const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

/**
 * Exchange OAuth authorization code for Access Token
 * Supporting: Facebook, Instagram, LinkedIn
 */
exports.exchangeSocialToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  const { provider, code, redirectUri } = data;
  if (!provider || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Champs manquants');
  }

  try {
    // 1. Fetch API Credentials from secure Firestore config
    const configSnap = await db.collection('system_config').doc('marketing_apis').get();
    if (!configSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Configuration API manquante. Ajoutez vos clés dans Marketing → ⚙️');
    }
    const apiConfig = configSnap.data();

    // ───────────────────────────────────────────────────
    // FACEBOOK & INSTAGRAM (Meta Graph API)
    // ───────────────────────────────────────────────────
    if (provider === 'facebook' || provider === 'instagram') {
      const config = apiConfig.facebook;
      if (!config?.clientId || !config?.clientSecret) {
        throw new functions.https.HttpsError('not-found', 'Clés Meta non configurées');
      }

      // Step 1: Exchange auth code → short-lived token
      const shortRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });
      const shortToken = shortRes.data.access_token;

      // Step 2: Exchange short-lived → long-lived token (60 days)
      const longRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          fb_exchange_token: shortToken
        }
      });
      const longToken = longRes.data.access_token;

      // Step 3: Get connected Facebook Pages & Instagram accounts
      const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
        params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' }
      });

      // Step 4: Save tokens to Firestore
      await db.collection('system_config').doc('social_tokens').set({
        facebook: {
          userToken: longToken,
          expiresIn: longRes.data.expires_in,
          pages: pagesRes.data.data || [],
          connectedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      return {
        success: true,
        provider: 'facebook',
        pages: pagesRes.data.data || [],
        expiresIn: longRes.data.expires_in
      };
    }

    // ───────────────────────────────────────────────────
    // LINKEDIN
    // ───────────────────────────────────────────────────
    if (provider === 'linkedin') {
      const config = apiConfig.linkedin;
      if (!config?.clientId || !config?.clientSecret) {
        throw new functions.https.HttpsError('not-found', 'Clés LinkedIn non configurées dans Marketing → ⚙️');
      }

      // Exchange code for access token
      const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const liToken = tokenRes.data.access_token;

      // Get LinkedIn profile
      const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${liToken}` }
      });

      // Get organization (Company Page)
      const orgRes = await axios.get('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))', {
        headers: { Authorization: `Bearer ${liToken}` }
      }).catch(() => ({ data: { elements: [] } }));

      // Save token
      await db.collection('system_config').doc('social_tokens').set({
        linkedin: {
          accessToken: liToken,
          expiresIn: tokenRes.data.expires_in,
          profile: profileRes.data,
          organizations: orgRes.data.elements || [],
          connectedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      return {
        success: true,
        provider: 'linkedin',
        profile: profileRes.data,
        expiresIn: tokenRes.data.expires_in
      };
    }

    throw new functions.https.HttpsError('invalid-argument', `Provider '${provider}' non supporté`);

  } catch (error) {
    console.error(`Error exchanging ${provider} token:`, error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', error.response?.data?.error_description || error.message);
  }
});

/**
 * Instagram / Meta Webhook Handler
 * Receives real-time messages and Instagram events
 */
const WEBHOOK_VERIFY_TOKEN = 'ipc_erp_webhook_secret_2026';

exports.metaWebhook = functions.https.onRequest(async (req, res) => {
  // Webhook verification (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // Incoming events (POST)
  if (req.method === 'POST') {
    const body = req.body;
    try {
      if (body.object === 'instagram' || body.object === 'page') {
        for (const entry of body.entry || []) {
          // Instagram DMs / Comments
          for (const msg of entry.messaging || []) {
            if (msg.message) {
              const messageDoc = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                sender: msg.sender.id,
                source: body.object === 'instagram' ? 'Instagram' : 'Facebook',
                content: msg.message.text || '[Media]',
                statut: 'Nouveau',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                receivedAt: admin.firestore.FieldValue.serverTimestamp()
              };
              await db.collection('marketing_messages').add(messageDoc);
              console.log('New message saved:', messageDoc.sender);
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).send('Error');
    }
  }

  return res.status(405).send('Method Not Allowed');
});

/**
 * Admin: Delete User account from Firebase Auth
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // 1. Security Check: Only authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  // 2. Privilege Check: Only SUPER_ADMIN allowed
  const callerUid = context.auth.uid;
  const callerSnap = await db.collection('users').doc(callerUid).get();
  const callerData = callerSnap.data();
  
  const isSuperAdmin = callerData?.permissions?.roles?.includes('SUPER_ADMIN');

  if (!isSuperAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Privilèges insuffisants pour cette opération.');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID de l\'utilisateur manquant');
  }

  try {
    await admin.auth().deleteUser(uid);
    console.log(`User ${uid} successfully deleted from Firebase Auth by ${callerUid}`);
    
    // Optionally clean up other potential collections linked to this UID
    // await db.collection('users').doc(uid).delete();
    // await db.collection('hr').doc(uid).delete();
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new functions.https.HttpsError('internal', `Erreur lors de la suppression Auth: ${error.message}`);
  }
});


/**
 * ══════════════════════════════════════════════════════════════
 * NEXUS AI — Gemini 2.0 Flash Integration
 * ══════════════════════════════════════════════════════════════
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.nexusChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise pour Nexus AI.');
  }

  const { message, history = [], erpContext = {} } = data;
  if (!message || typeof message !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Message invalide.');
  }

  // Fetch Gemini API key from Firestore system_config/ai_config
  const configSnap = await db.collection('system_config').doc('ai_config').get();
  const aiConfig = configSnap.exists ? configSnap.data() : {};
  const apiKey = aiConfig.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Clé API Gemini non configurée. Allez dans Admin → IA → Configurer la clé Gemini.'
    );
  }

  const {
    activeModule = 'dashboard',
    userRole = 'STAFF',
    userName = 'Utilisateur',
    kpis = {},
    recordCounts = {}
  } = erpContext;

  const moduleNames = {
    dashboard: 'Tableau de Bord', crm: 'CRM', hr: 'RH',
    finance: 'Finance', sales: 'Commerce', production: 'Production',
    logistics: 'Logistique', marketing: 'Marketing', legal: 'Juridique',
    bi: 'Business Intelligence', connect: 'Connect+', admin: 'Admin'
  };

  const systemPrompt = `Tu es Nexus, le copilote IA de l'ERP I.P.C (International Paving Company — fabricant de pavés en béton).
Réponds en FRANÇAIS, de manière professionnelle et concise (max 300 mots).
Tu es expert en gestion d'entreprise, finance, RH, production industrielle, CRM et supply chain.

CONTEXTE ACTUEL:
- Utilisateur: ${userName} (rôle: ${userRole})
- Module actif: ${moduleNames[activeModule] || activeModule}
- Heure: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}

DONNÉES ERP EN DIRECT:
${Object.entries(recordCounts).map(([k,v]) => `- ${k}: ${v} enregistrements`).join('\n') || '- Aucune donnée transmise'}
${Object.entries(kpis).map(([k,v]) => `- ${k}: ${v}`).join('\n') || ''}

COMMANDES DISPONIBLES (utilise-les dans ta réponse quand pertinent):
- [NAV:module_id] pour naviguer vers un module
- [CREATE:app:subModule:"description"] pour créer un enregistrement
Exemple: "Je vous redirige vers le CRM. [NAV:crm]"`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt
    });

    const chatHistory = (history || [])
      .filter(m => m.role && m.content)
      .slice(-8)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Parse ERP action commands
    const navMatch = responseText.match(/\[NAV:([a-z_]+)\]/);
    const createMatch = responseText.match(/\[CREATE:([^:]+):([^:]+):"([^"]+)"\]/);
    let action = null;
    if (navMatch) action = { type: 'NAVIGATE', appId: navMatch[1] };
    else if (createMatch) action = { type: 'CREATE_RECORD', appId: createMatch[1], subModule: createMatch[2], label: createMatch[3] };

    const displayText = responseText.replace(/\[(NAV|CREATE|FILTER):[^\]]+\]/g, '').trim();

    // Async usage log (non-blocking)
    db.collection('ai_logs').add({
      uid: context.auth.uid, userName, userRole, activeModule,
      message: message.substring(0, 200), hasAction: !!action,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});

    return { success: true, response: displayText, action, model: 'gemini-2.0-flash' };

  } catch (error) {
    console.error('Nexus AI error:', error);
    if (error.status === 429) {
      return { success: false, response: 'Quota Gemini atteint. Réessayez dans quelques secondes.', action: null };
    }
    throw new functions.https.HttpsError('internal', `Erreur IA: ${error.message}`);
  }
});

const { onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');

/**
 * ══════════════════════════════════════════════════════════════
 * SECURITY: GLOBAL AUDIT TRAIL (v2)
 * ══════════════════════════════════════════════════════════════
 */
const SENSITIVE_COLLECTIONS = ['finance', 'inventory', 'users', 'hr', 'sales_leads', 'production_orders'];

exports.globalAuditTrigger = onDocumentWritten('{collection}/{docId}', async (event) => {
  const { collection, docId } = event.params;
  if (!SENSITIVE_COLLECTIONS.includes(collection)) return null;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const beforeData = event.data.before.exists ? event.data.before.data() : null;
  const afterData = event.data.after.exists ? event.data.after.data() : null;
  
  let operation = 'UPDATE';
  if (!beforeData) operation = 'CREATE';
  if (!afterData) operation = 'DELETE';

  try {
    await db.collection('audit_logs').add({
      timestamp, collection, docId, operation,
      changedBy: afterData?._updatedBy || afterData?._createdBy || 'system_trigger',
      summary: `${operation} on ${collection}/${docId}`
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
  return null;
});

/**
 * 💹 FINANCE: AUTOMATED ACCOUNTING (v2)
 */
exports.syncAccountingOnInvoicePaid = onDocumentUpdated('finance_invoices/{invoiceId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();

  if (newData.status === 'paid' && oldData.status !== 'paid') {
    const { invoiceId } = event.params;
    const amount = newData.amountTTC || newData.amount || 0;
    
    const entry = {
      num: `ACC-${Date.now()}`,
      libelle: `Règlement Facture #${newData.num || invoiceId}`,
      date: admin.firestore.FieldValue.serverTimestamp(),
      debit: amount,
      credit: amount,
      invoiceId: invoiceId,
      _domain: 'finance',
      _createdBy: 'nexus_engine_trigger'
    };

    try {
      await db.collection('finance_accounting').add(entry);
    } catch (err) {
      console.error('Accounting Sync Error:', err);
    }
  }
  return null;
});

/**
 * 🧱 PRODUCTION: INVENTORY AUTO-SYNC (v2)
 */
exports.updateStockOnProductionComplete = onDocumentUpdated('production_orders/{ofId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();

  if (newData.status === 'completed' && oldData.status !== 'completed') {
    const productId = newData.productId;
    const quantity = newData.quantityProduced || newData.quantity || 0;
    if (!productId) return null;

    try {
      const productRef = db.collection('inventory_products').doc(productId);
      await db.runTransaction(async (t) => {
        const doc = await t.get(productRef);
        if (!doc.exists) return;
        const currentStock = doc.data().stockActuel || 0;
        t.update(productRef, { 
          stockActuel: currentStock + quantity,
          lastRefillAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    } catch (err) {
      console.error('Stock Update Error:', err);
    }
  }
  return null;
});



