import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Download, TrendingDown, AlertTriangle,
  Package, ArrowUpRight, Layers, FileText, Trash2, Eye,
  ChevronDown, ChevronRight, Calculator, Calendar, Filter
} from 'lucide-react';
import { useStore } from '../../store';
import { useToastStore } from '../../store/useToastStore';
import { FirestoreService } from '../../services/firestore.service';
import RecordModal from '../../components/RecordModal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import {
  immobilisationsSchema,
  calculerPlanAmortissement,
  calculerVNC,
  calculerResultatCession,
  dotationsDuExercice,
  CATEGORIES_IMMOBILISATIONS,
} from '../../schemas/immobilisations.schema';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n ?? 0) + ' FCFA';

const fmtPct = (n) => `${(n * 100).toFixed(1)}%`;

const ETAT_COLORS = {
  actif:        { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Actif' },
  cede:         { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Cédé' },
  mis_au_rebut: { bg: 'rgba(107,114,128,0.15)', text: '#6B7280', label: 'Rebut' },
};

const TABS = [
  { id: 'registre',      label: 'Registre',          icon: <Layers size={15} /> },
  { id: 'amortissement', label: "Plan d'amortis.",    icon: <Calculator size={15} /> },
  { id: 'dotations',     label: 'Dotations annuelles', icon: <Calendar size={15} /> },
  { id: 'sorties',       label: 'Sorties',             icon: <ArrowUpRight size={15} /> },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } } };

// ── Composant principal ───────────────────────────────────────────────────────
const ImmobilisationsHub = () => {
  const formatCurrency = useStore(s => s.formatCurrency);
  const shellView      = useStore(s => s.shellView);
  const { addToast } = useToastStore();
  const isMobile = shellView?.mobile;

  const [tab, setTab] = useState('registre');
  const [actifs, setActifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('actifs');
  const [selectedActif, setSelectedActif] = useState(null);     // pour plan d'amortissement
  const [expandedRows, setExpandedRows] = useState(new Set());  // pour table amortissement
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterEtat, setFilterEtat] = useState('actif');
  const [exerciceRef, setExerciceRef] = useState(new Date().getFullYear());

  // ── Firestore subscription ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const unsub = FirestoreService.subscribeToCollection(
      'immobilisations',
      { orderByField: 'date_acquisition', descending: true, limit: 500 },
      (docs) => { setActifs(docs); setLoading(false); },
      () => setLoading(false)
    );
    return () => typeof unsub === 'function' && unsub();
  }, []);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const actifsActifs = actifs.filter(a => a.etat !== 'cede' && a.etat !== 'mis_au_rebut');
    const valeurBrute = actifsActifs.reduce((s, a) => s + Number(a.valeur_brute || 0), 0);
    const vncTotal = actifsActifs.reduce((s, a) => s + calculerVNC(a), 0);
    const amortisTotal = valeurBrute - vncTotal;
    const dotationsAnnee = dotationsDuExercice(actifsActifs, exerciceRef);
    const dotationTotal = dotationsAnnee.reduce((s, d) => s + d.dotation, 0);
    const tauxAmortissement = valeurBrute > 0 ? amortisTotal / valeurBrute : 0;

    return { valeurBrute, vncTotal, amortisTotal, dotationTotal, tauxAmortissement, nbActifs: actifsActifs.length };
  }, [actifs, exerciceRef]);

  // ── Actifs filtrés ──────────────────────────────────────────────────────────
  const actifsFiltres = useMemo(() => {
    return actifs.filter(a => {
      const etatOk = filterEtat === 'all' || (a.etat || 'actif') === filterEtat;
      const catOk  = filterCategorie === 'all' || a.categorie === filterCategorie;
      return etatOk && catOk;
    });
  }, [actifs, filterEtat, filterCategorie]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSave = async (fields) => {
    try {
      const data = { ...fields, etat: fields.etat || 'actif', valeur_brute: Number(fields.valeur_brute || 0), duree_amortissement: Number(fields.duree_amortissement || 5), valeur_residuelle: Number(fields.valeur_residuelle || 0) };
      await FirestoreService.addDocument('immobilisations', data);
      addToast('Immobilisation enregistrée.', 'success');
      setIsModalOpen(false);
    } catch (err) {
      addToast('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  const handleCession = async (actif) => {
    // Quick-update: marquer comme cédé
    try {
      await FirestoreService.updateDocument('immobilisations', actif.id, { etat: 'cede', date_cession: new Date().toISOString().split('T')[0] });
      addToast(`${actif.designation} marqué comme cédé.`, 'success');
    } catch {
      addToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleExportCSV = useCallback(() => {
    const lines = ['Désignation,Catégorie,Date acquisition,Valeur brute,Durée,Méthode,VNC,État'];
    actifs.forEach(a => {
      const vnc = calculerVNC(a);
      lines.push([
        a.designation, a.categorie, a.date_acquisition, a.valeur_brute,
        a.duree_amortissement, a.methode, vnc, a.etat || 'actif'
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `immobilisations_${exerciceRef}.csv`; link.click();
    URL.revokeObjectURL(url);
  }, [actifs, exerciceRef]);

  if (loading) return <SkeletonLoader.Page />;

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.12)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Building2 size={20} color="#6366F1" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.7rem', color: '#6366F1', textTransform: 'uppercase', letterSpacing: '3px' }}>
              Finance — Immobilisations
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '2rem' : '2.75rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            Immobilisations
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Registre des actifs — amortissements linéaires & dégressifs (PCG / CGI art.39A)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setModalMode('actifs'); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1.4rem', borderRadius: '10px', background: '#6366F1', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
          >
            <Plus size={16} strokeWidth={2.5} /> Nouvel actif
          </motion.button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <motion.div variants={container} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '1rem' }}
      >
        {[
          { label: 'Actifs en portefeuille', value: kpis.nbActifs, unit: 'actifs', icon: <Package size={18} />, color: '#6366F1' },
          { label: 'Valeur brute totale',      value: fmt(kpis.valeurBrute),   unit: '', icon: <Building2 size={18} />, color: '#0EA5E9' },
          { label: 'VNC totale',               value: fmt(kpis.vncTotal),      unit: '', icon: <TrendingDown size={18} />, color: '#10B981' },
          { label: `Dotations ${exerciceRef}`, value: fmt(kpis.dotationTotal), unit: '', icon: <Calendar size={18} />, color: '#F59E0B' },
          { label: 'Taux amortissement',        value: fmtPct(kpis.tauxAmortissement), unit: '', icon: <Calculator size={18} />, color: '#EF4444' },
        ].map(kpi => (
          <motion.div key={kpi.label} variants={item}
            style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: kpi.color }}>
              {kpi.icon}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {kpi.value}{kpi.unit && <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.3rem', color: 'var(--text-muted)' }}>{kpi.unit}</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', borderRadius: '12px', padding: '0.4rem', border: '1px solid var(--border)', alignSelf: 'flex-start' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: '0.15s',
              background: tab === t.id ? '#6366F1' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
            }}
          >
            {t.icon} {!isMobile && t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'registre' && (
          <motion.div key="registre" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <RegistreTab
              actifs={actifsFiltres}
              filterEtat={filterEtat} setFilterEtat={setFilterEtat}
              filterCategorie={filterCategorie} setFilterCategorie={setFilterCategorie}
              onSelectActif={(a) => { setSelectedActif(a); setTab('amortissement'); }}
              onCession={handleCession}
              isMobile={isMobile}
            />
          </motion.div>
        )}
        {tab === 'amortissement' && (
          <motion.div key="amortissement" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AmortissementTab
              actifs={actifs.filter(a => a.etat !== 'cede' && a.etat !== 'mis_au_rebut')}
              selectedActif={selectedActif}
              setSelectedActif={setSelectedActif}
              expandedRows={expandedRows}
              setExpandedRows={setExpandedRows}
              isMobile={isMobile}
            />
          </motion.div>
        )}
        {tab === 'dotations' && (
          <motion.div key="dotations" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DotationsTab
              actifs={actifs}
              exercice={exerciceRef}
              setExercice={setExerciceRef}
              isMobile={isMobile}
            />
          </motion.div>
        )}
        {tab === 'sorties' && (
          <motion.div key="sorties" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <SortiesTab
              actifs={actifs.filter(a => a.etat === 'cede' || a.etat === 'mis_au_rebut')}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <RecordModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Nouvel actif immobilisé"
            fields={Object.entries(immobilisationsSchema.models.actifs.fields).map(([name, f]) => ({ ...f, name }))}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Tab Registre ──────────────────────────────────────────────────────────────
const RegistreTab = ({ actifs, filterEtat, setFilterEtat, filterCategorie, setFilterCategorie, onSelectActif, onCession, isMobile }) => {
  const thStyle = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Filter size={14} /> Filtres :
        </div>
        {['actif', 'cede', 'mis_au_rebut', 'all'].map(e => (
          <button key={e} onClick={() => setFilterEtat(e)}
            style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: `1px solid ${filterEtat === e ? '#6366F1' : 'var(--border)'}`, background: filterEtat === e ? '#6366F1' : 'transparent', color: filterEtat === e ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
          >
            {e === 'all' ? 'Tous' : e === 'actif' ? 'Actifs' : e === 'cede' ? 'Cédés' : 'Rebut'}
          </button>
        ))}
        <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}
          style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES_IMMOBILISATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {actifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <Building2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Aucun actif immobilisé enregistré.</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Cliquez sur « Nouvel actif » pour démarrer le registre.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Désignation</th>
                <th style={thStyle}>Catégorie</th>
                <th style={thStyle}>Date acq.</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Valeur brute</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>VNC</th>
                <th style={thStyle}>Méthode</th>
                <th style={thStyle}>État</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {actifs.map(actif => {
                const vnc = calculerVNC(actif);
                const etat = ETAT_COLORS[actif.etat || 'actif'];
                const cat = CATEGORIES_IMMOBILISATIONS.find(c => c.value === actif.categorie);
                return (
                  <tr key={actif.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover, rgba(99,102,241,0.04))'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{actif.designation}</span>
                      {actif.reference && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{actif.reference}</div>}
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: '0.78rem' }}>{cat?.label || actif.categorie}</span></td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{actif.date_acquisition}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(actif.valeur_brute)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: vnc < Number(actif.valeur_brute) * 0.2 ? '#F59E0B' : 'var(--text)' }}>{fmt(vnc)}</td>
                    <td style={tdStyle}><span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{actif.methode || 'lineaire'}</span></td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: etat.bg, color: etat.text }}>{etat.label}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {(actif.etat === 'actif' || !actif.etat) && (
                          <button onClick={() => onSelectActif(actif)} title="Plan d'amortissement"
                            style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#6366F1', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          ><Eye size={14} /></button>
                        )}
                        {(actif.etat === 'actif' || !actif.etat) && (
                          <button onClick={() => onCession(actif)} title="Marquer comme cédé"
                            style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#EF4444', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          ><ArrowUpRight size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Tab Plan d'amortissement ──────────────────────────────────────────────────
const AmortissementTab = ({ actifs, selectedActif, setSelectedActif, isMobile }) => {
  const actifCourant = selectedActif || actifs[0] || null;
  const plan = useMemo(() => actifCourant ? calculerPlanAmortissement(actifCourant) : [], [actifCourant]);

  const thStyle = { padding: '0.65rem 1rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)' };
  const tdStyle = { padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' };

  const anneeActuelle = new Date().getFullYear();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sélecteur actif */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actif :</span>
        <select
          value={actifCourant?.id || ''}
          onChange={e => setSelectedActif(actifs.find(a => a.id === e.target.value) || null)}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer', flex: 1, maxWidth: '400px' }}
        >
          {actifs.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
        </select>
      </div>

      {actifCourant ? (
        <>
          {/* Fiche actif */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Valeur brute', value: fmt(actifCourant.valeur_brute) },
              { label: 'Durée', value: `${actifCourant.duree_amortissement} ans` },
              { label: 'Méthode', value: actifCourant.methode === 'degressif' ? 'Dégressif (CGI)' : 'Linéaire' },
              { label: 'VNC actuelle', value: fmt(calculerVNC(actifCourant)) },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--surface)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Tableau amortissement */}
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Exercice</th>
                  <th style={thStyle}>VNC début</th>
                  <th style={thStyle}>Taux</th>
                  <th style={thStyle}>Dotation</th>
                  <th style={thStyle}>Amort. cumulé</th>
                  <th style={thStyle}>VNC fin</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((ligne, idx) => {
                  const isCurrent = ligne.annee === anneeActuelle;
                  const isPast = ligne.annee < anneeActuelle;
                  return (
                    <tr key={ligne.annee}
                      style={{ background: isCurrent ? 'rgba(99,102,241,0.06)' : 'transparent', fontWeight: isCurrent ? 700 : 400, opacity: isPast ? 0.6 : 1 }}
                    >
                      <td style={{ ...tdStyle, textAlign: 'left', color: isCurrent ? '#6366F1' : 'var(--text)', fontWeight: isCurrent ? 700 : 500 }}>
                        {ligne.annee}{isCurrent && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#6366F1', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>En cours</span>}
                      </td>
                      <td style={tdStyle}>{fmt(ligne.vncDebut)}</td>
                      <td style={tdStyle}>{ligne.taux}</td>
                      <td style={{ ...tdStyle, color: '#EF4444', fontWeight: 600 }}>− {fmt(ligne.dotation)}</td>
                      <td style={tdStyle}>{fmt(ligne.amortissementCumule)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: ligne.vncFin === 0 ? '#10B981' : 'var(--text)' }}>{fmt(ligne.vncFin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Calculator size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Aucun actif actif disponible pour le calcul.</p>
        </div>
      )}
    </div>
  );
};

// ── Tab Dotations annuelles ───────────────────────────────────────────────────
const DotationsTab = ({ actifs, exercice, setExercice, isMobile }) => {
  const actifsActifs = actifs.filter(a => a.etat !== 'cede' && a.etat !== 'mis_au_rebut');
  const dotations = useMemo(() => dotationsDuExercice(actifsActifs, exercice), [actifsActifs, exercice]);
  const totalDotations = dotations.reduce((s, d) => s + d.dotation, 0);

  // Regroupement par catégorie
  const parCategorie = useMemo(() => {
    const map = {};
    dotations.forEach(d => {
      const key = d.categorie || 'autre';
      if (!map[key]) map[key] = { dotation: 0, count: 0 };
      map[key].dotation += d.dotation;
      map[key].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].dotation - a[1].dotation);
  }, [dotations]);

  const thStyle = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)' };
  const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sélecteur exercice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Exercice fiscal :</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setExercice(e => e - 1)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700 }}>‹</button>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: '60px', textAlign: 'center' }}>{exercice}</span>
          <button onClick={() => setExercice(e => e + 1)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700 }}>›</button>
        </div>
        <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '1rem', color: '#EF4444' }}>
          Total dotations : {fmt(totalDotations)}
        </div>
      </div>

      {/* Synthèse par catégorie */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {parCategorie.map(([cat, data]) => {
          const catLabel = CATEGORIES_IMMOBILISATIONS.find(c => c.value === cat)?.label || cat;
          const pct = totalDotations > 0 ? data.dotation / totalDotations : 0;
          return (
            <div key={cat} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{catLabel}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: '0.5rem' }}>{fmt(data.dotation)}</div>
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: '#6366F1', borderRadius: '2px', transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{data.count} actif{data.count > 1 ? 's' : ''} — {fmtPct(pct)}</div>
            </div>
          );
        })}
      </div>

      {/* Détail par actif */}
      {dotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <AlertTriangle size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Aucune dotation calculée pour l'exercice {exercice}.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Désignation</th>
                <th style={thStyle}>Catégorie</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Dotation {exercice}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>VNC fin d'exercice</th>
              </tr>
            </thead>
            <tbody>
              {dotations.sort((a, b) => b.dotation - a.dotation).map(d => {
                const cat = CATEGORIES_IMMOBILISATIONS.find(c => c.value === d.categorie);
                return (
                  <tr key={d.actifId}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{d.designation}</td>
                    <td style={{ ...tdStyle, fontSize: '0.78rem' }}>{cat?.label || d.categorie}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#EF4444', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>− {fmt(d.dotation)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.vnc)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: 'rgba(99,102,241,0.05)', fontWeight: 800 }}>
                <td colSpan={2} style={{ ...tdStyle, fontWeight: 800 }}>TOTAL DOTATIONS {exercice}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#EF4444', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>− {fmt(totalDotations)}</td>
                <td style={tdStyle} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Tab Sorties ───────────────────────────────────────────────────────────────
const SortiesTab = ({ actifs, isMobile }) => {
  const thStyle = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)' };
  const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' };

  if (actifs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
      <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
      <p style={{ margin: 0, fontWeight: 600 }}>Aucune sortie d'actif enregistrée.</p>
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Désignation</th>
            <th style={thStyle}>Catégorie</th>
            <th style={thStyle}>Date acq.</th>
            <th style={thStyle}>Motif</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Valeur brute</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Prix cession</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Résultat</th>
          </tr>
        </thead>
        <tbody>
          {actifs.map(actif => {
            const cat = CATEGORIES_IMMOBILISATIONS.find(c => c.value === actif.categorie);
            const dateCession = actif.date_cession || actif._updatedAt?.split('T')[0] || '—';
            const resultats = actif.valeur_cession != null
              ? calculerResultatCession(actif, actif.valeur_cession, dateCession)
              : null;
            const etat = ETAT_COLORS[actif.etat];
            return (
              <tr key={actif.id}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{actif.designation}</td>
                <td style={{ ...tdStyle, fontSize: '0.78rem' }}>{cat?.label || actif.categorie}</td>
                <td style={tdStyle}>{actif.date_acquisition}</td>
                <td style={tdStyle}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: etat.bg, color: etat.text }}>{etat.label}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(actif.valeur_brute)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{actif.valeur_cession != null ? fmt(actif.valeur_cession) : '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: resultats ? (resultats.type === 'plus_value' ? '#10B981' : '#EF4444') : 'var(--text-muted)' }}>
                  {resultats ? (resultats.type === 'plus_value' ? '+' : '−') + fmt(Math.abs(resultats.resultat)) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ImmobilisationsHub;
