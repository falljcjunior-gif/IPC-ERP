import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Plus, Star, Clock, CheckCircle2, FileText, Users, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

const ProcurementHub = () => {
  const { data, formatCurrency } = useStore();
  const [activeTab, setActiveTab] = useState('tenders');

  const tenders = data.procurement?.tenders || [
    { id: 1, title: 'Ciment Portland CEM II - Q3', status: 'Publié', deadline: '2024-06-30', budget: 15000000, responses: 4 },
    { id: 2, title: 'Transport Régional Lot 2024', status: 'En Évaluation', deadline: '2024-05-15', budget: 8500000, responses: 7 },
    { id: 3, title: 'Moules Brique 15x20 (x50)', status: 'Attribué', deadline: '2024-04-20', budget: 3200000, responses: 3 },
  ];

  const suppliers = data.procurement?.suppliers || [
    { id: 1, name: 'CimAfrique SA', score: 92, category: 'Ciment', status: 'Actif', orders: 34 },
    { id: 2, name: 'Trans-Ivoire Logistics', score: 78, category: 'Transport', status: 'Actif', orders: 18 },
    { id: 3, name: 'Agrégats du Sud', score: 85, category: 'Agrégats', status: 'En évaluation', orders: 5 },
  ];

  const statusColor = { 'Publié': '#3B82F6', 'En Évaluation': '#F59E0B', 'Attribué': '#10B981', 'Clôturé': '#6B7280' };

  return (
    <div style={{ padding: '3rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#7C3AED', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
              <ShoppingBag size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#7C3AED', textTransform: 'uppercase' }}>Strategic Sourcing</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0 }}>Appels d'Offres</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sourcing fournisseurs et gestion des marchés.</p>
        </div>
        <SmartButton variant="primary" icon={Plus} onClick={async () => useToastStore.getState().addToast('Nouvel appel d\'offres créé', 'info')}>Créer un AO</SmartButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="AO Actifs" value={tenders.filter(t => t.status !== 'Clôturé').length} icon={<FileText size={20} />} color="#7C3AED" trend="15" trendType="up" sparklineData={[{val:2},{val:3},{val:3}]} />
        <KpiCard title="Fournisseurs" value={suppliers.length} icon={<Users size={20} />} color="#3B82F6" trend="8.4" trendType="up" sparklineData={[{val:5},{val:8},{val:12}]} />
        <KpiCard title="Économies Réalisées" value="12%" icon={<TrendingUp size={20} />} color="#10B981" trend="2.1" trendType="up" sparklineData={[{val:5},{val:9},{val:12}]} />
        <KpiCard title="Délai Moyen" value="14j" icon={<Clock size={20} />} color="#F59E0B" trend="30" trendType="down" sparklineData={[{val:21},{val:18},{val:14}]} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15,23,42,0.03)', padding: '6px', borderRadius: '1.5rem', border: '1px solid var(--border-light)', width: 'fit-content', marginBottom: '2.5rem' }}>
        {[{id:'tenders',label:'Appels d\'Offres',icon:<FileText size={16}/>},{id:'suppliers',label:'Panel Fournisseurs',icon:<Star size={16}/>}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.8rem 1.5rem', borderRadius:'1.25rem', border:'none', cursor:'pointer', fontWeight:700, background: activeTab===t.id?'white':'transparent', color: activeTab===t.id?'#7C3AED':'var(--text-muted)', boxShadow: activeTab===t.id?'var(--shadow-md)':'none' }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
          {activeTab === 'tenders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tenders.map(t => (
                <motion.div key={t.id} whileHover={{x:4}} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.25rem' }}>{t.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Budget: <strong>{formatCurrency(t.budget)}</strong> • Échéance: {t.deadline}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t.responses} réponses</span>
                    <span style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, background: `${statusColor[t.status]}15`, color: statusColor[t.status] }}>{t.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {activeTab === 'suppliers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {suppliers.map(s => (
                <motion.div key={s.id} whileHover={{y:-6}} className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '1rem', background: '#7C3AED15', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={22} /></div>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, background: s.status==='Actif'?'#10B98115':'#F59E0B15', color: s.status==='Actif'?'#10B981':'#F59E0B' }}>{s.status}</span>
                  </div>
                  <h3 style={{ fontWeight: 900, marginBottom: '0.25rem' }}>{s.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{s.category} • {s.orders} commandes</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Score Qualité</span>
                    <span style={{ fontWeight: 900 }}>{s.score}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div initial={{width:0}} animate={{width:`${s.score}%`}} style={{ height: '100%', background: s.score>80?'#10B981':'#F59E0B' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProcurementHub;
