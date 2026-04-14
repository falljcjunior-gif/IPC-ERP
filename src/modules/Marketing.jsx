import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, BarChart3, Plus, Eye, MousePointer2, TrendingUp, TrendingDown,
  ChevronRight, MoreVertical, Zap, Users, DollarSign, Target, Share2,
  Mail, Globe, Smartphone, Monitor, Activity, ArrowUpRight, Star,
  CheckCircle2, AlertTriangle, RefreshCcw, BarChart2, CreditCard,
  Calendar as CalendarIcon, MessageSquare, Link as LinkIcon, Camera,
  Square, Briefcase, Send, Clock, Filter, Search, MoreHorizontal, Grid
} from 'lucide-react';

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, Cell, ComposedChart,
  PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import { marketingSchema } from '../schemas/marketing.schema';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Shared UI Helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.72rem', fontWeight: 700 }}>{label}</span>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem', gap: '0.4rem', width: 'fit-content', border: '1px solid var(--border)' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
          background: active === t.id ? 'var(--accent)' : 'transparent',
          color: active === t.id ? 'white' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

/* ════════════════════════════════
   MARKETING MODULE (IPC GROWTH)
   Inspiré par Metricool
   ════════════════════════════════ */
const Marketing = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [mainTab, setMainTab] = useState('analytics');
  const [subNetwork, setSubNetwork] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('posts'); // 'posts' | 'campaigns' | 'smartlinks'

  // Data Selectors
  const campaigns = useMemo(() => data?.marketing?.campaigns || [], [data?.marketing?.campaigns]);
  const posts = useMemo(() => data?.marketing?.posts || [], [data?.marketing?.posts]);
  const leads = useMemo(() => data?.crm?.leads || [], [data?.crm?.leads]);
  const accounts = useMemo(() => data?.marketing?.accounts || [
    { id: '1', nom: 'IPC Facebook', reseau: 'Facebook', statut: 'Connecté' },
    { id: '2', nom: 'IPC Instagram', reseau: 'Instagram', statut: 'Connecté' },
    { id: '3', nom: 'IPC LinkedIn', reseau: 'LinkedIn', statut: 'Déconnecté' },
    { id: '4', nom: 'IPC TikTok', reseau: 'TikTok', statut: 'Connecté' }
  ], [data?.marketing?.accounts]);

  /* ─── Metricool Analytics Mock Data ─── */
  const evolutionData = [
    { date: '01/04', followers: 12400, engagement: 4.2 },
    { date: '05/04', followers: 12850, engagement: 4.5 },
    { date: '10/04', followers: 13100, engagement: 4.1 },
    { date: '15/04', followers: 13600, engagement: 4.8 },
    { date: '20/04', followers: 14200, engagement: 5.2 },
  ];

  const heatmapData = [
    { hour: '0h', mon: 10, tue: 15, wed: 8, thu: 12, fri: 20, sat: 40, sun: 35 },
    { hour: '8h', mon: 50, tue: 60, wed: 55, thu: 70, fri: 65, sat: 30, sun: 25 },
    { hour: '12h', mon: 80, tue: 85, wed: 90, thu: 88, fri: 92, sat: 60, sun: 55 },
    { hour: '18h', mon: 95, tue: 98, wed: 96, thu: 99, fri: 100, sat: 80, sun: 75 },
    { hour: '21h', mon: 70, tue: 65, wed: 75, thu: 72, fri: 85, sat: 90, sun: 95 },
  ];

  /* ════════════════════════════
     TAB: ANALYTICS (DASHBOARD)
     ════════════════════════════ */
  const renderAnalytics = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Network Filter */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { id: 'all', label: 'Vue Globale', icon: <Grid size={16} /> },
          { id: 'facebook', label: 'Facebook', icon: <Square size={16} color="#1877F2" /> },
          { id: 'instagram', label: 'Instagram', icon: <Camera size={16} color="#E4405F" /> },
          { id: 'linkedin', label: 'LinkedIn', icon: <Briefcase size={16} color="#0A66C2" /> },
          { id: 'tiktok', label: 'TikTok', icon: <Smartphone size={16} color="#000000" /> },
          { id: 'web', label: 'Site Web', icon: <Globe size={16} color="#3B82F6" /> },
        ].map(net => (
          <button key={net.id} onClick={() => setSubNetwork(net.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', 
              borderRadius: '2rem', border: '1px solid var(--border)', cursor: 'pointer',
              background: subNetwork === net.id ? 'var(--bg-subtle)' : 'transparent',
              fontWeight: 700, fontSize: '0.82rem', transition: '0.2s', whiteSpace: 'nowrap',
              boxShadow: subNetwork === net.id ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}>
            {net.icon} {net.label}
          </button>
        ))}
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Portée Totale (Reach)" value="452.8K" trend={12.5} trendType="up" icon={<Eye size={22} />} color="#3B82F6" sparklineData={[30, 45, 32, 60, 55, 80, 75]} />
        <KpiCard title="Engagement Moyen" value="4.82%" trend={0.5} trendType="up" icon={<Activity size={22} />} color="#8B5CF6" sparklineData={[4, 5, 4.2, 4.8, 4.5, 5.2]} />
        <KpiCard title="Nouveaux Abonnés" value="+2,450" trend={8.2} trendType="up" icon={<Users size={22} />} color="#10B981" sparklineData={[100, 150, 120, 300, 250, 400]} />
        <KpiCard title="Clics sur Liens" value="12,840" trend={-2.4} trendType="down" icon={<MousePointer2 size={22} />} color="#EC4899" sparklineData={[2000, 1800, 2500, 2200, 2100]} />
      </div>

      {/* Main Evolution Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>Évolution de l'Audience & Engagement</h4>
            <select className="glass" style={{ border: 'none', fontSize: '0.75rem', padding: '0.4rem', fontWeight: 700 }}>
              <option>30 derniers jours</option>
              <option>7 derniers jours</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area yAxisId="left" type="monotone" dataKey="followers" name="Abonnés" fill="#3B82F615" stroke="#3B82F6" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="engagement" name="Engagement %" stroke="#10B981" strokeWidth={3} dot={{ r: 6, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Best Time to Post (Metricool Signature) */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem' }}>
          <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#F59E0B" /> Heures de Forte Activité
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {heatmapData.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '30px', fontWeight: 700 }}>{row.hour}</span>
                <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                    <div key={day} style={{ 
                      flex: 1, height: '18px', borderRadius: '3px',
                      background: row[day] > 90 ? '#8B5CF6' : row[day] > 70 ? '#8B5CF680' : row[day] > 40 ? '#8B5CF640' : '#8B5CF610',
                      transition: '0.3s'
                    }} title={`${day} ${row.hour}: ${row[day]}%`} />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingLeft: '35px' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{d}</span>)}
            </div>
            <div style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent)' }}>💡 Conseil Pro :</p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Publiez ce vendredi à 18:30 pour maximiser votre portée.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* ════════════════════════════
     TAB: PLANNING (CONTENU)
     ════════════════════════════ */
  const renderPlanning = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>Calendrier de Publication</h4>
        <button className="btn-primary" onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.75rem' }}>
          <Plus size={18} /> Créer un Post
        </button>
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', minHeight: '500px' }}>
        {/* Simplified Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(d => (
            <div key={d} style={{ background: 'var(--bg-subtle)', padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{d}</div>
          ))}
          {Array(35).fill(null).map((_, i) => {
            const day = i - 2 + 1; // Arbitrary offset
            const hasPost = posts.some(p => new Date(p.date_publication).getDate() === day);
            return (
              <div key={i} style={{ background: 'var(--bg)', minHeight: '120px', padding: '0.5rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: day > 0 && day <= 30 ? 'var(--text)' : 'var(--text-muted)', opacity: day > 0 && day <= 30 ? 1 : 0.3 }}>{day > 0 && day <= 31 ? day : ''}</span>
                {day > 0 && day <= 31 && posts.filter(p => new Date(p.date_publication).getDate() === day).map((post, pi) => (
                  <div key={pi} className="glass" style={{ marginTop: '0.5rem', padding: '0.4rem', borderRadius: '0.5rem', fontSize: '0.72rem', borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.titre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', opacity: 0.7 }}>
                      <Clock size={10} /> {new Date(post.date_publication).getHours()}h00
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  /* ════════════════════════════
     TAB: ACCOUNT CONNECTION (Metricool Style)
     ════════════════════════════ */
  const renderConnect = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {[
        { id: 'fb', net: 'Facebook', icon: <Square size={24} />, color: '#1877F2', desc: 'Pages & Groupes' },
        { id: 'ig', net: 'Instagram', icon: <Camera size={24} />, color: '#E4405F', desc: 'Profils Business' },
        { id: 'li', net: 'LinkedIn', icon: <Briefcase size={24} />, color: '#0A66C2', desc: 'Profil & Pages' },
        { id: 'tk', net: 'TikTok', icon: <Smartphone size={24} />, color: '#000000', desc: 'Comptes Créateurs' },
        { id: 'ga', net: 'Google Ads', icon: <Globe size={24} />, color: '#4285F4', desc: 'Campagnes SEM' },
        { id: 'wb', net: 'Site Web', icon: <Globe size={24} />, color: '#10B981', desc: 'Tracker Analytics' },
      ].map(platform => {
        const connected = accounts.find(a => a.reseau === platform.net && a.statut === 'Connecté');
        return (
          <motion.div key={platform.id} variants={fadeIn} whileHover={{ y: -5 }} className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: platform.color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ background: `${platform.color}15`, padding: '0.75rem', borderRadius: '1rem', color: platform.color }}>
                {platform.icon}
              </div>
              <Chip label={connected ? 'Actif' : 'Déconnecté'} color={connected ? '#10B981' : '#64748B'} />
            </div>
            <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 800 }}>{platform.net}</h5>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{platform.desc}</p>
            
            {connected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>IPC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{connected.nom}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Synchro il y a 5 min</div>
                </div>
                <button className="btn-icon" style={{ padding: '4px' }}><RefreshCcw size={14} /></button>
              </div>
            ) : (
              <button className="btn-primary" style={{ width: '100%', background: platform.color, border: 'none' }}>
                Connecter {platform.net}
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );

  /* ═══ Main Render ═══ */
  const tabs = [
    { id: 'analytics', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 'planning', label: 'Planning', icon: <CalendarIcon size={16} /> },
    { id: 'ads', label: 'Campagnes Ads', icon: <Target size={16} /> },
    { id: 'smartlinks', label: 'SmartLinks', icon: <LinkIcon size={16} /> },
    { id: 'connect', label: 'Connexions', icon: <Zap size={16} /> },
  ];

  const modalConfig = {
    posts: { title: 'Programmer un Post Social', schema: marketingSchema.models.posts },
    campaigns: { title: 'Nouvelle Campagne Ads', schema: marketingSchema.models.campaigns },
    smartlinks: { title: 'Créer un SmartLink', schema: marketingSchema.models.smartlinks }
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Metricool Style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#EC4899', marginBottom: '0.5rem' }}>
            <div style={{ background: '#EC489915', padding: '6px', borderRadius: '8px' }}><Activity size={18} /></div>
            <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>IPC Growth Command Center</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Intelligence Marketing</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>
            Analysez, Planifiez et Boostez votre présence digitale sur 5 réseaux.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
             <Share2 size={16} /> Partager Rapport
           </button>
           <button className="btn-primary" onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <Plus size={18} /> Nouvelle Action
           </button>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {mainTab === 'analytics' && renderAnalytics()}
          {mainTab === 'planning' && renderPlanning()}
          {mainTab === 'connect' && renderConnect()}
          {mainTab === 'ads' && <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Moteur publicitaire en cours de chargement...</div>}
          {mainTab === 'smartlinks' && <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Générateur SmartLink en cours de chargement...</div>}
        </motion.div>
      </AnimatePresence>

      <RecordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode].title}
        fields={Object.entries(modalConfig[modalMode].schema.fields).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('marketing', modalMode, f);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Marketing;
