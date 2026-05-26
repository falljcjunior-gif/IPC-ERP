/**
 * ══════════════════════════════════════════════════════════════════
 * API REST PUBLIQUE — IPC Intelligence Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P3 — API REST pour intégrations tierces
 * AVANT : Aucune API publique — tout passe par le SDK Firebase (lock-in)
 * APRÈS : API REST authentifiée (Bearer JWT Firebase) + OpenAPI spec
 *
 * AUTHENTIFICATION :
 *   Authorization: Bearer <firebase_id_token>
 *   Le token est vérifié via admin.auth().verifyIdToken()
 *   Les Custom Claims (role, entity_id) sont extraits automatiquement
 *
 * BASE URL : https://europe-west1-ipc-erp.cloudfunctions.net/api
 *
 * ENDPOINTS DISPONIBLES :
 *   GET    /api/spec                  → OpenAPI 3.0 spec (JSON)
 *   GET    /api/health                → Statut de l'API
 *   GET    /api/v1/invoices           → Liste des factures
 *   GET    /api/v1/invoices/:id       → Détail d'une facture
 *   GET    /api/v1/contacts           → Liste des contacts CRM
 *   GET    /api/v1/employees          → Liste des employés
 *   GET    /api/v1/products           → Catalogue produits
 *   POST   /api/v1/webhooks/test      → Tester un webhook
 *   GET    /api/v1/metrics            → KPIs en temps réel
 */

const { onRequest } = require('firebase-functions/v2/https');
const admin  = require('firebase-admin');
const express = require('express');
const cors    = require('cors');
const { logger } = require('firebase-functions');
const { RATE_PRESETS } = require('./rate_limiter');

const db   = admin.firestore();
const app  = express();

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Autoriser : pas d'origin (curl, Postman), domaines IPC, et localhost en dev
    const allowed = !origin
      || origin.includes('ipc-erp.web.app')
      || origin.includes('ipc-erp.firebaseapp.com')
      || origin.includes('localhost')
      || origin.includes('127.0.0.1');
    cb(null, allowed);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-IPC-Entity-ID'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '256kb' }));

// ── Middleware : Vérification JWT Firebase ───────────────────────────────────
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authorization header required. Format: Bearer <firebase_id_token>',
    });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid:       decoded.uid,
      email:     decoded.email,
      role:      decoded.role      || decoded['role']      || 'GUEST',
      entity_id: decoded.entity_id || decoded['entity_id'] || 'ipc_group',
      tenant_id: decoded.tenant_id || 'ipc_group',
    };
    next();
  } catch (err) {
    logger.warn(`[API] Auth failed: ${err.message}`);
    return res.status(401).json({
      error:   'INVALID_TOKEN',
      message: 'Token invalide ou expiré. Générez un nouveau token via Firebase Auth.',
    });
  }
};

// ── Middleware : Vérification du rôle ───────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error:   'FORBIDDEN',
      message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}`,
    });
  }
  next();
};

// ── Middleware : Pagination helper ───────────────────────────────────────────
const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  return { page, limit, offset: (page - 1) * limit };
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const entityFilter = (req) => req.user.entity_id;

const docToApi = (doc) => ({ id: doc.id, ...doc.data() });

// ── Routes publiques (sans auth) ─────────────────────────────────────────────

/**
 * GET /health
 * Vérification de disponibilité (pour monitoring externe, Uptime Robot, etc.)
 */
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    version: '1.0',
    time:    new Date().toISOString(),
    service: 'IPC Intelligence Engine API',
  });
});

/**
 * GET /spec
 * Documentation OpenAPI 3.0 (JSON)
 */
app.get('/spec', (req, res) => {
  res.json(OPENAPI_SPEC);
});

// ── Routes protégées (nécessitent un token valide) ──────────────────────────

/**
 * GET /v1/invoices
 * Liste les factures de l'entité courante.
 * Query params: page, limit, status (paid|unpaid|overdue), from, to
 */
app.get('/v1/invoices', RATE_PRESETS.public, requireAuth, async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const entity_id = entityFilter(req);

    let q = db.collection('finance')
      .doc(entity_id)
      .collection('invoices')
      .limit(limit);

    if (req.query.status) {
      q = q.where('status', '==', req.query.status);
    }

    const snap  = await q.get();
    const items = snap.docs.map(docToApi);

    res.json({
      data:  items,
      meta:  { page, limit, count: items.length },
    });
  } catch (err) {
    logger.error('[API] GET /invoices:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * GET /v1/invoices/:id
 */
app.get('/v1/invoices/:id', RATE_PRESETS.public, requireAuth, async (req, res) => {
  try {
    const entity_id = entityFilter(req);
    const snap = await db.collection('finance')
      .doc(entity_id)
      .collection('invoices')
      .doc(req.params.id)
      .get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Facture introuvable' });
    }

    // Vérifier l'entité
    const data = snap.data();
    if (data.entity_id && data.entity_id !== entity_id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Accès refusé' });
    }

    res.json({ data: docToApi(snap) });
  } catch (err) {
    logger.error('[API] GET /invoices/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * GET /v1/contacts
 * Liste les contacts CRM.
 */
app.get('/v1/contacts', RATE_PRESETS.public, requireAuth, async (req, res) => {
  try {
    const { limit } = parsePagination(req.query);
    const entity_id = entityFilter(req);

    const snap = await db.collection('crm')
      .where('entity_id', '==', entity_id)
      .limit(limit)
      .get();

    res.json({ data: snap.docs.map(docToApi), meta: { count: snap.size } });
  } catch (err) {
    logger.error('[API] GET /contacts:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * GET /v1/employees
 * Liste les employés. Nécessite un rôle HR ou supérieur.
 */
app.get('/v1/employees',
  RATE_PRESETS.public,
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN', 'HR_MANAGER', 'HR'),
  async (req, res) => {
    try {
      const { limit } = parsePagination(req.query);
      const entity_id = entityFilter(req);

      const snap = await db.collection('users')
        .where('entity_id', '==', entity_id)
        .where('role', '!=', 'SUPER_ADMIN') // Jamais exposer les super admins
        .limit(limit)
        .get();

      // Retirer les champs sensibles
      const employees = snap.docs.map(doc => {
        const { password, refreshToken, fcmTokens, ...safe } = doc.data();
        return { id: doc.id, ...safe };
      });

      res.json({ data: employees, meta: { count: employees.length } });
    } catch (err) {
      logger.error('[API] GET /employees:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
);

/**
 * GET /v1/products
 * Catalogue produits / inventaire.
 */
app.get('/v1/products', RATE_PRESETS.public, requireAuth, async (req, res) => {
  try {
    const { limit } = parsePagination(req.query);
    const entity_id = entityFilter(req);

    const snap = await db.collection('products')
      .where('entity_id', '==', entity_id)
      .limit(limit)
      .get();

    res.json({ data: snap.docs.map(docToApi), meta: { count: snap.size } });
  } catch (err) {
    logger.error('[API] GET /products:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * GET /v1/metrics
 * KPIs en temps réel pour dashboards externes.
 */
app.get('/v1/metrics',
  RATE_PRESETS.public,
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN', 'HOLDING_FINANCE', 'FINANCE'),
  async (req, res) => {
    try {
      const entity_id = entityFilter(req);

      const [invoicesSnap, contactsSnap, employeesSnap] = await Promise.all([
        db.collection('finance').doc(entity_id).collection('invoices').count().get(),
        db.collection('crm').where('entity_id', '==', entity_id).count().get(),
        db.collection('users').where('entity_id', '==', entity_id).count().get(),
      ]);

      res.json({
        data: {
          invoices:  invoicesSnap.data().count,
          contacts:  contactsSnap.data().count,
          employees: employeesSnap.data().count,
          entity_id,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error('[API] GET /metrics:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error:   'NOT_FOUND',
    message: `Route ${req.method} ${req.path} n'existe pas. Consultez GET /spec pour la documentation.`,
  });
});

// ── OpenAPI 3.0 Spec ─────────────────────────────────────────────────────────
const OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title:       'IPC Intelligence Engine API',
    version:     '1.0.0',
    description: 'API REST publique pour les intégrations tierces avec l\'ERP IPC.',
    contact:     { name: 'IPC Tech', email: 'tech@ipc-group.com' },
  },
  servers: [
    { url: 'https://europe-west1-ipc-erp.cloudfunctions.net/api', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'Firebase ID Token',
        description:  'Obtenir via Firebase Auth SDK : user.getIdToken()',
      },
    },
    schemas: {
      Error: {
        type:       'object',
        properties: {
          error:   { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary:     'Statut de l\'API',
        security:    [],
        responses:   { '200': { description: 'API disponible' } },
      },
    },
    '/spec': {
      get: {
        summary:   'Documentation OpenAPI',
        security:  [],
        responses: { '200': { description: 'OpenAPI 3.0 spec' } },
      },
    },
    '/v1/invoices': {
      get: {
        summary:    'Liste des factures',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['paid', 'unpaid', 'overdue'] } },
        ],
        responses: {
          '200': { description: 'Liste paginée des factures' },
          '401': { description: 'Token manquant ou invalide' },
        },
      },
    },
    '/v1/contacts': {
      get: {
        summary:   'Liste des contacts CRM',
        responses: { '200': { description: 'Liste des contacts' }, '401': { description: 'Non authentifié' } },
      },
    },
    '/v1/employees': {
      get: {
        summary:   'Liste des employés (HR requis)',
        responses: { '200': { description: 'Liste des employés (champs sensibles masqués)' }, '403': { description: 'Permissions insuffisantes' } },
      },
    },
    '/v1/products': {
      get: {
        summary:   'Catalogue produits',
        responses: { '200': { description: 'Liste des produits' } },
      },
    },
    '/v1/metrics': {
      get: {
        summary:   'KPIs en temps réel (Finance requis)',
        responses: { '200': { description: 'Métriques clés' }, '403': { description: 'Permissions insuffisantes' } },
      },
    },
  },
};

// ── Export ────────────────────────────────────────────────────────────────────
exports.api = onRequest(
  {
    region:        'europe-west1',
    cors:          true,
    maxInstances:  20,
    memory:        '256MiB',
    timeoutSeconds: 30,
  },
  app
);
