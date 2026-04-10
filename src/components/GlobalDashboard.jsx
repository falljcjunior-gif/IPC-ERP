import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Target, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Activity as ActivityIcon,
  Calendar,
  Zap,
  Briefcase
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import KpiCard from './KpiCard';
import { AreaChartComp, BarChartComp } from './BusinessCharts';

const GlobalDashboard = () => {
  const { data, navigateTo, formatCurrency } = useBusiness();
  
  const revenueData = [
    { name: 'Lun', value: 120000000 },
    { name: 'Mar', value: 150000000 },
    { name: 'Mer', value: 180000000 },
    { name: 'Jeu', value: 140000000 },
    { name: 'Ven', value: 220000000 },
    { name: 'Sam', value: 190000000 },
    { name: 'Dim', value: 250000000 },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              <Zap size={20} fill="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cockpit Stratégique</span>
           </div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Bonjour, Raphael 👋</h1>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Voici l'état de santé actuel de votre organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
             onClick={() => navigateTo('crm')}
             className="glass" 
             style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
           >
              Analyses CRM <ArrowUpRight size={16} />
           </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Chiffre d'Affaires Mensuel" 
          value={formatCurrency(1250000000, true)}
          trend={18.4} 
          trendType="up" 
          icon={<DollarSign size={24} />} 
          color="#3B82F6"
          sparklineData={revenueData.map(d => ({ val: d.value }))}
        />
        <KpiCard 
          title="Conversion Pipeline" 
          value="24.8%"
          trend={3.2} 
          trendType="up" 
          icon={<Target size={24} />} 
          color="#10B981"
          sparklineData={[{val: 20}, {val: 22}, {val: 21}, {val: 24}, {val: 25}]}
        />
        <KpiCard 
          title="Effectif Actif" 
          value={data.hr.employees.length}
          trend={1.1} 
          trendType="up" 
          icon={<Users size={24} />} 
          color="#8B5CF6"
          sparklineData={[{val: 120}, {val: 122}, {val: 121}, {val: 124}, {val: 125}]}
        />
        <KpiCard 
          title="Satisfaction Client" 
          value="9.4/10"
          trend={2.1} 
          trendType="up" 
          icon={<ActivityIcon size={24} />} 
          color="#06B6D4"
          sparklineData={[{val: 8.5}, {val: 8.8}, {val: 9.2}, {val: 9.1}, {val: 9.4}]}
        />
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Activité Commerciale (7 jours)</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} /> 
                 Ventes Directes
              </div>
           </div>
           <AreaChartComp data={revenueData} color="var(--accent)" />
        </div>

        <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notifications Récentes</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { type: 'CRM', msg: 'Nouvel lead de "InnoCorp" assigné', time: '12m', color: '#3B82F6' },
                { type: 'Finance', msg: 'Facture #2026-084 payée', time: '1h', color: '#10B981' },
                { type: 'Prod', msg: 'OF #442 terminé (Serveur Gen3)', time: '3h', color: '#F59E0B' },
                { type: 'RH', msg: '3 nouvelles demandes de congés', time: '5h', color: '#8B5CF6' },
              ].map((notif, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    minWidth: '32px', height: '32px', borderRadius: '10px', background: `${notif.color}15`, 
                    color: notif.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 
                  }}>
                    {notif.type[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{notif.msg}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>il y a {notif.time}</div>
                  </div>
                </div>
              ))}
           </div>
           <button style={{ marginTop: 'auto', padding: '0.75rem', borderRadius: '1rem', border: 'none', background: 'var(--bg-subtle)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
              Voir tout l'historique
           </button>
        </div>
      </div>

      {/* Bottom Layout: Quick Apps */}
      <div>
         <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Accès Rapides</h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
            {[
              { id: 'crm', label: 'CRM', icon: <Target />, color: '#3B82F6' },
              { id: 'sales', label: 'Ventes', icon: <ShoppingCart />, color: '#10B981' },
              { id: 'projects', label: 'Projets', icon: <Briefcase />, color: '#F43F5E' },
              { id: 'hr', label: 'RH', icon: <Users />, color: '#8B5CF6' },
              { id: 'accounting', label: 'Finance', icon: <DollarSign />, color: '#F59E0B' },
              { id: 'production', label: 'Production', icon: <ActivityIcon />, color: '#06B6D4' },
            ].map(app => (
              <motion.div
                key={app.id}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigateTo(app.id)}
                className="glass"
                style={{ 
                  padding: '1.5rem', borderRadius: '1.5rem', cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <div style={{ color: app.color }}>{app.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app.label}</div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;
