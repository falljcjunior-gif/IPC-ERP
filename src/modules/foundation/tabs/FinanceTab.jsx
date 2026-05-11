/**
 * Foundation — Finance & Gestion des Dons
 * Comptabilité analytique par projet, subventions, Indice de Solidarité
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, Target, Sparkles, Plus,
  ChevronRight, Eye, Download, Landmark, Heart,
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import SmartButton from '../../../components/SmartButton';
import { useToastStore } from '../../../store/useToastStore';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Mock data ───────────────────────────────────────────────────
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const DONS_DATA = MONTHS.map((m, i) => ({
  mois: m,
  dons: Math.round(600000 + Math.random() * 400000),
  subventions: Math.round(200000 + Math.random() * 300000),
  mondhiro: Math.round(80000 + Math.random() * 120000),
}));

const PROJETS = [
  { id: 'p1', nom: 'Centre de Tri Yopougon',       budget: 4500000, depense: 3120000, phase: 'Opérationnel', color: '#10B981' },
  { id: 'p2', nom: 'Autonomisation Femmes Abobo',   budget: 2800000, depense: 1950000, phase: 'En cours',     color: '#6366F1' },
  { id: 'p3', nom: 'Formation Jeunes Koumassi',     budget: 1200000, depense: 480000,  phase: 'Démarrage',   color: '#F59E0B' },
  { id: 'p4', nom: 'Centre de Tri Cocody',          budget: 3800000, depense: 760000,  phase: 'Planifié',    color: '#06B6D4' },
  { id: 'p5', nom: 'Micro-crédits Porteurs',        budget: 1600000, depense: 1280000, phase: 'En cours',    color: '#EC4899' },
];

const TRANSACTIONS = [
  { date: '2025-05-09', desc: 'Don — Fondation Orange CI',   montant: 850000,  type: 'entree', projet: 'Centre de Tri Yopougon' },
  { date: '2025-05-08', desc: 'Subvention — Programme ONU Femmes', montant: 1200000, type: 'entree', projet: 'Autonomisation Femmes' },
  { date: '2025-05-07', desc: '2% ventes SHAYNAYAH — Avril',  montant: 124000,  type: 'entree', projet: 'Fonds Général' },
  { date: '2025-05-06', desc: 'Formation instructeurs',        montant: -320000, type: 'sortie', projet: 'Formation Jeunes' },
  { date: '2025-05-05', desc: 'Matériel tri plastique',        montant: -580000, type: 'sortie', projet: 'Centre de Tri Yopougon' },
  { date: '2025-05-04', desc: 'Don particulier — Ma.D.',       montant: 50000,   type: 'entree', projet: 'Fonds Général' },
  { date: '2025-05-03', desc: '2% ventes Mondhiro — Avril',    montant: 98000,   type: 'entree', projet: 'Fonds Général' },
];

const SPARKLINE = MONTHS.slice(0, 6).map((_, i) => ({ val: 600000 + i * 80000 }));

export default function FinanceTab() {
  const [selProjet, setSelProjet] = useState(null);
  const { addToast } = useToastStore();

  const totalDons     = DONS_DATA.reduce((s, d) => s + d.dons, 0);
  const totalSubv     = DONS_DATA.reduce((s, d) => s + d.subventions, 0);
  const totalMondhiro = DONS_DATA.reduce((s, d) => s + d.mondhiro, 0);
  const solidarite    = Math.round(((totalMondhiro) / totalDons) * 100);

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.abs(n)) + ' FCFA';

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Total Dons (12m)"    value={`${(totalDons/1000000).toFixed(1)}M FCFA`}     trend={12.4} trendType="up" icon={<Heart size={20} />}      color="#10B981" sparklineData={SPARKLINE} />
        <KpiCard title="Subventions Actives" value={`${(totalSubv/1000000).toFixed(1)}M FCFA`}     trend={8.2}  trendType="up" icon={<Landmark size={20} />}    color="#6366F1" sparklineData={SPARKLINE} />
        <KpiCard title="% Ventes → Impact"  value={`${(totalMondhiro/1000).toFixed(0)}K FCFA`}    trend={5.1}  trendType="up" icon={<TrendingUp size={20} />}   color="#F59E0B" sparklineData={SPARKLINE} />
        <KpiCard title="Indice de Solidarité" value={`${solidarite}%`}                            trend={2.3}  trendType="up" icon={<Sparkles size={20} />}    color="#EC4899" sparklineData={SPARKLINE} />
      </motion.div>

      {/* Impact par don */}
      <motion.div variants={fade} className="glass" style={{
        padding: '1.5rem 2rem', borderRadius: '1.5rem',
        background: 'linear-gradient(135deg, #10B98112, #6366f108)',
        border: '1px solid #10B98125',
        display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: '#10B98120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={22} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981' }}>Impact Concret</div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>Transparence Radicale</div>
          </div>
        </div>
        {[
          { don: '10 000', result: '15h de formation professionnelle', icon: '📚' },
          { don: '50 000', result: '1 micro-crédit pour une entrepreneuse', icon: '💼' },
          { don: '100 000', result: '1 mois de fonctionnement d\'un centre', icon: '🏭' },
        ].map((item, i) => (
          <div key={i} className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', flex: '1 1 180px', minWidth: 180 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {item.icon} <strong style={{ color: '#10B981' }}>{item.don} FCFA</strong> =
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{item.result}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Évolution dons */}
        <div className="luxury-widget" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#10B981" /> Évolution des Entrées (12 mois)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DONS_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gDons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSubv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [fmt(v)]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="dons" stroke="#10B981" strokeWidth={2} fill="url(#gDons)" name="Dons" />
              <Area type="monotone" dataKey="subventions" stroke="#6366F1" strokeWidth={2} fill="url(#gSubv)" name="Subventions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart % ventes */}
        <div className="luxury-widget" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#F59E0B" /> % Ventes → Foundation (Mondhiro + SHAYNAYAH)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DONS_DATA.slice(6)} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [fmt(v)]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="mondhiro" fill="#F59E0B" radius={[6,6,0,0]} name="% Ventes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Projets */}
      <motion.div variants={fade} className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>📁 Projets Actifs — Comptabilité Analytique</div>
          <SmartButton variant="primary" icon={Plus} onClick={() => addToast('Nouveau projet créé', 'success')}>Nouveau Projet</SmartButton>
        </div>
        <div style={{ padding: '0.5rem 0' }}>
          {PROJETS.map(p => {
            const pct = Math.round((p.depense / p.budget) * 100);
            return (
              <motion.div key={p.id} whileHover={{ background: 'var(--bg-subtle)' }}
                style={{ padding: '1rem 1.5rem', cursor: 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
                onClick={() => setSelProjet(selProjet === p.id ? null : p.id)}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.nom}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fmt(p.depense)} / {fmt(p.budget)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-dark)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                      style={{ height: '100%', background: p.color, borderRadius: 999 }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: p.color, background: `${p.color}18`, border: `1px solid ${p.color}30`, borderRadius: '0.4rem', padding: '2px 8px', flexShrink: 0 }}>{p.phase}</span>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: pct > 80 ? '#EF4444' : p.color, flexShrink: 0, width: 40, textAlign: 'right' }}>{pct}%</span>
                <ChevronRight size={14} color="var(--text-muted)" style={{ transform: selProjet === p.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Transactions récentes */}
      <motion.div variants={fade} className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>📋 Journal des Transactions</div>
          <SmartButton variant="secondary" icon={Download} onClick={() => addToast('Export généré', 'info')}>Exporter FEC</SmartButton>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Date','Description','Projet','Montant'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1.5rem', textAlign: h === 'Montant' ? 'right' : 'left', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>{t.date}</td>
                <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{t.desc}</td>
                <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.projet}</td>
                <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: t.type === 'entree' ? '#10B981' : '#EF4444' }}>
                  {t.type === 'entree' ? '+' : ''}{fmt(t.montant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
