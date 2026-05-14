/**
 * ════════════════════════════════════════════════════════════════
 * NEXUS EVENT BUS — Architecture Event-Driven IPC ERP
 * ════════════════════════════════════════════════════════════════
 *
 * POURQUOI :
 * Remplace les couplages directs module-à-module par un bus d'événements
 * typé et structuré. Chaque module publie des événements métier,
 * les autres modules s'abonnent selon leurs besoins.
 *
 * EXEMPLES CONCRETS :
 *   CRM : EventBus.emit('deal.won', { dealId, amount, clientId })
 *   → Connect publie un post de victoire sur le mur
 *   → Finance prépare une facture provisoire
 *
 *   Finance : EventBus.emit('invoice.paid', { invoiceId, amount })
 *   → HR calcule les commissions
 *   → Notifications envoie un récapitulatif
 *
 *   Production : EventBus.emit('order.completed', { orderId, qty })
 *   → Inventory met à jour le stock
 *   → Qualité crée un contrôle automatique
 *
 * CATALOGUE D'ÉVÉNEMENTS (topics structurés) :
 *
 * CRM & Ventes
 *   crm.lead.created          | crm.lead.qualified
 *   deal.created              | deal.updated | deal.won | deal.lost
 *   quote.accepted            | quote.rejected
 *   order.created             | order.shipped | order.delivered
 *   invoice.created           | invoice.sent  | invoice.paid | invoice.overdue
 *
 * Finance
 *   payment.received          | payment.refunded
 *   expense.submitted         | expense.approved | expense.rejected
 *   budget.exceeded           | budget.alert
 *   accounting.entry.created
 *
 * RH
 *   employee.hired            | employee.offboarded
 *   leave.requested           | leave.approved | leave.rejected
 *   payroll.generated         | payroll.paid
 *   performance.reviewed
 *
 * Production & Stocks
 *   production.order.created  | production.order.completed
 *   stock.updated             | stock.low_alert
 *   quality.control.failed    | quality.control.passed
 *
 * Projets
 *   project.created           | project.milestone.reached | project.completed
 *   task.assigned             | task.overdue
 *
 * Système
 *   user.role.changed         | user.login | user.logout
 *   notification.created
 *   connect.post.published
 */

// ── Types (JSDoc pour autocompletion sans TypeScript) ────────────────────

/**
 * @typedef {Object} BusEvent
 * @property {string}  topic      - Topic de l'événement (ex: 'deal.won')
 * @property {Object}  payload    - Données de l'événement
 * @property {string}  source     - Module émetteur (ex: 'crm', 'finance')
 * @property {string}  eventId    - ID unique de l'événement
 * @property {Date}    timestamp  - Date d'émission
 * @property {string}  [userId]   - UID de l'utilisateur qui a déclenché l'événement
 */

// ── Catalogue de topics valides ──────────────────────────────────────────
export const EVENTS = Object.freeze({
  // CRM & Ventes
  CRM_LEAD_CREATED:          'crm.lead.created',
  CRM_LEAD_QUALIFIED:        'crm.lead.qualified',
  DEAL_CREATED:              'deal.created',
  DEAL_WON:                  'deal.won',
  DEAL_LOST:                 'deal.lost',
  QUOTE_ACCEPTED:            'quote.accepted',
  ORDER_CREATED:             'order.created',
  ORDER_SHIPPED:             'order.shipped',
  ORDER_DELIVERED:           'order.delivered',
  INVOICE_CREATED:           'invoice.created',
  INVOICE_PAID:              'invoice.paid',
  INVOICE_OVERDUE:           'invoice.overdue',

  // Finance
  PAYMENT_RECEIVED:          'payment.received',
  EXPENSE_SUBMITTED:         'expense.submitted',
  EXPENSE_APPROVED:          'expense.approved',
  EXPENSE_REJECTED:          'expense.rejected',
  BUDGET_EXCEEDED:           'budget.exceeded',
  BUDGET_ALERT:              'budget.alert',
  ACCOUNTING_ENTRY_CREATED:  'accounting.entry.created',

  // RH
  EMPLOYEE_HIRED:            'employee.hired',
  EMPLOYEE_OFFBOARDED:       'employee.offboarded',
  LEAVE_REQUESTED:           'leave.requested',
  LEAVE_APPROVED:            'leave.approved',
  LEAVE_REJECTED:            'leave.rejected',
  PAYROLL_GENERATED:         'payroll.generated',
  PAYROLL_PAID:              'payroll.paid',

  // Production & Stocks
  PRODUCTION_ORDER_CREATED:  'production.order.created',
  PRODUCTION_ORDER_COMPLETED:'production.order.completed',
  STOCK_UPDATED:             'stock.updated',
  STOCK_LOW_ALERT:           'stock.low_alert',
  QUALITY_CONTROL_FAILED:    'quality.control.failed',
  QUALITY_CONTROL_PASSED:    'quality.control.passed',

  // Projets
  PROJECT_CREATED:           'project.created',
  PROJECT_MILESTONE:         'project.milestone.reached',
  PROJECT_COMPLETED:         'project.completed',
  TASK_ASSIGNED:             'task.assigned',
  TASK_OVERDUE:              'task.overdue',

  // Système
  USER_ROLE_CHANGED:         'user.role.changed',
  USER_LOGIN:                'user.login',
  USER_LOGOUT:               'user.logout',
  NOTIFICATION_CREATED:      'notification.created',

  // Connect Plus
  CONNECT_POST_PUBLISHED:    'connect.post.published',
  CONNECT_MENTION:           'connect.mention',
  CONNECT_DEAL_CELEBRATED:   'connect.deal.celebrated',
});

// ── Utilitaire ID ────────────────────────────────────────────────────────
let _eventCounter = 0;
const generateEventId = (topic) =>
  `${topic}:${Date.now()}:${++_eventCounter}`;

// ── Store interne ────────────────────────────────────────────────────────
const _subscribers = new Map(); // topic → Set<handler>
const _wildcardSubs = new Set(); // handlers abonnés à TOUS les événements
const _eventLog = [];           // historique des 200 derniers événements (debug)
const MAX_LOG = 200;

// ── Implementation ───────────────────────────────────────────────────────

const EventBus = {

  /**
   * Émet un événement métier sur le bus.
   *
   * @param {string}  topic    - Topic de l'événement (utiliser EVENTS.*)
   * @param {Object}  payload  - Données métier
   * @param {Object}  [opts]   - Options : source (module émetteur), userId
   * @returns {BusEvent}       - L'événement créé (pour logging/tracing)
   *
   * @example
   * EventBus.emit(EVENTS.DEAL_WON, { dealId: 'D-042', amount: 1200000, clientName: 'SGBCI' }, { source: 'crm' });
   */
  emit(topic, payload = {}, opts = {}) {
    if (!topic || typeof topic !== 'string') {
      console.warn('[EventBus] ⚠️ emit() appelé sans topic valide');
      return null;
    }

    const event = {
      eventId:   generateEventId(topic),
      topic,
      payload,
      source:    opts.source    || 'unknown',
      userId:    opts.userId    || null,
      timestamp: new Date(),
    };

    // Log interne (ring buffer de 200 événements)
    _eventLog.unshift(event);
    if (_eventLog.length > MAX_LOG) _eventLog.pop();

    if (import.meta.env.DEV) {
      console.groupCollapsed(`[EventBus] 📡 ${topic}`);
      console.log('Source:', event.source, '| ID:', event.eventId);
      console.log('Payload:', payload);
      console.groupEnd();
    }

    // Notifier les abonnés spécifiques au topic
    const topicSubs = _subscribers.get(topic);
    if (topicSubs?.size) {
      topicSubs.forEach(handler => {
        try { handler(event); }
        catch (err) { console.error(`[EventBus] Handler error on ${topic}:`, err); }
      });
    }

    // Notifier les wildcard subscribers
    _wildcardSubs.forEach(handler => {
      try { handler(event); }
      catch (err) { console.error('[EventBus] Wildcard handler error:', err); }
    });

    return event;
  },

  /**
   * S'abonne à un topic spécifique.
   *
   * @param {string}   topic    - Topic (utiliser EVENTS.* ou '*' pour tout)
   * @param {Function} handler  - Callback (event: BusEvent) => void
   * @returns {Function}        - Fonction de désabonnement
   *
   * @example
   * const unsub = EventBus.on(EVENTS.INVOICE_PAID, (event) => {
   *   console.log('Facture payée:', event.payload.invoiceId);
   * });
   * // Dans useEffect cleanup:
   * return unsub;
   */
  on(topic, handler) {
    if (!handler || typeof handler !== 'function') {
      console.warn('[EventBus] on() appelé avec un handler invalide');
      return () => {};
    }

    if (topic === '*') {
      _wildcardSubs.add(handler);
      return () => _wildcardSubs.delete(handler);
    }

    if (!_subscribers.has(topic)) {
      _subscribers.set(topic, new Set());
    }
    _subscribers.get(topic).add(handler);

    return () => {
      const subs = _subscribers.get(topic);
      if (subs) {
        subs.delete(handler);
        if (subs.size === 0) _subscribers.delete(topic);
      }
    };
  },

  /**
   * S'abonne à plusieurs topics en une seule ligne.
   *
   * @param {string[]} topics
   * @param {Function} handler
   * @returns {Function} unsubscribe (désabonne de tous les topics)
   *
   * @example
   * const unsub = EventBus.onMany([EVENTS.INVOICE_PAID, EVENTS.PAYMENT_RECEIVED], handler);
   */
  onMany(topics, handler) {
    const unsubs = topics.map(t => this.on(t, handler));
    return () => unsubs.forEach(u => u());
  },

  /**
   * S'abonne une seule fois à un topic (auto-désabonnement après 1 déclenchement).
   *
   * @param {string}   topic
   * @param {Function} handler
   * @returns {Function} unsubscribe anticipé si besoin
   */
  once(topic, handler) {
    let unsub;
    const wrapper = (event) => {
      handler(event);
      unsub();
    };
    unsub = this.on(topic, wrapper);
    return unsub;
  },

  /**
   * Retourne l'historique des N derniers événements émis.
   * Utile pour le debug et l'audit trail côté client.
   *
   * @param {number} [n=50]
   * @returns {BusEvent[]}
   */
  getRecentEvents(n = 50) {
    return _eventLog.slice(0, n);
  },

  /**
   * Retourne les statistiques d'abonnement (debug).
   */
  getStats() {
    const topicCount = {};
    _subscribers.forEach((subs, topic) => {
      topicCount[topic] = subs.size;
    });
    return {
      totalTopics:    _subscribers.size,
      wildcardSubs:   _wildcardSubs.size,
      topicBreakdown: topicCount,
      eventLogSize:   _eventLog.length,
    };
  },

  /**
   * Vide tous les abonnements (tests unitaires uniquement).
   */
  _reset() {
    _subscribers.clear();
    _wildcardSubs.clear();
    _eventLog.length = 0;
  },
};

export default EventBus;

// Note: Le hook React useEventBus est dans src/hooks/useEventBus.js
// pour éviter d'importer React dans ce module (potentiellement partagé Node/Browser).
