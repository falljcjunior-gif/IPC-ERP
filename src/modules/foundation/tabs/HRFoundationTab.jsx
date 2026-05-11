/**
 * HRFoundationTab — Ressources Humaines IPC Collect Foundation
 *
 * Collection Firestore : foundation_employees (distincte de hr/)
 * Sous-vues : Équipe | Contrats | Congés | Fiches de Paie
 *
 * Design : ANTIGRAVITY DARK — #0a0c10 / #1f2937 / #2ecc71
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, Calendar, DollarSign,
  Plus, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, Download, Upload,
  User, Briefcase, Phone, Mail, MapPin,
  AlertCircle, TrendingUp, Award, Shield,
} from 'lucide-react';
import { useStore } from '../../../store';

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:        'var(--bg)',
  surface:   'var(--bg-subtle)',
  card:      'var(--bg-card)',
  cardHover: 'var(--bg-subtle)',
  border:    'var(--border)',
  accent:    'var(--accent)',
  accentDim: 'var(--accent-glow)',
  accentMid: 'rgba(16, 185, 129, 0.25)',
  text:      'var(--text)',
  muted:     'var(--text-muted)',
  danger:    '#EF4444',
  warning:   '#F59E0B',
  info:      '#3B82F6',
};

// ── Static demo data ────────────────────────────────────────────
const DEMO_EMPLOYEES = [
  { id: 'EMP-F001', nom: 'Amara Diallo',     poste: 'Coordinatrice Terrain',  contrat: 'CDI',       salaire: 420000, date_embauche: '2023-03-15', email: 'a.diallo@foundation.ipc', phone: '+225 07 12 34 56', statut: 'Actif',    departement: 'Opérations' },
  { id: 'EMP-F002', nom: 'Kofi Mensah',       poste: 'Chargé de Collecte',     contrat: 'CDD',       salaire: 280000, date_embauche: '2024-01-08', email: 'k.mensah@foundation.ipc', phone: '+225 05 67 89 01', statut: 'Actif',    departement: 'Collecte' },
  { id: 'EMP-F003', nom: 'Fatou Traoré',      poste: 'Responsable Finance',    contrat: 'CDI',       salaire: 580000, date_embauche: '2022-09-01', email: 'f.traore@foundation.ipc', phone: '+225 01 23 45 67', statut: 'Actif',    departement: 'Finance' },
  { id: 'EMP-F004', nom: 'Jean-Paul Kouassi', poste: 'Consultant Impact',      contrat: 'Consultant', salaire: 750000, date_embauche: '2024-06-01', email: 'jp.kouassi@foundation.ipc', phone: '+225 07 89 01 23', statut: 'Actif', departement: 'Impact' },
  { id: 'EMP-F005', nom: 'Marie-Claire Bah',  poste: 'Assistante RH',          contrat: 'CDI',       salaire: 320000, date_embauche: '2023-11-20', email: 'mc.bah@foundation.ipc', phone: '+225 05 34 56 78', statut: 'Congé',    departement: 'Administration' },
];

const DEMO_CONGES = [
  { id: 'CG-001', employe: 'EMP-F002', nom: 'Kofi Mensah',       type: 'Congé annuel',  debut: '2025-06-10', fin: '2025-06-20', jours: 10, statut: 'en_attente', motif: 'Vacances familiales' },
  { id: 'CG-002', employe: 'EMP-F001', nom: 'Amara Diallo',      type: 'Congé maladie', debut: '2025-05-28', fin: '2025-05-30', jours: 3,  statut: 'approuve',   motif: 'Certificat médical joint' },
  { id: 'CG-003', employe: 'EMP-F005', nom: 'Marie-Claire Bah',  type: 'Congé annuel',  debut: '2025-05-01', fin: '2025-05-31', jours: 22, statut: 'approuve',   motif: 'Congé maternité' },
  { id: 'CG-004', employe: 'EMP-F003', nom: 'Fatou Traoré',      type: 'Formation',     debut: '2025-06-15', fin: '2025-06-17', jours: 3,  statut: 'en_attente', motif: 'Formation fiscalité ONG' },
];

const DEMO_PAIES = [
  { id: 'PAY-0525-001', employe: 'EMP-F001', nom: 'Amara Diallo',     mois: 'Mai 2025',  brut: 420000, net: 357000, statut: 'paye' },
  { id: 'PAY-0525-002', employe: 'EMP-F002', nom: 'Kofi Mensah',      mois: 'Mai 2025',  brut: 280000, net: 238000, statut: 'paye' },
  { id: 'PAY-0525-003', employe: 'EMP-F003', nom: 'Fatou Traoré',     mois: 'Mai 2025',  brut: 580000, net: 493000, statut: 'paye' },
  { id: 'PAY-0525-004', employe: 'EMP-F004', nom: 'Jean-Paul Kouassi', mois: 'Mai 2025', brut: 750000, net: 637500, statut: 'en_attente' },
  { id: 'PAY-0525-005', employe: 'EMP-F005', nom: 'Marie-Claire Bah', mois: 'Mai 2025',  brut: 320000, net: 272000, statut: 'paye' },
];

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const CONTRAT_COLORS = {
  CDI: T.accent,
  CDD: T.warning,
  Consultant: T.info,
};

const STATUT_CONFIG = {
  en_attente: { color: T.warning, label: 'En attente',  Icon: Clock },
  approuve:   { color: T.accent,  label: 'Approuvé',    Icon: CheckCircle },
  rejete:     { color: T.danger,  label: 'Rejeté',      Icon: XCircle },
  paye:       { color: T.accent,  label: 'Payé',        Icon: CheckCircle },
};

// ── Sub-views ───────────────────────────────────────────────────
const VIEWS = [
  { id: 'equipe',   label: 'Équipe',          Icon: Users },
  { id: 'contrats', label: 'Contrats',        Icon: FileText },
  { id: 'conges',   label: 'Congés',          Icon: Calendar },
  { id: 'paie',     label: 'Fiches de Paie',  Icon: DollarSign },
];

// ── Common card shell ────────────────────────────────────────────
function DarkCard({ children, style = {} }) {
  return (
    <div className="glassmorphism" style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: '1.25rem',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-md)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KPI strip ───────────────────────────────────────────────────
function KpiStrip({ employees }) {
  const actifs     = employees.filter(e => e.statut === 'Actif').length;
  const masseSal   = employees.reduce((a, e) => a + e.salaire, 0);
  const cdi        = employees.filter(e => e.contrat === 'CDI').length;
  const conges     = employees.filter(e => e.statut === 'Congé').length;

  const kpis = [
    { label: 'Effectif Total',    value: employees.length, icon: Users,      color: T.accent },
    { label: 'Actifs',            value: actifs,           icon: TrendingUp, color: T.info },
    { label: 'En Congé',          value: conges,           icon: Calendar,   color: T.warning },
    { label: 'Masse Salariale',   value: fmt(masseSal),    icon: DollarSign, color: T.accent, wide: true },
    { label: 'Contrats CDI',      value: cdi,              icon: Shield,     color: T.info },
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {kpis.map(({ label, value, icon: Icon, color, wide }) => (
        <div key={label} style={{
          flex: wide ? '2 1 200px' : '1 1 130px',
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: '0.875rem',
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
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
            <div style={{ fontSize: typeof value === 'number' ? '1.4rem' : '1rem', fontWeight: 800, color: T.text }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Equipe view ──────────────────────────────────────────────────
function EquipeView({ employees, onNewEmployee }) {
  const [search, setSearch] = useState('');
  const [filterContrat, setFilterContrat] = useState('Tous');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.nom.toLowerCase().includes(q) || e.poste.toLowerCase().includes(q) || e.departement.toLowerCase().includes(q);
    const matchContrat = filterContrat === 'Tous' || e.contrat === filterContrat;
    return matchSearch && matchContrat;
  }), [employees, search, filterContrat]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Rechercher un employé…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: '0.75rem', padding: '0.6rem 0.875rem 0.6rem 2.25rem',
              color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filterContrat}
          onChange={e => setFilterContrat(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none' }}
        >
          {['Tous', 'CDI', 'CDD', 'Consultant'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={onNewEmployee}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--primary)', border: 'none', borderRadius: '0.75rem',
            padding: '0.6rem 1.25rem', color: '#FFF', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          <Plus size={15} /> Nouvel Employé
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(selected?.id === emp.id ? null : emp)}
            style={{
              background: T.card, border: `1px solid ${selected?.id === emp.id ? T.accent + '60' : T.border}`,
              borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${T.accent}30, ${T.accent}10)`,
                border: `1px solid ${T.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800, color: T.accent,
              }}>
                {emp.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nom}</div>
                <div style={{ fontSize: '0.78rem', color: T.muted }}>{emp.poste}</div>
              </div>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', padding: '3px 10px', borderRadius: '2rem',
                background: `${CONTRAT_COLORS[emp.contrat]}18`,
                color: CONTRAT_COLORS[emp.contrat],
                border: `1px solid ${CONTRAT_COLORS[emp.contrat]}30`,
              }}>{emp.contrat}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: T.muted, background: T.surface, padding: '3px 10px', borderRadius: '2rem', border: `1px solid ${T.border}` }}>{emp.departement}</span>
              <span style={{
                fontSize: '0.75rem', padding: '3px 10px', borderRadius: '2rem',
                color: emp.statut === 'Actif' ? T.accent : T.warning,
                background: emp.statut === 'Actif' ? T.accentDim : 'rgba(245,158,11,0.1)',
                border: `1px solid ${emp.statut === 'Actif' ? T.accent + '30' : 'rgba(245,158,11,0.3)'}`,
              }}>{emp.statut}</span>
            </div>

            <div style={{ fontSize: '0.82rem', color: T.muted }}>
              <span style={{ color: T.text, fontWeight: 600 }}>{fmt(emp.salaire)}</span> / mois
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {selected?.id === emp.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${T.border}` }}>
                    {[
                      { Icon: Mail,  label: emp.email },
                      { Icon: Phone, label: emp.phone },
                      { Icon: Calendar, label: `Embauché le ${fmtDate(emp.date_embauche)}` },
                      { Icon: Briefcase, label: emp.id },
                    ].map(({ Icon, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: T.muted }}>
                        <Icon size={12} color={T.muted} /> {label}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Contrats view ────────────────────────────────────────────────
function ContratsView({ employees }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employe_id: '', type: 'CDI', debut: '', fin: '', salaire: '', avantages: '' });

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: T.muted, fontSize: '0.85rem' }}>{employees.length} contrats actifs</div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: showForm ? T.surface : T.accent,
            border: `1px solid ${showForm ? T.border : 'transparent'}`,
            borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
            color: showForm ? T.text : T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> {showForm ? 'Annuler' : 'Nouveau Contrat'}
        </button>
      </div>

      {/* New contract form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
          >
            <DarkCard>
              <div style={{ fontWeight: 700, color: T.accent, marginBottom: '1.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Nouveau Contrat de Travail
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  { key: 'employe_id', label: 'Employé', type: 'select', options: employees.map(e => ({ value: e.id, label: e.nom })) },
                  { key: 'type', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Consultant'].map(v => ({ value: v, label: v })) },
                  { key: 'debut', label: 'Date de début', type: 'date' },
                  { key: 'fin', label: 'Date de fin (CDD)', type: 'date' },
                  { key: 'salaire', label: 'Salaire mensuel (FCFA)', type: 'number' },
                  { key: 'avantages', label: 'Avantages en nature', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={form[field.key]}
                        onChange={e => handleField(field.key, e.target.value)}
                        style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="">Sélectionner…</option>
                        {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={form[field.key]}
                        onChange={e => handleField(field.key, e.target.value)}
                        style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 1.25rem', color: T.muted, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { alert('Contrat généré (PDF) — intégration Firestore à câbler'); setShowForm(false); }}
                  style={{ background: T.accent, border: 'none', borderRadius: '0.625rem', padding: '0.6rem 1.25rem', color: T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Générer le Contrat
                </button>
              </div>
            </DarkCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <DarkCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'Employé', 'Poste', 'Type', 'Date Embauche', 'Salaire', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <tr key={emp.id} style={{ borderBottom: i < employees.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.15s' }}>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: T.muted }}>{emp.id}</td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{emp.nom}</td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: T.muted }}>{emp.poste}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '2rem', color: CONTRAT_COLORS[emp.contrat], background: `${CONTRAT_COLORS[emp.contrat]}18`, border: `1px solid ${CONTRAT_COLORS[emp.contrat]}30` }}>
                    {emp.contrat}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: T.muted }}>{fmtDate(emp.date_embauche)}</td>
                <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{fmt(emp.salaire)}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '2rem', color: emp.statut === 'Actif' ? T.accent : T.warning, background: emp.statut === 'Actif' ? T.accentDim : 'rgba(245,158,11,0.1)' }}>
                    {emp.statut}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <button
                    onClick={() => alert(`Télécharger contrat ${emp.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.5rem', padding: '0.4rem 0.75rem', color: T.muted, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <Download size={12} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DarkCard>
    </div>
  );
}

// ── Congés view ──────────────────────────────────────────────────
function CongesView({ conges, userRole }) {
  const [showForm, setShowForm] = useState(false);
  const [localConges, setLocalConges] = useState(conges);
  const [form, setForm] = useState({ type: 'Congé annuel', debut: '', fin: '', motif: '' });

  const isAdmin = userRole === 'FOUNDATION_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const handleApprove = (id) => {
    setLocalConges(prev => prev.map(c => c.id === id ? { ...c, statut: 'approuve' } : c));
  };
  const handleReject = (id) => {
    setLocalConges(prev => prev.map(c => c.id === id ? { ...c, statut: 'rejete' } : c));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: T.muted, fontSize: '0.85rem' }}>
          <span style={{ color: T.warning, fontWeight: 600 }}>{localConges.filter(c => c.statut === 'en_attente').length}</span> demandes en attente
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: showForm ? T.surface : T.accent,
            border: `1px solid ${showForm ? T.border : 'transparent'}`,
            borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
            color: showForm ? T.text : T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Demander un congé
        </button>
      </div>

      {/* Request form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
            <DarkCard>
              <div style={{ fontWeight: 700, color: T.accent, marginBottom: '1.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nouvelle Demande de Congé</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { key: 'type', label: 'Type', type: 'select', options: ['Congé annuel', 'Congé maladie', 'Formation', 'Congé exceptionnel'] },
                  { key: 'debut', label: 'Date de début', type: 'date' },
                  { key: 'fin', label: 'Date de fin', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      >
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif</label>
                  <textarea value={form.motif} onChange={e => setForm(p => ({ ...p, motif: e.target.value }))} rows={3}
                    style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 1.25rem', color: T.muted, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => { alert('Demande envoyée — en attente de validation'); setShowForm(false); }} style={{ background: T.accent, border: 'none', borderRadius: '0.625rem', padding: '0.6rem 1.25rem', color: T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Envoyer la demande</button>
              </div>
            </DarkCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Congés list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {localConges.map((cg, i) => {
          const cfg = STATUT_CONFIG[cg.statut] || STATUT_CONFIG.en_attente;
          const StatusIcon = cfg.Icon;
          return (
            <motion.div
              key={cg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: T.card, border: `1px solid ${cg.statut === 'en_attente' ? T.warning + '40' : T.border}`,
                borderRadius: '0.875rem', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StatusIcon size={16} color={cfg.color} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{cg.nom}</div>
                <div style={{ fontSize: '0.78rem', color: T.muted }}>{cg.type} · {cg.jours} jour{cg.jours > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: T.muted, minWidth: 160 }}>
                {fmtDate(cg.debut)} → {fmtDate(cg.fin)}
              </div>
              <div style={{ fontSize: '0.8rem', color: T.muted, flex: 1, fontStyle: 'italic' }}>{cg.motif}</div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: '2rem',
                color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
              }}>
                {cfg.label}
              </span>
              {isAdmin && cg.statut === 'en_attente' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApprove(cg.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: T.accentDim, border: `1px solid ${T.accent}30`, borderRadius: '0.5rem', padding: '0.4rem 0.875rem', color: T.accent, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <CheckCircle size={12} /> Approuver
                  </button>
                  <button
                    onClick={() => handleReject(cg.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', color: T.danger, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <XCircle size={12} /> Rejeter
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fiches de Paie view ──────────────────────────────────────────
function PaieView({ paies, userRole }) {
  const [mois, setMois] = useState('Mai 2025');
  const isAdmin = userRole === 'FOUNDATION_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const filtered = paies.filter(p => p.mois === mois);
  const totalBrut = filtered.reduce((a, p) => a + p.brut, 0);
  const totalNet  = filtered.reduce((a, p) => a + p.net, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={mois} onChange={e => setMois(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.6rem 1rem', color: T.text, fontSize: '0.85rem', outline: 'none' }}
        >
          {['Mai 2025', 'Avril 2025', 'Mars 2025'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Masse Brute', value: fmt(totalBrut), color: T.accent },
            { label: 'Masse Nette',  value: fmt(totalNet),  color: T.info },
            { label: 'Charges Patronales', value: fmt(totalBrut - totalNet), color: T.warning },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', minWidth: 180 }}>
              <div style={{ fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color }}>{value}</div>
            </div>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => alert('Génération des fiches de paie en cours…')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: T.accent, border: 'none', borderRadius: '0.75rem', padding: '0.6rem 1.25rem', color: T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <Award size={15} /> Générer les Fiches
          </button>
        )}
      </div>

      <DarkCard style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Référence', 'Employé', 'Période', 'Salaire Brut', 'Salaire Net', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const cfg = STATUT_CONFIG[p.statut] || STATUT_CONFIG.en_attente;
              const StatusIcon = cfg.Icon;
              return (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: T.muted }}>{p.id}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{p.nom}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: T.muted }}>{p.mois}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{fmt(p.brut)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>{fmt(p.net)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '2rem', color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                      <StatusIcon size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      onClick={() => alert(`Télécharger fiche de paie ${p.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.5rem', padding: '0.4rem 0.75rem', color: T.muted, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      <Download size={12} /> PDF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DarkCard>
    </div>
  );
}

// ── New Employee Modal ───────────────────────────────────────────
function NewEmployeeModal({ onClose }) {
  const [form, setForm] = useState({ nom: '', poste: '', contrat: 'CDI', departement: 'Opérations', salaire: '', email: '', phone: '', date_embauche: '' });
  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: 600 }}
      >
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: T.text, marginBottom: '0.375rem' }}>Nouvel Employé Foundation</div>
        <div style={{ fontSize: '0.8rem', color: T.muted, marginBottom: '1.5rem' }}>Collection : <code style={{ color: T.accent }}>foundation_employees</code></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { key: 'nom', label: 'Nom complet', type: 'text' },
            { key: 'poste', label: 'Poste', type: 'text' },
            { key: 'contrat', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Consultant'] },
            { key: 'departement', label: 'Département', type: 'select', options: ['Opérations', 'Finance', 'Collecte', 'Impact', 'Administration'] },
            { key: 'salaire', label: 'Salaire mensuel (FCFA)', type: 'number' },
            { key: 'email', label: 'Email professionnel', type: 'email' },
            { key: 'phone', label: 'Téléphone', type: 'text' },
            { key: 'date_embauche', label: "Date d'embauche", type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: T.muted, marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.key]} onChange={e => handleField(f.key, e.target.value)}
                  style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.key]} onChange={e => handleField(f.key, e.target.value)}
                  style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: T.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.75rem', padding: '0.65rem 1.5rem', color: T.muted, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
          <button
            onClick={() => { alert(`Employé ${form.nom || '?'} créé dans foundation_employees`); onClose(); }}
            style={{ background: T.accent, border: 'none', borderRadius: '0.75rem', padding: '0.65rem 1.5rem', color: T.bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Créer l'Employé
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function HRFoundationTab() {
  const userRole = useStore(s => s.userRole);
  const [view, setView] = useState('equipe');
  const [showNewEmp, setShowNewEmp] = useState(false);

  const activeView = VIEWS.find(v => v.id === view) || VIEWS[0];

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <Users size={20} color={T.accent} />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: T.text }}>RH Foundation</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: T.muted }}>Gestion indépendante — Collection <code style={{ color: T.accent, fontSize: '0.75rem' }}>foundation_employees</code></p>
        </div>
        <div style={{ fontSize: '0.78rem', color: T.muted, background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.4rem 0.875rem' }}>
          Rôle actuel : <code style={{ color: T.accent }}>{userRole}</code>
        </div>
      </div>

      {/* KPI Strip */}
      <KpiStrip employees={DEMO_EMPLOYEES} />

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.875rem', padding: '0.3rem' }}>
        {VIEWS.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: active ? T.card : 'transparent',
                border: active ? `1px solid ${T.border}` : '1px solid transparent',
                borderRadius: '0.625rem', padding: '0.55rem 0.875rem',
                color: active ? T.text : T.muted, fontWeight: active ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <Icon size={13} color={active ? T.accent : T.muted} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {view === 'equipe'   && <EquipeView employees={DEMO_EMPLOYEES} onNewEmployee={() => setShowNewEmp(true)} />}
          {view === 'contrats' && <ContratsView employees={DEMO_EMPLOYEES} />}
          {view === 'conges'   && <CongesView conges={DEMO_CONGES} userRole={userRole} />}
          {view === 'paie'     && <PaieView paies={DEMO_PAIES} userRole={userRole} />}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showNewEmp && <NewEmployeeModal onClose={() => setShowNewEmp(false)} />}
      </AnimatePresence>
    </div>
  );
}
