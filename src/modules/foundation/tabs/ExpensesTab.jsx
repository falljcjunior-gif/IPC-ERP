/**
 * ExpensesTab — Notes de Frais IPC Collect Foundation
 *
 * Collection Firestore : foundation_expenses
 * Workflow : Soumission → Validation FOUNDATION_ADMIN → Remboursement
 *
 * Design : ANTIGRAVITY DARK — #0a0c10 / #1f2937 / #2ecc71
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

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:        '#0a0c10',
  surface:   '#0d1117',
  card:      '#111318',
  border:    '#1f2937',
  accent:    '#2ecc71',
  accentDim: 'rgba(46,204,113,0.10)',
  accentMid: 'rgba(46,204,113,0.20)',
  text:      '#e5e7eb',
  muted:     '#6b7280',
  danger:    '#EF4444',
  warning:   '#F59E0B',
  info:      '#3B82F6',
  purple:    '#8B5CF6',
};

// ── Category config ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'transport',   label: 'Transport',         Icon: Car,       color: T.info },
  { id: 'restauration',label: 'Restauration',      Icon: Coffee,    color: T.warning },
  { id: 'hebergement', label: 'Hébergement',       Icon: Hotel,     color: T.purple },
  { id: 'mission',     label: 'Frais de Mission',  Icon: Briefcase, color: T.accent },
  { id: 'materiel',    label: 'Matériel',          Icon: Monitor,   color: T.info },
  { id: 'divers',      label: 'Divers',            Icon: Package,   color: T.muted },
];

const getCatConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

// ── Static demo data ────────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUT_CONFIG = {
  en_attente: { color: T.warning, label: 'En attente',   Icon: Clock },
  approuve:   { color: T.accent,  label: 'Approuvé',     Icon: CheckCircle },
  rejete:     { color: T.danger,  label: 'Rejeté',       Icon: XCircle },
  rembourse:  { color: T.info,    label: 'Remboursé',    Icon: Wallet },
};

// ── DarkCard ─────────────────────────────────────────────────────
function DarkCard({ children, style = {} }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', padding: '1.5rem', ...style }}>
      {children}
    </div>
  );
}

// ── KPI strip ────────────────────────────────────────────────────
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
        <div key={label} style={{
          flex: '1 1 160px',
          background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.875rem',
          padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.625rem', flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: typeof value === 'number' ? '1.4rem' : '0.95rem', fontWeight: 800, color }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Category breakdown bar ────────────────────────────────────────
function CategoryBreakdown({ expenses }) {
  const approved = expenses.filter(e => e.statut === 'approuve');
  const total    = approved.reduce((a, e) => a + e.montant, 0) || 1;

  const byCategory = CATEGORIES.map(cat => {
    const amount = approved.filter(e => e.categorie === cat.id).reduce((a, e) => a + e.montant, 0);
    return { ...cat, amount, pct: Math.round((amount / total) * 100) };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  return (
    <DarkCard style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, color: T.text, marginBottom: '1rem', fontSize: '0.9rem' }}>Répartition par Catégorie (dépenses approuvées)</div>
      {byCategory.map(cat => {
        const CatIcon = cat.Icon;
        return (
          <div key={cat.id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: T.text }}>
                <CatIcon size={13} color={cat.color} /> {cat.label}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: T.muted }}>{fmt(cat.amount)} <span style={{ color: T.muted, fontSize: '0.72rem' }}>({cat.pct}%)</span></div>
            </div>
            <div style={{ height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', background: cat.color, borderRadius: 3 }}
              />
            </div>
          </div>
        );
      })}
    </DarkCard>
  );
}

// ── New expense form modal ────────────────────────────────────────
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: T.text }}>Nouvelle Note de Frais</div>
            <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 2 }}>IPC Collect Foundation — Fonds indépendants</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date de la dépense</label>
            <input type="date" value={form.date} onChange={e => handleField('date', e.target.value)}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Montant */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant (FCFA)</label>
            <input type="number" placeholder="0" value={form.montant} onChange={e => handleField('montant', e.target.value)}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Catégorie */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catégorie</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const CatIcon = cat.Icon;
                const active = form.categorie === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleField('categorie', cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: active ? `${cat.color}20` : T.surface,
                      border: `1px solid ${active ? cat.color + '50' : T.border}`,
                      borderRadius: '0.625rem', padding: '0.4rem 0.875rem',
                      color: active ? cat.color : T.muted, fontSize: '0.78rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <CatIcon size={12} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description de la dépense</label>
            <textarea
              placeholder="Décrivez la dépense et son contexte métier…"
              value={form.description}
              onChange={e => handleField('description', e.target.value)}
              rows={3}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Justificatif upload */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Justificatif <span style={{ color: T.danger }}>* obligatoire</span>
            </label>
            <label
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleField('justificatif', file.name);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.625rem', padding: '1.5rem',
                background: dragging ? T.accentMid : T.surface,
                border: `2px dashed ${dragging ? T.accent : (form.justificatif ? T.accent + '60' : T.border)}`,
                borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
              {form.justificatif ? (
                <>
                  <CheckCircle size={22} color={T.accent} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.accent }}>{form.justificatif}</div>
                  <div style={{ fontSize: '0.75rem', color: T.muted }}>Cliquer pour changer</div>
                </>
              ) : (
                <>
                  <Upload size={22} color={T.muted} />
                  <div style={{ fontSize: '0.85rem', color: T.muted }}>Glisser-déposer ou cliquer pour sélectionner</div>
                  <div style={{ fontSize: '0.72rem', color: T.muted }}>PDF, JPG, PNG — max 10 Mo</div>
                </>
              )}
            </label>
          </div>
        </div>

        {!form.justificatif && form.description && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.625rem', fontSize: '0.8rem', color: T.danger }}>
            <AlertCircle size={14} /> Un justificatif est obligatoire pour soumettre une note de frais.
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.65rem 1.5rem', color: T.muted, fontSize: '0.85rem', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              onSubmit({ ...form, montant: parseFloat(form.montant) });
              onClose();
            }}
            style={{
              background: canSubmit ? T.accent : T.border,
              border: 'none', borderRadius: '0.75rem', padding: '0.65rem 1.5rem',
              color: canSubmit ? T.bg : T.muted, fontWeight: 700, fontSize: '0.85rem',
              cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
            }}
          >
            Soumettre la Note
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Expense row ──────────────────────────────────────────────────
function ExpenseRow({ exp, isAdmin, onApprove, onReject, onView }) {
  const cfg     = STATUT_CONFIG[exp.statut] || STATUT_CONFIG.en_attente;
  const catCfg  = getCatConfig(exp.categorie);
  const StatIcon = cfg.Icon;
  const CatIcon  = catCfg.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: T.card, border: `1px solid ${exp.statut === 'en_attente' ? T.warning + '35' : T.border}`,
        borderRadius: '0.875rem', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}
    >
      {/* Category icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '0.625rem', flexShrink: 0,
        background: `${catCfg.color}18`, border: `1px solid ${catCfg.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CatIcon size={17} color={catCfg.color} />
      </div>

      {/* Main info */}
      <div style={{ flex: 2, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, marginBottom: 2 }}>{exp.description}</div>
        <div style={{ fontSize: '0.75rem', color: T.muted }}>{exp.submittedBy} · {fmtDate(exp.date)} · <span style={{ color: catCfg.color }}>{catCfg.label}</span></div>
      </div>

      {/* Amount */}
      <div style={{ minWidth: 120, textAlign: 'right' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: T.text }}>{fmt(exp.montant)}</div>
        <div style={{ fontSize: '0.72rem', color: T.muted }}>{exp.id}</div>
      </div>

      {/* Justificatif */}
      <button
        onClick={() => alert(`Visualiser : ${exp.justificatif}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.5rem', padding: '0.4rem 0.75rem', color: T.muted, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        <Eye size={12} /> {exp.justificatif}
      </button>

      {/* Status */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0,
        fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '2rem',
        color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
      }}>
        <StatIcon size={10} /> {cfg.label}
      </span>

      {/* Admin actions */}
      {isAdmin && exp.statut === 'en_attente' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={() => onApprove(exp.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: T.accentDim, border: `1px solid ${T.accent}30`,
              borderRadius: '0.5rem', padding: '0.4rem 0.875rem',
              color: T.accent, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <CheckCircle size={12} /> Valider
          </button>
          <button
            onClick={() => onReject(exp.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '0.5rem', padding: '0.4rem 0.875rem',
              color: T.danger, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <XCircle size={12} /> Rejeter
          </button>
        </div>
      )}

      {/* Rejection comment */}
      {exp.statut === 'rejete' && exp.commentaire && (
        <div style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.78rem', color: T.danger, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '0.5rem', padding: '0.5rem 0.875rem' }}>
          <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} /> {exp.commentaire}
        </div>
      )}
      {exp.statut === 'approuve' && exp.commentaire && (
        <div style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.78rem', color: T.accent, background: T.accentDim, border: `1px solid ${T.accent}25`, borderRadius: '0.5rem', padding: '0.5rem 0.875rem' }}>
          {exp.commentaire}
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────
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

  const handleApprove = (id) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, statut: 'approuve', commentaire: 'Validé par le responsable Foundation.' } : e));
  };
  const handleReject = (id) => {
    const reason = window.prompt('Motif du rejet :') || 'Rejeté par le responsable Foundation.';
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, statut: 'rejete', commentaire: reason } : e));
  };
  const handleSubmit = (data) => {
    const newExp = {
      id: `EXP-F${String(expenses.length + 1).padStart(3, '0')}`,
      submittedBy: 'Utilisateur Courant',
      employe_id: 'EMP-F001',
      statut: 'en_attente',
      commentaire: '',
      ...data,
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const totalEnAttente = expenses.filter(e => e.statut === 'en_attente').reduce((a, e) => a + e.montant, 0);

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <Receipt size={20} color={T.accent} />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: T.text }}>Notes de Frais</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: T.muted }}>Workflow indépendant — Fonds <code style={{ color: T.accent, fontSize: '0.75rem' }}>foundation_expenses</code></p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: T.accent, border: 'none', borderRadius: '0.75rem',
            padding: '0.65rem 1.25rem', color: T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Nouvelle Note
        </button>
      </div>

      {/* KPIs */}
      <KpiStrip expenses={expenses} />

      {/* Admin notice */}
      {isAdmin && totalEnAttente > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '0.875rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={16} color={T.warning} />
          <div style={{ fontSize: '0.85rem', color: T.warning }}>
            <strong>{fmt(totalEnAttente)}</strong> de notes de frais en attente de validation.
          </div>
        </motion.div>
      )}

      {/* Category breakdown */}
      <CategoryBreakdown expenses={expenses} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: '0.75rem', padding: '0.6rem 0.875rem 0.6rem 2.25rem',
              color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.25rem' }}>
          {['Tous', 'en_attente', 'approuve', 'rejete'].map(s => {
            const active = filterStatut === s;
            const label = s === 'Tous' ? 'Tous' : (STATUT_CONFIG[s]?.label || s);
            const color = s === 'Tous' ? T.text : (STATUT_CONFIG[s]?.color || T.text);
            return (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                  background: active ? T.card : 'transparent',
                  border: active ? `1px solid ${T.border}` : '1px solid transparent',
                  color: active ? color : T.muted, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence>
          {filtered.map(exp => (
            <ExpenseRow
              key={exp.id}
              exp={exp}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: T.muted, fontSize: '0.9rem' }}>
            Aucune note de frais trouvée.
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && <NewExpenseModal onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}
      </AnimatePresence>
    </div>
  );
}
