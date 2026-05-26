/**
 * ══════════════════════════════════════════════════════════════════
 * WEBHOOKS SORTANTS — IPC Intelligence Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P2 — Intégrations externe via webhooks HTTP
 * AVANT : EventBus 100% client-side, aucune notification externe possible
 * APRÈS : Cloud Function qui dispatche les événements métier à des
 *         endpoints HTTP configurés (Zapier, Make, systèmes tiers, ERP partenaires)
 *
 * Architecture :
 *   1. EventBus côté client écrit dans `webhook_events` (Firestore)
 *   2. Trigger Firestore onCreate → dispatchWebhookEvent()
 *   3. La function lit les `webhook_configs` actifs et envoie en HTTP POST
 *   4. HMAC-SHA256 signature dans le header X-IPC-Signature (vérifiable côté récepteur)
 *   5. Retry automatique : 3 tentatives avec backoff exponentiel
 *   6. Historique dans `webhook_deliveries` (TTL auto 30j)
 *
 * Format d'un webhook_configs/{id} :
 *   {
 *     url: "https://hooks.zapier.com/...",
 *     secret: "...",          // HMAC key, stocké chiffré
 *     events: ["deal.won", "invoice.paid"],   // [] = tous les événements
 *     active: true,
 *     entity_id: "ipc_green_blocks",          // isolation multi-entité
 *     created_by: "uid_admin",
 *     created_at: Timestamp
 *   }
 */

const { onDocumentCreated }  = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin  = require('firebase-admin');
const crypto = require('crypto');
const https  = require('https');
const http   = require('http');
const { URL } = require('url');
const { logger } = require('firebase-functions');
const { checkCallRate } = require('./rate_limiter');

const db = admin.firestore();

// ── Configuration ────────────────────────────────────────────────────────────
const MAX_RETRIES       = 3;
const RETRY_DELAYS_MS   = [1_000, 5_000, 30_000]; // backoff exponentiel
const REQUEST_TIMEOUT   = 10_000; // 10s
const MAX_RESPONSE_SIZE = 64_000; // 64KB max pour éviter les abus
const DELIVERY_TTL_DAYS = 30;

// ── HMAC-SHA256 Signature ────────────────────────────────────────────────────
const signPayload = (payload, secret) => {
  if (!secret) return null;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
};

// ── HTTP dispatch avec timeout ───────────────────────────────────────────────
const dispatchHttp = (url, body, headers) => {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try { parsedUrl = new URL(url); }
    catch { return reject(new Error(`Invalid URL: ${url}`)); }

    // Bloquer les adresses privées (SSRF protection)
    const hostname = parsedUrl.hostname;
    const isPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname === '169.254.169.254'; // AWS metadata service

    if (isPrivate) {
      return reject(new Error(`SSRF blocked: private/local URL not allowed: ${hostname}`));
    }

    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(bodyStr),
        'User-Agent':      'IPC-ERP-Webhooks/1.0',
        ...headers,
      },
      timeout: REQUEST_TIMEOUT,
    };

    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const req = transport.request(parsedUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > MAX_RESPONSE_SIZE) {
          req.destroy();
          reject(new Error('Response too large'));
        }
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 1000) }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(bodyStr);
    req.end();
  });
};

// ── Enregistrer le résultat d'une livraison ──────────────────────────────────
const recordDelivery = async (configId, eventId, topic, success, statusCode, error, attempt) => {
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + DELIVERY_TTL_DAYS);

  await db.collection('webhook_deliveries').add({
    configId,
    eventId,
    topic,
    success,
    statusCode:    statusCode || null,
    error:         error     || null,
    attempt,
    deliveredAt:   admin.firestore.FieldValue.serverTimestamp(),
    expireAt,      // TTL Firestore policy (field must be indexed in Firebase Console)
  });
};

// ── Dispatch vers un endpoint avec retry ─────────────────────────────────────
const dispatchWithRetry = async (config, eventPayload, eventId, topic) => {
  const bodyStr  = JSON.stringify(eventPayload);
  const signature = signPayload(bodyStr, config.secret);

  const headers = {
    'X-IPC-Event-ID':  eventId,
    'X-IPC-Topic':     topic,
    'X-IPC-Timestamp': String(Date.now()),
    ...(signature ? { 'X-IPC-Signature': signature } : {}),
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await dispatchHttp(config.url, bodyStr, headers);

      if (result.status >= 200 && result.status < 300) {
        logger.info(`[Webhook] ✅ Delivered ${topic} → ${config.url} (${result.status})`);
        await recordDelivery(config.id, eventId, topic, true, result.status, null, attempt);
        return;
      }

      // HTTP error — retry si pas le dernier essai
      logger.warn(`[Webhook] HTTP ${result.status} for ${config.url} (attempt ${attempt})`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
        continue;
      }

      await recordDelivery(config.id, eventId, topic, false, result.status,
        `HTTP ${result.status}`, attempt);

    } catch (err) {
      logger.warn(`[Webhook] Error attempt ${attempt} → ${config.url}: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
        continue;
      }
      await recordDelivery(config.id, eventId, topic, false, null, err.message, attempt);
    }
  }
};

// ── [TRIGGER] Écouter les nouveaux événements Firestore ──────────────────────
/**
 * Trigger : webhook_events/{eventId}
 * Chaque fois qu'un module crée un événement dans cette collection,
 * le dispatcher trouve les configs qui écoutent ce topic et envoie les webhooks.
 *
 * Structure webhook_events/{eventId} :
 * {
 *   topic: "deal.won",
 *   payload: { dealId, amount, ... },
 *   entity_id: "ipc_green_blocks",
 *   source: "crm",
 *   created_at: Timestamp
 * }
 */
exports.dispatchWebhookEvent = onDocumentCreated(
  'webhook_events/{eventId}',
  async (event) => {
    const snap  = event.data;
    const docId = event.params.eventId;
    if (!snap) return;

    const { topic, payload, entity_id } = snap.data();
    if (!topic) {
      logger.warn('[Webhook] Event without topic, skipping');
      return;
    }

    // Trouver les configs actifs qui écoutent ce topic (filtrés par entité)
    let query = db.collection('webhook_configs')
      .where('active', '==', true)
      .where('entity_id', '==', entity_id || 'ipc_group');

    const configsSnap = await query.get();
    if (configsSnap.empty) return;

    const eventPayload = {
      event_id:   docId,
      topic,
      payload:    payload || {},
      entity_id,
      timestamp:  new Date().toISOString(),
      version:    '1.0',
    };

    // Dispatch en parallèle vers toutes les configs éligibles
    const dispatches = [];
    configsSnap.forEach(doc => {
      const config = { id: doc.id, ...doc.data() };
      // Vérifier si la config écoute ce topic ([] = tous)
      const listenedEvents = config.events || [];
      if (listenedEvents.length === 0 || listenedEvents.includes(topic)) {
        dispatches.push(dispatchWithRetry(config, eventPayload, docId, topic));
      }
    });

    if (dispatches.length > 0) {
      await Promise.allSettled(dispatches);
      logger.info(`[Webhook] Dispatched ${topic} to ${dispatches.length} endpoint(s)`);
    }

    // Supprimer l'événement après traitement (auto-cleanup)
    await snap.ref.delete();
  }
);

// ── [CALLABLE] CRUD webhooks configs (admin uniquement) ─────────────────────

/**
 * Créer ou mettre à jour une configuration webhook.
 * Réservé aux ADMIN et SUPER_ADMIN.
 */
exports.manageWebhook = onCall(
  { region: 'europe-west1', enforceAppCheck: true },
  async (request) => {
    const { auth: authCtx, data } = request;

    if (!authCtx?.uid) throw new HttpsError('unauthenticated', 'Non authentifié');

    const role = authCtx.token?.role || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN'].includes(role)) {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs');
    }

    await checkCallRate(db, authCtx.uid, 'manageWebhook', { maxRequests: 10, windowMs: 60_000 });

    const { action, webhookId, url, events, active, secret } = data || {};

    if (action === 'create' || action === 'update') {
      // Valider URL
      if (!url) throw new HttpsError('invalid-argument', 'URL requise');
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new HttpsError('invalid-argument', 'URL doit être http(s)');
        }
      } catch {
        throw new HttpsError('invalid-argument', 'URL invalide');
      }

      const webhookData = {
        url,
        events:    Array.isArray(events) ? events : [],
        active:    active !== false,
        entity_id: authCtx.token?.entity_id || 'ipc_group',
        updated_by: authCtx.uid,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (secret) webhookData.secret = secret; // Ne jamais écraser avec vide

      if (action === 'create') {
        webhookData.created_by = authCtx.uid;
        webhookData.created_at = admin.firestore.FieldValue.serverTimestamp();
        const ref = await db.collection('webhook_configs').add(webhookData);
        return { success: true, id: ref.id };
      }

      if (!webhookId) throw new HttpsError('invalid-argument', 'webhookId requis pour update');
      await db.collection('webhook_configs').doc(webhookId).update(webhookData);
      return { success: true };
    }

    if (action === 'delete') {
      if (!webhookId) throw new HttpsError('invalid-argument', 'webhookId requis');
      await db.collection('webhook_configs').doc(webhookId).delete();
      return { success: true };
    }

    if (action === 'test') {
      if (!webhookId) throw new HttpsError('invalid-argument', 'webhookId requis');
      const snap = await db.collection('webhook_configs').doc(webhookId).get();
      if (!snap.exists) throw new HttpsError('not-found', 'Webhook introuvable');

      const config = { id: snap.id, ...snap.data() };
      const testPayload = {
        event_id:  `test:${Date.now()}`,
        topic:     'webhook.test',
        payload:   { message: 'IPC ERP webhook test — connexion vérifiée ✓', timestamp: new Date().toISOString() },
        entity_id: config.entity_id,
        timestamp: new Date().toISOString(),
        version:   '1.0',
      };

      try {
        const result = await dispatchHttp(
          config.url,
          JSON.stringify(testPayload),
          {
            'X-IPC-Event-ID':  testPayload.event_id,
            'X-IPC-Topic':     'webhook.test',
            'X-IPC-Timestamp': String(Date.now()),
            ...(config.secret ? { 'X-IPC-Signature': signPayload(JSON.stringify(testPayload), config.secret) } : {}),
          }
        );
        return { success: result.status >= 200 && result.status < 300, status: result.status };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    throw new HttpsError('invalid-argument', `Action inconnue: ${action}`);
  }
);

/**
 * Helper : émettre un événement webhook depuis n'importe quel module.
 * Usage interne Cloud Functions uniquement.
 *
 * @param {string} topic     - ex: 'deal.won'
 * @param {Object} payload   - Données métier
 * @param {string} entity_id - Identifiant entité
 * @param {string} source    - Module émetteur
 */
const emitWebhookEvent = async (topic, payload, entity_id = 'ipc_group', source = 'unknown') => {
  try {
    await db.collection('webhook_events').add({
      topic,
      payload,
      entity_id,
      source,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error(`[Webhook] Failed to emit event ${topic}:`, err);
  }
};

module.exports.emitWebhookEvent = emitWebhookEvent;
