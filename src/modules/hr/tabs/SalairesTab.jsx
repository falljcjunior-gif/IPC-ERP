import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, TrendingUp, Users, Award,
  Edit3, Clock, X, Check, Loader,
  Filter, Search, ChevronDown, LockKeyhole,
  History, AlertCircle, Wallet
} from 'lucide-react';
import { useStore } from '../../../store';
import { FirestoreService } from '../../../services/firestore.service';
import KpiCard from '../../../components/KpiCard';
import { SALARY_TYPES, CURRENCIES, PAYMENT_MODES } from '../../../schemas/payroll.schema';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n, devise = 'XOF') => {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-FR') + ' ' + devise;
};

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700 }}>{label}</span>
);

// ─── Edit Salary Modal ────────────────────────────────────────────────────────
const EditSalaryModal = ({ salary, onClose, onSave }) => {
  const [form, setForm] = useState({
    salaire_base: salary?.salaire_base || 0,
    devise: salary?.devise || 'XOF',
    type_remuneration: salary?.type_remuneration || 'Mensuel',
    prime_transport: salary?.prime_transport || 0,
    prime_logement: salary?.prime_logement || 0,
    prime_performance: salary?.prime_performance || 0,
    prime_anciennete: salary?.prime_anciennete || 0,
    mode_paiement: salary?.mode_paiement || 'Virement Bancaire',
    banque: salary?.banque || '',
    compte_bancaire: salary?.compte_bancaire || '',
    motif_modification: 'Révision',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '600px', border: '1px solid var(--border)', boxShadow: '0 40px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Modifier la Rémunération</h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '2px 8px', borderRadius: 999, background: '#F59E0B15', color: '#F59E0B', fontSize: '0.65rem', fontWeight: 800 }}>
                <LockKeyhole size={10} /> Confidentiel
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{salary?.employee_nom}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {[
            { name: 'salaire_base', label: 'Salaire de Base', type: 'number' },
            { name: 'devise', label: 'Devise', type: 'select', options: CURRENCIES },
            { name: 'type_remuneration', label: 'Type de Rémunération', type: 'select', options: Object.values(SALARY_TYPES) },
            { name: 'prime_transport', label: 'Prime de Transport', type: 'number' },
            { name: 'prime_logement', label: 'Prime de Logement', type: 'number' },
            { name: 'prime_performance', label: 'Prime de Performance', type: 'number' },
            { name: 'prime_anciennete', label: "Prime d'Ancienneté", type: 'number' },
            { name: 'mode_paiement', label: 'Mode de Paiement', type: 'select', options: PAYMENT_MODES },
            { name: 'banque', label: 'Banque', type: 'text' },
            { name: 'compte_bancaire', label: 'Numéro de Compte', type: 'text' },
            { name: 'motif_modification', label: 'Motif de Modification', type: 'select', options: ['Augmentation', 'Promotion', 'Révision', 'Correction'] },
          ].map(field => (
            <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{field.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.6rem 1rem' }}>
                {field.type === 'select' ? (
                  <select name={field.name} value={form[field.name]} onChange={handleChange} style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange} style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.9rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.9rem', borderRadius: '1rem', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {saving ? <Loader className="spin" size={18} /> : <Check size={18} />}
            {saving ? 'Sauvegarde...' : 'Enregistrer les Modifications'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── History Modal ─────────────────────────────────────────────────────────────
const HistoryModal = ({ employeeId, employeeName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = FirestoreService.subscribeToCollection(
      'compensation_history',
      { filters: [{ field: 'employeeId', op: '==', value: employeeId }], orderByField: 'date_effet', descending: true },
      (docs) => { setHistory(docs); setLoading(false); }
    );
    return () => typeof unsub === 'function' && unsub();
  }, [employeeId]);

  const motifColor = m => ({ Augmentation: '#10B981', Promotion: '#8B5CF6', Révision: '#3B82F6', Correction: '#F59E0B' }[m] || '#64748B');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '560px', border: '1px solid var(--border)', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900 }}>Historique des Rémunérations</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{employeeName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.5rem', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader className="spin" size={32} style={{ margin: '0 auto 1rem' }} />
            <p>Chargement...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Aucun historique disponible.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map(h => (
              <div key={h.id} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Chip label={h.motif} color={motifColor(h.motif)} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.date_effet}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {fmt(h.ancien_salaire)} → <strong style={{ color: h.nouveau_salaire > h.ancien_salaire ? '#10B981' : '#EF4444' }}>{fmt(h.nouveau_salaire)}</strong>
                    </div>
                    {h.approuve_par && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Approuvé par: {h.approuve_par}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {h.nouveau_salaire > h.ancien_salaire ? (
                      <span style={{ color: '#10B981', fontWeight: 900, fontSize: '0.85rem' }}>+{fmt(h.nouveau_salaire - h.ancien_salaire)}</span>
                    ) : (
                      <span style={{ color: '#EF4444', fontWeight: 900, fontSize: '0.85rem' }}>{fmt(h.nouveau_salaire - h.ancien_salaire)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SalairesTab = () => {
  const storeEmployees = useStore(state => state.data.hr?.employees || []);
  const [salaries, setSalaries] = useState([]);
  const [loadingSalaries, setLoadingSalaries] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('Tous');
  const [editTarget, setEditTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  useEffect(() => {
    setLoadingSalaries(true);
    const unsub = FirestoreService.subscribeToCollection(
      'salaries',
      { orderByField: '_createdAt', descending: true, limit: 500 },
      (docs) => { setSalaries(docs); setLoadingSalaries(false); }
    );
    return () => typeof unsub === 'function' && unsub();
  }, []);

  // Merge salary data with employee data for display
  const enriched = useMemo(() => {
    if (salaries.length > 0) return salaries;
    // Fallback: build from employees if no salary docs yet
    return storeEmployees.map(e => ({
      id: e.id,
      employee_id: e.id,
      employee_nom: e.nom,
      poste: e.poste || '—',
      dept: e.dept || e.departement || '—',
      salaire_base: parseFloat(e.salaire) || 0,
      devise: 'XOF',
      type_remuneration: 'Mensuel',
      prime_transport: 0,
      prime_logement: 0,
      prime_performance: 0,
      prime_anciennete: 0,
      mode_paiement: 'Virement Bancaire',
      payroll_status: 'Actif',
    }));
  }, [salaries, storeEmployees]);

  const departments = useMemo(() => {
    const depts = new Set(enriched.map(s => s.dept || s.payroll_group || '—').filter(Boolean));
    return ['Tous', ...Array.from(depts)];
  }, [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter(s => {
      const matchSearch = !search.trim() || (s.employee_nom || '').toLowerCase().includes(search.toLowerCase()) || (s.poste || '').toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'Tous' || s.dept === deptFilter || s.payroll_group === deptFilter;
      return matchSearch && matchDept;
    });
  }, [enriched, search, deptFilter]);

  // KPIs
  const masseSalariale = useMemo(() => filtered.reduce((s, e) => s + (Number(e.salaire_base) || 0), 0), [filtered]);
  const salaireMoyen = filtered.length ? Math.round(masseSalariale / filtered.length) : 0;
  const salaireMax = filtered.length ? Math.max(...filtered.map(e => Number(e.salaire_base) || 0)) : 0;
  const salaireMin = filtered.length ? Math.min(...filtered.map(e => Number(e.salaire_base) || 0)) : 0;

  const primesTotal = s => (Number(s.prime_transport) || 0) + (Number(s.prime_logement) || 0) + (Number(s.prime_performance) || 0) + (Number(s.prime_anciennete) || 0);

  const statusColor = st => ({ Actif: '#10B981', Suspendu: '#F59E0B', Clôturé: '#EF4444' }[st] || '#64748B');

  const handleSave = async (form) => {
    if (!editTarget) return;
    const prev = editTarget.salaire_base;
    const next = parseFloat(form.salaire_base) || 0;
    try {
      await FirestoreService.updateDocument('salaries', editTarget.id, {
        ...form,
        salaire_base: next,
        prime_transport: parseFloat(form.prime_transport) || 0,
        prime_logement: parseFloat(form.prime_logement) || 0,
        prime_performance: parseFloat(form.prime_performance) || 0,
        prime_anciennete: parseFloat(form.prime_anciennete) || 0,
        _updatedAt: new Date().toISOString(),
      });
      // Write compensation history if salary changed
      if (next !== prev && editTarget.id) {
        await FirestoreService.addDocument('compensation_history', {
          employeeId: editTarget.employee_id || editTarget.id,
          employee_nom: editTarget.employee_nom,
          date_effet: new Date().toISOString().split('T')[0],
          ancien_salaire: prev,
          nouveau_salaire: next,
          motif: form.motif_modification || 'Révision',
          approuve_par: 'RH',
          _createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('[SalairesTab] save error:', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Rémunérations & Salaires</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '3px 10px', borderRadius: 999, background: '#F59E0B15', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 800 }}>
              <LockKeyhole size={11} /> Accès RH
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filtered.length} collaborateur{filtered.length > 1 ? 's' : ''} · Gestion des structures salariales
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Masse Salariale" value={fmt(masseSalariale)} icon={<Banknote size={20} />} color="#059669" />
        <KpiCard title="Salaire Moyen" value={fmt(salaireMoyen)} icon={<TrendingUp size={20} />} color="#3B82F6" />
        <KpiCard title="Salaire Maximum" value={fmt(salaireMax)} icon={<Award size={20} />} color="#8B5CF6" />
        <KpiCard title="Salaire Minimum" value={fmt(salaireMin)} icon={<Wallet size={20} />} color="#F59E0B" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', flex: '1 1 200px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un collaborateur..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '1.75rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loadingSalaries ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Loader className="spin" size={40} style={{ marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Chargement des données salariales...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Aucun collaborateur trouvé.</p>
            <p style={{ fontSize: '0.85rem' }}>Ajoutez des employés via le module Onboarding pour voir leurs salaires ici.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['Collaborateur', 'Département', 'Salaire Base', 'Type', 'Total Primes', 'Mode Paiement', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <motion.tr key={s.id || idx}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)', transition: '0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'var(--accent-subtle, #10B98115)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'var(--accent)', flexShrink: 0 }}>
                          {(s.employee_nom || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{s.employee_nom || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.poste || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {s.dept || s.payroll_group || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#059669' }}>
                        {fmt(s.salaire_base, s.devise || 'XOF')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Chip label={s.type_remuneration || 'Mensuel'} color="#3B82F6" />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {fmt(primesTotal(s), s.devise || 'XOF')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {s.mode_paiement || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Chip label={s.payroll_status || 'Actif'} color={statusColor(s.payroll_status)} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setEditTarget(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '5px 12px', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                          <Edit3 size={13} /> Modifier
                        </button>
                        <button onClick={() => setHistoryTarget(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '5px 12px', borderRadius: '0.6rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                          <History size={13} /> Historique
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editTarget && (
          <EditSalaryModal
            salary={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleSave}
          />
        )}
        {historyTarget && (
          <HistoryModal
            employeeId={historyTarget.employee_id || historyTarget.id}
            employeeName={historyTarget.employee_nom}
            onClose={() => setHistoryTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SalairesTab;
