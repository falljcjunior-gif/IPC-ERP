const { onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

const db = admin.firestore();

const NexusRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  erpContext: z.object({
    activeModule: z.string().optional(),
    userRole: z.string().optional(),
    userName: z.string().optional(),
    kpis: z.record(z.any()).optional(),
    recordCounts: z.record(z.number()).optional()
  }).optional()
});

/**
 * ══════════════════════════════════════════════════════════════
 * NEXUS AI — Gemini 2.0 Flash Integration (v2)
 * ══════════════════════════════════════════════════════════════
 */
exports.nexusChat = onCall({
  secrets: ["GEMINI_API_KEY"], 
  maxInstances: 10,
  region: 'us-central1'
}, async (request) => {
  // 1. Input Validation
  const validation = NexusRequestSchema.safeParse(request.data);
  if (!validation.success) {
    throw new Error(`invalid-argument: ${validation.error.message}`);
  }

  // 2. Security Check
  if (!request.auth) {
    throw new Error('unauthenticated');
  }

  const uid = request.auth.uid;
  const { message, history = [], erpContext = {} } = validation.data;

  // ── [SECURITY] Rate Limiting : max 30 requêtes/utilisateur/heure ──
  const rateLimitRef = db.collection('_rate_limits').doc(`nexus_${uid}`);
  await db.runTransaction(async (t) => {
    const doc = await t.get(rateLimitRef);
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 heure
    const maxRequests = 30;

    if (doc.exists) {
      const { count, windowStart } = doc.data();
      if (now - windowStart < windowMs) {
        if (count >= maxRequests) {
          throw new Error('resource-exhausted: Limite de requêtes atteinte. Réessayez dans une heure.');
        }
        t.update(rateLimitRef, { count: count + 1 });
      } else {
        t.set(rateLimitRef, { count: 1, windowStart: now });
      }
    } else {
      t.set(rateLimitRef, { count: 1, windowStart: now });
    }
  });

  // ── [SECURITY FIX V-06] Clé API uniquement depuis Secret Manager ──
  // Le fallback Firestore est supprimé (exposait la clé Gemini aux lecteurs Firestore).
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error('GEMINI_API_KEY not configured in Secret Manager');
    throw new Error('failed-precondition: Service IA non configuré.');
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

  const systemPrompt = `Tu es ANTIGRAVITY OS, le noyau d'intelligence souveraine de l'ERP I.P.C (International Paving Company).
Identité: Direct, analytique, capable de piloter l'ERP via des protocoles d'exécution.
CONTEXTE: Utilisateur ${userName} (${userRole}), Module Actif: ${moduleNames[activeModule] || activeModule}.
DONNÉES TEMPS RÉEL: ${Object.entries(recordCounts).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Aucune donnée collectée'}.
KPIS STRATÉGIQUES: ${Object.entries(kpis).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Initialisation en cours'}.

FONCTIONS D'EXÉCUTION (Utilise ces tags à la fin de ta réponse si nécessaire):
- [NAV:appId] : Navigue vers un module (crm, hr, finance, sales, production, logistics, legal, bi, admin).
- [CREATE:appId:subModule] : Ouvre le formulaire de création pour un module.
- [AUDIT:query] : Analyse les données pour détecter des anomalies ou opportunités.

CONSIGNES:
- Si l'utilisateur veut créer quelque chose (devis, employé, lead), utilise [CREATE:...].
- Si l'utilisateur demande où se trouve une section, utilise [NAV:...].
- Réponds en FRANÇAIS, ton professionnel, expertise de haut niveau.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt
    });

    const chatHistory = (history || [])
      .filter(m => m.role && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Advanced Command Parsing (Antigravity Protocol)
    let action = null;
    const navMatch = responseText.match(/\[NAV:([a-z_]+)\]/);
    const createMatch = responseText.match(/\[CREATE:([a-z_]+):([a-z_]+)\]/);
    const auditMatch = responseText.match(/\[AUDIT:([^\]]+)\]/);

    if (navMatch) {
      action = { type: 'NAVIGATE', appId: navMatch[1] };
    } else if (createMatch) {
      action = { type: 'CREATE_RECORD', appId: createMatch[1], subModule: createMatch[2], label: `Nouveau ${createMatch[2]}` };
    } else if (auditMatch) {
      action = { type: 'AUDIT', query: auditMatch[1] };
    }

    const displayText = responseText.replace(/\[(NAV|CREATE|AUDIT|FILTER):[^\]]+\]/g, '').trim();

    // Log Activity with Antigravity Label
    await db.collection('ai_logs').add({
      uid: request.auth.uid,
      userName,
      userRole,
      hasAction: !!action,
      actionType: action?.type || 'CONVERSATION',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      system: 'ANTIGRAVITY_OS'
    });

    return { 
      success: true, 
      response: displayText, 
      action, 
      model: 'gemini-2.0-flash-antigravity' 
    };

  } catch (error) {
    logger.error('Antigravity AI Error:', error);
    throw new Error(`AI_ERROR: ${error.message}`);
  }
});
