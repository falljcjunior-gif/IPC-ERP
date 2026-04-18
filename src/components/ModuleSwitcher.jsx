import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ShoppingCart, Package, Briefcase, FileText, CreditCard,
  Users2, Factory, Mail, HardDrive, Truck, Globe, ShoppingBag,
  PenSquare, MessageSquare, Headphones, GraduationCap, UserPlus,
  CalendarClock, ClipboardCheck, Workflow, Radio, PhoneCall,
  BookOpen, MessageCircle
} from 'lucide-react';

const categories = [
  {
    name: 'Finance',
    apps: [
      { id: 'accounting', name: 'Comptabilité', icon: <FileText />, color: '#14B8A6' },
      { id: 'finance', name: 'Facturation & Finance', icon: <CreditCard />, color: '#EC4899' },
      { id: 'expenses', name: 'Notes de frais', icon: <CreditCard />, color: '#F43F5E' },
      { id: 'bi', name: 'Feuilles de calcul (BI)', icon: <Briefcase />, color: '#8B5CF6' },
      { id: 'dms', name: 'Documents', icon: <BookOpen />, color: '#64748B' },
    ]
  },
  {
    name: 'Ventes',
    apps: [
      { id: 'crm', name: 'CRM', icon: <Users />, color: '#3B82F6' },
      { id: 'sales', name: 'Ventes', icon: <ShoppingCart />, color: '#10B981' },
      { id: 'commerce', name: 'PdV / Abonnements / Location', icon: <ShoppingBag />, color: '#F59E0B' },
    ]
  },
  {
    name: 'Sites Web',
    apps: [
      { id: 'website', name: 'Site Web / eCommerce / Blog / Forum', icon: <Globe />, color: '#3B82F6' },
      { id: 'website', name: 'Live Chat', icon: <Headphones />, color: '#06B6D4' },
      { id: 'website', name: 'eLearning', icon: <GraduationCap />, color: '#8B5CF6' },
    ]
  },
  {
    name: "Chaîne d'approvisionnement",
    apps: [
      { id: 'inventory',  name: 'Inventaire',   icon: <Package />,  color: '#EF4444' },
      { id: 'production', name: 'Fabrication',  icon: <Factory />,  color: '#06B6D4' },
      { id: 'purchase',   name: 'Achats',       icon: <HardDrive />,color: '#64748B' },
      { id: 'shipping',   name: 'Logistique',   icon: <Truck />,    color: '#3B82F6' },
      { id: 'projects',   name: 'PLM / Projets',icon: <Briefcase />,color: '#8B5CF6' },
    ]
  },
  {
    name: 'Ressources Humaines',
    apps: [
      { id: 'hr', name: 'Employés', icon: <Users2 />, color: '#F97316' },
      { id: 'talent', name: 'Recrutement / Congés / Évaluations', icon: <UserPlus />, color: '#EC4899' },
    ]
  },
  {
    name: 'Marketing',
    apps: [
      { id: 'marketing', name: 'Marketing Social / Email / SMS', icon: <Mail />, color: '#F59E0B' },
      { id: 'marketing', name: 'Événements / Automation / Sondages', icon: <PenSquare />, color: '#0EA5E9' },
    ]
  },
  {
    name: 'Services',
    apps: [
      { id: 'projects', name: 'Projet', icon: <Briefcase />, color: '#8B5CF6' },
      { id: 'timesheets', name: 'Feuilles de temps', icon: <CalendarClock />, color: '#3B82F6' },
      { id: 'shipping', name: 'Services sur site / Planification / RDV', icon: <Workflow />, color: '#10B981' },
      { id: 'helpdesk', name: 'Assistance', icon: <MessageCircle />, color: '#F97316' },
    ]
  },
  {
    name: 'Productivité',
    apps: [
      { id: 'connect', name: 'Discussion', icon: <MessageSquare />, color: '#8B5CF6' },
      { id: 'workflows', name: 'Validations', icon: <ClipboardCheck />, color: '#22C55E' },
      { id: 'connect', name: 'Internet des Objets', icon: <Radio />, color: '#0EA5E9' },
      { id: 'connect', name: 'VoIP / WhatsApp', icon: <PhoneCall />, color: '#F43F5E' },
      { id: 'dms', name: 'Connaissances', icon: <BookOpen />, color: '#6366F1' },
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
