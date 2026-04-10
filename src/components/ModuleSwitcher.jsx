import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Users2, 
  Settings, 
  LayoutDashboard,
  Factory,
  Mail,
  PieChart,
  HardDrive
} from 'lucide-react';

const categories = [
  {
    name: 'Ventes & Marketing',
    apps: [
      { id: 'crm', name: 'CRM', icon: <Users />, color: '#3B82F6' },
      { id: 'sales', name: 'Ventes', icon: <ShoppingCart />, color: '#10B981' },
      { id: 'marketing', name: 'Marketing', icon: <Mail />, color: '#F59E0B' },
    ]
  },
  {
    name: 'Opérations',
    apps: [
      { id: 'inventory', name: 'Stocks', icon: <Package />, color: '#EF4444' },
      { id: 'projects', name: 'Projets', icon: <Briefcase />, color: '#8B5CF6' },
      { id: 'production', name: 'Production', icon: <Factory />, color: '#06B6D4' },
      { id: 'purchase', name: 'Achats', icon: <HardDrive />, color: '#64748B' },
    ]
  },
  {
    name: 'Finances',
    apps: [
      { id: 'accounting', name: 'Comptabilité', icon: <FileText />, color: '#14B8A6' },
      { id: 'billing', name: 'Facturation', icon: <CreditCard />, color: '#EC4899' },
      { id: 'treasury', name: 'Trésorerie', icon: <PieChart />, color: '#F43F5E' },
    ]
  },
  {
    name: 'Ressources Humaines',
    apps: [
      { id: 'hr', name: 'RH', icon: <Users2 />, color: '#F97316' },
    ]
  }
];

const ModuleSwitcher = ({ onSelectApp }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Applications Axelor
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Sélectionnez une application pour commencer à travailler.</p>
      </div>

      <div style={{ display: 'grid', gap: '3rem' }}>
        {categories.map((cat, idx) => (
          <div key={idx}>
            <h3 style={{ 
              fontSize: '1rem', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.5rem'
            }}>
              {cat.name}
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {cat.apps.map(app => (
                <motion.div
                  key={app.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectApp(app.id)}
                  className="glass"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '1rem',
                    background: `${app.color}15`,
                    color: app.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.cloneElement(app.icon, { size: 28 })}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                    {app.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleSwitcher;
