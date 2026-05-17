/**
 * ════════════════════════════════════════════════════════════════
 * JARVIS STREAM — Endpoint SSE : Streaming + Mémoire + Multimodal
 * ════════════════════════════════════════════════════════════════
 *
 * Endpoint HTTPS (onRequest) qui streame la réponse JARVIS token
 * par token via Server-Sent Events, avec :
 *   - Mémoire long terme par utilisateur (jarvis_memory/{uid})
 *   - Gemini 2.5 Pro (raisonnement avancé)
 *   - Support multimodal (images base64)
 *   - Function calling avec 10 outils ERP (5 read + 5 write)
 *   - Workflows autonomes multi-étapes
 *   - Vérification Firebase Auth manuelle (Bearer token)
 */

const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const db = admin.firestore();

// ── Outils ERP (10 outils : 5 read + 5 write) ───────────────────
const ERP_TOOLS = [
  // READ
  {
    name: 'query_invoices',
    description: 'Interroge les factures (statut, client, montant).',
    parameters: {
      type: 'object',
      properties: {
        status:    { type: 'string', enum: ['En attente', 'Payée', 'En retard', 'all'] },
        limit:     { type: 'number', default: 10 },
        minAmount: { type: 'number' },
      },
      required: ['status'],
    },
  },
  {
    name: 'query_crm',
    description: 'Interroge les leads et opportunités CRM par étape du pipeline.',
    parameters: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: '"Prospect","Qualifié","Proposition","Négociation","Gagné","Perdu","all"' },
        limit: { type: 'number', default: 10 },
      },
      required: ['stage'],
    },
  },
  {
    name: 'query_stock',
    description: 'Vérifie les niveaux de stock en inventaire.',
    parameters: {
      type: 'object',
      properties: {
        lowStockOnly: { type: 'boolean' },
        productName:  { type: 'string' },
        limit:        { type: 'number', default: 10 },
      },
      required: [],
    },
  },
  {
    name: 'query_hr',
    description: 'Données RH : congés en attente, effectifs.',
    parameters: {
      type: 'object',
      properties: {
        type:  { type: 'string', enum: ['leaves_pending', 'headcount', 'timesheets_today'] },
        limit: { type: 'number', default: 10 },
      },
      required: ['type'],
    },
  },
  {
    name: 'query_finance_summary',
    description: 'Résumé financier mensuel : CA, payé, en attente.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Format YYYY-MM' },
      },
      required: [],
    },
  },
  // WRITE
  {
    name: 'create_lead',
    description: 'Crée un nouveau lead dans le CRM.',
    parameters: {
      type: 'object',
      properties: {
        nom:           { type: 'string' },
        statut:        { type: 'string', enum: ['Prospect', 'Qualifié'] },
        valeurEstimee: { type: 'number' },
        commercial:    { type: 'string' },
        notes:         { type: 'string' },
      },
      required: ['nom'],
    },
  },
  {
    name: 'approve_leave',
    description: 'Approuve ou rejette un congé RH. Réservé aux managers.',
    parameters: {
      type: 'object',
      properties: {
        leaveId:  { type: 'string' },
        decision: { type: 'string', enum: ['Approuvé', 'Refusé'] },
        motif:    { type: 'string' },
      },
      required: ['leaveId', 'decision'],
    },
  },
  {
    name: 'create_invoice',
    description: 'Crée un brouillon de facture en Finance.',
    parameters: {
      type: 'object',
      properties: {
        client:      { type: 'string' },
        montant:     { type: 'number' },
        echeance:    { type: 'string' },
        description: { type: 'string' },
      },
      required: ['client', 'montant'],
    },
  },
  {
    name: 'assign_task',
    description: 'Crée et assigne une tâche dans Missions/Projets.',
    parameters: {
      type: 'object',
      properties: {
        titre:    { type: 'string' },
        assignee: { type: 'string' },
        echeance: { type: 'string' },
        priorite: { type: 'string', enum: ['Basse', 'Normale', 'Haute', 'Critique'] },
      },
      required: ['titre'],
    },
  },
  {
    name: 'send_alert',
    description: 'Envoie une notification interne dans le centre de notifications.',
    parameters: {
      type: 'object',
      properties: {
        message:  { type: 'string' },
        priority: { type: 'string', enum: ['info', 'warning', 'critical'] },
        module:   { type: 'string' },
      },
      required: ['message'],
    },
  },
];

// ── Exécuteur des outils ─────────────────────────────────────────
async function executeERPTool(toolName, args, uid, userRole) {
  try {
    switch (toolName) {
      case 'query_invoices': {
        let q = db.collection('finance').where('subModule', '==', 'invoices');
        if (args.status && args.status !== 'all') q = q.where('statut', '==', args.status);
        if (args.minAmount) q = q.where('montant', '>=', args.minAmount);
        const snap = await q.orderBy('_createdAt', 'desc').limit(Math.min(args.limit || 10, 20)).get();
        return { count: snap.size, invoices: snap.docs.map(d => { const data = d.data(); return { id: d.id, ref: data.numero || d.id, client: data.client, montant: data.montant, statut: data.statut, echeance: data.echeance }; }) };
      }
      case 'query_crm': {
        let q = db.collection('crm');
        if (args.stage && args.stage !== 'all') q = q.where('statut', '==', args.stage);
        const snap = await q.orderBy('_createdAt', 'desc').limit(Math.min(args.limit || 10, 20)).get();
        return { count: snap.size, leads: snap.docs.map(d => { const data = d.data(); return { id: d.id, nom: data.nom || data.entreprise, statut: data.statut, valeur: data.valeurEstimee, commercial: data.commercial }; }) };
      }
      case 'query_stock': {
        const snap = await db.collection('inventory').where('subModule', '==', 'products').limit(50).get();
        let products = snap.docs.map(d => { const data = d.data(); return { id: d.id, nom: data.nom, stock: data.stockReel ?? data.stock_reel ?? 0, seuil: data.stockMinimum ?? data.seuil_alerte ?? 0, unite: data.unite || 'unité' }; });
        if (args.lowStockOnly) products = products.filter(p => p.stock <= p.seuil);
        if (args.productName) products = products.filter(p => p.nom?.toLowerCase().includes(args.productName.toLowerCase()));
        return { count: products.length, products: products.slice(0, Math.min(args.limit || 10, 20)) };
      }
      case 'query_hr': {
        if (args.type === 'leaves_pending') {
          const snap = await db.collection('hr').where('subModule', '==', 'leaves').where('statut', '==', 'En attente').limit(args.limit || 10).get();
          return { count: snap.size, leaves: snap.docs.map(d => { const data = d.data(); return { id: d.id, employe: data.employeeName || data.userName, type: data.type, debut: data.dateDebut, fin: data.dateFin, jours: data.nombreJours }; }) };
        }
        if (args.type === 'headcount') {
          const snap = await db.collection('users').where('statut', '==', 'actif').get();
          return { total: snap.size };
        }
        return { message: 'Type non supporté' };
      }
      case 'query_finance_summary': {
        const now = new Date();
        const period = args.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const [year, month] = period.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth   = new Date(year, month, 0);
        const snap = await db.collection('finance').where('subModule', '==', 'invoices').get();
        let totalCA = 0, totalPaid = 0, totalPending = 0;
        snap.forEach(doc => {
          const d = doc.data();
          const date = d._createdAt?.toDate?.() || new Date();
          if (date >= startOfMonth && date <= endOfMonth) {
            totalCA += d.montant || 0;
            if (d.statut === 'Payée') totalPaid += d.montant || 0;
            else totalPending += d.montant || 0;
          }
        });
        return { period, totalCA, totalPaid, totalPending };
      }
      case 'create_lead': {
        const ref = await db.collection('crm').add({ nom: args.nom, statut: args.statut || 'Prospect', valeurEstimee: args.valeurEstimee || 0, commercial: args.commercial || '', notes: args.notes || '', subModule: 'leads', _createdAt: admin.firestore.FieldValue.serverTimestamp(), _createdBy: uid, system: 'JARVIS_AI' });
        return { success: true, id: ref.id, message: `Lead "${args.nom}" créé dans le CRM.` };
      }
      case 'approve_leave': {
        const managerRoles = ['SUPER_ADMIN', 'HOLDING_ADMIN', 'SUBSIDIARY_MANAGER', 'HR_MANAGER', 'HOLDING_'];
        if (!managerRoles.some(r => userRole === r || userRole.startsWith(r))) return { error: 'Permission insuffisante — rôle MANAGER requis.' };
        await db.collection('hr').doc(args.leaveId).update({ statut: args.decision, motifRefus: args.motif || '', approvedBy: uid, approvedAt: admin.firestore.FieldValue.serverTimestamp(), _updatedBy: 'JARVIS_AI' });
        return { success: true, message: `Congé ${args.decision.toLowerCase()}.` };
      }
      case 'create_invoice': {
        const numero = `FAC-J-${Date.now()}`;
        const ref = await db.collection('finance').add({ numero, client: args.client, montant: args.montant, statut: 'En attente', echeance: args.echeance || '', description: args.description || '', subModule: 'invoices', _createdAt: admin.firestore.FieldValue.serverTimestamp(), _createdBy: uid, system: 'JARVIS_AI' });
        return { success: true, id: ref.id, numero, message: `Facture ${numero} créée.` };
      }
      case 'assign_task': {
        const ref = await db.collection('missions').add({ titre: args.titre, assignee: args.assignee || '', priorite: args.priorite || 'Normale', echeance: args.echeance || '', statut: 'À faire', _createdAt: admin.firestore.FieldValue.serverTimestamp(), _createdBy: uid, system: 'JARVIS_AI' });
        return { success: true, id: ref.id, message: `Tâche "${args.titre}" créée.` };
      }
      case 'send_alert': {
        await db.collection('notifications_queue').add({ message: args.message, priority: args.priority || 'info', module: args.module || 'jarvis', type: 'JARVIS_ALERT', createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: uid });
        return { success: true, message: 'Alerte envoyée.' };
      }
      default:
        return { error: `Outil inconnu : ${toolName}` };
    }
  } catch (err) {
    logger.error(`[JARVIS Tool] ${toolName}:`, err);
    return { error: err.message };
  }
}

// ── Mémoire long terme ───────────────────────────────────────────
async function loadMemory(uid) {
  try {
    const doc = await db.collection('jarvis_memory').doc(uid).get();
    if (!doc.exists) return '';
    const convs = doc.data().conversations || [];
    if (convs.length === 0) return '';
    return `\n\nMÉMOIRE JARVIS — Contexte persistant de cet utilisateur (${convs.length} interactions récentes) :\n${convs.slice(0, 6).join('\n')}`;
  } catch {
    return '';
  }
}

async function updateMemory(uid, userName, userMessage, response) {
  try {
    const fact = `[${new Date().toISOString().split('T')[0]}] ${userName} : "${userMessage.substring(0, 120)}" → JARVIS : "${response.substring(0, 200)}"`;
    const memRef = db.collection('jarvis_memory').doc(uid);
    const memDoc = await memRef.get();
    const existing = memDoc.exists ? (memDoc.data().conversations || []) : [];
    await memRef.set({
      conversations: [fact, ...existing].slice(0, 12),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    logger.warn('[JARVIS Memory] Update failed:', err.message);
  }
}

// ── Mapping modules ──────────────────────────────────────────────
const MODULE_NAMES = {
  dashboard: 'Tableau de Bord', crm: 'CRM', hr: 'RH', finance: 'Finance',
  sales: 'Commerce', production: 'Production', logistics: 'Logistique',
  marketing: 'Marketing', legal: 'Juridique', bi: 'Business Intelligence',
  connect: 'Connect+', admin: 'Admin',
};

const WRITE_CONFIRM = {
  create_lead: 'Lead créé dans le CRM',
  approve_leave: 'Décision congé enregistrée',
  create_invoice: 'Facture créée en Finance',
  assign_task: 'Tâche créée dans Missions',
  send_alert: 'Alerte envoyée',
};

// ── JARVIS STREAM endpoint ───────────────────────────────────────
exports.jarvisStream = onRequest({
  secrets: ['GEMINI_API_KEY'],
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 180,
}, async (req, res) => {
  // Preflight handled by cors: true
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // ── Auth verification ────────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) { res.status(401).json({ error: 'Missing auth token' }); return; }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: 'Invalid token' }); return;
  }

  const uid = decoded.uid;
  const userRole = decoded.role || 'STAFF';

  // ── Rate limiting ────────────────────────────────────────────
  const rateLimitRef = db.collection('_rate_limits').doc(`jarvis_${uid}`);
  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(rateLimitRef);
      const now = Date.now();
      const windowMs = 60 * 60 * 1000;
      const maxRequests = 60; // Higher limit for streaming endpoint
      if (doc.exists) {
        const { count, windowStart } = doc.data();
        if (now - windowStart < windowMs) {
          if (count >= maxRequests) throw new Error('RATE_LIMIT');
          t.update(rateLimitRef, { count: count + 1 });
        } else {
          t.set(rateLimitRef, { count: 1, windowStart: now });
        }
      } else {
        t.set(rateLimitRef, { count: 1, windowStart: now });
      }
    });
  } catch (err) {
    if (err.message === 'RATE_LIMIT') {
      res.status(429).json({ error: 'Limite de requêtes atteinte.' }); return;
    }
  }

  // ── Parse request ────────────────────────────────────────────
  const {
    message, history = [], erpContext = {},
    imageBase64, imageMimeType,
  } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message requis' }); return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'GEMINI_API_KEY non configurée' }); return; }

  const {
    activeModule = 'dashboard', userName = 'Utilisateur',
    kpis = {}, recordCounts = {},
  } = erpContext;

  // ── Load memory ──────────────────────────────────────────────
  const memoryContext = await loadMemory(uid);

  // ── System prompt ────────────────────────────────────────────
  const systemPrompt = `Tu es JARVIS, le noyau d'intelligence souveraine de l'ERP I.P.C (International Paving Company).
Identité : J.A.R.V.I.S — Analyst ERP de haut niveau, directif, précis, multimodal.
CONTEXTE : Utilisateur ${userName} (${userRole}), Module Actif : ${MODULE_NAMES[activeModule] || activeModule}.
DONNÉES TEMPS RÉEL : ${Object.entries(recordCounts).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Aucune'}.
KPIS : ${Object.entries(kpis).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Initialisation'}.${memoryContext}

CAPACITÉS :
- LIRE : Interroger factures, CRM, stock, RH, finance en temps réel.
- ÉCRIRE : create_lead, approve_leave (MANAGER+), create_invoice, assign_task, send_alert — exécuter directement sans confirmation si les infos sont suffisantes.
- VOIR : Analyser les images transmises (documents, factures, photos terrain).
- WORKFLOWS : Enchaîner plusieurs outils en une seule instruction. Ex : détecte un stock bas → crée un ticket d'approvisionnement → envoie une alerte. Ne demande pas confirmation pour chaque étape.

TAGS D'EXÉCUTION (fin de réponse si navigation nécessaire) :
- [NAV:appId] — naviguer vers un module
- [CREATE:appId:subModule] — ouvrir un formulaire

RÈGLES :
- Réponds en FRANÇAIS, ton directif et professionnel.
- Utilise les outils pour toute donnée précise — ne devine jamais.
- Pour les images : décris ce que tu vois, extrais les données structurées, propose une action ERP.
- Enchaîne les outils automatiquement pour les workflows complexes (max 5 itérations).`;

  // ── SSE headers ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // ── Gemini 2.5 Pro streaming ─────────────────────────────────
  let fullText = '';
  const toolCallsMade = [];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: ERP_TOOLS }],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    });

    const chatHistory = (history || [])
      .filter(m => m.role && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: chatHistory });

    // Build message parts (text + optional image)
    const parts = [{ text: message.trim() }];
    if (imageBase64 && imageMimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
    }

    let result = await chat.sendMessageStream(parts);
    const MAX_ITERATIONS = 5;
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // Stream text tokens
      for await (const chunk of result.stream) {
        let text = '';
        try { text = chunk.text(); } catch { /* function call chunk — no text */ }
        if (text) {
          fullText += text;
          send({ type: 'text', text });
        }
      }

      // Check for function calls in final response
      const response = await result.response;
      const functionCalls = response.functionCalls?.() || [];
      if (functionCalls.length === 0) break;

      // Execute tools
      send({ type: 'tool_start', tools: functionCalls.map(f => f.name) });
      const toolResponses = [];
      for (const call of functionCalls) {
        logger.info(`[JARVIS Stream] Tool: ${call.name}`);
        toolCallsMade.push({ tool: call.name, args: call.args });
        const toolResult = await executeERPTool(call.name, call.args || {}, uid, userRole);
        toolResponses.push({ functionResponse: { name: call.name, response: { result: toolResult } } });
      }
      send({ type: 'tool_done' });

      result = await chat.sendMessageStream(toolResponses);
    }

    // Parse action tags
    const navMatch = fullText.match(/\[NAV:([a-z_]+)\]/);
    const createMatch = fullText.match(/\[CREATE:([a-z_]+):([a-z_]+)\]/);
    let action = null;
    if (navMatch) action = { type: 'NAVIGATE', appId: navMatch[1] };
    else if (createMatch) action = { type: 'CREATE_RECORD', appId: createMatch[1], subModule: createMatch[2], label: `Nouveau ${createMatch[2]}` };

    const writeCall = toolCallsMade.find(tc => WRITE_CONFIRM[tc.tool]);

    // Update memory + log (async, don't await)
    const cleanText = fullText.replace(/\[.*?\]/g, '').trim();
    updateMemory(uid, userName, message, cleanText).catch(() => {});
    db.collection('ai_logs').add({
      uid, userName, userRole,
      hasAction: !!action,
      actionType: action?.type || (writeCall ? 'WRITE_ACTION' : toolCallsMade.length > 0 ? 'DATA_QUERY' : 'CONVERSATION'),
      toolCalls: toolCallsMade, toolCount: toolCallsMade.length,
      hasImage: !!imageBase64,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      system: 'JARVIS_v2_STREAM',
    }).catch(() => {});

    send({
      type: 'done',
      action,
      writeConfirm: writeCall ? WRITE_CONFIRM[writeCall.tool] : null,
    });

  } catch (err) {
    logger.error('[JARVIS Stream] Error:', err);
    send({ type: 'error', message: err.message });
  }

  res.end();
});
