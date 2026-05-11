/**
 * CardSidebar — Colonne droite de la modale de carte
 * Sections : Labels · Membres · Échéance · Champs Custom · Liens ERP
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Users, Calendar, Sliders, Link2,
  Check, X, Plus, ExternalLink,
  Briefcase, User, Factory, FileText, DollarSign,
} from 'lucide-react';

// ── Section générique repliable ──────────────────────────────────

const Section = ({ icon, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '0.25rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: 'none',
          background: 'transparent', cursor: 'pointer', fontWeight: 700,
          fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase',
          letterSpacing: '0.5px', textAlign: 'left',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {React.cloneElement(icon, { size: 13 })}
        {title}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#CBD5E1' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
          >
            <div style={{ paddingBottom: '0.75rem' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Labels ────────────────────────────────────────────────────────

const LabelsSection = ({ card, board, onUpdate }) => {
  const labels = board?.labels || [];
  const selected = new Set(card.labelIds || []);

  const toggle = (labelId) => {
    const next = selected.has(labelId)
      ? [...selected].filter(id => id !== labelId)
      : [...selected, labelId];
    onUpdate({ labelIds: next }, { type: selected.has(labelId) ? 'label_removed' : 'label_added' });
  };

  return (
    <Section icon={<Tag />} title="Étiquettes" defaultOpen={true}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {labels.map(l => (
          <button
            key={l.id}
            onClick={() => toggle(l.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.7rem', borderRadius: '999px', border: 'none',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              background: selected.has(l.id) ? l.color : `${l.color}20`,
              color: selected.has(l.id) ? 'white' : l.color,
              transition: 'all 0.15s',
            }}
          >
            {selected.has(l.id) && <Check size={10} />}
            {l.name}
          </button>
        ))}
      </div>
    </Section>
  );
};

// ── Échéance ──────────────────────────────────────────────────────

const DueDateSection = ({ card, onUpdate }) => {
  const dueDate = card.dueDate
    ? (card.dueDate.toDate ? card.dueDate.toDate() : new Date(card.dueDate.seconds * 1000))
    : null;

  const handleChange = (e) => {
    const val = e.target.value;
    const payload = val
      ? { dueDate: { seconds: Math.floor(new Date(val).getTime() / 1000) } }
      : { dueDate: null };
    onUpdate(payload, { type: val ? 'due_date_set' : 'due_date_removed' });
  };

  const toggleComplete = () => {
    onUpdate({ dueDateComplete: !card.dueDateComplete }, { type: 'due_date_completed' });
  };

  const isOverdue = dueDate && !card.dueDateComplete && dueDate < new Date();

  return (
    <Section icon={<Calendar />} title="Échéance" defaultOpen={true}>
      <input
        type="date"
        defaultValue={dueDate ? dueDate.toISOString().split('T')[0] : ''}
        onChange={handleChange}
        style={{
          width: '100%', padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem', border: '1px solid #E2E8F0',
          fontSize: '0.85rem', outline: 'none', color: '#1E293B',
          boxSizing: 'border-box', marginBottom: '0.5rem',
          background: isOverdue ? '#FEF2F2' : 'white',
        }}
      />
      {dueDate && (
        <button
          onClick={toggleComplete}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: 'none',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            background: card.dueDateComplete ? '#D1FAE5' : '#F1F5F9',
            color: card.dueDateComplete ? '#059669' : '#64748B',
          }}
        >
          {card.dueDateComplete ? <Check size={12} /> : <Calendar size={12} />}
          {card.dueDateComplete ? 'Complète ✓' : 'Marquer comme complète'}
        </button>
      )}
    </Section>
  );
};

// ── Champs Personnalisés (Custom Fields) ──────────────────────────

const CustomFieldsSection = ({ card, board, onUpdate }) => {
  const fields = board?.customFields || [];
  if (fields.length === 0) return null;

  const handleFieldChange = (fieldId, value) => {
    onUpdate({
      customFieldValues: { ...card.customFieldValues, [fieldId]: value },
    }, { type: 'custom_field_updated', meta: { fieldName: fields.find(f => f.id === fieldId)?.name } });
  };

  return (
    <Section icon={<Sliders />} title="Champs Personnalisés">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {fields.map(field => (
          <div key={field.id}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '3px' }}>
              {field.name}
            </label>

            {field.type === 'text' && (
              <input
                defaultValue={card.customFieldValues?.[field.id] || ''}
                onBlur={e => handleFieldChange(field.id, e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                defaultValue={card.customFieldValues?.[field.id] || ''}
                onBlur={e => handleFieldChange(field.id, Number(e.target.value))}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                defaultValue={card.customFieldValues?.[field.id] || ''}
                onChange={e => handleFieldChange(field.id, e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            )}

            {field.type === 'select' && (
              <select
                value={card.customFieldValues?.[field.id] || ''}
                onChange={e => handleFieldChange(field.id, e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">—</option>
                {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {field.type === 'checkbox' && (
              <input
                type="checkbox"
                checked={!!card.customFieldValues?.[field.id]}
                onChange={e => handleFieldChange(field.id, e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#8B5CF6' }}
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
};

// ── Liens ERP ─────────────────────────────────────────────────────

const ERP_MODULES = [
  { module: 'crm',        model: 'leads',      label: 'Piste CRM',         icon: <User size={13} />,       color: '#8B5CF6' },
  { module: 'sales',      model: 'orders',     label: 'Commande Vente',    icon: <Briefcase size={13} />,  color: '#3B82F6' },
  { module: 'hr',         model: 'tasks',      label: 'Collaborateur RH',  icon: <Users size={13} />,      color: '#10B981' },
  { module: 'production', model: 'workOrders', label: 'Ordre de Fab.',     icon: <Factory size={13} />,    color: '#F59E0B' },
  { module: 'finance',    model: 'invoices',   label: 'Facture Finance',   icon: <DollarSign size={13} />, color: '#EF4444' },
  { module: 'projects',   model: 'projects',   label: 'Projet',            icon: <FileText size={13} />,   color: '#6366F1' },
];

const ErpLinksSection = ({ card, uid, onAddLink, onRemoveLink }) => {
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState({ module: 'crm', model: 'leads', entityId: '', label: '' });

  const handleAdd = () => {
    if (!form.entityId.trim() || !form.label.trim()) return;
    const moduleConfig = ERP_MODULES.find(m => m.module === form.module);
    onAddLink({
      module: form.module,
      model: form.model,
      entityId: form.entityId.trim(),
      label: form.label.trim(),
      url: `/${form.module}`,
      color: moduleConfig?.color || '#64748B',
    });
    setForm({ module: 'crm', model: 'leads', entityId: '', label: '' });
    setAdding(false);
  };

  return (
    <Section icon={<Link2 />} title="Liens ERP">
      {/* Liens existants */}
      {(card.linkedEntities || []).map(link => {
        const cfg = ERP_MODULES.find(m => m.module === link.module);
        return (
          <div key={link.entityId} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.6rem', borderRadius: '0.5rem',
            background: `${cfg?.color || '#64748B'}12`,
            border: `1px solid ${cfg?.color || '#64748B'}30`,
            marginBottom: '0.4rem',
          }}>
            <div style={{ color: cfg?.color || '#64748B' }}>{cfg?.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{link.label}</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{cfg?.label || link.module}</div>
            </div>
            <button
              onClick={() => onRemoveLink(link.entityId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* Formulaire d'ajout */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <select
                value={form.module}
                onChange={e => {
                  const cfg = ERP_MODULES.find(m => m.module === e.target.value);
                  setForm(f => ({ ...f, module: e.target.value, model: cfg?.model || '' }));
                }}
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none' }}
              >
                {ERP_MODULES.map(m => <option key={m.module} value={m.module}>{m.label}</option>)}
              </select>
              <input
                value={form.entityId}
                onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))}
                placeholder="ID de l'entité…"
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none' }}
              />
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Libellé affiché…"
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={handleAdd} style={{ flex: 1, padding: '0.4rem', borderRadius: '0.4rem', background: '#8B5CF6', color: 'white', border: 'none', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Lier</button>
                <button onClick={() => setAdding(false)} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.4rem', background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.6rem', borderRadius: '0.5rem',
            background: '#F1F5F9', border: 'none', cursor: 'pointer',
            color: '#64748B', fontSize: '0.78rem', fontWeight: 600,
            width: '100%',
          }}
        >
          <Plus size={12} /> Lier une entité ERP
        </button>
      )}
    </Section>
  );
};

// ── Export ────────────────────────────────────────────────────────

const CardSidebar = ({ card, board, uid, onUpdate, onAddLink, onRemoveLink }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
    <LabelsSection card={card} board={board} onUpdate={onUpdate} />
    <DueDateSection card={card} onUpdate={onUpdate} />
    <CustomFieldsSection card={card} board={board} onUpdate={onUpdate} />
    <ErpLinksSection card={card} uid={uid} onAddLink={onAddLink} onRemoveLink={onRemoveLink} />
  </div>
);

export default CardSidebar;
