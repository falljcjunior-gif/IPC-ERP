const { onCall, HttpsError } = require('firebase-functions/v2/https');
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
    throw new HttpsError('invalid-argument', validation.error.message);
  }

  // 2. Security Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
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
          throw new HttpsError('resource-exhausted', 'Limite de requêtes atteinte. Réessayez dans une heure.');
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
    throw new HttpsError('failed-precondition', 'Service IA non configuré.');
  }

  const {
    activeModule = 'dashboard',
    userName = 'Utilisateur',
    kpis = {},
    recordCounts = {}
  } = erpContext;

  // ── [SECURITY FIX AUD-004] Source de vérité : Custom Claims uniquement ──
  const userRole = request.auth.token?.role || 'STAFF';

  const moduleNames = {
    dashboard: 'Tableau de Bord', crm: 'CRM', hr: 'RH',
    finance: 'Finance', sales: 'Commerce', production: 'Production',
    logistics: 'Logistique', marketing: 'Marketing', legal: 'Juridique',
    bi: 'Business Intelligence', connect: 'Connect+', admin: 'Admin'
  };

    // ════════════════════════════════════════════════════════════════
  // NEXUS FUNCTION CALLING — Outils ERP que l'IA peut utiliser
  // L'IA peut désormais interroger Firestore directement pour répondre
  // à des questions comme "Montre-moi les factures en retard" ou
  // "Quel est le stock de béton en ce moment ?"
  // ════════════════════════════════════════════════════════════════

  /** Définitions des outils Gemini Function Calling */
  const ERP_TOOLS = [
    // ── Read tools ──────────────────────────────────────────────
    {
      name: 'query_invoices',
      description: 'Interroge les factures de l\'ERP. Peut filtrer par statut (En attente, Payée, En retard), client, ou montant minimum.',
      parameters: {
        type: 'object',
        properties: {
          status:     { type: 'string',  description: 'Statut de la facture : "En attente", "Payée", "En retard", ou "all"', enum: ['En attente', 'Payée', 'En retard', 'all'] },
          limit:      { type: 'number',  description: 'Nombre maximum de factures à retourner (max 20)', default: 10 },
          minAmount:  { type: 'number',  description: 'Montant minimum en FCFA' },
        },
        required: ['status'],
      },
    },
    {
      name: 'query_crm',
      description: 'Interroge les leads et opportunités CRM. Peut filtrer par statut du pipeline ou commercial.',
      parameters: {
        type: 'object',
        properties: {
          stage:  { type: 'string', description: 'Étape du pipeline : "Prospect", "Qualifié", "Proposition", "Négociation", "Gagné", "Perdu", ou "all"' },
          limit:  { type: 'number', description: 'Nombre maximum de leads', default: 10 },
        },
        required: ['stage'],
      },
    },
    {
      name: 'query_stock',
      description: 'Vérifie le niveau de stock des produits en inventaire.',
      parameters: {
        type: 'object',
        properties: {
          lowStockOnly: { type: 'boolean', description: 'Si true, retourne uniquement les produits en dessous du seuil d\'alerte' },
          productName:  { type: 'string',  description: 'Rechercher un produit spécifique par nom (recherche approximative)' },
          limit:        { type: 'number',  description: 'Nombre max de produits', default: 10 },
        },
        required: [],
      },
    },
    {
      name: 'query_hr',
      description: 'Interroge les données RH : congés en attente, effectifs, présence du jour.',
      parameters: {
        type: 'object',
        properties: {
          type:  { type: 'string', description: 'Type de données RH : "leaves_pending", "headcount", "timesheets_today"', enum: ['leaves_pending', 'headcount', 'timesheets_today'] },
          limit: { type: 'number', description: 'Nombre max de résultats', default: 10 },
        },
        required: ['type'],
      },
    },
    {
      name: 'query_finance_summary',
      description: 'Retourne un résumé financier : CA du mois, dépenses, solde trésorerie, budgets.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Période au format YYYY-MM (ex: 2025-05). Par défaut : mois courant.' },
        },
        required: [],
      },
    },

    // ── Write tools (JARVIS peut exécuter des actions réelles) ──
    {
      name: 'create_lead',
      description: 'Crée un nouveau lead/prospect dans le CRM IPC.',
      parameters: {
        type: 'object',
        properties: {
          nom:           { type: 'string',  description: 'Nom du contact ou de l\'entreprise' },
          statut:        { type: 'string',  description: 'Étape du pipeline', enum: ['Prospect', 'Qualifié'] },
          valeurEstimee: { type: 'number',  description: 'Valeur estimée de l\'opportunité en FCFA' },
          commercial:    { type: 'string',  description: 'Nom du commercial assigné' },
          notes:         { type: 'string',  description: 'Notes initiales' },
        },
        required: ['nom'],
      },
    },
    {
      name: 'approve_leave',
      description: 'Approuve ou rejette une demande de congé RH en attente. Réservé aux managers.',
      parameters: {
        type: 'object',
        properties: {
          leaveId:  { type: 'string', description: 'ID Firestore du document congé' },
          decision: { type: 'string', description: 'Décision finale', enum: ['Approuvé', 'Refusé'] },
          motif:    { type: 'string', description: 'Motif du refus (requis si Refusé)' },
        },
        required: ['leaveId', 'decision'],
      },
    },
    {
      name: 'create_invoice',
      description: 'Crée un brouillon de facture dans le module Finance.',
      parameters: {
        type: 'object',
        properties: {
          client:      { type: 'string', description: 'Nom du client' },
          montant:     { type: 'number', description: 'Montant total en FCFA' },
          echeance:    { type: 'string', description: 'Date d\'échéance au format YYYY-MM-DD' },
          description: { type: 'string', description: 'Description de la prestation' },
        },
        required: ['client', 'montant'],
      },
    },
    {
      name: 'assign_task',
      description: 'Crée et assigne une tâche dans le module Missions/Projets.',
      parameters: {
        type: 'object',
        properties: {
          titre:    { type: 'string', description: 'Titre de la tâche' },
          assignee: { type: 'string', description: 'Nom de la personne assignée' },
          echeance: { type: 'string', description: 'Date limite au format YYYY-MM-DD' },
          priorite: { type: 'string', description: 'Niveau de priorité', enum: ['Basse', 'Normale', 'Haute', 'Critique'] },
        },
        required: ['titre'],
      },
    },
    {
      name: 'send_alert',
      description: 'Envoie une notification interne urgente visible dans le centre de notifications ERP.',
      parameters: {
        type: 'object',
        properties: {
          message:  { type: 'string', description: 'Contenu de l\'alerte' },
          priority: { type: 'string', description: 'Niveau d\'urgence', enum: ['info', 'warning', 'critical'] },
          module:   { type: 'string', description: 'Module ERP source de l\'alerte' },
        },
        required: ['message'],
      },
    },
  ];

  /** Exécuteur des outils appelés par l'IA */
  async function executeERPTool(toolName, args) {
    try {
      switch (toolName) {

        case 'query_invoices': {
          let q = db.collection('finance').where('subModule', '==', 'invoices');
          if (args.status && args.status !== 'all') q = q.where('statut', '==', args.status);
          if (args.minAmount) q = q.where('montant', '>=', args.minAmount);
          const snap = await q.orderBy('_createdAt', 'desc').limit(Math.min(args.limit || 10, 20)).get();
          const invoices = snap.docs.map(d => {
            const data = d.data();
            return { id: d.id, ref: data.numero || d.id, client: data.client, montant: data.montant, statut: data.statut, echeance: data.echeance };
          });
          return { count: invoices.length, invoices };
        }

        case 'query_crm': {
          let q = db.collection('crm');
          if (args.stage && args.stage !== 'all') q = q.where('statut', '==', args.stage);
          const snap = await q.orderBy('_createdAt', 'desc').limit(Math.min(args.limit || 10, 20)).get();
          const leads = snap.docs.map(d => {
            const data = d.data();
            return { id: d.id, nom: data.nom || data.entreprise, statut: data.statut, valeur: data.valeurEstimee, commercial: data.commercial };
          });
          return { count: leads.length, leads };
        }

        case 'query_stock': {
          let q = db.collection('inventory').where('subModule', '==', 'products');
          const snap = await q.limit(50).get();
          let products = snap.docs.map(d => {
            const data = d.data();
            return { id: d.id, nom: data.nom, stock: data.stockReel || data.stock_reel || 0, seuil: data.stockMinimum || data.seuil_alerte || 0, unite: data.unite || 'unité' };
          });
          if (args.lowStockOnly) products = products.filter(p => p.stock <= p.seuil);
          if (args.productName) products = products.filter(p => p.nom?.toLowerCase().includes(args.productName.toLowerCase()));
          products = products.slice(0, Math.min(args.limit || 10, 20));
          return { count: products.length, products };
        }

        case 'query_hr': {
          if (args.type === 'leaves_pending') {
            const snap = await db.collection('hr').where('subModule', '==', 'leaves').where('statut', '==', 'En attente').limit(args.limit || 10).get();
            const leaves = snap.docs.map(d => {
              const data = d.data();
              return { id: d.id, employe: data.employeeName || data.userName, type: data.type, debut: data.dateDebut, fin: data.dateFin, jours: data.nombreJours };
            });
            return { count: leaves.length, leaves };
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

          const invoiceSnap = await db.collection('finance').where('subModule', '==', 'invoices').get();
          let totalCA = 0, totalPaid = 0, totalPending = 0;
          invoiceSnap.forEach(doc => {
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

        // ── Write tools ────────────────────────────────────────

        case 'create_lead': {
          const ref = await db.collection('crm').add({
            nom: args.nom, statut: args.statut || 'Prospect',
            valeurEstimee: args.valeurEstimee || 0,
            commercial: args.commercial || '', notes: args.notes || '',
            subModule: 'leads',
            _createdAt: admin.firestore.FieldValue.serverTimestamp(),
            _createdBy: uid, system: 'JARVIS_AI',
          });
          return { success: true, id: ref.id, message: `Lead "${args.nom}" créé dans le CRM.` };
        }

        case 'approve_leave': {
          const managerRoles = ['SUPER_ADMIN', 'HOLDING_ADMIN', 'SUBSIDIARY_MANAGER', 'HR_MANAGER', 'HOLDING_'];
          const isManager = managerRoles.some(r => userRole === r || userRole.startsWith(r));
          if (!isManager) {
            return { error: 'Permission insuffisante — rôle MANAGER requis pour approuver les congés.' };
          }
          await db.collection('hr').doc(args.leaveId).update({
            statut: args.decision,
            motifRefus: args.motif || '',
            approvedBy: uid,
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            _updatedBy: 'JARVIS_AI',
          });
          return { success: true, message: `Congé ${args.decision.toLowerCase()} avec succès.` };
        }

        case 'create_invoice': {
          const numero = `FAC-J-${Date.now()}`;
          const ref = await db.collection('finance').add({
            numero, client: args.client, montant: args.montant,
            statut: 'En attente', echeance: args.echeance || '',
            description: args.description || '', subModule: 'invoices',
            _createdAt: admin.firestore.FieldValue.serverTimestamp(),
            _createdBy: uid, system: 'JARVIS_AI',
          });
          return { success: true, id: ref.id, numero, message: `Facture ${numero} créée pour ${args.client}.` };
        }

        case 'assign_task': {
          const ref = await db.collection('missions').add({
            titre: args.titre, assignee: args.assignee || '',
            priorite: args.priorite || 'Normale', echeance: args.echeance || '',
            statut: 'À faire',
            _createdAt: admin.firestore.FieldValue.serverTimestamp(),
            _createdBy: uid, system: 'JARVIS_AI',
          });
          return { success: true, id: ref.id, message: `Tâche "${args.titre}" créée et assignée.` };
        }

        case 'send_alert': {
          await db.collection('notifications_queue').add({
            message: args.message, priority: args.priority || 'info',
            module: args.module || 'jarvis', type: 'JARVIS_ALERT',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: uid,
          });
          return { success: true, message: 'Alerte envoyée dans le centre de notifications.' };
        }

        default:
          return { error: `Outil inconnu : ${toolName}` };
      }
    } catch (err) {
      logger.error(`[NexusAI Tool] Erreur ${toolName}:`, err);
      return { error: `Erreur lors de l'exécution : ${err.message}` };
    }
  }

  const systemPrompt = `Tu es JARVIS, le noyau d'intelligence souveraine de l'ERP I.P.C (International Paving Company).
Identité: J.A.R.V.I.S — Direct, analytique, expert ERP avec accès aux données temps réel et capacité d'exécution d'actions.
CONTEXTE: Utilisateur ${userName} (${userRole}), Module Actif: ${moduleNames[activeModule] || activeModule}.
DONNÉES TEMPS RÉEL: ${Object.entries(recordCounts).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Aucune donnée collectée'}.
KPIS STRATÉGIQUES: ${Object.entries(kpis).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Initialisation en cours'}.

FONCTIONS D'EXÉCUTION (Utilise ces tags à la fin de ta réponse si nécessaire):
- [NAV:appId] : Navigue vers un module (crm, hr, finance, sales, production, logistics, legal, bi, admin).
- [CREATE:appId:subModule] : Ouvre le formulaire de création pour un module.

CAPACITÉS IA :
- Tu peux LIRE les données ERP (factures, stocks, CRM, RH, finance) via tes outils de requête.
- Tu peux ÉCRIRE et EXÉCUTER des actions réelles : créer un lead (create_lead), approuver un congé (approve_leave, MANAGER requis), créer une facture (create_invoice), assigner une tâche (assign_task), envoyer une alerte (send_alert).
- Quand l'utilisateur demande une action, exécute-la directement via l'outil approprié — ne demande pas de confirmation sauf si des infos cruciales manquent.
- Informe l'utilisateur du résultat après exécution (succès ou erreur de permission).
- Présente les résultats de manière structurée et actionnable.
- Respecte les permissions : role=${userRole}. approve_leave nécessite MANAGER ou supérieur.

CONSIGNES:
- Réponds en FRANÇAIS, ton professionnel, expertise de haut niveau.
- Sois précis avec les données retournées par tes outils.
- Formule des recommandations concrètes basées sur les données réelles.
- Après une action d'écriture réussie, confirme brièvement ce qui a été fait.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // ── Function Calling : modèle configuré avec les outils ERP ──
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: ERP_TOOLS }],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } }, // L'IA décide quand appeler les outils
    });

    const chatHistory = (history || [])
      .filter(m => m.role && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    let result = await chat.sendMessage(message);

    // ── Boucle d'exécution des outils (function calling loop) ──
    let responseText = '';
    let toolCallsMade = [];
    const MAX_TOOL_ITERATIONS = 5; // Sécurité anti-boucle
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const candidate = result.response.candidates?.[0];
      if (!candidate) break;

      // Vérifier si l'IA veut appeler un outil
      const functionCalls = result.response.functionCalls?.() || [];
      if (!functionCalls || functionCalls.length === 0) {
        // Pas d'appel d'outil — réponse textuelle finale
        responseText = result.response.text();
        break;
      }

      // Exécuter les outils demandés
      const toolResponses = [];
      for (const call of functionCalls) {
        logger.info(`[NexusAI] Tool call: ${call.name}`, call.args);
        toolCallsMade.push({ tool: call.name, args: call.args });
        const toolResult = await executeERPTool(call.name, call.args || {});
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        });
      }

      // Renvoyer les résultats des outils à l'IA pour qu'elle génère sa réponse finale
      result = await chat.sendMessage(toolResponses);
    }

    if (!responseText) {
      try { responseText = result.response.text(); }
      catch { responseText = 'Je n\'ai pas pu générer une réponse. Veuillez réessayer.'; }
    }

    // Command Parsing (Antigravity Protocol — conservé pour compatibilité)
    let action = null;
    const navMatch = responseText.match(/\[NAV:([a-z_]+)\]/);
    const createMatch = responseText.match(/\[CREATE:([a-z_]+):([a-z_]+)\]/);

    if (navMatch) {
      action = { type: 'NAVIGATE', appId: navMatch[1] };
    } else if (createMatch) {
      action = { type: 'CREATE_RECORD', appId: createMatch[1], subModule: createMatch[2], label: `Nouveau ${createMatch[2]}` };
    }

    const displayText = responseText.replace(/\[(NAV|CREATE|AUDIT|FILTER):[^\]]+\]/g, '').trim();

    // Detect write actions for frontend confirmation card
    const writeTools = ['create_lead', 'approve_leave', 'create_invoice', 'assign_task', 'send_alert'];
    const writeCall = toolCallsMade.find(tc => writeTools.includes(tc.tool));
    let writeConfirm = null;
    if (writeCall) {
      const confirmMap = {
        create_lead:    `Lead créé dans le CRM`,
        approve_leave:  `Décision congé enregistrée`,
        create_invoice: `Facture créée en Finance`,
        assign_task:    `Tâche créée dans Missions`,
        send_alert:     `Alerte envoyée`,
      };
      writeConfirm = confirmMap[writeCall.tool] || 'Action exécutée par JARVIS';
    }

    // Log Activity
    await db.collection('ai_logs').add({
      uid:          request.auth.uid,
      userName,
      userRole,
      hasAction:    !!action,
      actionType:   action?.type || (writeCall ? 'WRITE_ACTION' : toolCallsMade.length > 0 ? 'DATA_QUERY' : 'CONVERSATION'),
      toolCalls:    toolCallsMade,
      toolCount:    toolCallsMade.length,
      timestamp:    admin.firestore.FieldValue.serverTimestamp(),
      system:       'JARVIS_v1',
    });

    return {
      success: true,
      response: displayText,
      action,
      writeConfirm,
      model: 'gemini-2.0-flash-jarvis'
    };

  } catch (error) {
    logger.error('Antigravity AI Error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Antigravity AI failed: ${error.message}`);
  }
});
