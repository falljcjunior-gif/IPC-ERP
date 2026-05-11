/**
 * ButlerPanel — Board-level automation rules manager
 *
 * Displays existing Butler rules for the active board and lets users:
 *   • Toggle rules on/off
 *   • Delete rules
 *   • Create new rules (trigger + conditions + actions)
 *   • Test-fire a rule against a card
 *
 * Rules are stored in missions_boards/{boardId}/butler_rules/{ruleId}
 * and evaluated server-side by Cloud Functions (missions_butler.js).
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, Trash2, Play, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Clock, ArrowRight,
  DollarSign, Users, Bell, Tag, CalendarDays,
  X, Check, RefreshCw,
} from 'lucide-react';
import { MissionsFS } from '../services/missions.firestore';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const TRIGGER_TYPES = [
  { value: 'card_moved',   label: 'Carte déplacée',   icon: <ArrowRight size={13} /> },
  { value: 'card_created', label: 'Carte créée',       icon: <Plus size={13} /> },
];

const ACTION_TYPES = [
  { value: 'assign_member',          label: 'Assigner un membre',          icon: <Users size={13} />,       color: '#10B981' },
  { value: 'set_due_date',           label: 'Définir une échéance',         icon: <CalendarDays size={13} />, color: '#3B82F6' },
  { value: 'add_label',              label: 'Ajouter une étiquette',        icon: <Tag size={13} />,          color: '#F59E0B' },
  { value: 'move_to_list',           label: 'Déplacer vers une liste',      icon: <ArrowRight size={13} />,   color: '#8B5CF6' },
  { value: 'create_finance_invoice', label: 'Créer une facture Finance',    icon: <DollarSign size={13} />,   color: '#EF4444' },
  { value: 'create_hr_task',         label: 'Créer une tâche RH',           icon: <Users size={13} />,        color: '#0D9488' },
  { value: 'notify',                 label: 'Envoyer une notification',     icon: <Bell size={13} />,         color: '#6366F1' },
];

const CRON_JOBS = [
  { name: 'Scan des échéances',     schedule: 'Quotidien 08:00',   desc: 'Flagge les cartes en retard et notifie les membres.' },
  { name: 'Rapport hebdomadaire',   schedule: 'Lundi 07:00',       desc: 'Agrège les stats de chaque tableau sur 7 jours.' },
  { name: 'Reset isDueSoon',        schedule: 'Quotidien minuit',  desc: 'Nettoie les flags d\'alerte échéance imminente.' },
];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const pill = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 8px', borderRadius: '999px',
  background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700,
});

const inputStyle = {
  width: '100%', padding: '0.45rem 0.75rem',
  borderRadius: '0.5rem', border: '1px solid #E2E8F0',
  fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#1E293B',
};

// ─────────────────────────────────────────────────────────────────
// ACTION FORM — rendered for each action in the rule builder
// ─────────────────────────────────────────────────────────────────

function ActionForm({ action, index, onChange, onRemove }) {
  const meta = ACTION_TYPES.find(a => a.value === action.type) || ACTION_TYPES[0];

  return (
    <div style={{
      background: '#F8FAFC', borderRadius: '0.625rem',
      border: `1px solid ${meta.color}30`,
      padding: '0.65rem 0.75rem', marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={pill(meta.color)}>{meta.icon} {meta.label}</span>
        <button
          onClick={() => onRemove(index)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}
        >
          <X size={12} />
        </button>
      </div>

      {action.type === 'assign_member' && (
        <input
          style={inputStyle}
          placeholder="UID du membre…"
          value={action.memberId || ''}
          onChange={e => onChange(index, { ...action, memberId: e.target.value })}
        />
      )}

      {action.type === 'set_due_date' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="number" min={1} max={365}
            style={{ ...inputStyle, width: '80px' }}
            value={action.daysFromNow || 7}
            onChange={e => onChange(index, { ...action, daysFromNow: Number(e.target.value) })}
          />
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>jours à partir de maintenant</span>
        </div>
      )}

      {action.type === 'add_label' && (
        <input
          style={inputStyle}
          placeholder="ID de l'étiquette…"
          value={action.labelId || ''}
          onChange={e => onChange(index, { ...action, labelId: e.target.value })}
        />
      )}

      {action.type === 'move_to_list' && (
        <input
          style={inputStyle}
          placeholder="Nom exact de la liste…"
          value={action.listName || ''}
          onChange={e => onChange(index, { ...action, listName: e.target.value })}
        />
      )}

      {action.type === 'create_finance_invoice' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number" min={0}
            style={{ ...inputStyle, width: '130px' }}
            placeholder="Montant (XOF)"
            value={action.amount || ''}
            onChange={e => onChange(index, { ...action, amount: Number(e.target.value) })}
          />
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Brouillon automatique</span>
        </div>
      )}

      {action.type === 'create_hr_task' && (
        <select
          style={inputStyle}
          value={action.taskType || 'evaluation'}
          onChange={e => onChange(index, { ...action, taskType: e.target.value })}
        >
          {['evaluation', 'formation', 'entretien', 'onboarding', 'autre'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      )}

      {action.type === 'notify' && (
        <>
          <input
            style={{ ...inputStyle, marginBottom: '0.35rem' }}
            placeholder="Titre de la notification…"
            value={action.title || ''}
            onChange={e => onChange(index, { ...action, title: e.target.value })}
          />
          <input
            style={inputStyle}
            placeholder="UID du destinataire…"
            value={action.userId || ''}
            onChange={e => onChange(index, { ...action, userId: e.target.value, userIds: [e.target.value] })}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RULE CARD — displays one existing rule
// ─────────────────────────────────────────────────────────────────

function RuleCard({ rule, boardId, onToggle, onDelete, onTest }) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testCardId, setTestCardId] = useState('');

  const triggerMeta = TRIGGER_TYPES.find(t => t.value === rule.trigger?.type);

  const handleTest = async () => {
    if (!testCardId.trim()) return;
    setTesting(true);
    try {
      const res = await MissionsFS.executeButlerRule(boardId, rule.id, testCardId.trim());
      alert(`✅ ${res.actionsExecuted} action(s) exécutée(s).`);
    } catch (e) {
      alert(`❌ Erreur : ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      background: 'white', borderRadius: '0.875rem',
      border: rule.active ? '1px solid #E2E8F0' : '1px dashed #E2E8F0',
      marginBottom: '0.6rem', overflow: 'hidden',
      opacity: rule.active ? 1 : 0.6,
      transition: 'opacity 0.2s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', cursor: 'pointer',
      }}
        onClick={() => setExpanded(o => !o)}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: rule.active ? '#8B5CF620' : '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: rule.active ? '#8B5CF6' : '#94A3B8', flexShrink: 0,
        }}>
          <Zap size={14} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
            {rule.name || 'Règle sans nom'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {triggerMeta?.label || rule.trigger?.type} →{' '}
            {(rule.actions || []).map(a => ACTION_TYPES.find(t => t.value === a.type)?.label || a.type).join(', ')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
          {/* Toggle */}
          <button
            onClick={e => { e.stopPropagation(); onToggle(rule); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.active ? '#10B981' : '#CBD5E1' }}
            title={rule.active ? 'Désactiver' : 'Activer'}
          >
            {rule.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(rule.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} color="#CBD5E1" /> : <ChevronDown size={14} color="#CBD5E1" />}
        </div>
      </div>

      {/* Expanded detail + test */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid #F1F5F9' }}
          >
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748B' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Déclencheur :</strong> {triggerMeta?.label}
                {rule.trigger?.conditions?.toListName && (
                  <span> → liste <strong>"{rule.trigger.conditions.toListName}"</strong></span>
                )}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Actions :</strong>{' '}
                {(rule.actions || []).map((a, i) => (
                  <span key={i} style={{ ...pill(ACTION_TYPES.find(t => t.value === a.type)?.color || '#64748B'), marginRight: '4px' }}>
                    {ACTION_TYPES.find(t => t.value === a.type)?.label || a.type}
                  </span>
                ))}
              </div>

              {/* Manual test */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, flex: 1, fontSize: '0.75rem' }}
                  placeholder="ID de carte pour le test…"
                  value={testCardId}
                  onChange={e => setTestCardId(e.target.value)}
                />
                <button
                  onClick={handleTest}
                  disabled={testing || !testCardId.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
                    background: '#8B5CF6', color: 'white', border: 'none',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    opacity: testing ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {testing ? <RefreshCw size={12} /> : <Play size={12} />}
                  Tester
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RULE BUILDER — form to create a new rule
// ─────────────────────────────────────────────────────────────────

const emptyRule = () => ({
  name:    '',
  trigger: { type: 'card_moved', conditions: {} },
  actions: [],
  active:  true,
});

function RuleBuilder({ boardId, onSaved, onCancel }) {
  const [rule, setRule]     = useState(emptyRule());
  const [saving, setSaving] = useState(false);

  const setTriggerType = (type) =>
    setRule(r => ({ ...r, trigger: { type, conditions: {} } }));

  const setCondition = (key, val) =>
    setRule(r => ({ ...r, trigger: { ...r.trigger, conditions: { ...r.trigger.conditions, [key]: val } } }));

  const addAction = (type) =>
    setRule(r => ({ ...r, actions: [...r.actions, { type }] }));

  const updateAction = (i, a) =>
    setRule(r => { const acts = [...r.actions]; acts[i] = a; return { ...r, actions: acts }; });

  const removeAction = (i) =>
    setRule(r => ({ ...r, actions: r.actions.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!rule.name.trim())            { alert('Donnez un nom à la règle.'); return; }
    if (rule.actions.length === 0)    { alert('Ajoutez au moins une action.'); return; }
    setSaving(true);
    try {
      await MissionsFS.saveButlerRule(boardId, rule);
      onSaved();
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: '#F8FAFC', borderRadius: '0.875rem',
      border: '2px solid #8B5CF6', padding: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1E293B', marginBottom: '0.875rem' }}>
        Nouvelle règle Butler
      </div>

      {/* Nom */}
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '3px' }}>
        Nom de la règle
      </label>
      <input
        style={{ ...inputStyle, marginBottom: '0.875rem' }}
        placeholder="Ex : Auto-facturer en livraison…"
        value={rule.name}
        onChange={e => setRule(r => ({ ...r, name: e.target.value }))}
      />

      {/* Déclencheur */}
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '3px' }}>
        Déclencheur
      </label>
      <select
        style={{ ...inputStyle, marginBottom: '0.5rem' }}
        value={rule.trigger.type}
        onChange={e => setTriggerType(e.target.value)}
      >
        {TRIGGER_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {rule.trigger.type === 'card_moved' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
              Depuis (optionnel)
            </label>
            <input
              style={inputStyle}
              placeholder="Nom de liste source…"
              value={rule.trigger.conditions.fromListName || ''}
              onChange={e => setCondition('fromListName', e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
              Vers (optionnel)
            </label>
            <input
              style={inputStyle}
              placeholder="Nom de liste cible…"
              value={rule.trigger.conditions.toListName || ''}
              onChange={e => setCondition('toListName', e.target.value)}
            />
          </div>
        </div>
      )}

      {rule.trigger.type === 'card_created' && (
        <input
          style={{ ...inputStyle, marginBottom: '0.875rem' }}
          placeholder="ID de liste (optionnel, filtre)…"
          value={rule.trigger.conditions.inListId || ''}
          onChange={e => setCondition('inListId', e.target.value)}
        />
      )}

      {/* Actions */}
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.4rem' }}>
        Actions
      </label>

      {rule.actions.map((a, i) => (
        <ActionForm
          key={i}
          action={a}
          index={i}
          onChange={updateAction}
          onRemove={removeAction}
        />
      ))}

      {/* Add action */}
      <select
        style={{ ...inputStyle, marginBottom: '0.875rem', color: '#94A3B8' }}
        value=""
        onChange={e => { if (e.target.value) addAction(e.target.value); }}
      >
        <option value="" disabled>+ Ajouter une action…</option>
        {ACTION_TYPES.map(a => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#64748B', fontSize: '0.8rem',
          }}
        >
          Annuler
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '0.45rem 1rem', borderRadius: '0.5rem',
            background: '#8B5CF6', color: 'white', border: 'none',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <RefreshCw size={12} /> : <Check size={12} />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BUTLER PANEL — root component
// ─────────────────────────────────────────────────────────────────

const ButlerPanel = ({ boardId }) => {
  const [rules, setRules]       = useState([]);
  const [adding, setAdding]     = useState(false);
  const [report, setReport]     = useState(null);

  useEffect(() => {
    if (!boardId) return;
    const unsub1 = MissionsFS.subscribeButlerRules(boardId, setRules);
    const unsub2 = MissionsFS.subscribeWeeklyReport(boardId, setReport);
    return () => { unsub1(); unsub2(); };
  }, [boardId]);

  const handleToggle = async (rule) => {
    await MissionsFS.saveButlerRule(boardId, { ...rule, active: !rule.active });
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Supprimer cette règle ?')) return;
    await MissionsFS.deleteButlerRule(boardId, ruleId);
  };

  return (
    <div style={{ padding: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '0.625rem',
          background: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={16} color="#8B5CF6" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>Butler Automation</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{rules.length} règle{rules.length !== 1 ? 's' : ''} configurée{rules.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
            padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
            background: '#8B5CF6', color: 'white', border: 'none',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Nouvelle règle
        </button>
      </div>

      {/* Rule builder */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <RuleBuilder
              boardId={boardId}
              onSaved={() => setAdding(false)}
              onCancel={() => setAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules list */}
      {rules.length === 0 && !adding ? (
        <div style={{
          textAlign: 'center', padding: '2rem 1rem',
          color: '#CBD5E1', border: '1.5px dashed #E2E8F0',
          borderRadius: '0.875rem',
        }}>
          <Zap size={28} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Aucune règle configurée</div>
          <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            Créez une règle pour automatiser ce tableau.
          </div>
        </div>
      ) : (
        rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            boardId={boardId}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* CRON section */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '0.75rem',
        }}>
          Tâches automatiques (Cloud CRON)
        </div>
        {CRON_JOBS.map(job => (
          <div key={job.name} style={{
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            padding: '0.6rem 0.75rem', borderRadius: '0.625rem',
            background: '#F8FAFC', border: '1px solid #F1F5F9',
            marginBottom: '0.4rem',
          }}>
            <Clock size={13} color="#8B5CF6" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{job.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{job.schedule} — {job.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly report snapshot */}
      {report && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '0.75rem',
          }}>
            Rapport hebdomadaire
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
          }}>
            {[
              { label: 'Terminées', value: report.stats?.completed, color: '#10B981' },
              { label: 'Créées',    value: report.stats?.created,   color: '#8B5CF6' },
              { label: 'En retard', value: report.stats?.overdue,   color: '#EF4444' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '0.625rem',
                background: `${s.color}10`, borderRadius: '0.625rem',
                border: `1px solid ${s.color}20`,
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: s.color }}>
                  {s.value ?? '—'}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ButlerPanel;
