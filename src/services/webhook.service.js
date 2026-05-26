/**
 * ══════════════════════════════════════════════════════════════════
 * WEBHOOK SERVICE — Client Side
 * ══════════════════════════════════════════════════════════════════
 *
 * Permet aux modules côté client d'émettre des événements métier
 * qui seront acheminés vers les endpoints webhook configurés.
 *
 * Fonctionnement :
 *   1. emit() écrit dans `webhook_events` (Firestore)
 *   2. La Cloud Function dispatchWebhookEvent() écoute onCreate
 *      et dispatche vers tous les endpoints configurés
 *
 * Utilisation :
 *   import { WebhookService } from '../services/webhook.service';
 *   await WebhookService.emit('deal.won', { dealId, amount });
 */

import { db }        from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getTenantContext }  from './TenantContext';
import { useStore }         from '../store';
import logger               from '../utils/logger';

const WebhookService = {

  /**
   * Émet un événement métier qui sera dispatché aux webhooks configurés.
   *
   * @param {string}  topic     - Topic de l'événement (ex: 'deal.won')
   * @param {Object}  payload   - Données métier (sera transmis tel quel)
   * @param {string}  [source]  - Module émetteur (ex: 'crm', 'finance')
   * @returns {Promise<string>} - eventId du document créé
   */
  async emit(topic, payload = {}, source = 'unknown') {
    if (!topic) {
      logger.warn('[WebhookService] emit() appelé sans topic');
      return null;
    }

    try {
      const tenantCtx = getTenantContext();
      const currentUser = useStore.getState().currentUser;

      const eventDoc = {
        topic,
        payload,
        entity_id:  tenantCtx?.entity_id  || 'ipc_group',
        tenant_id:  tenantCtx?.tenant_id  || 'ipc_group',
        source,
        triggered_by: currentUser?.id || null,
        created_at: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'webhook_events'), eventDoc);
      logger.info(`[WebhookService] Event emitted: ${topic} → ${ref.id}`);
      return ref.id;
    } catch (err) {
      // Webhook emission is non-blocking — never throw to the caller
      logger.warn(`[WebhookService] Failed to emit event ${topic}:`, err.message);
      return null;
    }
  },

  /**
   * Variante silencieuse : ne bloque jamais même en cas d'erreur.
   * Idéal pour les appels post-mutation sans attendre la confirmation.
   *
   * @param {string}  topic
   * @param {Object}  payload
   * @param {string}  source
   */
  emitAsync(topic, payload = {}, source = 'unknown') {
    this.emit(topic, payload, source).catch(() => {});
  },
};

export { WebhookService };
export default WebhookService;
