/**
 * useEventBus — Hook React pour s'abonner à l'EventBus Nexus
 *
 * Gère automatiquement le cleanup (désabonnement) au démontage du composant.
 * Le handler est stabilisé via useRef pour éviter les re-souscriptions
 * inutiles lors des re-renders.
 *
 * @example
 * import { useEventBus } from '../hooks/useEventBus';
 * import { EVENTS }      from '../services/EventBus';
 *
 * function DealWinNotifier() {
 *   useEventBus(EVENTS.DEAL_WON, (event) => {
 *     addToast({ type: 'success', message: `Deal gagné : ${event.payload.clientName}` });
 *   });
 *   return null;
 * }
 *
 * // Plusieurs topics :
 * useEventBus([EVENTS.INVOICE_PAID, EVENTS.PAYMENT_RECEIVED], handler);
 */

import { useEffect, useRef } from 'react';
import EventBus from '../services/EventBus';

/**
 * @param {string | string[]} topicOrTopics  - Topic(s) à écouter (EVENTS.* ou tableau)
 * @param {Function}          handler        - (event: BusEvent) => void
 * @param {any[]}             [deps=[]]      - Dépendances supplémentaires (comme useEffect)
 */
export function useEventBus(topicOrTopics, handler, deps = []) {
  // On stabilise le handler avec une ref pour éviter de re-souscrire à chaque render
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler = (event) => handlerRef.current(event);

    if (Array.isArray(topicOrTopics)) {
      return EventBus.onMany(topicOrTopics, stableHandler);
    }
    return EventBus.on(topicOrTopics, stableHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Array.isArray(topicOrTopics) ? topicOrTopics : [topicOrTopics, ...deps]);
}

export default useEventBus;
