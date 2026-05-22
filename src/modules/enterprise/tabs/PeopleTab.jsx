import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Mail, Phone, Briefcase,
  Search, Filter, Activity, TrendingUp, Award,
  Clock, CheckCircle2, MoreVertical, MapPin,
  Building2, Heart, Plus, Wallet,
  Banknote, X, Check, Loader, LockKeyhole
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import EnterpriseView from '../../../components/EnterpriseView';
import { hrSchema } from '../../../schemas/hr.schema';
import { useStore } from '../../../store';
import { FirestoreService } from '../../../services/firestore.service';
import { useToastStore } from '../../../store/useToastStore';
import { useRBAC, PERMISSIONS } from '../../../utils/RBACGuard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// ─── Salary Quick-Edit Modal ──────────────────────────────────────────────────
const CURRENCIES = ['XOF', 'EUR', 'USD', 'MAD', 'GNF', 'CFA'];
const MOTIFS     = ['Augmentation', 'Promotion', 'Révision', 'Correction', 'Recrutement'];

const SalaryModal = ({ employee, onClose }) => {
  const { addToast } = useToastStore();
  const [form, setForm] = useState({
    salaire_base:       employee._salary?.salaire_base       ?? employee.salaire ?? 0,
    devise:             employee._salary?.devise             ?? 'XOF',
    prime_transport:    employee._salary?.prime_transport    ?? 0,
    prime_logement:     employee._salary?.prime_logement     ?? 0,
    prime_performance:  employee._salary?.prime_performance  ?? 0,
    motif_modification: 'Révision',
  });
  const [saving, setSaving] = useState(false);

  const field = (name, label, type = 'number') => (
    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {type === 'select' ? (
        <select name={name} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
          style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', outline: 'none' }}>
          {(name === 'devise' ? CURRENCIES : MOTIFS).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="number" min="0" name={name} value={form[name]}
          onChange={e => setForm(p => ({ ...p, [name]: parseFloat(e.target.value) || 0 }))}
          style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', outline: 'none' }} />
      )}
    </div>
  );

  const totalBrut = (form.salaire_base || 0) + (form.prime_transport || 0) + (form.prime_logement || 0) + (form.prime_performance || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = employee.id || employee.uid;
      const payload = {
        ...form,
        employee_uid:  uid,
        employee_nom:  employee.nom || employee.profile?.nom || '—',
        updatedAt:     new Date().toISOString(),
        total_brut:    totalBrut,
      };
      // Write to secure hr_private subcollection
      await FirestoreService.setDocument(`users/${uid}/hr_private`, 'salary', payload, true);
      // Mirror salaire_base to public profile for payroll computations
      await FirestoreService.updateDocument('users', uid, { salaire: form.salaire_base });
      // Audit trail
      await FirestoreService.addDocument('compensation_history', {
        employeeId:   uid,
        employee_nom: payload.employee_nom,
        ...form,
        total_brut:   totalBrut,
        date_effet:   new Date().toISOString(),
        modifiedBy:   'HR_ADMIN',
      });
      addToast(`Salaire de ${payload.employee_nom} mis à jour — ${totalBrut.toLocaleString('fr-FR')} ${form.devise}`, 'success');
      onClose();
    } catch (err) {
      addToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.93, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '560px', border: '1px solid var(--border)', boxShadow: '0 40px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <Banknote size={22} color="var(--accent)" />
                <h3 style={{ margin: 0, fontWeight: 900 }}>Rémunération</h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '2px 8px', borderRadius: 999, background: '#F59E0B15', color: '#F59E0B', fontSize: '0.65rem', fontWeight: 800 }}>
                  <LockKeyhole size={10} /> Confidentiel
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {employee.nom || employee.profile?.nom || '—'} · {employee.poste || '—'}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
              <X size={18} />
            </button>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {field('salaire_base',      'Salaire de Base')}
            {field('devise',            'Devise', 'select')}
            {field('prime_transport',   'Prime de Transport')}
            {field('prime_logement',    'Prime de Logement')}
            {field('prime_performance', 'Prime de Performance')}
            {field('motif_modification','Motif', 'select')}
          </div>

          {/* Total */}
          <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '1.25rem', background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', opacity: 0.85 }}>Total Brut</span>
            <span style={{ fontWeight: 900, fontSize: '1.4rem' }}>{totalBrut.toLocaleString('fr-FR')} <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{form.devise}</span></span>
          </div>

          {/* Actions */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '0.9rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 700, cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: '0.9rem', borderRadius: '1rem', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {saving ? <Loader size={18} className="spin" /> : <Check size={18} />}
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const PeopleTab = ({ data, onOpenDetail }) => {
  const { generatePayrollEntry } = useStore();
  const { hasAccess } = useRBAC();
  const [salaryTarget, setSalaryTarget] = useState(null); // employee being edited

  const canEditSalary = hasAccess(PERMISSIONS.MANAGE_FINANCE) ||
    hasAccess(PERMISSIONS.MANAGE_HR) ||
    useStore.getState().userRole === 'SUPER_ADMIN';
  const employees = data?.employees || [];
  
  const stats = useMemo(() => {
    const active = employees.filter(e => e.active !== false).length;
    const formations = employees.reduce((acc, e) => acc + (e.training_completed || 0), 0);
    // Only average employees that actually have a satisfaction score
    const scored = employees.filter(e => e.satisfaction_score != null && e.satisfaction_score > 0);
    const satisfaction = scored.length > 0
      ? Math.round(scored.reduce((acc, e) => acc + e.satisfaction_score, 0) / scored.length)
      : null;
    // Retention: active employees vs total ever hired (exclude if no termination date)
    const retention = employees.length > 0
      ? Math.round((employees.filter(e => e.active !== false && !e.dateDepart).length / employees.length) * 100)
      : null;
    // Skills progression: employees with skills > 0 / total
    const withSkills = employees.filter(e => e.training_completed > 0 || (e.skills?.length > 0)).length;
    const skillsProgression = employees.length > 0 ? Math.round((withSkills / employees.length) * 100) : null;
    // Probation ending soon (within 7 days)
    const now = new Date();
    const probationEndingSoon = employees.filter(e => {
      if (!e.finEssai) return false;
      const end = new Date(e.finEssai);
      const diff = (end - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
    // Training completion for 'production' department
    const prodEmployees = employees.filter(e => e.departement === 'Production' || e.department === 'Production');
    const prodTrained = prodEmployees.filter(e => e.training_completed > 0).length;
    const prodTrainingPct = prodEmployees.length > 0 ? Math.round((prodTrained / prodEmployees.length) * 100) : null;

    return { active, formations, satisfaction, retention, skillsProgression, probationEndingSoon, prodTrainingPct };
  }, [employees]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Human Capital KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Effectif Actif" value={stats.active} icon={<Users size={22} />} color="#0D9488" />
        <KpiCard title="Satisfaction Coll." value={stats.satisfaction !== null ? `${stats.satisfaction}/10` : '—'} icon={<Heart size={22} />} color="#EC4899" />
        <KpiCard title="Formations YTD" value={stats.formations} icon={<Award size={22} />} color="#6366F1" />
        <KpiCard title="Taux d'Absence" value="0%" icon={<Clock size={22} />} color="#F59E0B" />
      </motion.div>

      {/* Directory & Management */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Registre des Collaborateurs</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gérez les profils, les contrats et les compétences de vos équipes.</p>
           </div>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => generatePayrollEntry()} className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '0.85rem', color: '#8B5CF6', border: '1px solid #8B5CF650' }}>
                <Wallet size={18} /> Exécuter la Paie
              </button>
              <button disabled title="Organigramme dynamique — bientôt disponible" className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.5 }}>
                <Building2 size={18} /> Organigramme
              </button>
              <button onClick={() => onOpenDetail && onOpenDetail(null, 'hr', 'employees')} className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#0D9488', borderColor: '#0D9488' }}>
                <UserPlus size={20} /> Nouveau Profil
              </button>
           </div>
        </div>

        <motion.div variants={item}>
           <EnterpriseView
              moduleId="hr"
              modelId="employees"
              schema={hrSchema}
              onOpenDetail={onOpenDetail}
              rowActions={canEditSalary ? (emp) => (
                <button
                  onClick={() => setSalaryTarget(emp)}
                  title="Modifier le salaire"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.85rem', borderRadius: '0.65rem',
                    border: '1px solid var(--accent)', background: 'transparent',
                    color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem',
                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
                >
                  <Banknote size={13} /> Salaire
                </button>
              ) : null}
           />
        </motion.div>

        {/* Salary modal */}
        {salaryTarget && (
          <SalaryModal employee={salaryTarget} onClose={() => setSalaryTarget(null)} />
        )}
      </div>

      {/* Organizational Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem' }}>Alertes RH & Rappels</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '1.25rem', background: '#F59E0B10', border: '1px solid #F59E0B20' }}>
                  <div style={{ color: '#F59E0B' }}><Clock size={20} /></div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                       {stats.probationEndingSoon.length > 0
                         ? `${stats.probationEndingSoon.length} Période${stats.probationEndingSoon.length > 1 ? 's' : ''} d'essai se terminent cette semaine`
                         : 'Aucune période d\'essai imminente'}
                     </div>
                     <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>
                       {stats.probationEndingSoon.length > 0
                         ? `Revues à programmer pour : ${stats.probationEndingSoon.map(e => e.nom || e.name || e.id).join(', ')}.`
                         : 'Toutes les périodes d\'essai sont gérées.'}
                     </p>
                  </div>
                  <button disabled title="Bientôt disponible" style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'not-allowed', padding: '4px', opacity: 0.5 }}><Plus size={20} /></button>
               </div>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '1.25rem', background: '#10B98110', border: '1px solid #10B98120' }}>
                  <div style={{ color: '#10B981' }}><CheckCircle2 size={20} /></div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Formation "Hygiène & Sécurité" complétée</div>
                     <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>
                       {stats.prodTrainingPct !== null
                         ? `${stats.prodTrainingPct}% des employés de production ont validé le module.`
                         : 'Aucun employé de production enregistré.'}
                     </p>
                  </div>
                  <button disabled title="Bientôt disponible" style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'not-allowed', padding: '4px', opacity: 0.5 }}><Activity size={20} /></button>
               </div>
            </div>
         </motion.div>

         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Santé Sociale de l'Usine</h4>
               <TrendingUp size={20} opacity={0.5} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                     <span>Rétention des talents</span>
                     <span>{stats.retention !== null ? `${stats.retention}%` : '—'}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                     <motion.div initial={{ width: 0 }} animate={{ width: stats.retention !== null ? `${stats.retention}%` : '0%' }} transition={{ duration: 1 }} style={{ height: '100%', background: 'white' }} />
                  </div>
               </div>
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                     <span>Progression des compétences</span>
                     <span>{stats.skillsProgression !== null ? `${stats.skillsProgression}%` : '—'}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                     <motion.div initial={{ width: 0 }} animate={{ width: stats.skillsProgression !== null ? `${stats.skillsProgression}%` : '0%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#2DD4BF' }} />
                  </div>
               </div>
            </div>
            <p style={{ marginTop: '2rem', fontSize: '0.75rem', opacity: 0.8, fontStyle: 'italic', lineHeight: 1.5 }}>
              "L'humain est le moteur de l'excellence industrielle. Notre taux de rétention témoigne de la solidité de la culture IPC."
            </p>
         </motion.div>
      </div>
    </motion.div>
  );
};

export default PeopleTab;
