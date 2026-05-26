/**
 * Tests — EventBus
 * Vérifier le bus d'événements interne IPC ERP
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventBus, { EVENTS } from '../services/EventBus';

describe('EventBus', () => {
  beforeEach(() => {
    EventBus._reset();
  });

  // ── emit ────────────────────────────────────────────────────────────────

  it('émettre un événement et retourner un objet BusEvent valide', () => {
    const event = EventBus.emit(EVENTS.DEAL_WON, { dealId: 'D-001', amount: 500000 }, { source: 'crm' });
    expect(event).toBeDefined();
    expect(event.topic).toBe(EVENTS.DEAL_WON);
    expect(event.payload.dealId).toBe('D-001');
    expect(event.source).toBe('crm');
    expect(event.eventId).toContain(EVENTS.DEAL_WON);
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('retourner null si le topic est invalide', () => {
    const result = EventBus.emit('');
    expect(result).toBeNull();

    const result2 = EventBus.emit(null);
    expect(result2).toBeNull();
  });

  it('émettre sans payload fonctionne (payload vide par défaut)', () => {
    const event = EventBus.emit(EVENTS.INVOICE_PAID);
    expect(event.payload).toEqual({});
  });

  // ── on ──────────────────────────────────────────────────────────────────

  it('s\'abonner à un topic et recevoir l\'événement', () => {
    const handler = vi.fn();
    EventBus.on(EVENTS.INVOICE_PAID, handler);
    EventBus.emit(EVENTS.INVOICE_PAID, { invoiceId: 'INV-001' });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].payload.invoiceId).toBe('INV-001');
  });

  it('désabonnement propre via la fonction retournée', () => {
    const handler = vi.fn();
    const unsub = EventBus.on(EVENTS.DEAL_WON, handler);
    EventBus.emit(EVENTS.DEAL_WON, { amount: 1 });
    expect(handler).toHaveBeenCalledOnce();

    unsub();
    EventBus.emit(EVENTS.DEAL_WON, { amount: 2 });
    expect(handler).toHaveBeenCalledOnce(); // Toujours 1, pas 2
  });

  it('retourner une fonction no-op si handler invalide', () => {
    const unsub = EventBus.on(EVENTS.DEAL_WON, 'pas-une-fonction');
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });

  // ── on('*') ─────────────────────────────────────────────────────────────

  it('wildcard (*) reçoit tous les événements', () => {
    const handler = vi.fn();
    EventBus.on('*', handler);
    EventBus.emit(EVENTS.DEAL_WON, {});
    EventBus.emit(EVENTS.INVOICE_PAID, {});
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('désabonner le wildcard correctement', () => {
    const handler = vi.fn();
    const unsub = EventBus.on('*', handler);
    unsub();
    EventBus.emit(EVENTS.DEAL_WON, {});
    expect(handler).not.toHaveBeenCalled();
  });

  // ── onMany ──────────────────────────────────────────────────────────────

  it('onMany s\'abonne à plusieurs topics', () => {
    const handler = vi.fn();
    const unsub = EventBus.onMany([EVENTS.DEAL_WON, EVENTS.INVOICE_PAID], handler);
    EventBus.emit(EVENTS.DEAL_WON, {});
    EventBus.emit(EVENTS.INVOICE_PAID, {});
    EventBus.emit(EVENTS.STOCK_LOW_ALERT, {}); // Non écouté
    expect(handler).toHaveBeenCalledTimes(2);

    unsub();
    EventBus.emit(EVENTS.DEAL_WON, {});
    expect(handler).toHaveBeenCalledTimes(2); // Pas de 3ème appel
  });

  // ── once ────────────────────────────────────────────────────────────────

  it('once() se déclenche une seule fois', () => {
    const handler = vi.fn();
    EventBus.once(EVENTS.EMPLOYEE_HIRED, handler);
    EventBus.emit(EVENTS.EMPLOYEE_HIRED, {});
    EventBus.emit(EVENTS.EMPLOYEE_HIRED, {});
    EventBus.emit(EVENTS.EMPLOYEE_HIRED, {});
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── getRecentEvents ──────────────────────────────────────────────────────

  it('getRecentEvents() retourne les événements récents', () => {
    EventBus.emit(EVENTS.DEAL_WON, { a: 1 });
    EventBus.emit(EVENTS.DEAL_LOST, { a: 2 });
    const events = EventBus.getRecentEvents(5);
    expect(events).toHaveLength(2);
    // Les plus récents en premier (unshift)
    expect(events[0].topic).toBe(EVENTS.DEAL_LOST);
    expect(events[1].topic).toBe(EVENTS.DEAL_WON);
  });

  it('getRecentEvents() limite le nombre de résultats', () => {
    for (let i = 0; i < 10; i++) {
      EventBus.emit(EVENTS.STOCK_UPDATED, { i });
    }
    expect(EventBus.getRecentEvents(3)).toHaveLength(3);
  });

  // ── getStats ─────────────────────────────────────────────────────────────

  it('getStats() retourne les statistiques d\'abonnement', () => {
    EventBus.on(EVENTS.DEAL_WON, vi.fn());
    EventBus.on(EVENTS.DEAL_WON, vi.fn());
    EventBus.on(EVENTS.INVOICE_PAID, vi.fn());
    EventBus.on('*', vi.fn());

    const stats = EventBus.getStats();
    expect(stats.totalTopics).toBe(2);
    expect(stats.wildcardSubs).toBe(1);
    expect(stats.topicBreakdown[EVENTS.DEAL_WON]).toBe(2);
    expect(stats.topicBreakdown[EVENTS.INVOICE_PAID]).toBe(1);
  });

  // ── Isolation handlers ───────────────────────────────────────────────────

  it('ne pas laisser une erreur dans un handler bloquer les autres', () => {
    const crashingHandler = vi.fn(() => { throw new Error('Handler crash'); });
    const safeHandler     = vi.fn();

    EventBus.on(EVENTS.DEAL_WON, crashingHandler);
    EventBus.on(EVENTS.DEAL_WON, safeHandler);

    expect(() => EventBus.emit(EVENTS.DEAL_WON, {})).not.toThrow();
    expect(safeHandler).toHaveBeenCalledOnce();
  });

  // ── EVENTS catalogue ─────────────────────────────────────────────────────

  it('le catalogue EVENTS contient les topics requis', () => {
    expect(EVENTS.DEAL_WON).toBe('deal.won');
    expect(EVENTS.INVOICE_PAID).toBe('invoice.paid');
    expect(EVENTS.EMPLOYEE_HIRED).toBe('employee.hired');
    expect(EVENTS.STOCK_LOW_ALERT).toBe('stock.low_alert');
    expect(EVENTS.PROJECT_COMPLETED).toBe('project.completed');
    expect(EVENTS.NOTIFICATION_CREATED).toBe('notification.created');
  });

  it('EVENTS est frozen (immuable)', () => {
    expect(() => { EVENTS.NEW_EVENT = 'test'; }).toThrow();
  });
});
