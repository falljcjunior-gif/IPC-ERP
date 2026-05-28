/**
 * ════════════════════════════════════════════════════════════════
 * NEXUS OS — MRP TAB (Material Requirements Planning — MVP)
 * ════════════════════════════════════════════════════════════════
 *
 * Logique MRP simplifiée :
 *   1. Lire les commandes client confirmées (demande)
 *   2. Lire les ordres de fabrication existants (offre planifiée)
 *   3. Lire les BOM pour calculer les besoins en composants
 *   4. Lire les stocks pour mesurer la couverture
 *   5. Calculer le besoin net = Demande - Stock - OF planifiés
 *   6. Permettre de créer un OF en un clic pour chaque déficit
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Package, Zap,
  TrendingUp, Factory, Calendar, ChevronRight,
  Play, Clock, ShieldAlert, Info, RefreshCw
} from 'lucide-react';
import { useStore } from '../../../store';
import { useToastStore } from '../../../store/useToastStore';
import { logger } from '../../../utils/logger';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const StatusBadge = ({ level }) => {
  const map = {
    ok:       { label: 'Stock OK',     color: '#10B981', bg: '#10B98115' },
    low:      { label: 'Stock Faible', color: '#F59E0B', bg: '#F59E0B15' },
    shortage: { label: 'Rupture',      color: '#EF4444', bg: '#EF444415' },
    unknown:  { label: 'À définir',    color: '#64748B', bg: '#64748B15' },
  };
  const s = map[level] || map.unknown;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

// ─── MRP Engine (pure function) ───────────────────────────────────────────────
/**
 * Calcule le plan MRP.
 * @param {object[]} salesOrders  - Commandes confirmées
 * @param {object[]} workOrders   - OF existants (Planifié / En cours)
 * @param {object[]} boms         - Nomenclatures
 * @param {object[]} inventory    - Articles en stock
 * @returns {object[]} mrpLines
 */
function computeMRP(salesOrders, workOrders, boms, inventory) {
  // ── 1. Agrégation de la demande par produit ──────────────────
  const demand = {};
  salesOrders.forEach(order => {
    // Les commandes peuvent référencer un produit par `produit`, `article`, `produitRef`, `nom`
    const key = (order.produit || order.article || order.produitRef || order.designation || '').trim();
    if (!key) return;
    const qty = Number(order.quantite || order.qty || order.quantiteCommandee || 1);
    const echeance = order.echeance || order.dateLivraison || order.date || null;
    if (!demand[key]) demand[key] = { qty: 0, orders: [], earliestDate: echeance };
    demand[key].qty += qty;
    demand[key].orders.push(order);
    if (echeance && (!demand[key].earliestDate || echeance < demand[key].earliestDate)) {
      demand[key].earliestDate = echeance;
    }
  });

  // ── 2. Offre planifiée par produit ──────────────────────────
  const planned = {};
  workOrders
    .filter(w => ['Planifié', 'En cours'].includes(w.statut || w.status))
    .forEach(w => {
      const key = (w.produit || w.article || '').trim();
      if (!key) return;
      if (!planned[key]) planned[key] = 0;
      planned[key] += Number(w.qte || w.quantite || 0);
    });

  // ── 3. Stock disponible par produit ─────────────────────────
  const stockMap = {};
  inventory.forEach(item => {
    const key = (item.nom || item.designation || item.sku || '').trim();
    if (!key) return;
    stockMap[key] = (stockMap[key] || 0) + Number(item.stock_reel || item.stockActuel || 0);
  });

  // ── 4. BOM map ───────────────────────────────────────────────
  const bomMap = {};
  boms.forEach(b => {
    const key = (b.produit || '').trim();
    if (key) bomMap[key] = b;
  });

  // ── 5. Calcul du besoin net ──────────────────────────────────
  return Object.entries(demand).map(([produit, { qty: demandQty, orders, earliestDate }]) => {
    const availableStock = stockMap[produit] || 0;
    const plannedQty     = planned[produit] || 0;
    const netNeed        = Math.max(0, demandQty - availableStock - plannedQty);
    const coverage       = demandQty > 0 ? (availableStock + plannedQty) / demandQty : 1;
    const bom            = bomMap[produit] || null;

    let stockLevel;
    if (coverage >= 1)    stockLevel = 'ok';
    else if (coverage >= 0.5) stockLevel = 'low';
    else                  stockLevel = 'shortage';

    return {
      produit,
      demandQty,
      availableStock,
      plannedQty,
      netNeed,
      coverage,
      stockLevel,
      earliestDate,
      salesOrderCount: orders.length,
      hasBOM: !!bom,
      bomCout: bom?.coutEstime,
    };
  }).sort((a, b) => {
    // Trier : ruptures d'abord, puis par date
    const levelOrder = { shortage: 0, low: 1, ok: 2 };
    const lo = (levelOrder[a.stockLevel] || 2) - (levelOrder[b.stockLevel] || 2);
    if (lo !== 0) return lo;
    return (a.earliestDate || '').localeCompare(b.earliestDate || '');
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const MRPTab = () => {
  const { data, addRecord } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const [creatingOf, setCreatingOf] = useState({});
  const [showHelp, setShowHelp] = useState(false);

  // ── Données source ──────────────────────────────────────────
  const salesOrders = useMemo(() =>
    (data?.sales?.orders || []).filter(o => ['Confirmé', 'En Préparation', 'Expédié'].includes(o.statut || o.status)),
  [data]);

  const workOrders = useMemo(() => data?.production?.workOrders || [], [data]);
  const boms       = useMemo(() => data?.production?.boms || [], [data]);
  const inventory  = useMemo(() => data?.inventory?.products || [], [data]);

  // ── Calcul MRP ──────────────────────────────────────────────
  const mrpLines = useMemo(() =>
    computeMRP(salesOrders, workOrders, boms, inventory),
  [salesOrders, workOrders, boms, inventory]);

  // ── KPIs ────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    totalLines: mrpLines.length,
    ruptures:   mrpLines.filter(l => l.stockLevel === 'shortage').length,
    faibles:    mrpLines.filter(l => l.stockLevel === 'low').length,
    ok:         mrpLines.filter(l => l.stockLevel === 'ok').length,
  }), [mrpLines]);

  // ── Créer un OF planifié ─────────────────────────────────────
  const handleCreateOF = async (line) => {
    setCreatingOf(p => ({ ...p, [line.produit]: true }));
    try {
      const nextNum = `OF-MRP-${Date.now().toString(36).toUpperCase()}`;
      await addRecord('production', 'workOrders', {
        num:        nextNum,
        produit:    line.produit,
        qte:        line.netNeed,
        echeance:   line.earliestDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        statut:     'Planifié',
        priority:   line.stockLevel === 'shortage' ? 'Urgente' : 'Haute',
        progression: 0,
        _source:    'MRP_AUTO',
        _mrp:       true,
      });
      addToast(`OF ${nextNum} créé pour "${line.produit}" — ${line.netNeed} unités`, 'success');
    } catch (err) {
      logger.error('[MRP] createOF failed:', err.message);
      addToast(`Erreur lors de la création de l'OF : ${err.message}`, 'error');
    } finally {
      setCreatingOf(p => ({ ...p, [line.produit]: false }));
    }
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Plan MRP</h3>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: '#3B82F615', color: '#3B82F6', fontSize: '0.7rem', fontWeight: 800 }}>
              Planification des besoins matière
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {mrpLines.length} produit{mrpLines.length > 1 ? 's' : ''} analysé{mrpLines.length > 1 ? 's' : ''} · basé sur {salesOrders.length} commande{salesOrders.length > 1 ? 's' : ''} confirmée{salesOrders.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowHelp(h => !h)}
          aria-label="Aide MRP"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}
        >
          <Info size={14} aria-hidden="true" /> Comment ça marche ?
        </button>
      </div>

      {/* ── Help Panel ── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '1.5rem', borderRadius: '1.25rem', background: '#3B82F608', border: '1px solid #3B82F625', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>Formule MRP :</strong>
              <code style={{ background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: 6, fontFamily: 'monospace', color: '#3B82F6' }}>
                Besoin Net = Demande Confirmée − Stock Disponible − OF Planifiés
              </code>
              <ul style={{ margin: '0.75rem 0 0 1.25rem', padding: 0 }}>
                <li><strong>Stock OK</strong> : la couverture ≥ 100% — aucune action requise</li>
                <li><strong>Stock Faible</strong> : couverture entre 50% et 100% — surveiller</li>
                <li><strong>Rupture</strong> : couverture &lt; 50% — créer un OF immédiatement</li>
              </ul>
              <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                Les données proviennent des <strong>commandes client confirmées</strong>, des <strong>ordres de fabrication</strong> en cours/planifiés, et des <strong>stocks d'inventaire</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
        {[
          { label: 'Produits analysés', value: kpis.totalLines, icon: <Package size={18} />, color: '#3B82F6' },
          { label: 'En rupture', value: kpis.ruptures, icon: <AlertTriangle size={18} />, color: '#EF4444' },
          { label: 'Stock faible', value: kpis.faibles, icon: <ShieldAlert size={18} />, color: '#F59E0B' },
          { label: 'Stock OK', value: kpis.ok, icon: <CheckCircle2 size={18} />, color: '#10B981' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${k.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MRP Table ── */}
      {mrpLines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', border: '1px solid var(--border)', borderRadius: '1.75rem' }}>
          <Factory size={48} style={{ opacity: 0.15, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>Aucune demande détectée</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Confirmez des commandes client dans le module Ventes pour générer un plan MRP.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '1.75rem', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', padding: '0.9rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Produit</span>
            <span>Demande</span>
            <span>Stock dispo</span>
            <span>OF planifiés</span>
            <span>Besoin net</span>
            <span>Statut</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          {mrpLines.map((line, idx) => (
            <motion.div
              key={line.produit}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                gap: '0.5rem',
                padding: '1rem 1.5rem',
                borderBottom: idx < mrpLines.length - 1 ? '1px solid var(--border-light)' : 'none',
                alignItems: 'center',
                background: line.stockLevel === 'shortage' ? '#EF444405' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              {/* Produit */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {line.stockLevel === 'shortage' && <AlertTriangle size={13} color="#EF4444" aria-hidden="true" />}
                  {line.produit}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={10} aria-hidden="true" /> {fmtDate(line.earliestDate)}
                  </span>
                  <span>{line.salesOrderCount} cmd</span>
                  {!line.hasBOM && <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚠ Pas de BOM</span>}
                </div>
              </div>

              {/* Demande */}
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{line.demandQty}</span>

              {/* Stock dispo */}
              <span style={{ fontWeight: 600, color: line.availableStock >= line.demandQty ? '#10B981' : '#EF4444', fontSize: '0.9rem' }}>
                {line.availableStock}
              </span>

              {/* OF planifiés */}
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{line.plannedQty}</span>

              {/* Besoin net */}
              <span style={{ fontWeight: 800, color: line.netNeed > 0 ? '#EF4444' : '#10B981', fontSize: '0.9rem' }}>
                {line.netNeed > 0 ? `+${line.netNeed}` : '—'}
              </span>

              {/* Statut */}
              <StatusBadge level={line.stockLevel} />

              {/* Action */}
              <div>
                {line.netNeed > 0 ? (
                  <button
                    onClick={() => handleCreateOF(line)}
                    disabled={!!creatingOf[line.produit]}
                    aria-label={`Créer un ordre de fabrication pour ${line.produit}`}
                    title={`Créer OF — ${line.netNeed} unités`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                      background: line.stockLevel === 'shortage' ? '#EF4444' : '#F59E0B',
                      color: 'white', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap',
                      opacity: creatingOf[line.produit] ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {creatingOf[line.produit]
                      ? <RefreshCw size={12} className="spin" aria-hidden="true" />
                      : <Play size={12} aria-hidden="true" />
                    }
                    Créer OF
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} aria-hidden="true" /> OK
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Source info ── */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
        <span>📋 <strong>{salesOrders.length}</strong> commande{salesOrders.length > 1 ? 's' : ''} confirmée{salesOrders.length > 1 ? 's' : ''}</span>
        <span>⚙️ <strong>{workOrders.filter(w => ['Planifié','En cours'].includes(w.statut)).length}</strong> OF actifs</span>
        <span>📦 <strong>{inventory.length}</strong> article{inventory.length > 1 ? 's' : ''} en stock</span>
        <span>🗂 <strong>{boms.length}</strong> nomenclature{boms.length > 1 ? 's' : ''}</span>
      </div>
    </motion.div>
  );
};

export default MRPTab;
