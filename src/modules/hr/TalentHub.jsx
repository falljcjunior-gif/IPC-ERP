import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Star, Award, Heart, BookOpen, BarChart3,
  TrendingUp, Target, Trophy, Smile, Frown, Meh, ChevronRight,
  Plus, X, Check, Search, Filter, Clock, CalendarDays,
  GraduationCap, Briefcase, Building2, Sparkles, Flame,
  MessageSquare, ThumbsUp, CheckCircle2, AlertCircle, GitBranch
} from 'lucide-react';

import { useStore } from '../../store';
import { useCanSeeSubTab } from '../../store/selectors';
import KpiCard from '../../components/KpiCard';
import RecordModal from '../../components/RecordModal';
import SmartButton from '../../components/SmartButton';
import { debugInteraction } from '../../utils/InteractionAuditor';
import { useToastStore } from '../../store/useToastStore';

/* ─── Helpers ─── */
const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const DEPT_COLORS = {
  'Informatique': '#6366F1', 'Finance': '#10B981', 'Commercial': '#F59E0B',
  'Production': '#EF4444', 'RH': '#EC4899', 'Direction': '#8B5CF6',
  'Marketing': '#D946EF', 'Logistique': '#3B82F6', 'Opérations': '#14B8A6'
};

const RECRUIT_STAGES = ['Candidature', 'Entretien RH', 'Test Technique', 'Entretien Final', 'Offre', 'Embauché'];
const STAGE_COLORS = { 'Candidature': '#64748B', 'Entretien RH': '#3B82F6', 'Test Technique': '#F59E0B', 'Entretien Final': '#8B5CF6', 'Offre': '#EC4899', 'Embauché': '#10B981' };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700 }}>{label}</span>
);

const ProgressBar = ({ pct, color = 'var(--accent)', label, value }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', fontWeight: 700 }}>
      <span>{label}</span><span style={{ color }}>{value}</span>
    </div>
    <div style={{ height: 7, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
        style={{ height: '100%', background: color, borderRadius: 999 }} />
    </div>
  </div>
);

/* ─── Tab Navigation ─── */
const TabNav = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '5px', borderRadius: '1.25rem', border: '1px solid var(--border)', overflowX: 'auto', width: 'fit-content', maxWidth: '100%' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.9rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', transition: 'all 0.18s',
          background: active === t.id ? 'var(--accent)' : 'transparent', color: active === t.id ? 'white' : 'var(--text-muted)' }}>
        {t.icon}{t.label}
      </button>
    ))}
  </div>
);

/* ══════════════════════════════════════
   TAB 1 — Dashboard Culturel
══════════════════════════════════════ */
const DashboardTab = ({ data, onSentiment }) => {
  const employees = data.employees || data.hr?.employees || [];
  const leaves = data.hr?.leaves || [];
  const candidates = data.talent?.candidates || [];

  const byDept = useMemo(() => {
    const map = {};
    employees.forEach(e => { map[e.departement] = (map[e.departement] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  const activeCount = employees.filter(e => e.active !== false).length;
  const pendingLeaves = leaves.filter(l => l.statut === 'En attente').length;
  const newHires = employees.filter(e => {
    if (!e.dateEntree) return false;
    const d = new Date(e.dateEntree);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24 * 30) < 3;
  }).length;

  const masseSal = employees.reduce((s, e) => s + (parseFloat(e.salaire) || 0), 0);

  const moods = [
    { icon: <Smile size={28} color="#10B981" />, label: 'Épanoui', pct: 62 },
    { icon: <Meh size={28} color="#F59E0B" />, label: 'Neutre', pct: 28 },
    { icon: <Frown size={28} color="#EF4444" />, label: 'Stressé', pct: 10 },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 210px),1fr))', gap: '1.25rem' }}>
        <KpiCard title="Effectif Total" value={activeCount} trend={2.1} trendType="up" icon={<Users size={20} />} color="#0D9488" />
        <KpiCard title="Nouvelles Recrues (3m)" value={newHires} trend={0} icon={<UserPlus size={20} />} color="#8B5CF6" />
        <KpiCard title="Congés en Attente" value={pendingLeaves} trend={0} icon={<CalendarDays size={20} />} color="#F59E0B" />
        <KpiCard title="Masse Salariale" value={`${(masseSal / 1000).toFixed(0)}K FCFA`} trend={1.2} trendType="up" icon={<Briefcase size={20} />} color="#3B82F6" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Répartition par Département */}
        <motion.div variants={fade} className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '0.95rem' }}> Effectif par Département</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {byDept.slice(0, 6).map(([dept, count]) => {
              const color = DEPT_COLORS[dept] || '#8B5CF6';
              const pct = Math.round((count / (activeCount || 1)) * 100);
              return (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    <span>{dept}</span><span style={{ color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', background: color, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
            {byDept.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun employé enregistré.</p>}
          </div>
        </motion.div>

        {/* Baromètre du Bien-être */}
        <motion.div variants={fade} className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '0.95rem' }}> Baromètre Bien-être</h4>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {moods.map(m => (
              <div key={m.label} onClick={() => onSentiment(m.label)} style={{ textAlign: 'center', flex: 1, cursor: 'pointer' }}>
                <motion.div whileHover={{ scale: 1.1, y: -5 }} style={{ padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', marginBottom: '0.5rem' }}>{m.icon}</motion.div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{m.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{m.pct}%</div>
              </div>
            ))}
          </div>
          <ProgressBar pct={78} color="#10B981" label="Score Engagement Global" value="7.8/10" />
        </motion.div>

        {/* Santé culturelle */}
        <motion.div variants={fade} className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: 'white', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: 8 }}>IPC CULTURE SCORE</div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Culture Health Index</h3>
            </div>
            <Sparkles size={40} style={{ opacity: 0.4 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {[
              { label: 'Rétention', val: 94, color: '#A5F3FC' },
              { label: 'eNPS Score', val: 67, color: '#FDE68A' },
              { label: 'Compétences', val: 78, color: '#A7F3D0' },
              { label: 'Diversité', val: 85, color: '#FCA5A5' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, opacity: 0.85 }}>
                  <span>{item.label}</span><span>{item.val}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.2 }}
                    style={{ height: '100%', background: item.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   TAB 2 — Pipeline Recrutement
══════════════════════════════════════ */
const RecrutementTab = () => {
  const data = useStore(state => state.data);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const candidates = data.talent?.candidates || [];

  const filtered = candidates.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.poste?.toLowerCase().includes(search.toLowerCase())
  );

  const byStage = useMemo(() => {
    const map = {};
    RECRUIT_STAGES.forEach(s => { map[s] = []; });
    filtered.forEach(c => { const s = c.etape || 'Candidature'; if (map[s]) map[s].push(c); });
    return map;
  }, [filtered]);

  const handleStage = (id, etape) => updateRecord('talent', 'candidates', id, { etape });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900 }}>Pipeline de Recrutement</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{candidates.length} candidat{candidates.length > 1 ? 's' : ''} en cours</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <Search size={15} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: 160 }} />
          </div>
          <SmartButton 
            onClick={async () => setShowModal(true)} 
            variant="primary" 
            icon={UserPlus}
            style={{ background: '#8B5CF6' }}
            successMessage="Ouverture du formulaire"
          >
            Nouveau Candidat
          </SmartButton>
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${RECRUIT_STAGES.length}, minmax(min(100%, 200px), 1fr))`, gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {RECRUIT_STAGES.map(stage => {
          const cards = byStage[stage] || [];
          const color = STAGE_COLORS[stage];
          return (
            <div key={stage}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stage}</span>
                <span style={{ fontSize: '0.72rem', background: `${color}20`, color, padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>{cards.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 80 }}>
                <AnimatePresence>
                  {cards.map(c => (
                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="glass" style={{ padding: '0.9rem', borderRadius: '1rem', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 3 }}>{c.nom}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{c.poste}</div>
                      {c.source && <div style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}><Chip label={c.source} color={color} /></div>}
                      {/* Stage advancement buttons */}
                      <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem' }}>
                        {RECRUIT_STAGES.indexOf(stage) < RECRUIT_STAGES.length - 1 && (
                          <button onClick={() => handleStage(c.id, RECRUIT_STAGES[RECRUIT_STAGES.indexOf(stage) + 1])}
                            style={{ flex: 1, fontSize: '0.65rem', padding: '3px 6px', borderRadius: 6, border: 'none', background: `${color}20`, color, fontWeight: 700, cursor: 'pointer' }}>
                            Avancer →
                          </button>
                        )}
                        <button onClick={() => deleteRecord('talent', 'candidates', c.id)}
                          style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: '#EF444415', color: '#EF4444', cursor: 'pointer', fontSize: '0.65rem' }}>
 
 </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {cards.length === 0 && (
                  <div style={{ padding: '1rem', borderRadius: '1rem', border: '1px dashed var(--border)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6 }}>Vide</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RecordModal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau Candidat"
        fields={[
          { name: 'nom', label: 'Nom complet', required: true },
          { name: 'poste', label: 'Poste visé', required: true },
          { name: 'email', label: 'Email du candidat', type: 'email' },
          { name: 'telephone', label: 'Téléphone' },
          { name: 'source', label: 'Source', type: 'select', options: ['LinkedIn', 'Recommandation', 'Candidature spontanée', 'Job board', 'Agence'] },
          { name: 'etape', label: 'Étape', type: 'select', options: RECRUIT_STAGES },
          { name: 'notes', label: 'Notes / Observations' },
        ]}
        onSave={f => { addRecord('talent', 'candidates', { ...f, etape: f.etape || 'Candidature', statut: 'Actif' }); setShowModal(false); }}
      />
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 3 — Évaluations 360°
══════════════════════════════════════ */
const EvaluationsTab = () => {
  const data = useStore(state => state.data);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const [showModal, setShowModal] = useState(false);
  const employees = data.hr?.employees || [];
  const appraisals = data.talent?.appraisals || [];

  const scoreColor = s => s >= 8 ? '#10B981' : s >= 6 ? '#F59E0B' : '#EF4444';
  const scoreBg = s => s >= 8 ? '#10B98115' : s >= 6 ? '#F59E0B15' : '#EF444415';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900 }}>Évaluations 360°</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Performance, compétences et progression individuelle.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.25rem', borderRadius: '0.9rem', border: 'none', background: '#8B5CF6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={15} /> Nouvelle Évaluation
        </button>
      </div>

      {/* Summary Cards */}
      {appraisals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 300px),1fr))', gap: '1.25rem' }}>
          {appraisals.map(ap => {
            const score = parseFloat(ap.score) || 0;
            return (
              <motion.div key={ap.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass"
                style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1rem' }}>{ap.employe}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{ap.periode} · {ap.evaluateur || 'Auto-éval.'}</div>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 999, background: scoreBg(score), color: scoreColor(score), fontWeight: 900, fontSize: '1rem' }}>
                    {score}/10
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['Technique', 'Communication', 'Leadership', 'Initiative'].map((crit, i) => {
                    const val = ap[crit.toLowerCase()] ? parseFloat(ap[crit.toLowerCase()]) : score;
                    return <ProgressBar key={crit} label={crit} value={`${val}/10`} pct={val * 10} color={scoreColor(val)} />;
                  })}
                </div>
                {ap.commentaire && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    « {ap.commentaire} »
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {appraisals.length === 0 && (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '1.5rem' }}>
          <Target size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Aucune évaluation créée. Lancez le premier cycle d'évaluation.</p>
        </div>
      )}

      <RecordModal isOpen={showModal} onClose={() => setShowModal(false)} title="Créer une Évaluation"
        fields={[
          { name: 'employe', label: 'Collaborateur évalué', type: 'select', options: employees.map(e => e.nom), required: true },
          { name: 'evaluateur', label: 'Évaluateur' },
          { name: 'periode', label: 'Période (ex: Q1 2026)', required: true },
          { name: 'score', label: 'Score Global (/10)', type: 'number', required: true },
          { name: 'technique', label: 'Compétences Techniques (/10)', type: 'number' },
          { name: 'communication', label: 'Communication (/10)', type: 'number' },
          { name: 'leadership', label: 'Leadership (/10)', type: 'number' },
          { name: 'initiative', label: 'Initiative (/10)', type: 'number' },
          { name: 'commentaire', label: 'Commentaire / Feedback' },
        ]}
        onSave={f => { addRecord('talent', 'appraisals', { ...f, statut: 'Complétée', date: new Date().toISOString().split('T')[0] }); setShowModal(false); }}
      />
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 4 — Formations & Learning
══════════════════════════════════════ */
const FormationsTab = () => {
  const data = useStore(state => state.data);
  const addRecord = useStore(state => state.addRecord);
  const [showModal, setShowModal] = useState(false);
  const employees = data.hr?.employees || [];
  const formations = data.talent?.formations || [];

  const CATS = { 'Technique': '#3B82F6', 'Sécurité': '#EF4444', 'Management': '#8B5CF6', 'Soft Skills': '#10B981', 'Conformité': '#F59E0B' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900 }}>Formations & Learning</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Catalogue de formations et suivi des compétences.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.25rem', borderRadius: '0.9rem', border: 'none', background: '#10B981', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={15} /> Nouvelle Formation
        </button>
      </div>

      {formations.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 300px),1fr))', gap: '1.25rem' }}>
          {formations.map(f => {
            const color = CATS[f.categorie] || '#64748B';
            const progress = parseFloat(f.progression) || 0;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass"
                style={{ padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid ${color}25`, borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}><GraduationCap size={20} /></div>
                  <Chip label={f.categorie || 'Formation'} color={color} />
                </div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 900, fontSize: '0.95rem' }}>{f.titre || f.nom}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{f.formateur || 'IPC Learning'} · {f.duree || 'N/A'}</div>
                <ProgressBar label="Progression" value={`${progress}%`} pct={progress} color={color} />
                {f.participants && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={12} />{f.participants} participant{parseInt(f.participants) > 1 ? 's' : ''}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '1.5rem' }}>
          <GraduationCap size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Aucune formation planifiée. Créez votre premier programme !</p>
        </div>
      )}

      <RecordModal isOpen={showModal} onClose={() => setShowModal(false)} title="Créer une Formation"
        fields={[
          { name: 'titre', label: 'Titre de la formation', required: true },
          { name: 'categorie', label: 'Catégorie', type: 'select', options: Object.keys(CATS) },
          { name: 'formateur', label: 'Formateur / Organisme' },
          { name: 'duree', label: 'Durée (ex: 2 jours, 8h)' },
          { name: 'dateDebut', label: 'Date de début', type: 'date' },
          { name: 'participants', label: 'Nombre de participants', type: 'number' },
          { name: 'progression', label: 'Avancement (%)', type: 'number' },
          { name: 'description', label: 'Description / Objectifs' },
        ]}
        onSave={f => { addRecord('talent', 'formations', { ...f, statut: 'Planifiée' }); setShowModal(false); }}
      />
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 5 — Bien-être & Engagement
══════════════════════════════════════ */
const BienEtreTab = ({ onSentiment }) => {
  const data = useStore(state => state.data);
  const addRecord = useStore(state => state.addRecord);
  const [showModal, setShowModal] = useState(false);
  const surveys = data.talent?.surveys || [];

  const initiatives = [
    { icon: '', title: 'Challenges Sport Mensuel', desc: 'Défi de mars : 10 000 pas/jour', color: '#10B981', participants: 18, badge: 'Actif' },
    { icon: '', title: 'Séance Mindfulness', desc: 'Chaque vendredi 12h - Salle Zen', color: '#8B5CF6', participants: 12, badge: '2x/semaine' },
    { icon: '', title: 'Team Building Q2', desc: 'Sortie Karting prévue le 15 Mai', color: '#F59E0B', participants: 24, badge: 'À venir' },
    { icon: '', title: 'Cercle de Parole', desc: 'Exprimez vos idées sur la culture', color: '#3B82F6', participants: 9, badge: 'Mensuel' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Initiatives */}
      <div>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 900 }}> Initiatives Bien-être</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 260px),1fr))', gap: '1.25rem' }}>
          {initiatives.map((init, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid ${init.color}25` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>{init.icon}</div>
                <Chip label={init.badge} color={init.color} />
              </div>
              <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 900, fontSize: '0.95rem' }}>{init.title}</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{init.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={12} />{init.participants} participants
                </div>
                <button
                  disabled
                  title="Inscription aux initiatives — bientôt disponible"
                  style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999, border: 'none', background: `${init.color}15`, color: init.color, fontWeight: 700, cursor: 'not-allowed', opacity: 0.6 }}
                >
                  Rejoindre
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pulse Survey */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #1E1B4B, #312E81)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: 8 }}>PULSE SURVEY</div>
            <h3 style={{ margin: 0, fontWeight: 900 }}>Sondage Rapide de la Semaine</h3>
          </div>
          <MessageSquare size={32} style={{ opacity: 0.4 }} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Comment évalueriez-vous votre niveau d'énergie et de motivation cette semaine ?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {[['', 'Bas'], ['', 'Moyen'], ['', 'Bien'], ['', 'Excellent']].map(([emoji, label]) => (
              <button key={label} 
                onClick={() => onSentiment(label)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '1rem 1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '1.5rem', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                {emoji}<span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', opacity: 0.7 }}>
          <span> Réponses anonymes garanties</span>
          <span>{surveys.length} réponses ce mois</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 6 — Organigramme
══════════════════════════════════════ */
const OrgaTab = ({ data }) => {
  const employees = data.employees || data.hr?.employees || [];
  const [filter, setFilter] = useState('Tous');

  const depts = ['Tous', ...new Set(employees.map(e => e.departement).filter(Boolean))];
  const displayed = filter === 'Tous' ? employees : employees.filter(e => e.departement === filter);

  const byDept = useMemo(() => {
    const map = {};
    displayed.forEach(e => {
      const d = e.departement || 'Sans Département';
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [displayed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900 }}>Organigramme IPC</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{employees.length} collaborateurs · {depts.length - 1} départements</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-subtle)', padding: 4, borderRadius: '1rem', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {depts.slice(0, 6).map(d => (
            <button key={d} onClick={() => setFilter(d)}
              style={{ padding: '5px 12px', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.77rem',
                background: filter === d ? 'var(--accent)' : 'transparent', color: filter === d ? 'white' : 'var(--text-muted)' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(byDept).length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '1.5rem' }}>
          <GitBranch size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ajoutez des employés depuis le module RH pour construire l'organigramme.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(byDept).map(([dept, emps]) => {
            const color = DEPT_COLORS[dept] || '#8B5CF6';
            return (
              <div key={dept}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: color }} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color }}>{dept}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emps.length} collaborateur{emps.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px),1fr))', gap: '1rem', paddingLeft: '1.25rem', borderLeft: `2px solid ${color}30` }}>
                  {emps.map(emp => (
                    <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass"
                      style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color, flexShrink: 0 }}>
                        {emp.nom?.[0] || '?'}{emp.nom?.split(' ')?.[1]?.[0] || ''}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nom}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{emp.poste || '—'}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 999, background: emp.active !== false ? '#10B98115' : '#EF444415', color: emp.active !== false ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                            {emp.active !== false ? '● Actif' : '○ Inactif'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════ */
const PeopleAndCulture = () => {
  const data = useStore(state => state.data);
  const userRole = useStore(state => state.userRole);
  // [GO-LIVE] seedDemoData retiré — l'ERP démarre vide en production.
  const addRecord = useStore(state => state.addRecord);
  const [tab, setTab] = useState('dashboard');

  const canSee = useCanSeeSubTab();

  const allTabs = [
    { id: 'dashboard', label: 'Vue Culture', icon: <Sparkles size={15} /> },
    { id: 'recrutement', label: 'Recrutement', icon: <UserPlus size={15} /> },
    { id: 'evaluations', label: 'Évaluations', icon: <Target size={15} /> },
    { id: 'formations', label: 'Formations', icon: <GraduationCap size={15} /> },
    { id: 'bienetre', label: 'Bien-être', icon: <Heart size={15} /> },
    { id: 'orga', label: 'Organigramme', icon: <GitBranch size={15} /> },
  ];

  const tabs = useMemo(() => {
    return allTabs.filter(t => canSee('talent', t.id));
  }, [canSee]);

  const handleSentiment = (mood) => {
    addRecord('talent', 'surveys', { type: 'Pulse', sentiment: mood, date: new Date().toISOString() });
    alert(`Merci ! Votre sentiment "${mood}" a été enregistré.`);
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', minHeight: '100vh', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}
              style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', padding: '8px', borderRadius: '12px' }}>
              <Heart size={18} color="white" />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: '#EC4899' }}>IPC — PEOPLE & CULTURE</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            People & Culture
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontWeight: 500 }}>
            Talent, bien-être, évaluations, formations et culture d'entreprise.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* [GO-LIVE] UAT Lab + bouton "Seed Data" retirés pour la livraison client.
              Les outils de debug sont accessibles via le module Admin > Diagnostics. */}

          <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1.5rem', border: '1px solid #EC489930', display: 'flex', gap: '2rem' }}>
            {[
              { val: (data.hr?.employees || []).length, label: 'Collaborateurs' },
              { val: (data.talent?.candidates || []).length, label: 'Candidats' },
              { val: (data.talent?.formations || []).length, label: 'Formations' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EC4899' }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} active={tab} onChange={setTab} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }} transition={{ duration: 0.28 }}>
          {tab === 'dashboard'    && <DashboardTab data={data} onSentiment={handleSentiment} />}
          {tab === 'recrutement' && <RecrutementTab />}
          {tab === 'evaluations' && <EvaluationsTab />}
          {tab === 'formations'  && <FormationsTab />}
          {tab === 'bienetre'    && <BienEtreTab onSentiment={handleSentiment} />}
          {tab === 'orga'        && <OrgaTab data={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PeopleAndCulture;
