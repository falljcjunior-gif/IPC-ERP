import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Shield, ShieldOff, Eye, Pencil,
  Lock, Unlock, Info, CheckCircle2, Zap, Layers, ChevronUp,
  RotateCcw, Copy,
} from 'lucide-react';
import {
  MODULES_REGISTRY, MODULE_CATEGORIES, ACTIONS, ALL_ACTIONS, ACTION_PRESETS,
  ROLE_DEFAULT_PERMISSIONS, applyPreset, getDefaultPermissionsForRole,
} from '../../../schemas/permissions.schema';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const HIERARCHY_LEVELS = [
  { id: 'Director',  label: 'Directeur',  desc: 'Validation + KPIs stratégiques', color: '#8B5CF6' },
  { id: 'Manager',   label: 'Manager',    desc: 'Équipe + Modification + Rapports', color: '#3B82F6' },
  { id: 'Employee',  label: 'Employé',    desc: 'Consultation & Exécution',         color: '#10B981' },
];

const ACTION_META = [
  { key: ACTIONS.VIEW,      label: 'Voir',       short: 'V',  color: '#6366F1' },
  { key: ACTIONS.CREATE,    label: 'Créer',      short: 'C',  color: '#10B981' },
  { key: ACTIONS.EDIT,      label: 'Modifier',   short: 'M',  color: '#F59E0B' },
  { key: ACTIONS.DELETE,    label: 'Supprimer',  short: 'D',  color: '#EF4444' },
  { key: ACTIONS.EXPORT,    label: 'Exporter',   short: 'E',  color: '#0EA5E9' },
  { key: ACTIONS.VALIDATE,  label: 'Valider',    short: 'Val', color: '#8B5CF6' },
  { key: ACTIONS.APPROVE,   label: 'Approuver',  short: 'App', color: '#D97706' },
  { key: ACTIONS.SUPERVISE, label: 'Superviser', short: 'Sup', color: '#EC4899' },
  { key: ACTIONS.ADMIN,     label: 'Administrer',short: 'Adm', color: '#374151' },
];

const PRESET_ROLES = [
  { label: 'Aucun accès',     value: 'none'     },
  { label: 'Lecture seule',   value: 'view'     },
  { label: 'Standard',        value: 'standard' },
  { label: 'Accès total',     value: 'full'     },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CHIP — pill cliquable
// ─────────────────────────────────────────────────────────────────────────────
function ActionChip({ meta, active, disabled, onToggle }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      title={meta.label}
      style={{
        padding: '3px 8px',
        borderRadius: '6px',
        border: `1.5px solid ${active ? meta.color : 'rgba(0,0,0,0.1)'}`,
        background: active ? meta.color : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        fontSize: '0.65rem',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s',
        letterSpacing: '0.02em',
        lineHeight: 1,
        minWidth: 28,
      }}
    >
      {meta.short}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMODULE ROW
// ─────────────────────────────────────────────────────────────────────────────
function SubmoduleRow({ sub, subPerms, moduleEnabled, onToggleAction }) {
  const isEnabled = subPerms?.enabled ?? false;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: '10px',
      background: isEnabled ? 'white' : 'transparent',
      border: '1px solid var(--border)',
      opacity: moduleEnabled ? 1 : 0.4,
      transition: '0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isEnabled
          ? <Unlock size={12} color="#10B981" />
          : <Lock size={12} color="var(--text-muted)" />}
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isEnabled ? 'var(--text)' : 'var(--text-muted)' }}>
          {sub.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {ACTION_META.map(meta => (
          <ActionChip
            key={meta.key}
            meta={meta}
            active={subPerms?.actions?.[meta.key] === true}
            disabled={!moduleEnabled}
            onToggle={() => onToggleAction(sub.id, meta.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE ROW
// ─────────────────────────────────────────────────────────────────────────────
function ModuleRow({ mod, modPerms, onToggleAction, onToggleSubmoduleAction, onPreset }) {
  const [expanded, setExpanded] = useState(false);
  const isEnabled = modPerms?.enabled ?? false;
  const activeActions = ACTION_META.filter(m => modPerms?.actions?.[m.key]).length;
  const activeSubCount = Object.values(modPerms?.submodules || {}).filter(s => s.enabled).length;

  return (
    <div
      style={{
        borderRadius: '14px',
        border: `1.5px solid ${isEnabled ? 'var(--accent)30' : 'var(--border)'}`,
        overflow: 'hidden',
        background: isEnabled ? 'var(--accent)04' : 'var(--bg)',
        transition: '0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
        {/* Toggle expand submodules */}
        {mod.submodules?.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, borderRadius: 6 }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {/* Module label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isEnabled ? 'var(--text)' : 'var(--text-muted)' }}>
              {mod.label}
            </span>
            {isEnabled && (
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, background: 'var(--accent)15', padding: '2px 7px', borderRadius: 20 }}>
                {activeActions} action{activeActions > 1 ? 's' : ''} · {activeSubCount} sous-mod
              </span>
            )}
          </div>
        </div>

        {/* Action chips */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
          {ACTION_META.map(meta => (
            <ActionChip
              key={meta.key}
              meta={meta}
              active={modPerms?.actions?.[meta.key] === true}
              disabled={false}
              onToggle={() => onToggleAction(mod.id, meta.key)}
            />
          ))}
        </div>

        {/* Preset selector */}
        <select
          value=""
          onChange={e => { if (e.target.value) onPreset(mod.id, e.target.value); }}
          style={{
            fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--bg)', color: 'var(--text)', padding: '4px 6px', cursor: 'pointer',
          }}
          title="Appliquer un preset"
        >
          <option value="">Preset…</option>
          {PRESET_ROLES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Submodules accordion */}
      <AnimatePresence>
        {expanded && mod.submodules?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {mod.submodules.map(sub => (
              <SubmoduleRow
                key={sub.id}
                sub={sub}
                subPerms={modPerms?.submodules?.[sub.id]}
                moduleEnabled={isEnabled}
                onToggleAction={(subId, action) => onToggleSubmoduleAction(mod.id, subId, action)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — PermissionMatrix
// ─────────────────────────────────────────────────────────────────────────────
export const PermissionMatrix = ({ permissions = {}, onChange }) => {
  const [activeCategory, setActiveCategory] = useState(MODULE_CATEGORIES[0]);
  const [expandAllCategories, setExpandAllCategories] = useState(false);

  // ── Modules in active category ─────────────────────────────────────────
  const categoryModules = useMemo(
    () => MODULES_REGISTRY.filter(m => m.category === activeCategory),
    [activeCategory]
  );

  // ── Helpers ────────────────────────────────────────────────────────────

  const toggleModuleAction = useCallback((moduleId, action) => {
    const mod = MODULES_REGISTRY.find(m => m.id === moduleId);
    const prev = permissions.modules?.[moduleId] || {
      enabled: false,
      actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, false])),
      submodules: Object.fromEntries((mod?.submodules || []).map(s => [s.id, { enabled: false, actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, false])) }])),
    };
    const newAction = !prev.actions[action];
    // VIEW must be true if any other action is true
    const newActions = { ...prev.actions, [action]: newAction };
    if (action !== ACTIONS.VIEW && newAction) newActions[ACTIONS.VIEW] = true;
    const enabled = Object.values(newActions).some(Boolean);
    // Cascade VIEW to all submodules when enabling, cascade disable when all off
    const newSubmodules = { ...prev.submodules };
    if (action === ACTIONS.VIEW) {
      for (const sub of (mod?.submodules || [])) {
        newSubmodules[sub.id] = {
          ...newSubmodules[sub.id],
          enabled: newAction,
          actions: { ...(newSubmodules[sub.id]?.actions || {}), [ACTIONS.VIEW]: newAction },
        };
      }
    }
    onChange({
      ...permissions,
      modules: {
        ...permissions.modules,
        [moduleId]: { ...prev, enabled, actions: newActions, submodules: newSubmodules },
      },
    });
  }, [permissions, onChange]);

  const toggleSubmoduleAction = useCallback((moduleId, subId, action) => {
    const prev = permissions.modules?.[moduleId];
    if (!prev) return;
    const prevSub = prev.submodules?.[subId] || { enabled: false, actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, false])) };
    const newAction = !prevSub.actions[action];
    const newSubActions = { ...prevSub.actions, [action]: newAction };
    if (action !== ACTIONS.VIEW && newAction) newSubActions[ACTIONS.VIEW] = true;
    const subEnabled = Object.values(newSubActions).some(Boolean);
    onChange({
      ...permissions,
      modules: {
        ...permissions.modules,
        [moduleId]: {
          ...prev,
          submodules: {
            ...prev.submodules,
            [subId]: { enabled: subEnabled, actions: newSubActions },
          },
        },
      },
    });
  }, [permissions, onChange]);

  const applyModulePreset = useCallback((moduleId, preset) => {
    onChange(applyPreset(permissions, moduleId, preset));
  }, [permissions, onChange]);

  const applyRoleTemplate = useCallback((role) => {
    const defaults = getDefaultPermissionsForRole(role);
    onChange({ ...defaults, hierarchy_level: permissions.hierarchy_level || 'Employee' });
  }, [permissions, onChange]);

  const applyPresetToCategory = useCallback((preset) => {
    let updated = { ...permissions };
    for (const mod of categoryModules) {
      updated = applyPreset(updated, mod.id, preset);
    }
    onChange(updated);
  }, [permissions, categoryModules, onChange]);

  // ── Category stats ─────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const cat of MODULE_CATEGORIES) {
      const mods = MODULES_REGISTRY.filter(m => m.category === cat);
      stats[cat] = mods.filter(m => permissions.modules?.[m.id]?.enabled).length;
    }
    return stats;
  }, [permissions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── SECTION 1: NIVEAU HIÉRARCHIQUE ─────────────────────────────── */}
      <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 900 }}>
          <Shield size={18} color="var(--accent)" /> Niveau d'Autorité
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {HIERARCHY_LEVELS.map(level => {
            const isSelected = permissions.hierarchy_level === level.id;
            return (
              <motion.div
                key={level.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ ...permissions, hierarchy_level: level.id })}
                style={{
                  padding: '1rem', borderRadius: '1rem', cursor: 'pointer',
                  border: `2px solid ${isSelected ? level.color : 'var(--border)'}`,
                  background: isSelected ? `${level.color}10` : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: '0.85rem', color: isSelected ? level.color : 'var(--text)' }}>{level.label}</span>
                  {isSelected && <CheckCircle2 size={16} color={level.color} />}
                </div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{level.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: TEMPLATES RAPIDES ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <Zap size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Modèle de rôle :
        </span>
        {[
          { role: 'SUBSIDIARY_DG',   label: 'DG Filiale' },
          { role: 'SUBSIDIARY_RH',   label: 'RH' },
          { role: 'SUBSIDIARY_CFO',  label: 'CFO' },
          { role: 'HR_MANAGER',      label: 'Resp. RH' },
          { role: 'FINANCE',         label: 'Finance' },
          { role: 'SALES',           label: 'Commercial' },
          { role: 'PRODUCTION',      label: 'Production' },
          { role: 'SUBSIDIARY_STAFF',label: 'Employé' },
        ].map(({ role, label }) => (
          <button
            key={role}
            onClick={() => applyRoleTemplate(role)}
            style={{
              padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer', transition: '0.15s',
            }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SECTION 3: LÉGENDE DES ACTIONS ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>Actions :</span>
        {ACTION_META.map(m => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              padding: '2px 7px', borderRadius: 5, background: m.color, color: '#fff',
              fontSize: '0.62rem', fontWeight: 800,
            }}>{m.short}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── SECTION 4: MATRICE PAR CATÉGORIE ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem' }}>

        {/* Sidebar catégories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flexShrink: 0 }}>
          {MODULE_CATEGORIES.map(cat => {
            const count = categoryStats[cat];
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 10,
                  border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent)10' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer', transition: '0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span style={{
                    background: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.62rem', fontWeight: 800,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Module list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Category actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>{activeCategory}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tout :</span>
            {PRESET_ROLES.map(p => (
              <button
                key={p.value}
                onClick={() => applyPresetToCategory(p.value)}
                style={{
                  padding: '3px 10px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', fontSize: '0.68rem', fontWeight: 700,
                  cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {categoryModules.map(mod => (
            <ModuleRow
              key={mod.id}
              mod={mod}
              modPerms={permissions.modules?.[mod.id]}
              onToggleAction={toggleModuleAction}
              onToggleSubmoduleAction={toggleSubmoduleAction}
              onPreset={applyModulePreset}
            />
          ))}
        </div>
      </div>

      {/* ── INFO ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '1.25rem', background: 'var(--accent)08', border: '1px solid var(--accent)20' }}>
        <Info size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <b>Gouvernance :</b> Les droits d'écriture/création incluent automatiquement la lecture.
          Cliquez sur <b>▶</b> pour configurer les sous-modules individuellement.
          Les modèles de rôle (Preset) appliquent les permissions par défaut — vous pouvez ensuite les affiner manuellement.
          Les permissions finales sont vérifiées côté serveur (Firestore Rules) en plus de l'interface.
        </p>
      </div>
    </div>
  );
};

export default PermissionMatrix;
