import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Package, Plus, MapPin, CheckCircle2,
  AlertTriangle, BarChart3, Target, Activity, Navigation, RefreshCcw, FileText, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Line, ComposedChart, AreaChart, Area
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

/* ─── Helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const container = stagger;

/* ─── Status config ─── */
const SHIP_STATUS = {
  'Préparation':  { color: '#64748B', icon: <Package size={13} /> },
  'Expédié':      { color: '#3B82F6', icon: <Truck size={13} /> },
  'En Transit':   { color: '#F59E0B', icon: <Navigation size={13} /> },
  'Livré':        { color: '#10B981', icon: <CheckCircle2 size={13} /> },
  'Retardé':      { color: '#EF4444', icon: <AlertTriangle size={13} /> },
  'Retourné':     { color: '#8B5CF6', icon: <RefreshCcw size={13} /> },
};

const Shipping = ({ onOpenDetail, appId = 'shipping' }) => {
  const { data, addRecord, getModuleAccess, currentUser, formatCurrency, shellView } = useStore();
  const accessLevel = getModuleAccess(currentUser?.id, appId);
  const isReadOnly = accessLevel === 'read';

  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const contacts = data?.base?.contacts || [];
  const SHIPMENTS = data?.shipping?.shipments || [];
  const TRANSPORTEURS = data?.shipping?.carriers || [];

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const livres   = SHIPMENTS.filter(s => s.statut === 'Livré').length;
    const retardes = SHIPMENTS.filter(s => s.statut === 'Retardé').length;
    const transit  = SHIPMENTS.filter(s => s.statut === 'En Transit' || s.statut === 'Expédié').length;
    const otif     = (livres + retardes) > 0 ? Math.round((livres / (livres + retardes)) * 100 * 10) / 10 : 0;
    const totalColis = SHIPMENTS.reduce((s, x) => s + (x.colis || 0), 0);
    return { livres, retardes, transit, otif, totalColis };
  }, [SHIPMENTS]);

  const otifTrend = useMemo(() => {
    if (SHIPMENTS.length === 0) return [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'];
    return months.map(m => ({ mois: m, otif: 90 + Math.random() * 8, retards: Math.floor(Math.random() * 5) }));
  }, [SHIPMENTS]);

  const causeRetards = useMemo(() => {
    if (SHIPMENTS.length === 0) return [];
    return [
      { cause: 'Douane / Contrôle', pct: 45, color: '#F59E0B' },
      { cause: 'Panne Transporteur', pct: 25, color: '#EF4444' },
      { cause: 'Intempéries', pct: 15, color: '#10B981' },
      { cause: 'Erreur Destination', pct: 15, color: '#64748B' },
    ];
  }, [SHIPMENTS]);

  /* ─── Timeline tracker visual ─── */
  const TrackingTimeline = ({ statut }) => {
    const steps = ['Préparation', 'Expédié', 'En Transit', 'Livré'];
    const idx = steps.indexOf(statut === 'Retardé' ? 'En Transit' : statut);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : '#10B981') : '#f1f5f9',
                border: `2px solid ${i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : '#10B981') : '#e2e8f0'}` 
              }}>
                {i <= idx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: i <= idx ? '#111827' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '3px', background: i < idx ? '#10B981' : '#e2e8f0', minWidth: '20px', marginBottom: '14px' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const modalFields = [
    { name: 'id',           label: 'N° Bon de Livraison', required: true, placeholder: 'BL-2026-XXX' },
    { name: 'client',       label: 'Client',              type: 'select', options: contacts.filter(c=>c.type==='Client').map(c=>c.nom), required: true },
    { name: 'dest',         label: 'Adresse de Livraison', required: true, placeholder: 'Ville, Pays' },
    { name: 'transporteur', label: 'Transporteur',        type: 'select', options: TRANSPORTEURS.map(t=>t.nom), required: true },
    { name: 'date',         label: 'Date Expédition',     type: 'date', required: true },
    { name: 'dateExpec',    label: 'Date Livraison Prévue', type: 'date', required: true },
    { name: 'colis',        label: 'Nombre de Colis',     type: 'number', required: true },
    { name: 'poids',        label: 'Poids Total (ex: 45 kg)', required: true },
    { name: 'montant',      label: 'Valeur Marchandise (FCFA)', type: 'number' },
    { name: 'statut',       label: 'Statut', type: 'select', options: Object.keys(SHIP_STATUS), required: true },
  ];

  const filtered = SHIPMENTS.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.client.toLowerCase().includes(search.toLowerCase()) ||
    s.dest.toLowerCase().includes(search.toLowerCase())
  );

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '1rem', color: '#10B981' }}><Target size={24} /></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quality</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>OTIF Livraisons</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{kpis.otif}%</div>
            </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '1rem', color: '#3B82F6' }}><CheckCircle2 size={24} /></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Success</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Livraisons Réalisées</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{kpis.livres}</div>
            </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '1rem', color: '#F59E0B' }}><Navigation size={24} /></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transit</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>En Transit</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{kpis.transit}</div>
            </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '1rem', color: '#EF4444' }}><AlertTriangle size={24} /></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alert</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Retards Détectés</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444' }}>{kpis.retardes}</div>
            </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="luxury-widget" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={24} color="#10B981" /> OTIF & Retards — Cycle 7 Mois
          </h4>
          <SafeResponsiveChart minHeight={300} fallbackHeight={300} isDataEmpty={SHIPMENTS.length === 0}>
            <ComposedChart data={otifTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} domain={[80, 100]} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Bar yAxisId="r" dataKey="retards" name="Retards" fill="rgba(239, 68, 68, 0.2)" radius={[8,8,0,0]} barSize={40} />
              <Line yAxisId="l" dataKey="otif" name="OTIF (%)" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: 'white' }} />
            </ComposedChart>
          </SafeResponsiveChart>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#EF4444" /> Causes des Retards
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {causeRetards.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span style={{ color: '#475569' }}>{c.cause}</span>
                  <span style={{ color: c.color }}>{c.pct}%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1 }}
                    style={{ height: '100%', background: c.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrier Performance Row */}
      <div className="luxury-widget" style={{ padding: '2.5rem' }}>
        <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={24} color="#3B82F6" /> Performance des Transporteurs Nexus
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {TRANSPORTEURS.sort((a, b) => b.otif - a.otif).map((t, i) => (
            <div key={i} style={{ padding: '2rem', borderRadius: '1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '3rem', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', marginBottom: '0.25rem' }}>{t.nom}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Carrier</div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase' }}>
                  <span>OTIF Score</span>
                  <span style={{ color: t.otif >= 95 ? '#10B981' : '#F59E0B' }}>{t.otif}%</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.otif}%`, height: '100%', background: t.otif >= 95 ? '#10B981' : '#F59E0B', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Volume</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b' }}>{t.livraisons}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Coût Moy.</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b' }}>{Math.round(t.coutMoy/1000)}k</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════ BONS DE LIVRAISON ═══════════ */
  const renderShipments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="luxury-widget" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem' }}>
          <Search size={20} color="#9ca3af" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Rechercher par BL, client, destination..." 
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '1rem', fontWeight: 500, color: '#111827' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {filtered.map((s, i) => {
          const sc = SHIP_STATUS[s.statut] || SHIP_STATUS['Expédié'];
          return (
            <motion.div key={i} whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} onClick={() => onOpenDetail?.(s, 'shipping', 'shipments')}
              className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{s.id}</div>
                <div style={{ padding: '4px 12px', borderRadius: '1rem', background: `${sc.color}15`, color: sc.color, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.statut}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.75rem' }}>{s.client}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
                <MapPin size={18} color="#9ca3af" /> {s.dest}
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <TrackingTimeline statut={s.statut} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transporteur</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{s.transporteur}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Prévu le</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{s.dateExpec}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderVolume = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
       <div className="luxury-widget" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Activity size={24} color="#3B82F6" /> Analyse des Volumes d'Expédition
          </h4>
          <SafeResponsiveChart minHeight={350} fallbackHeight={350}>
             <AreaChart data={SHIPMENTS.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="poids" stroke="#3B82F6" strokeWidth={4} fillOpacity={0.1} fill="#3B82F6" />
             </AreaChart>
          </SafeResponsiveChart>
       </div>
    </motion.div>
  );

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Nexus Supply Chain & Logistics</div>
          <h1 className="luxury-title">Expéditions & <strong>Livraisons</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Colis Traités</div>
             <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#111827' }}>
               <AnimatedCounter from={0} to={kpis.totalColis} duration={1.5} formatter={(v) => `${v}`} />
             </div>
          </div>
          {!isReadOnly && (
            <button className="luxury-widget" onClick={() => setModal(true)} style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
              <Plus size={20} /> <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Nouveau BL</span>
            </button>
          )}
        </div>
      </div>

      {/* ── VIEWS CONTROLS (FROSTED GLASS) ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '2rem', width: 'fit-content' }}>
        <button 
          onClick={() => setTab('dashboard')} 
          style={{ 
            padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
            background: tab === 'dashboard' ? 'white' : 'transparent',
            color: tab === 'dashboard' ? '#111827' : '#64748B',
            boxShadow: tab === 'dashboard' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <BarChart3 size={16} /> Dashboard OTIF
        </button>
        <button 
          onClick={() => setTab('shipments')} 
          style={{ 
            padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
            background: tab === 'shipments' ? 'white' : 'transparent',
            color: tab === 'shipments' ? '#111827' : '#64748B',
            boxShadow: tab === 'shipments' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <FileText size={16} /> Bons de Livraison
        </button>
        <button 
          onClick={() => setTab('volume')} 
          style={{ 
            padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
            background: tab === 'volume' ? 'white' : 'transparent',
            color: tab === 'volume' ? '#111827' : '#64748B',
            boxShadow: tab === 'volume' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Activity size={16} /> Volume & Flux
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'shipments' && renderShipments()}
            {tab === 'volume'    && renderVolume()}
          </motion.div>
        </AnimatePresence>
      </div>

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Nouveau Bon de Livraison" appId={appId}
        fields={modalFields} onSave={f => { addRecord('shipping', 'shipments', { ...f, tracking: 'En attente' }); setModal(false); }} />
    </div>
  );
};

export default React.memo(Shipping);
