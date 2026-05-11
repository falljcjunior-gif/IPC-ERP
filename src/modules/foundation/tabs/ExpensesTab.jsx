/**
 * ExpensesTab — Notes de Frais IPC Collect Foundation
 *
 * Collection Firestore : foundation_expenses
 * Workflow : Soumission → Validation FOUNDATION_ADMIN → Remboursement
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, Upload, CheckCircle, XCircle,
  Clock, Filter, Search, Download, AlertCircle,
  TrendingUp, Wallet, FileText, Eye, X,
  Car, Coffee, Hotel, Briefcase, Monitor, Package,
} from 'lucide-react';
import { useStore } from '../../../store';

const T = {
  bg:        'var(--bg)',
  surface:   'var(--bg-subtle)',
  card:      'var(--bg-card)',
  border:    'var(--border)',
  accent:    'var(--accent)',
  accentDim: 'var(--accent-glow)',
  text:      'var(--text)',
  muted:     'var(--text-muted)',
  danger:    '#EF4444',
  warning:   '#F59E0B',
  info:      '#3B82F6',
  purple:    '#8B5CF6',
};

const CATEGORIES = [
  { id: 'transport',   label: 'Transport',         Icon: Car,       color: T.info },
  { id: 'restauration',label: 'Restauration',      Icon: Coffee,    color: T.warning },
  { id: 'hebergement', label: 'Hébergement',       Icon: Hotel,     color: T.purple },
  { id: 'mission',     label: 'Frais de Mission',  Icon: Briefcase, color: T.accent },
  { id: 'materiel',    label: 'Matériel',          Icon: Monitor,   color: T.info },
  { id: 'divers',      label: 'Divers',            Icon: Package,   color: T.muted },
];

const getCatConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

const DEMO_EXPENSES = [
  {
    id: 'EXP-F001',
    submittedBy: 'Amara Diallo',
    employe_id: 'EMP-F001',
    date: '2025-05-08',
    categorie: 'transport',
    description: 'Transport Abidjan-Bouaké pour collecte terrain',
    montant: 45000,
    justificatif: 'ticket_train_08052025.pdf',
    statut: 'en_attente',
    commentaire: '',
  },
  {
    id: 'EXP-F002',
    submittedBy: 'Kofi Mensah',
    employe_id: 'EMP-F002',
    date: '2025-05-06',
    categorie: 'restauration',
    description: 'Déjeuner réunion partenaires ONG Solidarité',
    montant: 18500,
    justificatif: 'facture_resto_06052025.pdf',
    statut: 'approuve',
    commentaire: 'Validé — partenariat stratégique confirmé',
  },
  {
    id: 'EXP-F003',
    submittedBy: 'Jean-Paul Kouassi',
    employe_id: 'EMP-F004',
    date: '2025-05-04',
    categorie: 'hebergement',
    description: 'Nuit hôtel mission Yamoussoukro (2 nuits)',
    montant: 72000,
    justificatif: 'facture_hotel_04052025.pdf',
    statut: 'approuve',
    commentaire: '',
  },
  {
    id: 'EXP-F004',
    submittedBy: 'Fatou Traoré',
    employe_id: 'EMP-F003',
    date: '2025-05-10',
    categorie: 'materiel',
    description: 'Achat fournitures bureau (cartouches, ramettes)',
    montant: 25600,
    justificatif: 'facture_bureau_10052025.pdf',
    statut: 'en_attente',
    commentaire: '',
  },
  {
    id: 'EXP-F005',
    submittedBy: 'Amara Diallo',
    employe_id: 'EMP-F001',
    date: '2025-04-28',
    categorie: 'mission',
    description: 'Formation tri déchets — Frais de mission globaux',
    montant: 120000,
    justificatif: 'rapport_mission_280425.pdf',
    statut: 'rejete',
    commentaire: 'Montant trop élevé sans approbation préalable. Resoumettre avec devis.',
  },
];

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUT_CONFIG = {
  en_attente: { color: T.warning, label: 'En attente',   Icon: Clock },
  approuve:   { color: T.accent,  label: 'Approuvé',     Icon: CheckCircle },
  rejete:     { color: T.danger,  label: 'Rejeté',       Icon: XCircle },
  rembourse:  { color: T.info,    label: 'Remboursé',    Icon: Wallet },
};

function DarkCard({ children, style = {} }) {
  return (
    <div className="glassmorphism" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1.25rem', padding: '1.5rem', ...style }}>
      {children}
    </div>
  );
}

function KpiStrip({ expenses }) {
  const total       = expenses.reduce((a, e) => a + e.montant, 0);
  const approuves   = expenses.filter(e => e.statut === 'approuve').reduce((a, e) => a + e.montant, 0);
  const en_attente  = expenses.filter(e => e.statut === 'en_attente').length;
  const rejetes     = expenses.filter(e => e.statut === 'rejete').length;

  const kpis = [
    { label: 'Total Soumis',         value: fmt(total),       icon: Receipt,     color: T.text },
    { label: 'Total Approuvé',       value: fmt(approuves),   icon: CheckCircle, color: T.accent },
    { label: 'En Attente',           value: en_attente,       icon: Clock,       color: T.warning },
    { label: 'Rejetées',             value: rejetes,          icon: XCircle,     color: T.danger },
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="glassmorphism" style={{
          flex: '1 1 160px',
          background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.875rem',
          padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.625rem', flexShrink: 0,
            background: `${color}12`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: typeof value === 'number' ? '1.4rem' : '0.95rem', fontWeight: 900, color }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryBreakdown({ expenses }) {
  const approved = expenses.filter(e => e.statut === 'approuve');
  const total    = approved.reduce((a, e) => a + e.montant, 0) || 1;

  const byCategory = CATEGORIES.map(cat => {
    const amount = approved.filter(e => e.categorie === cat.id).reduce((a, e) => a + e.montant, 0);
    return { ...cat, amount, pct: Math.round((amount / total) * 100) };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  return (
    <DarkCard style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 800, color: T.text, marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={15} color={T.accent} /> Répartition des dépenses approuvées
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {byCategory.map(cat => {
          const CatIcon = cat.Icon;
          return (
            <div key={cat.id} style={{ background: T.surface, padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: T.text }}>
                  <div style={{ width: 24, height: 24, borderRadius: '0.4rem', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CatIcon size={12} color={cat.color} />
                  </div>
                  {cat.label}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: T.text }}>{cat.pct}%</div>
              </div>
              <div style={{ height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }} transition={{ duration: 0.6 }}
                  style={{ height: '100%', background: cat.color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: T.muted, fontWeight: 600 }}>{fmt(cat.amount)}</div>
            </div>
          );
        })}
      </div>
    </DarkCard>
  );
}

function NewExpenseModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    categorie: 'transport',
    description: '',
    montant: '',
    justificatif: null,
  });
  const [dragging, setDragging] = useState(false);
  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleField('justificatif', file.name);
  };

  const canSubmit = form.description.trim() && form.montant && form.justificatif;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-2xl)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: T.text }}>Nouvelle Note de Frais</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: T.muted, marginTop: 4 }}>Dépenses professionnelles — IPC Foundation</p>
          </div>
          <button onClick={onClose} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: T.muted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
              <input type="date" value={form.date} onChange={e => handleField('date', e.target.value)}
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', color: T.text, fontSize: '0.875rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Montant (FCFA)</label>
              <input type="number" placeholder="0" value={form.montant} onChange={e => handleField('montant', e.target.value)}
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', color: T.text, fontSize: '0.875rem', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catégorie</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const CatIcon = cat.Icon;
                const active = form.categorie === cat.id;
                return (
                  <button key={cat.id} onClick={() => handleField('categorie', cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: active ? 'var(--accent-glow)' : T.bg, border: `1px solid ${active ? 'var(--accent)' : T.border}`, borderRadius: '0.75rem', padding: '0.5rem 1rem', color: active ? 'var(--accent)' : T.muted, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <CatIcon size={12} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motif / Description</label>
            <textarea placeholder="Expliquez l'objet de cette dépense…" value={form.description} onChange={e => handleField('description', e.target.value)} rows={3}
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', color: T.text, fontSize: '0.875rem', outline: 'none', resize: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Justificatif (PDF, Image) *</label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: dragging ? 'var(--accent-glow)' : T.bg, border: `2px dashed ${form.justificatif ? 'var(--accent)' : T.border}`, borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleField('justificatif', file.name); }}>
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              {form.justificatif ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle size={20} /> {form.justificatif}
                </div>
              ) : (
                <>
                  <Upload size={24} color={T.muted} />
                  <div style={{ fontSize: '0.85rem', color: T.muted, fontWeight: 600 }}>Cliquer ou glisser le fichier ici</div>
                </>
              )}
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.75rem 1.5rem', color: T.text, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button disabled={!canSubmit} onClick={() => { onSubmit({ ...form, montant: parseFloat(form.montant) }); onClose(); }}
            style={{ background: canSubmit ? 'var(--primary)' : T.surface, border: 'none', borderRadius: '0.75rem', padding: '0.75rem 2rem', color: '#FFF', fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', boxShadow: canSubmit ? 'var(--shadow-accent)' : 'none' }}>
            Soumettre
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExpenseRow({ exp, isAdmin, onApprove, onReject }) {
  const cfg     = STATUT_CONFIG[exp.statut] || STATUT_CONFIG.en_attente;
  const catCfg  = getCatConfig(exp.categorie);
  const StatIcon = cfg.Icon;
  const CatIcon  = catCfg.Icon;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glassmorphism"
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
      
      <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: `${catCfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CatIcon size={20} color={catCfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: T.text, marginBottom: 4 }}>{exp.description}</div>
        <div style={{ fontSize: '0.75rem', color: T.muted, fontWeight: 600 }}>{exp.submittedBy} · {fmtDate(exp.date)}</div>
      </div>

      <div style={{ textAlign: 'right', minWidth: 120 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: T.text }}>{fmt(exp.montant)}</div>
        <div style={{ fontSize: '0.7rem', color: T.muted, fontFamily: 'monospace' }}>{exp.id}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '4px 10px', borderRadius: '0.5rem', color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`, textTransform: 'uppercase' }}>
          <StatIcon size={10} style={{ verticalAlign:'middle', marginRight:4 }} /> {cfg.label}
        </span>
        
        {isAdmin && exp.statut === 'en_attente' ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => onApprove(exp.id)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '0.5rem', padding: '6px 12px', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>✓</button>
            <button onClick={() => onReject(exp.id)} style={{ background: '#EF4444', border: 'none', borderRadius: '0.5rem', padding: '6px 12px', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.5rem', padding: '6px 12px', color: T.text, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Justificatif</button>
        )}
      </div>

      {(exp.commentaire) && (
        <div style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem 1rem', background: T.surface, borderRadius: '0.75rem', border: `1px solid ${T.border}`, fontSize: '0.8rem', color: T.muted, fontWeight: 500 }}>
          <span style={{ fontWeight: 800, color: T.text }}>Note :</span> {exp.commentaire}
        </div>
      )}
    </motion.div>
  );
}

export default function ExpensesTab() {
  const userRole = useStore(s => s.userRole);
  const [expenses, setExpenses] = useState(DEMO_EXPENSES);
  const [showForm, setShowForm] = useState(false);
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [search, setSearch] = useState('');

  const isAdmin = ['FOUNDATION_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(userRole);

  const filtered = useMemo(() => expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.description.toLowerCase().includes(q) || e.submittedBy.toLowerCase().includes(q);
    const matchStatut = filterStatut === 'Tous' || e.statut === filterStatut;
    return matchSearch && matchStatut;
  }), [expenses, search, filterStatut]);

  const handleApprove = (id) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, statut: 'approuve', commentaire: 'Dépense validée.' } : e));
  const handleReject = (id) => {
    const reason = window.prompt('Motif :') || 'Rejeté.';
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, statut: 'rejete', commentaire: reason } : e));
  };
  const handleSubmit = (data) => setExpenses(prev => [{ id: `EXP-F${Date.now().toString().slice(-4)}`, submittedBy: 'Admin', statut: 'en_attente', ...data }, ...prev]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>Notes de Frais</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: T.muted, marginTop: 4 }}>Gestion indépendante des remboursements</p>
        </div>
        <button onClick={() => setShowForm(true)} className="primary-button" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'var(--primary)', color: '#FFF', fontWeight: 800, cursor: 'pointer', border: 'none' }}>
          <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Nouvelle Note
        </button>
      </div>

      <KpiStrip expenses={expenses} />
      <CategoryBreakdown expenses={expenses} />

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <Search size={16} color={T.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Rechercher une note..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.75rem', color: T.text, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: T.surface, padding: 4, borderRadius: '0.6rem', border: `1px solid ${T.border}` }}>
          {['Tous', 'en_attente', 'approuve', 'rejete'].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: filterStatut === s ? 'var(--accent)' : 'transparent', color: filterStatut === s ? '#FFF' : T.muted }}>
              {s === 'Tous' ? 'Toutes' : STATUT_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {filtered.map(exp => <ExpenseRow key={exp.id} exp={exp} isAdmin={isAdmin} onApprove={handleApprove} onReject={handleReject} />)}
        </AnimatePresence>
      </div>

      <AnimatePresence>{showForm && <NewExpenseModal onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}</AnimatePresence>
    </div>
  );
}
