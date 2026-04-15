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
import { useBusiness } from '../../../BusinessContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PeopleTab = ({ data, onOpenDetail }) => {
  const { generatePayrollEntry } = useBusiness();
  const employees = data?.hr?.employees || [];
  
  const stats = useMemo(() => {
    const active = employees.filter(e => e.active !== false).length;
    const formations = 14; 
    const satisfaction = 8.5;
    return { active, formations, satisfaction };
  }, [employees]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Human Capital KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Effectif Actif" value={stats.active} trend={2.4} trendType="up" icon={<Users size={22} />} color="#0D9488" sparklineData={[42, 44, 45, 46]} />
        <KpiCard title="Satisfaction Coll." value={`${stats.satisfaction}/10`} trend={5.1} trendType="up" icon={<Heart size={22} />} color="#EC4899" sparklineData={[7.8, 8.1, 8.3, 8.5]} />
        <KpiCard title="Formations YTD" value={stats.formations} trend={12} trendType="up" icon={<Award size={22} />} color="#6366F1" sparklineData={[8, 10, 12, 14]} />
        <KpiCard title="Taux d'Absence" value="2.1%" trend={-4} trendType="down" icon={<Clock size={22} />} color="#F59E0B" sparklineData={[2.5, 2.4, 2.3, 2.1]} />
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
              <button className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
                <Building2 size={18} /> Organigramme
              </button>
              <button className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#0D9488', borderColor: '#0D9488' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem' }}>Alertes RH & Rappels</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '1.25rem', background: '#F59E0B10', border: '1px solid #F59E0B20' }}>
                  <div style={{ color: '#F59E0B' }}><Clock size={20} /></div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>3 Périodes d'essai se terminent cette semaine</div>
                     <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>Revues à programmer pour J. Doe, A. Smith, M. Kablan.</p>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer' }}><Plus size={20} /></button>
               </div>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '1.25rem', background: '#10B98110', border: '1px solid #10B98120' }}>
                  <div style={{ color: '#10B981' }}><CheckCircle2 size={20} /></div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Formation "Hygiène & Sécurité" complétée</div>
                     <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>92% des employés de production ont validé le module.</p>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}><Activity size={20} /></button>
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
                     <span>94%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                     <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 1 }} style={{ height: '100%', background: 'white' }} />
                  </div>
               </div>
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                     <span>Progression des compétences</span>
                     <span>78%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                     <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#2DD4BF' }} />
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
