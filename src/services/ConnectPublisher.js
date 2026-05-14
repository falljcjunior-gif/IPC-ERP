/**
 * ════════════════════════════════════════════════════════════════
 * CONNECT PUBLISHER — Cross-Module → Mur Enterprise
 * ════════════════════════════════════════════════════════════════
 *
 * Ce service écoute l'EventBus et publie automatiquement des posts
 * contextuels sur le Mur Enterprise (Connect Plus) lors d'événements
 * métier significatifs.
 *
 * ÉVÉNEMENTS AUTOMATISÉS :
 *   DEAL_WON          → 🏆 Victoire commerciale célébrée
 *   INVOICE_PAID      → 💰 Paiement confirmé
 *   PROJECT_MILESTONE → 🎯 Jalon projet atteint
 *   PROJECT_COMPLETED → 🎉 Projet terminé
 *   EMPLOYEE_HIRED    → 👋 Bienvenue au nouvel employé
 *   PRODUCTION_ORDER_COMPLETED → 🏭 Production terminée
 *   STOCK_LOW_ALERT   → ⚠️ Alerte stock faible (ciblée managers)
 *
 * USAGE :
 *   import ConnectPublisher from './ConnectPublisher';
 *   ConnectPublisher.init(); // Appelé une seule fois dans App.jsx ou BusinessContext
 *
 * DÉSACTIVATION GRANULAIRE :
 *   ConnectPublisher.toggleTopic(EVENTS.DEAL_WON, false);
 */

import EventBus, { EVENTS } from './EventBus';
import { FirestoreService } from './firestore.service';
import { auth } from '../firebase/config';

// ── Templates de posts par événement ────────────────────────────────────

const POST_TEMPLATES = {

  [EVENTS.DEAL_WON]: (payload) => ({
    type:     'celebration',
    category: 'commercial',
    icon:     '🏆',
    title:    `Deal gagné — ${payload.clientName || 'Client'}`,
    content:  `Félicitations à l'équipe commerciale ! Le deal **${payload.dealTitle || payload.dealId}** avec **${payload.clientName || 'notre client'}** a été remporté${payload.amount ? ` pour un montant de **${new Intl.NumberFormat('fr-FR').format(payload.amount)} ${payload.currency || 'FCFA'}**` : ''}.${payload.salesPerson ? ` Bravo à **${payload.salesPerson}** pour cette belle victoire !` : ''}`,
    tags:     ['#commercial', '#victoire', '#CRM'],
    audience: 'all',
  }),

  [EVENTS.INVOICE_PAID]: (payload) => ({
    type:     'financial',
    category: 'finance',
    icon:     '💰',
    title:    `Paiement reçu — ${payload.invoiceRef || payload.invoiceId}`,
    content:  `Le paiement de **${payload.amount ? new Intl.NumberFormat('fr-FR').format(payload.amount) + ' FCFA' : '—'}** a été confirmé${payload.clientName ? ` de la part de **${payload.clientName}**` : ''}. Le dossier financier est à jour.`,
    tags:     ['#finance', '#paiement'],
    audience: 'finance_team',
  }),

  [EVENTS.PROJECT_MILESTONE]: (payload) => ({
    type:     'milestone',
    category: 'projets',
    icon:     '🎯',
    title:    `Jalon atteint — ${payload.projectName || 'Projet'}`,
    content:  `Le jalon **"${payload.milestoneName || payload.milestone}"** du projet **${payload.projectName}** a été atteint${payload.completionPct ? ` (${payload.completionPct}% du projet accompli)` : ''}. Excellent travail d'équipe !`,
    tags:     ['#projets', '#milestone', `#${(payload.projectName || 'projet').replace(/\s+/g, '')}`],
    audience: 'all',
  }),

  [EVENTS.PROJECT_COMPLETED]: (payload) => ({
    type:     'celebration',
    category: 'projets',
    icon:     '🎉',
    title:    `Projet terminé — ${payload.projectName}`,
    content:  `Le projet **${payload.projectName}** est officiellement clôturé avec succès !${payload.duration ? ` Durée totale : ${payload.duration}.` : ''}${payload.teamMembers?.length ? ` Félicitations à toute l'équipe projet.` : ''}`,
    tags:     ['#projets', '#succès', '#clôture'],
    audience: 'all',
  }),

  [EVENTS.EMPLOYEE_HIRED]: (payload) => ({
    type:     'welcome',
    category: 'rh',
    icon:     '👋',
    title:    `Bienvenue — ${payload.employeeName}`,
    content:  `Accueillons chaleureusement **${payload.employeeName}** qui rejoint notre équipe en tant que **${payload.poste || payload.role}**${payload.departement ? ` au département **${payload.departement}**` : ''} ! N'hésitez pas à lui souhaiter la bienvenue.`,
    tags:     ['#rh', '#onboarding', '#bienvenue'],
    audience: 'all',
  }),

  [EVENTS.PRODUCTION_ORDER_COMPLETED]: (payload) => ({
    type:     'operational',
    category: 'production',
    icon:     '🏭',
    title:    `Production terminée — ${payload.orderId}`,
    content:  `L'ordre de fabrication **${payload.orderId}** est terminé.${payload.quantity ? ` Quantité produite : **${payload.quantity} ${payload.unit || 'unités'}**.` : ''}${payload.qualityScore ? ` Score qualité : **${payload.qualityScore}/100**.` : ''}`,
    tags:     ['#production', '#manufacturing'],
    audience: 'operations_team',
  }),

  [EVENTS.STOCK_LOW_ALERT]: (payload) => ({
    type:     'alert',
    category: 'stocks',
    icon:     '⚠️',
    title:    `Alerte Stock — ${payload.productName}`,
    content:  `Le stock du produit **${payload.productName}** est en dessous du seuil critique (**${payload.currentStock} ${payload.unit || 'unités'}** / seuil : ${payload.threshold} ${payload.unit || 'unités'}). Une commande de réapprovisionnement est recommandée.`,
    tags:     ['#stocks', '#alerte', '#approvisionnement'],
    audience: 'operations_managers',
    priority: 'high',
  }),

};

// ── Topics activés par défaut ────────────────────────────────────────────
const DEFAULT_ENABLED_TOPICS = new Set([
  EVENTS.DEAL_WON,
  EVENTS.PROJECT_MILESTONE,
  EVENTS.PROJECT_COMPLETED,
  EVENTS.EMPLOYEE_HIRED,
  EVENTS.PRODUCTION_ORDER_COMPLETED,
  // EVENTS.INVOICE_PAID      — désactivé par défaut (données financières sensibles)
  // EVENTS.STOCK_LOW_ALERT   — désactivé par défaut (ciblage managers uniquement)
]);

// ── État interne ─────────────────────────────────────────────────────────
let _initialized = false;
let _unsubscribes = [];
const _enabledTopics = new Set(DEFAULT_ENABLED_TOPICS);

// ── Service principal ────────────────────────────────────────────────────

const ConnectPublisher = {

  /**
   * Initialise le publisher et souscrit aux événements configurés.
   * Idempotent — peut être appelé plusieurs fois sans effets de bord.
   */
  init() {
    if (_initialized) return;
    _initialized = true;

    const handledTopics = Object.keys(POST_TEMPLATES);

    handledTopics.forEach(topic => {
      const unsub = EventBus.on(topic, (event) => {
        if (!_enabledTopics.has(topic)) return;
        this._publishToWall(topic, event.payload, event).catch(err => {
          console.warn(`[ConnectPublisher] Échec publication pour ${topic}:`, err);
        });
      });
      _unsubscribes.push(unsub);
    });

    if (import.meta.env.DEV) {
      console.info('[ConnectPublisher] ✅ Initialisé — topics actifs:', [..._enabledTopics]);
    }
  },

  /**
   * Active ou désactive la publication automatique pour un topic.
   * @param {string}  topic
   * @param {boolean} enabled
   */
  toggleTopic(topic, enabled) {
    if (enabled) {
      _enabledTopics.add(topic);
    } else {
      _enabledTopics.delete(topic);
    }
  },

  /**
   * Publie un post sur le Mur Enterprise (collection `connect`).
   * @private
   */
  async _publishToWall(topic, payload, event) {
    const templateFn = POST_TEMPLATES[topic];
    if (!templateFn) return;

    const template = templateFn(payload);

    // Construire le document de post
    const postDoc = {
      subModule:    'wall',
      type:         template.type,
      category:     template.category,
      icon:         template.icon,
      titre:        template.title,
      contenu:      template.content,
      tags:         template.tags || [],
      audience:     template.audience || 'all',
      priority:     template.priority || 'normal',

      // Métadonnées événement
      _sourceEvent:  topic,
      _sourceModule: event.source,
      _eventId:      event.eventId,
      _autoPublished: true,

      // Auteur (bot système)
      auteurId:     auth.currentUser?.uid || 'system',
      auteurNom:    'Nexus Intelligence',
      auteurAvatar: null,
      auteurRole:   'SYSTEM',

      // Engagement
      reactions:    {},
      comments:     [],
      views:        0,
      isPinned:     false,
    };

    await FirestoreService.createDocument('connect', postDoc);

    if (import.meta.env.DEV) {
      console.info(`[ConnectPublisher] 📢 Post publié sur le mur : "${template.title}"`);
    }
  },

  /**
   * Arrête le publisher (cleanup lors du logout).
   */
  destroy() {
    _unsubscribes.forEach(u => u());
    _unsubscribes = [];
    _initialized = false;
  },
};

export default ConnectPublisher;
