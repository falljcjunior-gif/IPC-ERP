import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, ChevronRight, MoreVertical, DollarSign, 
  Calendar, User, Tag, Plus, Filter, Search,
  TrendingUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import Chip from '../../marketing/components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const PipelineTab = ({ opportunities, formatCurrency, onOpenDetail }) => {
  const STAGE_COLORS = { 
    'Nouveau': '#64748B', 
    'Qualification': '#3B82F6', 
    'Proposition': '#8B5CF6', 
    'Négociation': '#F59E0B', 
    'Gagné': '#10B981', 
    'Perdu': '#EF4444' 
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher une opportunité..." 
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.9rem' }} />
          </div>
          <button className="glass" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <Filter size={18} /> Filtres
          </button>
        </div>
        <button className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
          <Plus size={20} /> Nouvelle Opportunité
        </button>
      </div>

      {/* Opportunities List - Premium Kanban/List Hybrid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {opportunities.length > 0 ? opportunities.map((opp) => (
          <motion.div 
            key={opp.id} 
            variants={item}
            whileHover={{ x: 10, background: 'var(--bg-subtle)' }}
            onClick={() => onOpenDetail && onOpenDetail('crm', 'opportunities', opp)}
            className="glass" 
            style={{ 
              padding: '1.5rem 2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', 
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 50px', alignItems: 'center', 
              gap: '2rem', cursor: 'pointer', transition: '0.2s'
            }}
          >
            {/* Opp Name & Client */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: `${STAGE_COLORS[opp.etape] || '#64748B'}15`, padding: '12px', borderRadius: '1rem', color: STAGE_COLORS[opp.etape] }}>
                <Briefcase size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{opp.nom}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <User size={12} /> {opp.client || 'Client Inconnu'}
                </div>
              </div>
            </div>

            {/* Amount & Probability */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Valeur Estimée</div>
              <div style={{ fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {formatCurrency(opp.montant, true)}
                <span style={{ fontSize: '0.75rem', color: '#10B981', background: '#10B98115', padding: '2px 6px', borderRadius: '6px' }}>{opp.probabilite}%</span>
              </div>
            </div>

            {/* Stage */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Étape Actuelle</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STAGE_COLORS[opp.etape] }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{opp.etape}</span>
              </div>
            </div>

            {/* Date / Next Action */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Date de Clôture</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--text-muted)" /> {opp.date_fin ? new Date(opp.date_fin).toLocaleDateString() : 'Non planifié'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="glass" style={{ padding: '0.6rem', borderRadius: '0.8rem', border: 'none' }}>
                <MoreVertical size={18} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
             <Briefcase size={48} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
             <p style={{ fontWeight: 800 }}>Aucune opportunité dans le pipeline.</p>
             <button className="btn-primary" style={{ marginTop: '1rem' }}>Ajouter la première</button>
          </div>
        )}
      </div>

      {/* Pipeline Summary Footer */}
      <div className="glass" style={{ display: 'flex', justifyContent: 'space-around', padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)' }}>
        {['Qualification', 'Proposition', 'Négociation', 'Gagné'].map((stage, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: STAGE_COLORS[stage], textTransform: 'uppercase', marginBottom: '0.25rem' }}>{stage}</div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{opportunities.filter(o => o.etape === stage).length}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PipelineTab;
