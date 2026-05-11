/**
 * Foundation — Social Engine : Autonomisation Femmes & Jeunes
 * CRM bénéficiaires, Social Score, parcours formation→emploi→autonomie
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Users, Star, Award, BookOpen, Briefcase, Heart,
  Plus, Search, ChevronRight, X, TrendingUp, CreditCard,
  CheckCircle2, Clock, AlertCircle, UserCheck,
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import SmartButton from '../../../components/SmartButton';
import { useToastStore } from '../../../store/useToastStore';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Types ───────────────────────────────────────────────────────
const STATUTS = {
  formation:  { color: '#6366F1', label: 'En Formation',       icon: BookOpen },
  emploi:     { color: '#10B981', label: 'En Emploi',          icon: Briefcase },
  autonome:   { color: '#F59E0B', label: 'Autonome',           icon: Award },
  microcredit:{ color: '#EC4899', label: 'Micro-crédit actif', icon: CreditCard },
  inscription:{ color: '#06B6D4', label: 'Inscription',        icon: Clock },
};

const PROGRAMMES = ['Couture Professionnelle', 'Commerce Digital', 'Maraîchage Bio', 'Artisanat Perles', 'Formation IT', 'Micro-Entreprise'];

// ── Mock bénéficiaires ─────────────────────────────────────────
const BENEFICIAIRES = [
  { id: 'b1', nom: 'Kouamé Adjoua',   age: 28, programme: 'Couture Professionnelle', statut: 'emploi',     score: 82, dept: 'Femmes', credit: null,    mois: 8,  certif: true,  presence: 96 },
  { id: 'b2', nom: 'Traoré Mariam',   age: 22, programme: 'Commerce Digital',         statut: 'formation',  score: 67, dept: 'Femmes', credit: 150000, mois: 3,  certif: false, presence: 88 },
  { id: 'b3', nom: 'Diallo Fatoumata',age: 35, programme: 'Maraîchage Bio',           statut: 'autonome',   score: 94, dept: 'Femmes', credit: 200000, mois: 14, certif: true,  presence: 99 },
  { id: 'b4', nom: 'Koné Aminata',    age: 19, programme: 'Formation IT',             statut: 'formation',  score: 71, dept: 'Jeunes', credit: null,    mois: 2,  certif: false, presence: 91 },
  { id: 'b5', nom: 'N\'Guessan Pierre',age: 21, programme: 'Micro-Entreprise',        statut: 'microcredit',score: 78, dept: 'Jeunes', credit: 300000, mois: 6,  certif: true,  presence: 85 },
  { id: 'b6', nom: 'Bamba Rokiatou',  age: 31, programme: 'Artisanat Perles',         statut: 'emploi',     score: 88, dept: 'Femmes', credit: null,    mois: 11, certif: true,  presence: 98 },
  { id: 'b7', nom: 'Coulibaly Sita',  age: 26, programme: 'Couture Professionnelle',  statut: 'inscription',score: 42, dept: 'Femmes', credit: null,    mois: 0,  certif: false, presence: 0  },
  { id: 'b8', nom: 'Camara Ibrahima', age: 18, programme: 'Commerce Digital',         statut: 'formation',  score: 59, dept: 'Jeunes', credit: 80000,  mois: 1,  certif: false, presence: 78 },
];

const sparkline = [{ val: 20 }, { val: 32 }, { val: 45 }, { val: 58 }, { val: 71 }, { val: 84 }];

// Score color
const scoreColor = (s) => s >= 80 ? '#10B981' : s >= 60 ? '#6366F1' : s >= 40 ? '#F59E0B' : '#EF4444';

// Social Score Gauge
function SocialScoreGauge({ score }) {
  const color = scoreColor(score);
  const angle = (score / 100) * 180;
  return (
    <div style={{ position: 'relative', width: 120, height: 65, overflow: 'hidden' }}>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M10,60 A50,50,0,0,1,110,60" fill="none" stroke="var(--bg-dark)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M10,60 A50,50,0,0,1,${60 + 50 * Math.cos(Math.PI - (angle * Math.PI / 180))},${60 - 50 * Math.sin(Math.PI - (angle * Math.PI / 180))}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <text x="60" y="58" textAnchor="middle" fontSize="16" fontWeight="900" fill={color}>{score}</text>
        <text x="60" y="68" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600">Social Score</text>
      </svg>
    </div>
  );
}

export default function SocialEngineTab() {
  const [search, setSearch] = useState('');
  const [filtreDept, setFiltreDept] = useState('Tous');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState(null);
  const { addToast } = useToastStore();

  const filtered = useMemo(() => BENEFICIAIRES.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.nom.toLowerCase().includes(q) || b.programme.toLowerCase().includes(q);
    const matchDept   = filtreDept === 'Tous' || b.dept === filtreDept;
    const matchStatut = filtreStatut === 'Tous' || b.statut === filtreStatut;
    return matchSearch && matchDept && matchStatut;
  }), [search, filtreDept, filtreStatut]);

  const selectedB = selected ? BENEFICIAIRES.find(b => b.id === selected) : null;

  const counts = {
    total:      BENEFICIAIRES.length,
    formation:  BENEFICIAIRES.filter(b => b.statut === 'formation').length,
    emploi:     BENEFICIAIRES.filter(b => b.statut === 'emploi').length,
    autonome:   BENEFICIAIRES.filter(b => b.statut === 'autonome').length,
    credit:     BENEFICIAIRES.filter(b => b.credit).length,
  };

  const radarData = [
    { subject: 'Présence',    A: 88 },
    { subject: 'Formation',   A: 74 },
    { subject: 'Emploi',      A: 62 },
    { subject: 'Autonomie',   A: 55 },
    { subject: 'Remboursement', A: 91 },
  ];

  const progressionData = PROGRAMMES.map(p => ({
    prog: p.split(' ')[0],
    count: BENEFICIAIRES.filter(b => b.programme === p).length,
  }));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Bénéficiaires Actifs"     value={counts.total}      trend={15.2} trendType="up" icon={<Users size={20} />}       color="#6366F1" sparklineData={sparkline} />
        <KpiCard title="En Formation"             value={counts.formation}  trend={8.1}  trendType="up" icon={<BookOpen size={20} />}     color="#06B6D4" sparklineData={sparkline} />
        <KpiCard title="En Emploi / Autonomes"    value={counts.emploi + counts.autonome} trend={22.4} trendType="up" icon={<UserCheck size={20} />} color="#10B981" sparklineData={sparkline} />
        <KpiCard title="Micro-crédits Actifs"     value={counts.credit}     trend={5.3}  trendType="up" icon={<CreditCard size={20} />}   color="#EC4899" sparklineData={sparkline} />
      </motion.div>

      {/* Parcours Visualisation */}
      <motion.div variants={fade} className="glass" style={{
        padding: '1.25rem 2rem', borderRadius: '1.5rem',
        background: 'linear-gradient(90deg, #6366F112, #10B98108)',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366F1', marginBottom: '1rem' }}>
          🚀 Pipeline d'Autonomisation — Parcours Individuel
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { label: 'Inscription',  count: 1, color: '#06B6D4', icon: Clock },
            { label: 'Formation',    count: 3, color: '#6366F1', icon: BookOpen },
            { label: 'Emploi',       count: 2, color: '#F59E0B', icon: Briefcase },
            { label: 'Autonome',     count: 1, color: '#10B981', icon: Award },
          ].map((step, i, arr) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={i}>
                <div className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 120px', border: `1px solid ${step.color}30` }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.6rem', background: `${step.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={step.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: step.color }}>{step.count}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{step.label}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <ChevronRight size={18} color="var(--border)" style={{ flexShrink: 0, margin: '0 4px' }} />}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Table + Détail */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: selectedB ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Table bénéficiaires */}
        <div className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem', borderRadius: '0.875rem', flex: '1 1 180px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', width: '100%' }}
                placeholder="Rechercher un bénéficiaire…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            {[{ state: filtreDept, set: setFiltreDept, options: ['Tous', 'Femmes', 'Jeunes'] },
              { state: filtreStatut, set: setFiltreStatut, options: ['Tous', ...Object.keys(STATUTS)] }
            ].map((f, i) => (
              <select key={i} value={f.state} onChange={e => f.set(e.target.value)}
                style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                {f.options.map(o => <option key={o} value={o}>{o === 'Tous' ? 'Tous' : (STATUTS[o]?.label || o)}</option>)}
              </select>
            ))}
            <SmartButton variant="primary" icon={Plus} onClick={() => addToast('Nouveau bénéficiaire ajouté', 'success')}>Ajouter</SmartButton>
          </div>

          {/* Rows */}
          <div>
            {filtered.map((b) => {
              const cfg = STATUTS[b.statut];
              const Icon = cfg.icon;
              return (
                <motion.div key={b.id} whileHover={{ background: 'var(--bg-subtle)' }}
                  style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.15s', background: selected === b.id ? 'var(--bg-subtle)' : 'transparent' }}
                  onClick={() => setSelected(selected === b.id ? null : b.id)}
                >
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${cfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: '0.85rem', color: cfg.color }}>
                    {b.nom.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{b.nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.programme} · {b.dept} · {b.age} ans</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '0.4rem', background: `${cfg.color}15`, color: cfg.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                  {/* Score mini gauge */}
                  <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: scoreColor(b.score) }}>{b.score}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>score</div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ transform: selected === b.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.87rem' }}>
                Aucun bénéficiaire trouvé
              </div>
            )}
          </div>
        </div>

        {/* Fiche détail */}
        <AnimatePresence>
          {selectedB && (
            <motion.div key={selectedB.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', position: 'sticky', top: 0 }}
            >
              {/* Header */}
              <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${STATUTS[selectedB.statut].color}10` }}>
                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{selectedB.nom}</div>
                <X size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelected(null)} />
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Score gauge */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <SocialScoreGauge score={selectedB.score} />
                </div>

                {/* Métriques */}
                {[
                  { label: 'Programme',  val: selectedB.programme },
                  { label: 'Statut',     val: STATUTS[selectedB.statut].label, color: STATUTS[selectedB.statut].color },
                  { label: 'Présence',   val: `${selectedB.presence}%`, color: selectedB.presence > 90 ? '#10B981' : '#F59E0B' },
                  { label: 'Mois actif', val: `${selectedB.mois} mois` },
                  { label: 'Micro-crédit', val: selectedB.credit ? `${new Intl.NumberFormat('fr-FR').format(selectedB.credit)} FCFA` : 'Aucun', color: selectedB.credit ? '#EC4899' : undefined },
                  { label: 'Certificat', val: selectedB.certif ? '✅ Validé' : '⏳ En cours', color: selectedB.certif ? '#10B981' : '#F59E0B' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: row.color || 'var(--text)' }}>{row.val}</span>
                  </div>
                ))}

                <SmartButton variant="primary" icon={CheckCircle2} onClick={() => addToast(`Profil de ${selectedB.nom} mis à jour`, 'success')}>
                  Valider Progression
                </SmartButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Charts insights */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="luxury-widget" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem' }}>📊 Bénéficiaires par Programme</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={progressionData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="prog" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} name="Bénéficiaires" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="luxury-widget" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem' }}>🎯 Indice de Performance Collective</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-light)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
