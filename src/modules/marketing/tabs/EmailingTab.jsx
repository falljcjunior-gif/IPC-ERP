import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Plus, Search, Send, Eye, MousePointerClick, UserMinus,
  CheckCircle2, Clock, FileText, Play, BarChart2, Users, Inbox,
  TrendingUp, ChevronRight, MoreHorizontal
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const TEMPLATES = [
  { id: 'promo', label: 'Promotionnel', color: '#EC4899', icon: '🎯', desc: 'Offres spéciales, remises' },
  { id: 'news', label: 'Newsletter', color: '#3B82F6', icon: '📰', desc: 'Actualités, nouveautés IPC' },
  { id: 'invite', label: 'Invitation', color: '#8B5CF6', icon: '🎟️', desc: 'Événements, salons' },
  { id: 'relance', label: 'Relance', color: '#F59E0B', icon: '🔔', desc: 'Relance prospects, devis' },
  { id: 'welcome', label: 'Bienvenue', color: '#10B981', icon: '👋', desc: 'Onboarding nouveaux clients' },
  { id: 'transac', label: 'Transactionnel', color: '#06B6D4', icon: '📋', desc: 'Confirmation, suivi' },
];

const STATUT_CFG = {
  'Brouillon': { color: '#6B7280', bg: '#6B728015' },
  'Planifié':  { color: '#3B82F6', bg: '#3B82F615' },
  'Envoyé':    { color: '#10B981', bg: '#10B98115' },
  'Partiel':   { color: '#F59E0B', bg: '#F59E0B15' },
  'Annulé':    { color: '#EF4444', bg: '#EF444415' },
};

const EmailingTab = ({ emailings, onNew, onOpenDetail, formatCurrency }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const sent = emailings.reduce((s, e) => s + (e.nbEnvoyes || 0), 0);
  const opens = emailings.reduce((s, e) => s + (e.nbOuvertures || 0), 0);
  const clicks = emailings.reduce((s, e) => s + (e.nbClics || 0), 0);
  const unsubs = emailings.reduce((s, e) => s + (e.nbDesabonnements || 0), 0);
  const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(1) : 0;
  const ctr = opens > 0 ? ((clicks / opens) * 100).toFixed(1) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Global E-mail KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Total Envoyés', value: sent.toLocaleString(), icon: <Send size={20} />, color: '#3B82F6' },
          { label: 'Taux d\'Ouverture', value: `${openRate}%`, icon: <Eye size={20} />, color: '#EC4899', note: 'Objectif: 25%' },
          { label: 'Taux de Clic (CTR)', value: `${ctr}%`, icon: <MousePointerClick size={20} />, color: '#8B5CF6', note: 'Moy. secteur: 3.5%' },
          { label: 'Désabonnements', value: unsubs, icon: <UserMinus size={20} />, color: '#F59E0B' },
        ].map((k, i) => (
          <motion.div key={i} variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: `${k.color}15`, color: k.color, padding: '12px', borderRadius: '1rem' }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: k.color }}>{k.value}</div>
              {k.note && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{k.note}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontWeight: 900 }}>Campagnes E-mailing ({emailings.length})</h3>
        <button onClick={onNew} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, background: '#3B82F6', borderColor: '#3B82F6' }}>
          <Plus size={18} /> Nouvelle Campagne Mail
        </button>
      </div>

      {/* Template Picker */}
      <motion.div variants={item} className="glass" style={{ padding: '1.75rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>📐 Choisir un Template</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {TEMPLATES.map(t => (
            <div key={t.id} onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
              style={{
                padding: '1rem', borderRadius: '1.25rem', cursor: 'pointer', transition: 'all 0.2s',
                border: `2px solid ${selectedTemplate === t.id ? t.color : 'var(--border)'}`,
                background: selectedTemplate === t.id ? `${t.color}10` : 'var(--bg-subtle)'
              }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{t.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: selectedTemplate === t.id ? t.color : 'var(--text)' }}>{t.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
            </div>
          ))}
        </div>
        {selectedTemplate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '1rem', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Template "{TEMPLATES.find(t => t.id === selectedTemplate)?.label}" sélectionné</span>
            <button onClick={onNew} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', background: '#3B82F6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
              Créer avec ce template
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* E-mailing List */}
      {emailings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Mail size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontWeight: 700 }}>Aucune campagne e-mail. Créez votre premier envoi.</p>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 100px', padding: '1rem 2rem', background: 'var(--bg-subtle)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
            <div>Objet / Campagne</div><div>Envoyés</div><div>Ouvert</div><div>Clics</div><div>Date</div><div>Statut</div>
          </div>
          {emailings.map((e, i) => {
            const openPct = e.nbEnvoyes > 0 ? ((e.nbOuvertures || 0) / e.nbEnvoyes * 100).toFixed(1) : '0.0';
            const ctrPct = e.nbOuvertures > 0 ? ((e.nbClics || 0) / e.nbOuvertures * 100).toFixed(1) : '0.0';
            const cfg = STATUT_CFG[e.statut] || {};
            return (
              <motion.div key={e.id || i} whileHover={{ background: 'rgba(59,130,246,0.03)' }}
                onClick={() => onOpenDetail && onOpenDetail(e, 'marketing', 'emailings')}
                style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 100px', padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{e.titre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.template} · {e.liste}</div>
                </div>
                <div style={{ fontWeight: 800 }}>{(e.nbEnvoyes || 0).toLocaleString()}</div>
                <div style={{ fontWeight: 800, color: parseFloat(openPct) > 25 ? '#10B981' : parseFloat(openPct) < 15 ? '#EF4444' : 'var(--text)' }}>{openPct}%</div>
                <div style={{ fontWeight: 800, color: '#8B5CF6' }}>{ctrPct}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.dateEnvoi || '—'}</div>
                <div style={{ padding: '4px 8px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, background: cfg.bg, color: cfg.color, textAlign: 'center' }}>{e.statut}</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default EmailingTab;
