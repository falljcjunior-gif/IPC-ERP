/**
 * Foundation — Waste Tracker & Centres de Tri
 * Tableur de saisie des tonnages, suivi machines, KPI environnementaux
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
} from 'recharts';
import {
  Leaf, Package, Wrench, AlertTriangle, CheckCircle2,
  Plus, Save, Factory, Recycle, Trash2, TrendingUp,
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import SmartButton from '../../../components/SmartButton';
import { useToastStore } from '../../../store/useToastStore';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Mock data ───────────────────────────────────────────────────
const CENTRES = [
  { id: 'c1', nom: 'Centre Yopougon',   actif: true,  collecte: 48.2, trie: 38.5, recycle: 32.1, capacite: 60,  machines: [{ nom: 'Presse PET',    statut: 'ok' }, { nom: 'Broyeur',      statut: 'ok' }, { nom: 'Trieuse opt.', statut: 'maintenance' }] },
  { id: 'c2', nom: 'Centre Abobo',      actif: true,  collecte: 31.7, trie: 24.2, recycle: 19.8, capacite: 40,  machines: [{ nom: 'Presse PET',    statut: 'ok' }, { nom: 'Broyeur',      statut: 'panne' }] },
  { id: 'c3', nom: 'Centre Cocody',     actif: false, collecte: 0,    trie: 0,    recycle: 0,    capacite: 50,  machines: [{ nom: 'Presse PET',    statut: 'installation' }] },
  { id: 'c4', nom: 'Centre Koumassi',   actif: true,  collecte: 22.4, trie: 17.1, recycle: 14.3, capacite: 30,  machines: [{ nom: 'Presse PET',    statut: 'ok' }, { nom: 'Broyeur',      statut: 'ok' }] },
];

const HISTORIQUE = [
  { sem: 'S18', yop: 11.2, abo: 7.8, kou: 5.2 },
  { sem: 'S19', yop: 12.1, abo: 8.1, kou: 5.8 },
  { sem: 'S20', yop: 11.8, abo: 7.5, kou: 5.1 },
  { sem: 'S21', yop: 13.1, abo: 8.4, kou: 6.2 },
  { sem: 'S22', yop: 12.5, abo: 8.0, kou: 5.9 },
  { sem: 'S23', yop: 14.2, abo: 8.8, kou: 6.4 },
];

const TOTAL_COLLECTE = CENTRES.reduce((s, c) => s + c.collecte, 0);
const TOTAL_RECYCLE  = CENTRES.reduce((s, c) => s + c.recycle, 0);
const OBJECTIF_AN    = 1200;

const STATUT_CONFIG = {
  ok:           { color: '#10B981', label: 'Opérationnel', icon: CheckCircle2 },
  maintenance:  { color: '#F59E0B', label: 'Maintenance',  icon: Wrench },
  panne:        { color: '#EF4444', label: 'En panne',     icon: AlertTriangle },
  installation: { color: '#6366F1', label: 'Installation', icon: Package },
};

// Saisie rapide state type
const EMPTY_SAISIE = { centre: '', date: '', collecte: '', trie: '', recycle: '', note: '' };

export default function WasteTrackerTab() {
  const [viewMode, setViewMode]   = useState('dashboard'); // 'dashboard' | 'tableur'
  const [saisie, setSaisie]       = useState(EMPTY_SAISIE);
  const [selCentre, setSelCentre] = useState(null);
  const { addToast } = useToastStore();

  const sparkline = HISTORIQUE.map((d, i) => ({ val: d.yop + d.abo + d.kou }));
  const pctObjectif = Math.round((TOTAL_RECYCLE / OBJECTIF_AN) * 100 * 10) / 10;

  const handleSave = () => {
    if (!saisie.centre || !saisie.date || !saisie.collecte) {
      addToast('Remplissez les champs obligatoires', 'error'); return;
    }
    addToast(`Saisie enregistrée — ${saisie.collecte}t pour ${saisie.centre}`, 'success');
    setSaisie(EMPTY_SAISIE);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header actions */}
      <motion.div variants={fade} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{
          display: 'flex', background: 'var(--bg-subtle)', padding: '5px',
          borderRadius: '1rem', border: '1px solid var(--border)', gap: 4,
        }}>
          {[{ id: 'dashboard', label: '📊 Dashboard' }, { id: 'tableur', label: '📋 Saisie Tonnages' }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                background: viewMode === v.id ? 'var(--accent)' : 'transparent',
                color: viewMode === v.id ? '#fff' : 'var(--text-muted)',
              }}
            >{v.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <SmartButton variant="primary" icon={Plus} onClick={() => setViewMode('tableur')}>Nouvelle Saisie</SmartButton>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Tonnage Collecté (cumul)"  value={`${TOTAL_COLLECTE.toFixed(1)}t`} trend={9.2} trendType="up"  icon={<Trash2 size={20} />}    color="#10B981" sparklineData={sparkline} />
        <KpiCard title="Tonnage Recyclé"           value={`${TOTAL_RECYCLE.toFixed(1)}t`}  trend={11.4} trendType="up" icon={<Recycle size={20} />}   color="#06B6D4" sparklineData={sparkline} />
        <KpiCard title="Centres Opérationnels"     value={`${CENTRES.filter(c => c.actif).length}/${CENTRES.length}`} trend={0} trendType="up" icon={<Factory size={20} />} color="#6366F1" sparklineData={sparkline} />
        <KpiCard title="% Objectif Annuel"         value={`${pctObjectif}%`}                trend={pctObjectif > 50 ? 3.1 : 0} trendType="up" icon={<TrendingUp size={20} />} color="#F59E0B" sparklineData={sparkline} />
      </motion.div>

      {/* Objectif annuel banner */}
      <motion.div variants={fade} className="glass" style={{
        padding: '1.25rem 2rem', borderRadius: '1.5rem',
        background: 'linear-gradient(135deg, #10B98110, #06B6D410)',
        border: '1px solid #10B98120',
        display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', marginBottom: 4 }}>🌍 Impact Environnemental 2025</div>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text)' }}>{TOTAL_RECYCLE.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>tonnes retirées de la nature</span></div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', fontWeight: 700 }}>
            <span>Objectif : {OBJECTIF_AN}t / an</span>
            <span style={{ color: '#10B981' }}>{pctObjectif}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-dark)', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pctObjectif}%` }} transition={{ duration: 1.2 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #06B6D4)', borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: '🐟 Équivalent', val: `${Math.round(TOTAL_RECYCLE * 50)} poissons sauvés` },
            { label: '🌊 Déchets sea', val: `${Math.round(TOTAL_RECYCLE * 0.3)}t évitées en mer` },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text)' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {viewMode === 'dashboard' ? (
        <>
          {/* Centres */}
          <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {CENTRES.map(c => (
              <motion.div key={c.id} className="luxury-widget" whileHover={{ y: -3 }}
                style={{ borderRadius: '1.5rem', overflow: 'hidden', cursor: 'pointer', opacity: c.actif ? 1 : 0.65 }}
                onClick={() => setSelCentre(selCentre === c.id ? null : c.id)}
              >
                <div style={{
                  padding: '1rem 1.5rem', background: c.actif ? 'linear-gradient(90deg,#10B98112,transparent)' : 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Factory size={16} color={c.actif ? '#10B981' : 'var(--text-muted)'} />
                    {c.nom}
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '0.4rem',
                    background: c.actif ? '#10B98118' : '#64748B18',
                    color: c.actif ? '#10B981' : '#64748B',
                  }}>{c.actif ? '● Actif' : '○ En construction'}</span>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {c.actif && (
                    <>
                      {[
                        { label: 'Collecté', val: c.collecte, max: c.capacite, color: '#F59E0B' },
                        { label: 'Trié',     val: c.trie,     max: c.capacite, color: '#6366F1' },
                        { label: 'Recyclé', val: c.recycle,  max: c.capacite, color: '#10B981' },
                      ].map(row => (
                        <div key={row.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                            <span>{row.label}</span>
                            <span style={{ color: row.color }}>{row.val}t / {row.max}t</span>
                          </div>
                          <div style={{ height: 5, background: 'var(--bg-dark)', borderRadius: 999, overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(row.val / row.max) * 100}%` }} transition={{ duration: 0.8 }}
                              style={{ height: '100%', background: row.color, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Machines */}
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.machines.map((m, i) => {
                      const cfg = STATUT_CONFIG[m.statut];
                      const Icon = cfg.icon;
                      return (
                        <span key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '0.4rem',
                          background: `${cfg.color}15`, color: cfg.color,
                        }}>
                          <Icon size={11} /> {m.nom}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Graph hebdo */}
          <motion.div variants={fade} className="luxury-widget" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Leaf size={16} color="#10B981" /> Tonnage Hebdomadaire par Centre (tonnes)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={HISTORIQUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="t" />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="yop" fill="#10B981" radius={[4,4,0,0]} name="Yopougon" stackId="a" />
                <Bar dataKey="abo" fill="#6366F1" radius={[0,0,0,0]} name="Abobo"    stackId="a" />
                <Bar dataKey="kou" fill="#F59E0B" radius={[4,4,0,0]} name="Koumassi" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      ) : (
        /* TABLEUR DE SAISIE */
        <motion.div variants={fade} className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', fontWeight: 900, fontSize: '0.95rem' }}>
            📋 Saisie des Tonnages — Rapport Journalier
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'centre', label: 'Centre de Tri *', type: 'select', options: CENTRES.map(c => c.nom) },
              { key: 'date',   label: 'Date *',          type: 'date' },
              { key: 'collecte', label: 'Tonnage Collecté (t) *', type: 'number', placeholder: '0.00' },
              { key: 'trie',     label: 'Tonnage Trié (t)',       type: 'number', placeholder: '0.00' },
              { key: 'recycle',  label: 'Tonnage Recyclé (t)',    type: 'number', placeholder: '0.00' },
              { key: 'note',     label: 'Notes / Incidents',      type: 'text',   placeholder: 'Maintenance machine X…', span: 2 },
            ].map(field => (
              <div key={field.key} style={{ gridColumn: field.span ? `span ${field.span}` : 'span 1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={saisie[field.key]}
                    onChange={e => setSaisie(s => ({ ...s, [field.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.875rem', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.87rem', outline: 'none' }}
                  >
                    <option value="">Sélectionner…</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={saisie[field.key]}
                    placeholder={field.placeholder}
                    onChange={e => setSaisie(s => ({ ...s, [field.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.875rem', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: 12 }}>
            <SmartButton variant="primary" icon={Save} onClick={handleSave}>Enregistrer la saisie</SmartButton>
            <SmartButton variant="secondary" icon={Trash2} onClick={() => setSaisie(EMPTY_SAISIE)}>Effacer</SmartButton>
          </div>

          {/* Mini preview calcul */}
          {saisie.collecte && (
            <div style={{ margin: '0 1.5rem 1.5rem', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                📊 Taux de tri : <strong style={{ color: '#6366F1' }}>{saisie.trie ? ((saisie.trie / saisie.collecte) * 100).toFixed(1) : '—'}%</strong>
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ♻️ Taux de recyclage : <strong style={{ color: '#10B981' }}>{saisie.recycle ? ((saisie.recycle / saisie.collecte) * 100).toFixed(1) : '—'}%</strong>
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                🌊 Impact : <strong style={{ color: '#06B6D4' }}>{saisie.recycle ? `${(saisie.recycle * 1000).toFixed(0)} kg retirés de la nature` : '—'}</strong>
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
