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


