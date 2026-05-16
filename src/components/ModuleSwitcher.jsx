import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, ShoppingCart, Package, Briefcase, FileText, CreditCard,
  Users2, Factory, Mail, HardDrive, Truck,
  PenSquare, MessageSquare, UserPlus,
  ClipboardCheck, Workflow,
  BookOpen, MessageCircle
} from 'lucide-react';

const categories = [
  {
    name: 'Finance',
    apps: [
      { id: 'accounting', name: 'Comptabilité', icon: <FileText />, color: '#14B8A6' },
      { id: 'finance', name: 'Finance & Facturation', icon: <CreditCard />, color: '#EC4899' },
      { id: 'expenses', name: 'Notes de frais', icon: <CreditCard />, color: '#F43F5E' },
      { id: 'bi', name: 'Business Intelligence', icon: <Briefcase />, color: '#8B5CF6' },
    ]
  },
  {
    name: 'Ventes',
    apps: [
      { id: 'crm', name: 'CRM', icon: <Users />, color: '#3B82F6' },
      { id: 'sales', name: 'Ventes', icon: <ShoppingCart />, color: '#10B981' },
      { id: 'marketing', name: 'Marketing Digital', icon: <Mail />, color: '#F59E0B' },
    ]
  },
  {
    name: "Opérations & Supply Chain",
    apps: [
      { id: 'inventory',  name: 'Stocks & Logistique', icon: <Package />,  color: '#EF4444' },
      { id: 'production', name: 'Production',           icon: <Factory />,  color: '#06B6D4' },
      { id: 'shipping',   name: 'Expéditions',          icon: <Truck />,    color: '#3B82F6' },
      { id: 'quality',    name: 'Qualité & HSE',        icon: <HardDrive />,color: '#64748B' },
      { id: 'fleet',      name: 'Flotte',               icon: <Truck />,    color: '#10B981' },
    ]
  },
  {
    name: 'Ressources Humaines',
    apps: [
      { id: 'hr',      name: 'Employés',                            icon: <Users2 />,  color: '#F97316' },
      { id: 'talent',  name: 'Recrutement / Congés / Évaluations',  icon: <UserPlus />,color: '#EC4899' },
      { id: 'payroll', name: 'Paie & Social',                       icon: <CreditCard />, color: '#8B5CF6' },
    ]
  },
  {
    name: 'Services & Projets',
    apps: [
      { id: 'projects',   name: 'Projets',              icon: <Briefcase />,   color: '#8B5CF6' },
      { id: 'helpdesk',   name: 'Support & Helpdesk',   icon: <MessageCircle />,color: '#F97316' },
      { id: 'legal',      name: 'Juridique',            icon: <ClipboardCheck />,color: '#14B8A6' },
    ]
  },
  {
    name: 'Productivité',
    apps: [
      { id: 'connect',    name: 'Connect Plus',    icon: <MessageSquare />, color: '#8B5CF6' },
      { id: 'dms',        name: 'Documents Cloud', icon: <BookOpen />,      color: '#6366F1' },
      { id: 'signature',  name: 'Signature',       icon: <PenSquare />,     color: '#0EA5E9' },
      { id: 'workflows',  name: 'Workflows',       icon: <Workflow />,      color: '#22C55E' },
    ]
  }
];

const ModuleSwitcher = ({ onSelectApp }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Modules IPC Green Block
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', 
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
