import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Building2, ArrowLeftRight, Plus, CheckCircle2, DollarSign } from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';

const MultiEntityHub = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useStore();

  // [GO-LIVE] Données réelles uniquement — chargées depuis le store/Firestore.
  // Démarre à vide tant qu'aucune entité ni taux n'est configuré.
  const entities = data?.multiEntity?.entities || [];
  const rates    = data?.multiEntity?.exchangeRates || [];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#2563EB', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
              <Globe size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#2563EB', textTransform: 'uppercase' }}>Multi-Entity Management</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0 }}>Multi-Société & Devises</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Consolidation financière et gestion des filiales internationales.</p>
        </div>
        <SmartButton variant="primary" icon={Plus} onClick={() => onOpenDetail && onOpenDetail(null, 'base', 'entities')}>Ajouter Entité</SmartButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Entités Actives" value={entities.length} icon={<Building2 size={20} />} color="#2563EB" sparklineData={[{val:1},{val:2},{val:3}]} />
        <KpiCard title="Devises Gérées" value="3" icon={<DollarSign size={20} />} color="#059669" sparklineData={[{val:1},{val:2},{val:3}]} />
        <KpiCard title="CA Consolidé" value={formatCurrency(570000000)} icon={<Globe size={20} />} color="#8B5CF6" sparklineData={[{val:350},{val:450},{val:570}]} />
        <KpiCard title="Transactions Inter-Co" value="24" icon={<ArrowLeftRight size={20} />} color="#F59E0B" sparklineData={[{val:10},{val:18},{val:24}]} />
      </div>

      {/* Entities */}
      <h3 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '1.5rem' }}>Périmètre de Consolidation</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {entities.map(e => (
          <motion.div key={e.id} whileHover={{y:-6}} className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem' }}>{e.country}</span>
              <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, background: e.status==='Principal'?'#2563EB15':'#6B728015', color: e.status==='Principal'?'#2563EB':'#6B7280' }}>{e.status}</span>
            </div>
            <h3 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>{e.name}</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563EB' }}>{e.currency === 'XOF' ? formatCurrency(e.revenue) : `€${e.revenue.toLocaleString()}`}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem' }}>Devise: {e.currency}</div>
          </motion.div>
        ))}
      </div>

      {/* Exchange Rates */}
      <h3 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '1.5rem' }}>Taux de Change</h3>
      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {rates.map((r, i) => (
            <div key={i} style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ArrowLeftRight size={20} color="#2563EB" />
              <div>
                <div style={{ fontWeight: 900 }}>{r.from} → {r.to}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563EB' }}>{r.rate}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MAJ: {r.updated}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiEntityHub;
