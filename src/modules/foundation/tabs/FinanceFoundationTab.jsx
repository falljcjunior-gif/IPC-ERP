/**
 * Foundation — Finance & Comptabilité
 * Dons, Décaissements, Livre Journal temps réel
 *
 * Firestore collections :
 *   foundation_finance/dons/{id}          — saisie des dons
 *   foundation_finance/decaissements/{id} — fiches de sortie (approbation requise)
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Download, CheckCircle2, Clock, XCircle,
  FileText, Paperclip, Filter, Wallet, TrendingUp,
  Heart, AlertTriangle, BookOpen, Receipt,
} from 'lucide-react';
import { useToastStore } from '../../../store/useToastStore';

const T = {
  bg: '#0a0c10', surface: '#0d1117', card: '#111318', border: '#1f2937',
  accent: '#2ecc71', accentDim: 'rgba(46,204,113,0.12)', text: '#e5e7eb', muted: '#6b7280',
};

// ── Mock data ──────────────────────────────────────────────────
const PROJETS = ['Centre de Tri Yopougon','Autonomisation Femmes Abobo','Formation Jeunes Koumassi','Micro-crédits Porteurs','Fonds Général'];
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const JOURNAL_DATA = MOIS.map((m, i) => ({
  mois: m,
  dons: Math.round(700000 + Math.random() * 500000),
  depenses: Math.round(300000 + Math.random() * 300000),
}));

const DONS_INIT = [
  { id: 'd1', date: '2025-05-09', donateur: 'Fondation Orange CI',    montant: 850000,  projet: 'Centre de Tri Yopougon',     certif: true  },
  { id: 'd2', date: '2025-05-07', donateur: 'ONU Femmes',              montant: 1200000, projet: 'Autonomisation Femmes Abobo', certif: true  },
  { id: 'd3', date: '2025-05-04', donateur: 'Diallo Moussa (Particulier)', montant: 50000, projet: 'Fonds Général',            certif: false },
  { id: 'd4', date: '2025-05-03', donateur: 'Programme ANADER',         montant: 320000, projet: 'Formation Jeunes Koumassi',   certif: true  },
];
const DEC_INIT = [
  { id: 'dc1', date: '2025-05-08', description: 'Formation instructeurs Yop.', montant: 320000, projet: 'Centre de Tri Yopougon',   statut: 'approuve', pj: 'facture_form.pdf' },
  { id: 'dc2', date: '2025-05-06', description: 'Matériel tri plastique',      montant: 580000, projet: 'Centre de Tri Yopougon',   statut: 'pending',  pj: 'devis_materiel.pdf' },
  { id: 'dc3', date: '2025-05-05', description: 'Micro-crédit — Diallo K.',     montant: 150000, projet: 'Micro-crédits Porteurs',  statut: 'approuve', pj: 'contrat_mc.pdf' },
  { id: 'dc4', date: '2025-05-02', description: 'Transport matériel Abobo',     montant: 75000,  projet: 'Autonomisation Femmes Abobo', statut: 'rejete', pj: null },
];

const STATUT_CFG = {
  approuve: { color: '#2ecc71', label: 'Approuvé', Icon: CheckCircle2 },
  pending:  { color: '#F59E0B', label: 'En attente', Icon: Clock },
  rejete:   { color: '#EF4444', label: 'Rejeté', Icon: XCircle },
};

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.abs(n)) + ' FCFA';

const Input = ({ label, ...props }) => (
  <div>
    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
    {props.as === 'select' ? (
      <select {...props} as={undefined} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.6rem', border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }}>
        <option value="">Sélectionner…</option>
        {PROJETS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    ) : (
      <input {...props} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.6rem', border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }} />
    )}
  </div>
);

const EMPTY_DON = { date: '', donateur: '', montant: '', projet: '' };
const EMPTY_DEC = { date: '', description: '', montant: '', projet: '', pj: '' };

export default function FinanceFoundationTab() {
  const [view, setView] = useState('journal'); // journal | dons | decaissements
  const [dons, setDons]   = useState(DONS_INIT);
  const [decs, setDecs]   = useState(DEC_INIT);
  const [donForm, setDonForm] = useState(EMPTY_DON);
  const [decForm, setDecForm] = useState(EMPTY_DEC);
  const { addToast } = useToastStore();

  const totalDons     = dons.reduce((s, d) => s + d.montant, 0);
  const totalDec      = decs.filter(d => d.statut === 'approuve').reduce((s, d) => s + d.montant, 0);
  const solde         = totalDons - totalDec;
  const cumulDons     = JOURNAL_DATA.reduce((s, d) => s + d.dons, 0);
  const cumulDep      = JOURNAL_DATA.reduce((s, d) => s + d.depenses, 0);

  const submitDon = () => {
    if (!donForm.date || !donForm.donateur || !donForm.montant || !donForm.projet) {
      addToast('Remplissez tous les champs requis', 'error'); return;
    }
    const newDon = { id: `d${Date.now()}`, ...donForm, montant: parseFloat(donForm.montant), certif: false };
    setDons(prev => [newDon, ...prev]);
    setDonForm(EMPTY_DON);
    addToast(`Don de ${fmt(newDon.montant)} enregistré — certificat en génération…`, 'success');
  };

  const submitDec = () => {
    if (!decForm.date || !decForm.description || !decForm.montant || !decForm.projet) {
      addToast('Remplissez tous les champs requis', 'error'); return;
    }
    if (!decForm.pj) { addToast('Une pièce jointe (facture) est obligatoire', 'error'); return; }
    const newDec = { id: `dc${Date.now()}`, ...decForm, montant: parseFloat(decForm.montant), statut: 'pending' };
    setDecs(prev => [newDec, ...prev]);
    setDecForm(EMPTY_DEC);
    addToast('Fiche de sortie soumise — en attente de validation Admin', 'info');
  };

  const approveDec = (id) => {
    setDecs(prev => prev.map(d => d.id === id ? { ...d, statut: 'approuve' } : d));
    addToast('Décaissement approuvé', 'success');
  };

  const TABS = [
    { id: 'journal',       label: 'Livre Journal',   icon: BookOpen },
    { id: 'dons',          label: 'Saisie Don',       icon: Heart },
    { id: 'decaissements', label: 'Décaissement',     icon: Receipt },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: T.surface, padding: 4, borderRadius: '0.75rem', border: `1px solid ${T.border}`, width: 'fit-content' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s',
                background: view === t.id ? T.accent : 'transparent',
                color: view === t.id ? '#000' : T.muted,
              }}
            >
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Solde Disponible', value: fmt(solde), icon: Wallet, color: solde >= 0 ? T.accent : '#EF4444', sub: 'Temps réel' },
          { label: 'Total Dons reçus', value: fmt(cumulDons), icon: Heart, color: '#6366F1', sub: `${dons.length} donateurs` },
          { label: 'Décaissements', value: fmt(cumulDep), icon: TrendingUp, color: '#F59E0B', sub: `${decs.filter(d=>d.statut==='pending').length} en attente` },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: kpi.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '0.6rem', background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.35rem', color: kpi.color, marginBottom: 2 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.72rem', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
              <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: 3 }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── JOURNAL ─────────────────────────────────────────── */}
        {view === 'journal' && (
          <motion.div key="journal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Chart */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', padding: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={15} color={T.accent} /> Évolution Dons / Dépenses (12 mois)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={JOURNAL_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => [fmt(v)]} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text }} />
                  <Area type="monotone" dataKey="dons"     stroke="#2ecc71" strokeWidth={2} fill="url(#gD)" name="Dons" />
                  <Area type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} fill="url(#gE)" name="Dépenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Journal table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={15} color={T.accent} /> Journal des Opérations
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surface }}>
                    {['Date','Libellé','Projet','Type','Montant'].map(h => (
                      <th key={h} style={{ padding: '0.7rem 1.25rem', textAlign: h==='Montant'?'right':'left', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...dons.map(d=>({...d,type:'DON',color:'#2ecc71'})), ...decs.filter(d=>d.statut==='approuve').map(d=>({...d,type:'SORTIE',color:'#EF4444'}))].sort((a,b)=>b.date.localeCompare(a.date)).map((row,i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.82rem', color: T.muted }}>{row.date}</td>
                      <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{row.donateur || row.description}</td>
                      <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.78rem', color: T.muted }}>{row.projet}</td>
                      <td style={{ padding: '0.8rem 1.25rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: row.color, background: `${row.color}18`, border: `1px solid ${row.color}30`, borderRadius: '0.3rem', padding: '2px 7px' }}>{row.type}</span>
                      </td>
                      <td style={{ padding: '0.8rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: row.color }}>
                        {row.type === 'DON' ? '+' : '-'}{fmt(row.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── FORMULAIRE DON ──────────────────────────────────── */}
        {view === 'dons' && (
          <motion.div key="dons" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Formulaire */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={15} color={T.accent} /> Nouveau Don
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input label="Date *" type="date" value={donForm.date} onChange={e=>setDonForm(f=>({...f,date:e.target.value}))} />
                <Input label="Donateur *" type="text" placeholder="Nom ou organisme" value={donForm.donateur} onChange={e=>setDonForm(f=>({...f,donateur:e.target.value}))} />
                <Input label="Montant (FCFA) *" type="number" placeholder="0" value={donForm.montant} onChange={e=>setDonForm(f=>({...f,montant:e.target.value}))} />
                <Input label="Projet Cible *" as="select" value={donForm.projet} onChange={e=>setDonForm(f=>({...f,projet:e.target.value}))} />
                <button onClick={submitDon}
                  style={{ padding: '0.85rem', borderRadius: '0.6rem', border: 'none', background: T.accent, color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: 8 }}>
                  ✓ Enregistrer & Générer Certificat
                </button>
              </div>
            </div>
            {/* Liste dons */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text }}>
                Dons Enregistrés ({dons.length})
              </div>
              <div style={{ padding: '0.5rem 0' }}>
                {dons.map((d) => (
                  <div key={d.id} style={{ padding: '0.85rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.87rem', color: T.text }}>{d.donateur}</div>
                      <div style={{ fontSize: '0.75rem', color: T.muted }}>{d.date} · {d.projet}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: T.accent, fontSize: '0.95rem' }}>+{fmt(d.montant)}</div>
                      {d.certif
                        ? <button onClick={()=>addToast('Certificat PDF téléchargé','success')} style={{ fontSize: '0.65rem', color: T.accent, background: T.accentDim, border: 'none', borderRadius: '0.3rem', padding: '2px 7px', cursor: 'pointer', marginTop: 3 }}>📄 Certificat</button>
                        : <span style={{ fontSize: '0.65rem', color: T.muted }}>⏳ Génération…</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DÉCAISSEMENTS ───────────────────────────────────── */}
        {view === 'decaissements' && (
          <motion.div key="dec" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Alerte solde */}
            {decs.filter(d=>d.statut==='pending').length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} color="#F59E0B" />
                <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 600 }}>
                  {decs.filter(d=>d.statut==='pending').length} décaissement(s) en attente de validation FOUNDATION_ADMIN
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Form */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={15} color="#F59E0B" /> Fiche de Sortie
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Input label="Date *" type="date" value={decForm.date} onChange={e=>setDecForm(f=>({...f,date:e.target.value}))} />
                  <Input label="Description *" type="text" placeholder="Objet de la dépense" value={decForm.description} onChange={e=>setDecForm(f=>({...f,description:e.target.value}))} />
                  <Input label="Montant (FCFA) *" type="number" placeholder="0" value={decForm.montant} onChange={e=>setDecForm(f=>({...f,montant:e.target.value}))} />
                  <Input label="Projet ID *" as="select" value={decForm.projet} onChange={e=>setDecForm(f=>({...f,projet:e.target.value}))} />
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pièce Jointe — Facture * <span style={{ color: '#EF4444' }}>obligatoire</span></label>
                    <div style={{ border: `1.5px dashed ${decForm.pj ? T.accent : T.border}`, borderRadius: '0.6rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                      onClick={() => { setDecForm(f=>({...f,pj:'facture_'+Date.now()+'.pdf'})); }}>
                      <Paperclip size={18} color={decForm.pj ? T.accent : T.muted} style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: '0.78rem', color: decForm.pj ? T.accent : T.muted }}>
                        {decForm.pj ? `✓ ${decForm.pj}` : 'Cliquer pour joindre la facture'}
                      </div>
                    </div>
                  </div>
                  <button onClick={submitDec}
                    style={{ padding: '0.85rem', borderRadius: '0.6rem', border: 'none', background: '#F59E0B', color: '#000', fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>
                    Soumettre pour validation
                  </button>
                </div>
              </div>

              {/* Liste décaissements */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text }}>Fiches de Sortie</div>
                <div>
                  {decs.map((d) => {
                    const cfg = STATUT_CFG[d.statut];
                    const Icon = cfg.Icon;
                    return (
                      <div key={d.id} style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.87rem', color: T.text }}>{d.description}</span>
                          <span style={{ fontWeight: 900, color: '#EF4444', fontSize: '0.9rem' }}>-{fmt(d.montant)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: T.muted }}>{d.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 800, color: cfg.color, background: `${cfg.color}15`, borderRadius: '0.3rem', padding: '2px 6px' }}>
                            <Icon size={10} />{cfg.label}
                          </span>
                          {d.pj && <span style={{ fontSize: '0.68rem', color: T.muted }}>📎 {d.pj}</span>}
                          {d.statut === 'pending' && (
                            <button onClick={() => approveDec(d.id)}
                              style={{ fontSize: '0.68rem', fontWeight: 800, color: '#000', background: T.accent, border: 'none', borderRadius: '0.3rem', padding: '2px 8px', cursor: 'pointer', marginLeft: 'auto' }}>
                              ✓ Approuver
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
