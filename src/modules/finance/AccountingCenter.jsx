import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Calculator, Scale, BookMarked, 
  BookCopy, ShieldCheck, Download
} from 'lucide-react';
import { useStore } from '../../store';
import AccountingTab from './tabs/AccountingTab';

/**
 * AccountingCenter — Module Comptabilité (distinct de Finance)
 * Expose directement le Grand Livre, la Saisie Journal,
 * le Plan de Comptes OHADA et la Balance Générale.
 */
const AccountingCenter = ({ onOpenDetail }) => {
  const { addAccountingEntry, shellView } = useStore();

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <BookOpen size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Ledger & Compliance System
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Comptabilité OHADA
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Centralisez vos écritures comptables et assurez une conformité totale avec le référentiel OHADA via le moteur Nexus.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <ShieldCheck size={24} color="var(--nexus-primary)" />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Validation SSOT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
              </div>
            </div>

            <button 
              className="nexus-card" 
              onClick={() => alert('Export FEC Nexus en cours...')}
              style={{ background: 'white', padding: '1rem', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}
            >
              <Download size={20} color="var(--nexus-secondary)" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Bento Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
        {[
          { icon: <BookCopy size={20} />, label: 'Journal Général', desc: 'Saisie & Flux', color: '#3B82F6', span: 3 },
          { icon: <BookOpen size={20} />, label: 'Grand Livre', desc: 'Analytique Compte', color: 'var(--nexus-primary)', span: 3 },
          { icon: <Scale size={20} />, label: 'Balance Nexus', desc: 'Équilibre Débit/Crédit', color: 'var(--nexus-secondary)', span: 3 },
          { icon: <BookMarked size={20} />, label: 'Plan OHADA', desc: 'Référentiel SYSCOHADA', color: '#F59E0B', span: 3 },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="nexus-card"
            style={{ gridColumn: `span ${k.span}`, padding: '1.5rem', background: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
          >
            <div className="nexus-glow" style={{ background: 'var(--nexus-bg)', padding: '0.75rem', borderRadius: '14px', color: k.color }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>{k.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--nexus-text-muted)' }}>{k.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Core Accounting Component */}
      <div className="nexus-card" style={{ background: 'white', padding: '1rem', minHeight: '600px' }}>
        <AccountingTab onOpenDetail={onOpenDetail} addAccountingEntry={addAccountingEntry} />
      </div>
    </div>
  );
};

export default AccountingCenter;
