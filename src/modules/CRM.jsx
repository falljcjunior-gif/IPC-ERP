import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, MoreVertical, Mail, Phone, Building2, Calendar,
  DollarSign, TrendingUp, Target, BarChart3, Layout, Users, Star,
  ChevronRight, ArrowUpRight, ArrowDownRight, Zap, Award, Clock,
  Activity, RefreshCcw, UserCheck, Megaphone, Headphones, ShieldCheck,
  TrendingDown, Circle, CheckCircle2, XCircle, AlertCircle, Globe,
  MessageSquare, ThumbsUp, ThumbsDown, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, FunnelChart, Funnel, LabelList,
  Cell, PieChart, Pie, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';
import KanbanBoard from '../components/KanbanBoard';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const STAGE_COLORS = {
  'Nouveau':       '#64748B',
  'Qualification': '#3B82F6',
  'Proposition':   '#8B5CF6',
  'Négociation':   '#F59E0B',
  'Gagné':         '#10B981',
  'Perdu':         '#EF4444',
};

const STAGE_ORDER = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '999px',
    background: `${color}18`, color, fontSize: '0.73rem', fontWeight: 700
  }}>
    <Circle size={6} fill={color} /> {label}
  </span>
);

const ScoreStar = ({ score }) => {
  const stars = Math.round((score / 100) * 5);
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} fill={i <= stars ? '#F59E0B' : 'transparent'} color={i <= stars ? '#F59E0B' : 'var(--border)'} />
      ))}
    </div>
  );
};

/* ─── Custom Tooltip ─── */
const CRMTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

/* ─── Mini Stat Box ─── */
const StatBox = ({ label, value, sub, color, icon }) => (
  <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <div style={{ color, background: `${color}15`, padding: '5px', borderRadius: '0.5rem' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

/* ─── Client 360 Panel ─── */
const Client360Panel = ({ lead, onClose, formatCurrency }) => {
  if (!lead) return null;
  const activities = [
    { type: 'Email', msg: 'Proposition commerciale envoyée', date: '10 Avr', icon: <Mail size={14} />, color: '#3B82F6' },
    { type: 'Appel', msg: 'Démo produit réalisée — réaction positive', date: '08 Avr', icon: <Phone size={14} />, color: '#10B981' },
    { type: 'Note', msg: 'Budget confirmé: 15M FCFA pour Q3', date: '05 Avr', icon: <MessageSquare size={14} />, color: '#8B5CF6' },
    { type: 'Support', msg: 'Ticket SAV #2041 résolu en 2h', date: '01 Avr', icon: <Headphones size={14} />, color: '#F59E0B' },
  ];
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="glass" style={{ width: '380px', minWidth: '380px', borderRadius: '1.5rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', maxHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{lead.prenom} {lead.nom}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Building2 size={13} /> {lead.entreprise}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
          <XCircle size={20} />
        </button>
      </div>

      {/* Score */}
      <div style={{ background: 'var(--bg-subtle)', borderRadius: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Score Lead</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>82</div>
          <ScoreStar score={82} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>LTV Estimée</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(lead.valeur || 5000000)}</div>
          <Badge label={lead.statut || 'Nouveau'} color="#3B82F6" />
        </div>
      </div>

      {/* Contact Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>📋 Fiche Contact</div>
        {[
          { icon: <Mail size={14} />, val: lead.email || 'Non renseigné' },
          { icon: <Phone size={14} />, val: lead.tel || '+33 1 XX XX XX XX' },
          { icon: <Globe size={14} />, val: lead.source || 'Site Web' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {item.icon} {item.val}
          </div>
        ))}
      </div>

      {/* ERP Cross-Data */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>🔗 Vue ERP Croisée</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { dept: 'Finance',      val: '2 factures en attente (450K FCFA)', color: '#EF4444', icon: <DollarSign size={13} /> },
            { dept: 'Supply',       val: 'Commande #2026-041 expédiée',       color: '#10B981', icon: <CheckCircle2 size={13} /> },
            { dept: 'SAV',          val: '1 ticket ouvert depuis 3 jours',    color: '#F59E0B', icon: <AlertCircle size={13} /> },
            { dept: 'Contrats',     val: '1 abonnement actif — renouvellement en Juin', color:'#8B5CF6', icon: <ShieldCheck size={13} /> },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.6rem', background: 'var(--bg-subtle)', borderRadius: '0.6rem' }}>
              <span style={{ color: d.color }}>{d.icon}</span>
              <span><strong>{d.dept}: </strong>{d.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>⏱ Journal d'Activité</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activities.map((act, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ color: act.color, background: `${act.color}15`, padding: '5px', borderRadius: '6px', marginTop: '2px' }}>{act.icon}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{act.msg}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.type} — {act.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════
   CRM MODULE
═══════════════════════════════════ */
const CRM = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { leads = [], opportunities = [] } = data.crm || {};
  const contacts = data.base?.contacts || [];

  /* ─── Computed KPIs ─── */
  const kpis = useMemo(() => {
    const totalPipeline = opportunities.reduce((s, o) => s + (o.montant || 0), 0);
    const weightedPipeline = opportunities.reduce((s, o) => s + (o.montant || 0) * ((o.probabilite || 0) / 100), 0);
    const won  = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const convRate = leads.length > 0 ? Math.round((opportunities.length / leads.length) * 100) : 0;
    const winRate  = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    const avgCycleDays = 28;  // simulated
    const nps    = 62;        // simulated
    const csat   = 88;        // simulated
    const churn  = 3.2;       // simulated
    const avgResolutionHours = 4.2; // simulated
    const cac    = 125000;    // simulated
    const ltv    = 8500000;   // simulated
    const cltv   = ltv * 3;   // LTV * avg years
    const mqlCount = leads.filter(l => l.statut === 'En cours').length;
    const sqlCount = leads.filter(l => l.statut === 'Assigné').length;
    const roiCampaign = 340;  // % simulated
    return { totalPipeline, weightedPipeline, convRate, winRate, avgCycleDays, nps, csat, churn, avgResolutionHours, cac, ltv, cltv, mqlCount, sqlCount, won, lost, roiCampaign };
  }, [leads, opportunities]);

  /* ─── Chart Data ─── */
  const pipelineByStage = STAGE_ORDER.slice(0, -1).map(stage => ({
    name: stage,
    montant: opportunities.filter(o => o.etape === stage).reduce((s, o) => s + (o.montant || 0), 0),
    count: opportunities.filter(o => o.etape === stage).length,
    color: STAGE_COLORS[stage]
  }));

  const monthlyLeads = [
    { mois: 'Oct', mql: 28, sql: 14, clients: 6 },
    { mois: 'Nov', mql: 32, sql: 18, clients: 8 },
    { mois: 'Déc', mql: 25, sql: 12, clients: 5 },
    { mois: 'Jan', mql: 40, sql: 22, clients: 10 },
    { mois: 'Fév', mql: 45, sql: 27, clients: 13 },
    { mois: 'Mar', mql: 52, sql: 31, clients: 16 },
    { mois: 'Avr', mql: kpis.mqlCount + 48, sql: kpis.sqlCount + 29, clients: 15 },
  ];

  const npsData = [
    { name: 'Promoteurs', value: 62, fill: '#10B981' },
    { name: 'Passifs',    value: 23, fill: '#F59E0B' },
    { name: 'Détracteurs',value: 15, fill: '#EF4444' },
  ];

  const winLossData = [
    { reason: 'Prix / Budget',  won: 42, lost: 58 },
    { reason: 'Fonctionnalités',won: 65, lost: 35 },
    { reason: 'Concurrence',    won: 38, lost: 62 },
    { reason: 'Délai',          won: 70, lost: 30 },
    { reason: 'Relation',       won: 80, lost: 20 },
  ];

  const sourceData = [
    { name: 'Site Web',    value: leads.filter(l => l.source === 'Site Web').length || 12,    fill:'#3B82F6' },
    { name: 'E-mail',      value: leads.filter(l => l.source === 'E-mail').length || 8,       fill:'#8B5CF6' },
    { name: 'Appel entrant', value: leads.filter(l => l.source === 'Appel entrant').length || 5, fill:'#10B981' },
    { name: 'Partenaires', value: leads.filter(l => l.source === 'Partenaire').length || 6,   fill:'#F59E0B' },
    { name: 'Conférence',  value: leads.filter(l => l.source === 'Conférence').length || 4,   fill:'#EC4899' },
  ];

  /* ─── Modal Fields ─── */
  const stages = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];
  const modalFields = (view === 'opportunities' || view === 'kanban') ? [
    { name: 'titre',       label: 'Titre de l\'opportunité', required: true, placeholder: 'Ex: Migration Cloud' },
    { name: 'client',      label: 'Client / Entreprise', type: 'select', options: contacts.map(c => c.nom), required: true },
    { name: 'montant',     label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'probabilite', label: 'Probabilité (%)', type: 'number', required: true },
    { name: 'etape',       label: 'Étape', type: 'select', options: stages, required: true },
    { name: 'dateCloture', label: 'Date de clôture prévue', type: 'date', required: true },
  ] : [
    { name: 'prenom',   label: 'Prénom', required: true },
    { name: 'nom',      label: 'Nom', required: true },
    { name: 'entreprise',label: 'Entreprise', required: true },
    { name: 'email',    label: 'Email', type: 'email', required: true },
    { name: 'source',   label: 'Source', type: 'select', options: ['Site Web', 'E-mail', 'Appel entrant', 'Conférence', 'Partenaire'], required: true },
    { name: 'statut',   label: 'Statut', type: 'select', options: ['Nouveau', 'En cours', 'Assigné', 'Terminé'], required: true },
    { name: 'valeur',   label: 'Valeur estimée (FCFA)', type: 'number', required: true },
  ];

  const handleSave = (formData) => {
    const sub = (view === 'opportunities' || view === 'kanban') ? 'opportunities' : 'leads';
    addRecord('crm', sub, formData);
  };
  const handleMove = (item, col) => updateRecord('crm', 'opportunities', item.id, { etape: col });

  const filteredLeads = leads.filter(l =>
    `${l.prenom} ${l.nom} ${l.entreprise}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─── VIEW: DASHBOARD ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Sales KPIs ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={16} color="#3B82F6" /> Ventes & Pipeline
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <KpiCard title="Valeur Brute Pipeline"   value={formatCurrency(kpis.totalPipeline, true)}    trend={8.2}  trendType="up"   icon={<DollarSign size={20} />} color="#3B82F6" sparklineData={[{val:30},{val:35},{val:32},{val:40},{val:45}]} />
          <KpiCard title="Pipeline Pondéré"        value={formatCurrency(kpis.weightedPipeline, true)} trend={5.1}  trendType="up"   icon={<Activity size={20} />}   color="#8B5CF6" sparklineData={[{val:15},{val:18},{val:17},{val:20},{val:22}]} />
          <KpiCard title="Taux de Conversion"      value={`${kpis.convRate}%`}                          trend={12.5} trendType="up"   icon={<TrendingUp size={20} />} color="#10B981" sparklineData={[{val:10},{val:15},{val:12},{val:18},{val:25}]} />
          <KpiCard title="Win Rate"                value={`${kpis.winRate}%`}                           trend={3.2}  trendType="up"   icon={<Award size={20} />}      color="#F59E0B" sparklineData={[{val:40},{val:42},{val:41},{val:44},{val:46}]} />
          <KpiCard title="Cycle de Vente Moyen"    value={`${kpis.avgCycleDays} Jours`}                 trend={5.1}  trendType="up"   icon={<Clock size={20} />}      color="#06B6D4" sparklineData={[{val:35},{val:32},{val:30},{val:29},{val:28}]} />
        </div>
      </motion.div>

      {/* ── Pipeline Stage Chart + Win/Loss ── */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Entonnoir Pipeline par Étape</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineByStage} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 600 }} width={95} />
              <Tooltip content={<CRMTooltip suffix=" FCFA" />} />
              <Bar dataKey="montant" name="Montant" radius={[0, 6, 6, 0]} barSize={20}>
                {pipelineByStage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Raisons Gain / Perte</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={winLossData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="reason" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', fontSize: 11 }} width={90} />
              <Tooltip content={<CRMTooltip suffix="%" />} />
              <Bar dataKey="won"  name="Gagné" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} stackId="a" />
              <Bar dataKey="lost" name="Perdu" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={12} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Marketing KPIs ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Megaphone size={16} color="#EC4899" /> Marketing & Génération de Leads
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <StatBox label="MQL (Leads Marketing)"  value={kpis.mqlCount + 48} sub="Prospects qualifiés Mktg"     color="#3B82F6" icon={<UserCheck size={16} />} />
          <StatBox label="SQL (Leads Ventes)"      value={kpis.sqlCount + 29}  sub="Validés par les commerciaux" color="#8B5CF6" icon={<Target size={16} />} />
          <StatBox label="CAC"                     value={formatCurrency(kpis.cac, true)} sub="Coût d'Acquisition Client"  color="#F59E0B" icon={<DollarSign size={16} />} />
          <StatBox label="ROI Campagnes"            value={`${kpis.roiCampaign}%`}         sub="Rentabilité Mktg globale"   color="#10B981" icon={<TrendingUp size={16} />} />
        </div>
      </motion.div>

      {/* ── Lead Gen Chart + Sources ── */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Génération MQL → SQL → Clients (7 mois)</h4>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={monthlyLeads}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip content={<CRMTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.75rem' }} />
              <Bar     dataKey="mql"     name="MQL"     fill="#3B82F666" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar     dataKey="sql"     name="SQL"     fill="#8B5CF6"   radius={[4, 4, 0, 0]} barSize={18} />
              <Line    dataKey="clients" name="Clients gagnés" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Sources des Leads</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                {sourceData.map((s, i) => <Cell key={i} fill={s.fill} />)}
              </Pie>
              <Tooltip content={<CRMTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {sourceData.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.fill, flexShrink: 0 }} /> {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Service Client KPIs ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Headphones size={16} color="#06B6D4" /> Service Client & Fidélisation
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <KpiCard title="NPS Score"               value={kpis.nps}                           trend={4.1} trendType="up"   icon={<ThumbsUp size={20} />}    color="#10B981" sparklineData={[{val:55},{val:57},{val:60},{val:61},{val:62}]} />
          <KpiCard title="CSAT"                    value={`${kpis.csat}%`}                    trend={2.3} trendType="up"   icon={<Star size={20} />}        color="#F59E0B" sparklineData={[{val:84},{val:85},{val:86},{val:87},{val:88}]} />
          <KpiCard title="Taux d'Attrition (Churn)"value={`${kpis.churn}%`}                  trend={0.5} trendType="up"   icon={<RefreshCcw size={20} />}  color="#EF4444" sparklineData={[{val:3.8},{val:3.6},{val:3.5},{val:3.3},{val:3.2}]} />
          <KpiCard title="Résolution Moy. SAV"     value={`${kpis.avgResolutionHours}h`}      trend={8.2} trendType="up"   icon={<Clock size={20} />}       color="#8B5CF6" sparklineData={[{val:6},{val:5.5},{val:5},{val:4.5},{val:4.2}]} />
          <KpiCard title="LTV / CLTV"              value={formatCurrency(kpis.cltv, true)}   trend={3.0} trendType="up"   icon={<Award size={20} />}       color="#06B6D4" sparklineData={[{val:20},{val:22},{val:23},{val:24},{val:25.5}]} />
        </div>
      </motion.div>

      {/* ── NPS Breakdown ── */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Net Promoter Score</div>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{kpis.nps}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Excellent — Référence industrie: 45</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {npsData.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: n.fill, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{n.name}</span>
                <span style={{ fontWeight: 700, color: n.fill }}>{n.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            Opportunités Récentes — Vue Pipeline
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
            {opportunities.slice(0, 6).map((opp, i) => (
              <div key={i} onClick={() => oOpenDetail?.(opp, 'crm', 'opportunities')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opp.titre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opp.client}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge label={opp.etape} color={STAGE_COLORS[opp.etape] || '#64748B'} />
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>{formatCurrency(opp.montant, true)}</div>
                </div>
              </div>
            ))}
            {opportunities.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Aucune opportunité en cours.</div>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ─── VIEW: LEADS TABLE with 360 Panel ─── */
  const renderLeads = () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, color: 'var(--text-muted)' }}>
            <Search size={16} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un prospect..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text)', width: '100%' }} />
          </div>
        </div>
        <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                {['Contact', 'Entreprise', 'Source', 'Statut', 'Lead Score', 'LTV Estimée', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, i) => {
                const score = 50 + Math.floor(Math.random() * 50);
                return (
                  <motion.tr key={lead.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedLead(lead)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedLead?.id === lead.id ? 'var(--bg-subtle)' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700 }}>{lead.prenom} {lead.nom}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={13} /> {lead.entreprise}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}><Badge label={lead.source} color="#64748B" /></td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Badge label={lead.statut} color={lead.statut === 'Terminé' ? '#10B981' : lead.statut === 'Assigné' ? '#8B5CF6' : lead.statut === 'En cours' ? '#F59E0B' : '#64748B'} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '50px', height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: score > 75 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(lead.valeur || 5000000, true)}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button title="Email" style={{ background: '#3B82F615', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#3B82F6' }}><Mail size={14} /></button>
                        <button title="Appel" style={{ background: '#10B98115', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#10B981' }}><Phone size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <Client360Panel lead={selectedLead} onClose={() => setSelectedLead(null)} formatCurrency={formatCurrency} />
        )}
      </AnimatePresence>
    </div>
  );

  /* ─── VIEW: KANBAN ─── */
  const renderKanban = () => (
    <KanbanBoard
      columns={stages}
      items={opportunities}
      columnMapping="etape"
      onMove={handleMove}
      onItemClick={(item) => onOpenDetail?.(item, 'crm', 'opportunities')}
      onAddClick={() => setIsModalOpen(true)}
      renderCardContent={(item) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>{item.titre}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <Building2 size={11} /> {item.client}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{formatCurrency(item.montant, true)}</span>
            <span style={{ color: STAGE_COLORS[item.etape] || 'var(--accent)', fontWeight: 700, fontSize: '0.8rem' }}>{item.probabilite}%</span>
          </div>
        </div>
      )}
    />
  );

  /* ─── VIEW: OPPORTUNITÉS ─── */
  const renderOpportunities = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {opportunities.map((opp) => (
        <motion.div key={opp.id} whileHover={{ y: -5 }} onClick={() => onOpenDetail?.(opp, 'crm', 'opportunities')}
          className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${STAGE_COLORS[opp.etape] || 'var(--accent)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Badge label={opp.etape} color={STAGE_COLORS[opp.etape] || '#64748B'} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opp.dateCloture}</div>
          </div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', fontWeight: 700 }}>{opp.titre}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1.25rem' }}>
            <Building2 size={13} /> {opp.client}
          </div>
          <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valeur</div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{formatCurrency(opp.montant, true)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Probabilité</div>
              <div style={{ fontWeight: 800, color: STAGE_COLORS[opp.etape] || 'var(--accent)' }}>{opp.probabilite}%</div>
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div whileHover={{ scale: 1.02 }} onClick={() => setIsModalOpen(true)} className="glass"
        style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', minHeight: '160px' }}>
        <Plus size={28} />
        <span style={{ fontWeight: 600 }}>Nouvelle Opportunité</span>
      </motion.div>
    </div>
  );

  /* ─── TABS ─── */
  const tabs = [
    { id: 'dashboard',     label: 'Dashboard',    icon: <BarChart3 size={15} /> },
    { id: 'kanban',        label: 'Pipeline',     icon: <Layout size={15} /> },
    { id: 'opportunities', label: 'Opportunités', icon: <Target size={15} /> },
    { id: 'leads',         label: 'Prospects 360°',icon: <Users size={15} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
            <Zap size={16} fill="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>CRM — Front Office Enterprise</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Gestion de la Relation Client</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            Pipeline · Marketing · SAV · Fidélisation — Vue 360°
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={17} /> {view === 'leads' ? 'Nouveau Prospect' : 'Nouvelle Opportunité'}
        </button>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.25rem', width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              background: view === tab.id ? 'var(--bg)' : 'transparent',
              color: view === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: view === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Views */}
      {view === 'dashboard'     && renderDashboard()}
      {view === 'kanban'        && renderKanban()}
      {view === 'opportunities' && renderOpportunities()}
      {view === 'leads'         && renderLeads()}

      <RecordModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'opportunities' || view === 'kanban' ? 'Nouvelle Opportunité' : 'Nouveau Prospect'}
        fields={modalFields}
      />
    </div>
  );
};

export default CRM;
