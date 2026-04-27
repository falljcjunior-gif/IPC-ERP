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

  const { message, history = [], erpContext = {} } = validation.data;

  // 2. Fetch API Key (Prioritize Secret Manager, Fallback to Firestore for legacy compatibility)
  let apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) {
    logger.debug('GEMINI_API_KEY secret not found, falling back to Firestore config');
    const configSnap = await db.collection('system_config').doc('ai_config').get();
    apiKey = configSnap.data()?.geminiApiKey;
  }

  if (!apiKey) {
    logger.error('Gemini API Key missing');
    throw new Error('failed-precondition');
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

  const systemPrompt = `Tu es Nexus, le copilote IA de l'ERP I.P.C (International Paving Company).
Réponds en FRANÇAIS, de manière professionnelle et concise.
CONTEXTE: Utilisateur ${userName} (${userRole}), Module ${moduleNames[activeModule] || activeModule}.
DONNÉES: ${Object.entries(recordCounts).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Aucune'}.
KPIS: ${Object.entries(kpis).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Aucun'}.`;

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

    // Command Parsing
    const navMatch = responseText.match(/\[NAV:([a-z_]+)\]/);
    let action = null;
    if (navMatch) action = { type: 'NAVIGATE', appId: navMatch[1] };

    const displayText = responseText.replace(/\[(NAV|CREATE|FILTER):[^\]]+\]/g, '').trim();

    // Log Activity
    await db.collection('ai_logs').add({
      uid: request.auth.uid,
      userName,
      userRole,
      hasAction: !!action,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      response: displayText, 
      action, 
      model: 'gemini-2.0-flash' 
    };

  } catch (error) {
    logger.error('Nexus AI Error:', error);
    throw new Error(`AI_ERROR: ${error.message}`);
  }
});
