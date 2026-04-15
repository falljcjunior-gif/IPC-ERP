import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Eye, TrendingUp, MousePointer2, MessageSquare, FileText, Users } from 'lucide-react';

const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const KPI = ({ label, value, sub, color, icon }) => (
  <motion.div variants={card} className="glass"
    style={{ padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid ${color}20` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ background: `${color}15`, padding: '10px', borderRadius: '10px', color }}>{icon}</div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{value}</div>
    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.72rem', color, marginTop: '0.2rem' }}>{sub}</div>}
  </motion.div>
);

const StatsTab = ({ campaigns, posts, messages, leads, formatCurrency }) => {
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalDepense = campaigns.reduce((s, c) => s + (c.depense || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
  const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
  const postsPublies = posts.filter(p => p.statut === 'Publié').length;
  const postsProgrammes = posts.filter(p => p.statut === 'Programmé').length;
  const newMessages = messages.filter(m => m.statut === 'Nouveau').length;
  const burnRate = totalBudget > 0 ? ((totalDepense / totalBudget) * 100).toFixed(0) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <KPI label="Budget Campagnes" value={formatCurrency?.(totalBudget) || `${totalBudget.toLocaleString()} FCFA`}
          sub={`Consommé : ${burnRate}%`} color="#6366F1" icon={<Megaphone size={20} />} />
        <KPI label="Reach Total" value={totalReach.toLocaleString()}
          sub={`${campaigns.filter(c => c.statut === 'Active').length} campagne(s) active(s)`} color="#3B82F6" icon={<Eye size={20} />} />
        <KPI label="Conversions" value={totalConversions}
          sub="Leads générés via campagnes" color="#10B981" icon={<TrendingUp size={20} />} />
        <KPI label="Posts Publiés" value={postsPublies}
          sub={`${postsProgrammes} programmés`} color="#F59E0B" icon={<FileText size={20} />} />
        <KPI label="Messages Entrants" value={messages.length}
          sub={`${newMessages} non lus`} color="#EC4899" icon={<MessageSquare size={20} />} />
        <KPI label="Leads CRM" value={leads.length}
          sub="Contacts qualifiés" color="#8B5CF6" icon={<Users size={20} />} />
      </div>

      {/* Campaign Summary Table */}
      <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Résumé des Campagnes</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Campagne', 'Canal', 'Budget', 'Dépensé', 'Reach', 'Conversions', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Aucune campagne. Créez-en une depuis l'onglet Campagnes.
              </td></tr>
            ) : campaigns.map((c, i) => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)' }}>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, fontSize: '0.85rem' }}>{c.nom}</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.canal}</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>{(c.budget || 0).toLocaleString()}</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>{(c.depense || 0).toLocaleString()}</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>{(c.reach || 0).toLocaleString()}</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>{c.conversions || 0}</td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                    background: c.statut === 'Active' ? '#10B98120' : c.statut === 'Terminée' ? '#6366F120' : '#F59E0B20',
                    color: c.statut === 'Active' ? '#10B981' : c.statut === 'Terminée' ? '#6366F1' : '#F59E0B' }}>
                    {c.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default StatsTab;
