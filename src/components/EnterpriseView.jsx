import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Layers, List as ListIcon, 
  Grid as KanbanIcon, PieChart as GraphIcon, 
  ChevronRight, MoreVertical, Download, 
  ArrowUpRight, Target, Users, DollarSign
} from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import ViewSwitcher from './ViewSwitcher';
import AdvancedSearch from './AdvancedSearch';
import KanbanBoard from './KanbanBoard';
import { groupData } from '../utils/GroupingHelper';

/**
 * EnterpriseView
 * A generic Odoo-style view engine driven by JSON schemas.
 * Replaces hardcoded layouts with a standardized, data-driven experience.
 */
const EnterpriseView = ({ 
  moduleId, 
  modelId, 
  schema, 
  onOpenDetail 
}) => {
  const { t } = useTranslation();
  const addRecord = useStore(s => s.addRecord);
  const deleteRecord = useStore(s => s.deleteRecord);
  const updateRecord = useStore(s => s.updateRecord);
  const formatCurrency = useStore(s => s.formatCurrency);
  const schemaOverrides = useStore(s => s.schemaOverrides);
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  // Merge base schema with potential Studio overrides
  const modelSchema = useMemo(() => {
    if (!schema || !schema.models || !schema.models[modelId]) return null;
    const base = schema.models[modelId];
    const overrides = (schemaOverrides || {})[`${moduleId}.${modelId}`];
    if (!overrides) return base;
    return { ...base, ...overrides };
  }, [schema, modelId, moduleId, schemaOverrides]);

  // Robust data resolution (Standard: data[moduleId][modelId] | Custom: data[path...])
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  if (!modelSchema) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444', fontWeight: 600 }}>Vue indisponible : le modèle {modelId} n'existe pas dans le schéma {moduleId}.</div>;
  }

  // --- RBAC Field Logic ---
  const ROLE_HIERARCHY = { 'GUEST': 0, 'EMPLOYEE': 1, 'MANAGER': 2, 'ADMIN': 3, 'SUPER_ADMIN': 4 };
  const userRolePath = useStore(state => state.userRole);
  const userRoleWeight = ROLE_HIERARCHY[userRolePath] ?? 0;
  
  const isFieldVisible = (fieldSchema) => {
    if (!fieldSchema) return false;
    if (fieldSchema.hidden) return false;
    if (fieldSchema.readAccessRule) {
      if (typeof fieldSchema.readAccessRule === 'string' && ROLE_HIERARCHY[fieldSchema.readAccessRule] > userRoleWeight) return false;
    }
    return true;
  };

  const dataPath = modelSchema.dataPath || `${moduleId}.${modelId}`;

  // [AUDIT] Optimisation: Sélecteur ciblé pour éviter les re-renders globaux
  const _rawData = useStore(useCallback(state => {
    return getNestedValue(state.data, dataPath);
  }, [dataPath]));
  const rawData = Array.isArray(_rawData) ? _rawData : [];

  // 2. Filter & Search Logic
  const processedData = useMemo(() => {
    let result = [...rawData];
    
    // Global Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.keys(modelSchema.fields || {}).some(fieldKey => {
          const field = modelSchema.fields[fieldKey];
          if (!field?.search) return false;
          return String(item[fieldKey] || '').toLowerCase().includes(q);
        });
      });
    }

    // Schema-defined Filters (Simplified domain filtering)
    const filtersToApply = [...activeFilters];
    
    // Apply static domain if defined in schema
    const evaluateDomain = (data, domain) => {
       let res = [...data];
       domain.forEach(([field, op, val]) => {
          if (op === '==') res = res.filter(r => r[field] === val);
          if (op === '!=') res = res.filter(r => r[field] !== val);
          if (op === '>=') res = res.filter(r => r[field] >= val);
          if (op === '<=') res = res.filter(r => r[field] <= val);
       });
       return res;
    };

    if (modelSchema.staticDomain) {
       result = evaluateDomain(result, modelSchema.staticDomain);
    }

    activeFilters.forEach(filterId => {
      const filter = modelSchema?.views?.search?.filters?.find(f => f.id === filterId);
      if (filter && filter.domain) {
        result = evaluateDomain(result, filter.domain);
      }
    });

    return result;
  }, [rawData, searchTerm, activeFilters, modelSchema]);

  // 3. Grouping Logic
  const groupedData = useMemo(() => {
    if (!activeGroup) return null;
    return groupData(processedData, activeGroup);
  }, [processedData, activeGroup]);

  // Renderers
  const renderList = () => {
    const columns = modelSchema?.views?.list || Object.keys(modelSchema?.fields || {});

    const renderRow = (item) => (
      <tr 
        key={item.id} 
        onClick={() => onOpenDetail(item, moduleId, modelId)}
        className="glass-hover"
        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: '0.2s' }}
      >
        {columns.map(col => {
          const field = modelSchema?.fields?.[col];
          let value = item[col];
          
          // Formatter based on schema type
          if (field.type === 'money') value = formatCurrency(value);
          if (field.type === 'selection') {
            let color = 'var(--text-muted)';
            const lowerVal = String(value).toLowerCase();
            if (['gagné', 'validé', 'approuvé', 'terminé', 'payé'].includes(lowerVal)) color = '#10B981';
            else if (['annulé', 'refusé', 'échec', 'retard'].includes(lowerVal)) color = '#EF4444';
            else if (['en cours', 'nouveau', 'brouillon', 'ouvert', 'signé'].includes(lowerVal)) color = '#3B82F6';
            else if (['en attente', 'pause', 'négociation'].includes(lowerVal)) color = '#F59E0B';

            value = <span style={{ padding: '4px 10px', borderRadius: '6px', background: `${color}15`, color, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{value}</span>;
          }

          return (
            <td key={col} style={{ padding: '1rem', fontSize: '0.9rem' }}>
              {value}
            </td>
          );
        })}
        <td style={{ padding: '1rem', textAlign: 'right' }}>
           <ChevronRight size={16} color="var(--text-muted)" />
        </td>
      </tr>
    );

    return (
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--nexus-border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--nexus-border)' }}>
              {columns.map(col => (
                <th key={col} style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t(modelSchema.fields?.[col]?.label || col)}
                </th>
              ))}
              <th style={{ width: '50px' }} />
            </tr>
          </thead>
          <tbody>
            {activeGroup && groupedData ? (
              Object.entries(groupedData).map(([groupTitle, items]) => (
                <React.Fragment key={groupTitle}>
                   <tr style={{ background: 'var(--bg-subtle)', fontWeight: 800, fontSize: '0.8rem' }}>
                      <td colSpan={columns.length + 1} style={{ padding: '0.75rem 1rem', color: 'var(--accent)' }}>
                         {groupTitle} ({items.length})
                      </td>
                   </tr>
                   {items.map(renderRow)}
                </React.Fragment>
              ))
            ) : (
              processedData.map(renderRow)
            )}
          </tbody>
        </table>
        {processedData.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
             Aucun enregistrement trouvé.
          </div>
        )}
      </div>
    );
  };

  const renderKanban = () => {
    if (!modelSchema.views?.kanban) return <div style={{ padding: '2rem', opacity: 0.6 }}>Vue Kanban non configurée.</div>;
    const config = modelSchema?.views?.kanban;
    
    // Dynamically get columns from the group field options
    const groupField = modelSchema?.fields?.[config?.groupField];
    const columns = groupField ? groupField.options : ['Nouveau', 'En cours', 'Fait'];

    return (
      <KanbanBoard 
        items={processedData}
        columns={columns}
        columnMapping={config.groupField}
        onItemClick={(item) => onOpenDetail(item, moduleId, modelId)}
        onMove={(item, newColumn) => {
          updateRecord(modelSchema.dataPath ? modelSchema.dataPath.split('.')[0] : moduleId, modelSchema.dataPath ? modelSchema.dataPath.split('.')[1] : modelId, item.id, { [config.groupField]: newColumn });
        }}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Action Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
         <AdvancedSearch 
           filters={modelSchema.views?.search?.filters || []}
           groups={modelSchema.views?.search?.groups || []}
           onFilterChange={setActiveFilters}
           onGroupChange={(g) => setActiveGroup(g)}
           onSearch={setSearchTerm}
         />
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ViewSwitcher 
              active={viewMode} 
              onChange={setViewMode} 
              options={[
                { id: 'list', icon: <ListIcon size={18} /> },
                { id: 'kanban', icon: <KanbanIcon size={18} /> }
              ]} 
            />
            <button 
              onClick={() => onOpenDetail(null, moduleId, modelId)}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 700 }}
            >
              <Plus size={18} /> Nouveau
            </button>
         </div>
      </header>

      {/* Breadcrumbs / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{modelSchema?.label || 'Chargement...'}</span>
         <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {processedData?.length || 0} items</span>
      </div>

      {/* Main Content */}
      <motion.div
        key={`${viewMode}-${activeGroup}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === 'list' ? renderList() : renderKanban()}
      </motion.div>
    </div>
  );
};

export default EnterpriseView;
