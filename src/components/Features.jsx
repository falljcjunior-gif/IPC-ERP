import React from 'react';
import { motion } from 'framer-motion';
import { Database, Layout, GitMerge, Zap, BarChart3, Users } from 'lucide-react';

const featureList = [
  {
    icon: <Database size={32} />,
    title: "Smart Data Management",
    desc: "A powerful PostgreSQL-backed architecture with automated schema generation and AI data enrichment."
  },
  {
    icon: <Layout size={32} />,
    title: "Visual Form Builder",
    desc: "Build complex business interfaces in minutes using our XML-based visual drag-and-drop studio."
  },
  {
    icon: <GitMerge size={32} />,
    title: "Seamless Integration",
    desc: "Connect your entire business stack with built-in connectors for CRM, ERP, and 100+ third-party APIs."
  },
  {
    icon: <Zap size={32} />,
    title: "Real-time Auditing",
    desc: "Track every action across your platform with a robust, immutable audit trail for complete transparency."
  },
  {
    icon: <BarChart3 size={32} />,
    title: "Advanced Analytics",
    desc: "Generate stunning reports and dynamic dashboards using our integrated business intelligence engine."
  },
  {
    icon: <Users size={32} />,
    title: "Enterprise IAM",
    desc: "Granular Role-Based Access Control (RBAC) ensuring security and compliance across large organizations."
  }
];

const Features = () => {
  return (
    <section id="features" className="section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            One Platform, <span style={{ color: 'var(--accent)' }}>Infinite Possibilities</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            IPC ERP replaces dozens of isolated tools with a single, unified source of truth for your business.
          </p>
        </div>

        <div className="grid grid-3">
          {featureList.map((f, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className="glass"
              style={{
                padding: '3rem 2rem',
                borderRadius: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                transition: 'var(--transition)'
              }}
            >
              <div style={{
                color: 'var(--accent)',
                background: 'var(--bg)',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
