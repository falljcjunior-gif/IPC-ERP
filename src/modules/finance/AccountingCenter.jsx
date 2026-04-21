import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Calculator, Scale, BookMarked, 
  BookCopy, ShieldCheck, Download
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';
import AccountingTab from './tabs/AccountingTab';

/**
 * AccountingCenter — Module Comptabilité (distinct de Finance)
 * Expose directement le Grand Livre, la Saisie Journal,
 * le Plan de Comptes OHADA et la Balance Générale.
 */
const AccountingCenter = ({ onOpenDetail }) => {
  const { addAccountingEntry } = useBusiness();

  return (
    <div style={{
      padding: '2.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(16,185,129,0.02) 100%)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366F1', marginBottom: '0.75rem' }}>
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              style={{ background: '#6366F120', padding: '6px', borderRadius: '8px' }}
            >
              <BookOpen size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
              OHADA — Plan Comptable Normalisé
            </span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>
            Comptabilité Générale
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Saisie des écritures, Grand Livre, Balance Générale et Plan de Comptes.
            Chaque écriture doit être équilibrée (Débit = Crédit) avant validation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #6366F130' }}>
            <ShieldCheck size={16} color="#6366F1" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>SSOT — Source Unique Validée</span>
          </div>
          <button
            className="glass"
            style={{ padding: '0.8rem 1.4rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            <Download size={16} /> Exporter FEC
          </button>
        </div>
      </div>

      {/* KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
        {[
          { icon: <BookCopy size={20} />, label: 'Journal Général', desc: 'Saisie & consultation', color: '#6366F1' },
          { icon: <BookOpen size={20} />, label: 'Grand Livre', desc: 'Mouvements par compte', color: '#8B5CF6' },
          { icon: <Scale size={20} />, label: 'Balance', desc: 'Vérification équilibre', color: '#10B981' },
          { icon: <BookMarked size={20} />, label: 'Plan de Comptes', desc: 'Référentiel OHADA', color: '#F59E0B' },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass"
            style={{ padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: `1px solid ${k.color}20` }}
          >
            <div style={{ background: `${k.color}15`, padding: '0.75rem', borderRadius: '1rem', color: k.color }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{k.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Core Accounting Component */}
      <AccountingTab onOpenDetail={onOpenDetail} addAccountingEntry={addAccountingEntry} />
    </div>
  );
};

export default AccountingCenter;
