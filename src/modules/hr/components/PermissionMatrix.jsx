import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronRight, Shield, ShieldOff, Eye, Pencil, 
  Lock, Unlock, Info, CheckCircle2, AlertCircle
} from 'lucide-react';

/**
 * 🏛️ NEXUS OS: GOVERNANCE MATRIX
 * A high-precision permission management component.
 */

const HIERARCHY_LEVELS = [
  { id: 'Director', label: 'Directeur de Département', desc: 'Accès total + Validation + KPIs Stratégiques', color: '#8B5CF6' },
  { id: 'Manager', label: 'Responsable (Manager)', desc: 'Gestion d\'équipe + Modification + Rapports', color: '#3B82F6' },
  { id: 'Employee', label: 'Employé', desc: 'Consultation & Exécution des tâches assignées', color: '#10B981' }
];

const MODULE_STRUCTURE = [
  {
    id: 'admin',
    label: 'ADMINISTRATION',
    desc: 'Configuration, Logs & Sécurité',
    subTabs: [
      { id: 'config', label: 'Hub de Configuration' },
      { id: 'logs', label: 'Logs de Sécurité' },
      { id: 'roles', label: 'Gestion des Rôles' }
    ]
  },
  {
    id: 'finance',
    label: 'FINANCE & COMPTABILITÉ',
    desc: 'Trésorerie, Facturation & Budgets',
    subTabs: [
      { id: 'invoices', label: 'Facturation (Vente)' },
      { id: 'expenses', label: 'Notes de frais' },
      { id: 'budgets', label: 'Budgets' },
      { id: 'bank', label: 'Rapprochement Bancaire' }
    ]
  },
  {
    id: 'hr',
    label: 'RESSOURCES HUMAINES',
    desc: 'Capital Humain & Paie',
    subTabs: [
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'payroll', label: 'Paie' },
      { id: 'contracts', label: 'Contrats' },
      { id: 'performance', label: 'Évaluations Performance' }
    ]
  },
  {
    id: 'logistics',
    label: 'LOGISTIQUE & FLOTTE',
    desc: 'Stocks, Livraisons & Flotte',
    subTabs: [
      { id: 'inventory', label: 'Gestion des Stocks' },
      { id: 'fleet', label: 'Suivi des Véhicules' },
      { id: 'maintenance', label: 'Entretien' },
      { id: 'shipping', label: 'Livraisons' }
    ]
  },
  {
    id: 'crm',
    label: 'CRM & MARKETING',
    desc: 'Leads, Campagnes & Conversion',
    subTabs: [
      { id: 'leads', label: 'Leads (Prospects)' },
      { id: 'campaigns', label: 'Campagnes' },
      { id: 'conversion', label: 'Analyse de Conversion' }
    ]
  }
];

export const PermissionMatrix = ({ permissions, onChange }) => {
  const [expandedModule, setExpandedModule] = useState(null);

  const handleLevelChange = (level) => {
    onChange({ ...permissions, hierarchy_level: level });
  };

  const toggleModuleAccess = (modId, access) => {
    const newModules = { ...(permissions.modules || {}) };
    if (access === 'none') {
      delete newModules[modId];
    } else {
      newModules[modId] = {
        ...newModules[modId],
        access,
        subTabs: newModules[modId]?.subTabs || {}
      };
    }
    onChange({ ...permissions, modules: newModules });
  };

  const toggleSubTab = (modId, tabId) => {
    const newModules = { ...(permissions.modules || {}) };
    if (!newModules[modId]) return;
    
    const currentSubTabs = { ...(newModules[modId].subTabs || {}) };
    currentSubTabs[tabId] = !currentSubTabs[tabId];
    
    newModules[modId] = {
      ...newModules[modId],
      subTabs: currentSubTabs
    };
    onChange({ ...permissions, modules: newModules });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── SECTION 1: HIÉRARCHIE ── */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 900 }}>
          <Shield size={20} color="var(--accent)" /> Niveau d'Autorité (Hierarchy)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {HIERARCHY_LEVELS.map(level => {
            const isSelected = permissions.hierarchy_level === level.id;
            return (
              <motion.div
                key={level.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLevelChange(level.id)}
                style={{ 
                  padding: '1.25rem', borderRadius: '1.25rem', cursor: 'pointer',
                  border: `2px solid ${isSelected ? level.color : 'rgba(0,0,0,0.05)'}`,
                  background: isSelected ? `${level.color}08` : 'transparent',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 900, color: isSelected ? level.color : 'var(--text)', fontSize: '0.9rem' }}>{level.label}</span>
                  {isSelected && <CheckCircle2 size={18} color={level.color} />}
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{level.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: MATRICE GRANULAIRE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 900 }}>
          <Lock size={20} color="var(--accent)" /> Gouvernance par Module
        </h3>
        
        {MODULE_STRUCTURE.map(mod => {
          const isExpanded = expandedModule === mod.id;
          const modPerms = permissions.modules?.[mod.id] || { access: 'none', subTabs: {} };
          const activeSubTabs = Object.values(modPerms.subTabs || {}).filter(Boolean).length;
          
          return (
            <div key={mod.id} className="glass" style={{ borderRadius: '1.25rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Module Header */}
              <div 
                style={{ 
                  padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: modPerms.access !== 'none' ? 'rgba(0,0,0,0.02)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: modPerms.access !== 'none' ? 'var(--accent)10' : 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: modPerms.access !== 'none' ? 'var(--accent)' : 'var(--text-muted)'
                  }}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{mod.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {modPerms.access === 'none' ? 'Accès non autorisé' : `${modPerms.access === 'read' ? 'Lecture seule' : 'Lecture/Écriture'} • ${activeSubTabs} sous-onglet(s)`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg)', padding: '4px', borderRadius: '0.75rem', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleModuleAccess(mod.id, 'none')}
                    style={{ 
                      padding: '0.5rem 0.75rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                      background: modPerms.access === 'none' ? '#EF4444' : 'transparent',
                      color: modPerms.access === 'none' ? 'white' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    <ShieldOff size={14} /> Aucun
                  </button>
                  <button 
                    onClick={() => toggleModuleAccess(mod.id, 'read')}
                    style={{ 
                      padding: '0.5rem 0.75rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                      background: modPerms.access === 'read' ? 'var(--accent)' : 'transparent',
                      color: modPerms.access === 'read' ? 'white' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    <Eye size={14} /> Lecture
                  </button>
                  <button 
                    onClick={() => toggleModuleAccess(mod.id, 'write')}
                    style={{ 
                      padding: '0.5rem 0.75rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                      background: modPerms.access === 'write' ? '#10B981' : 'transparent',
                      color: modPerms.access === 'write' ? 'white' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    <Pencil size={14} /> Écriture
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Accordion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}
                  >
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {mod.subTabs.map(tab => {
                        const isEnabled = modPerms.subTabs?.[tab.id];
                        const isDisabled = modPerms.access === 'none';
                        
                        return (
                          <div 
                            key={tab.id}
                            onClick={() => !isDisabled && toggleSubTab(mod.id, tab.id)}
                            style={{ 
                              padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)',
                              background: isEnabled ? 'white' : 'transparent',
                              opacity: isDisabled ? 0.3 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              boxShadow: isEnabled ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                              transition: '0.2s'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isEnabled ? 'var(--text)' : 'var(--text-muted)' }}>{tab.label}</span>
                            {isEnabled ? <Unlock size={14} color="#10B981" /> : <Lock size={14} color="var(--text-muted)" />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── INFO BOX ── */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--accent)08', border: '1px solid var(--accent)20' }}>
        <Info size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <b>Note sur la Gouvernance :</b> Les droits d'écriture incluent automatiquement les droits de lecture. 
          Les Directeurs peuvent outrepasser certaines restrictions de sous-onglets pour la validation finale.
        </p>
      </div>
    </div>
  );
};

