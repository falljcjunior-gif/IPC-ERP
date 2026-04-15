import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Eye, Target, CheckCircle2, Clock, PauseCircle, Trash2 } from 'lucide-react';

const CANAL_COLORS = {
  Facebook: '#1877F2', Instagram: '#E4405F', LinkedIn: '#0A66C2',
  TikTok: '#010101', Google: '#4285F4', Autre: '#6366F1'
};

const CampaignesTab = ({ campaigns, formatCurrency, addRecord }) => {
  const [selected, setSelected] = useState(campaigns[0]?.id || null);
  const active = campaigns.find(c => c.id === selected);

  const cpc   = active?.clics > 0       ? (active.depense / active.clics).toFixed(0)       : '—';
  const cpa   = active?.conversions > 0  ? (active.depense / active.conversions).toFixed(0)  : '—';
  const roi   = active?.depense > 0      ? ((active.conversions * 150000) / active.depense).toFixed(1) : '—';
  const burn  = active?.budget > 0       ? ((active.depense / active.budget) * 100).toFixed(0) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
      {/* Liste */}
      <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Campagnes ({campaigns.length})</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          {campaigns.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucune campagne. Cliquez "Campagne" en haut pour en créer une.
            </div>
          )}
          {campaigns.map(c => {
            const color = CANAL_COLORS[c.canal] || '#6366F1';
            const br = c.budget > 0 ? (c.depense / c.budget) * 100 : 0;
            return (
              <motion.div key={c.id} whileHover={{ x: 3 }} onClick={() => setSelected(c.id)}
                style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '0.75rem', cursor: 'pointer',
                  border: `1px solid ${selected === c.id ? color + '50' : 'var(--border)'}`,
                  background: selected === c.id ? `${color}08` : 'var(--bg-subtle)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{c.nom}</div>
                    <div style={{ fontSize: '0.75rem', color, fontWeight: 700 }}>{c.canal} · {c.objectif}</div>
                  </div>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', height: 'fit-content', fontSize: '0.7rem', fontWeight: 800,
                    background: c.statut === 'Active' ? '#10B98120' : '#6366F120',
                    color: c.statut === 'Active' ? '#10B981' : '#6366F1' }}>{c.statut}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Budget consommé</span>
                  <span style={{ fontWeight: 800, color: br > 90 ? '#EF4444' : 'var(--text)' }}>{br.toFixed(0)}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(br, 100)}%`, height: '100%', background: br > 90 ? '#EF4444' : color, borderRadius: '3px' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Détail */}
      <div className="glass" style={{ borderRadius: '1.5rem', padding: '1.75rem', border: '1px solid var(--border)' }}>
        {active ? (
          <>
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: CANAL_COLORS[active.canal] || '#6366F1', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{active.canal}</div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>{active.nom}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{active.dateDebut} → {active.dateFin}</div>
            </div>

            {/* Métriques clés */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Budget', value: `${(active.budget||0).toLocaleString()} F` },
                { label: 'Dépensé', value: `${(active.depense||0).toLocaleString()} F`, warn: burn > 90 },
                { label: 'Reach', value: (active.reach||0).toLocaleString() },
                { label: 'Clics', value: (active.clics||0).toLocaleString() },
                { label: 'Conversions', value: active.conversions || 0, highlight: true },
                { label: 'ROI estimé', value: `×${roi}`, highlight: true },
                { label: 'CPC', value: `${Number(cpc).toLocaleString()||'—'} F` },
                { label: 'CPA', value: `${Number(cpa).toLocaleString()||'—'} F` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '0.85rem', borderRadius: '1rem', background: m.highlight ? '#10B98112' : 'var(--bg-subtle)',
                  border: `1px solid ${m.highlight ? '#10B98130' : m.warn ? '#EF444430' : 'var(--border)'}` }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{m.label}</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: m.highlight ? '#10B981' : m.warn ? '#EF4444' : 'var(--text)' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Barre de progression budget */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>Consommation budget</span>
                <span style={{ color: burn > 90 ? '#EF4444' : '#10B981' }}>{burn}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(burn, 100)}%` }} transition={{ duration: 0.8 }}
                  style={{ height: '100%', background: burn > 90 ? '#EF4444' : `${CANAL_COLORS[active.canal] || '#6366F1'}`, borderRadius: '4px' }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sélectionnez une campagne
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignesTab;
