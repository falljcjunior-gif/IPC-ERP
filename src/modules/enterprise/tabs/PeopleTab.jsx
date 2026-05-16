import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Mail, Phone, Briefcase, 
  Search, Filter, Activity, TrendingUp, Award,
  Clock, CheckCircle2, MoreVertical, MapPin,
  Building2, Heart, Plus, Wallet
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import EnterpriseView from '../../../components/EnterpriseView';
import { hrSchema } from '../../../schemas/hr.schema';
import { useStore } from '../../../store';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PeopleTab = ({ data, onOpenDetail }) => {
  const { generatePayrollEntry } = useStore();
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
           />
        </motion.div>
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
