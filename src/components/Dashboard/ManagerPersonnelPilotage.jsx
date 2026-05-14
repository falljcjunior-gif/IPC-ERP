import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { useStore } from '../../store';

const ManagerPersonnelPilotage = ({ managerId }) => {
  const { data } = useStore();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Extraction des employés sous la responsabilité de ce manager ayant un risque
    const employees = data.hr?.employees || [];
    const teamMembers = employees.filter(
      emp => (emp.managerId === managerId || emp.hr?.managerId === managerId) && emp.burnout_risk >= 60
    );
    
    // Alertes sur les congés critiques (qui débutent dans moins de 3 jours)
    const pendingLeaves = (data.hr?.leaves || []).filter(
      l => (l.statut === 'En attente' || l.statut === 'Brouillon') && new Date(l.date_debut) < new Date(Date.now() + 86400000 * 3)
    );

    setAlerts([
      ...teamMembers.map(emp => ({
        id: emp.id, 
        type: 'BURNOUT', 
        priority: 'high', 
        message: `${emp.nom || 'Employé'} présente un risque d'épuisement critique (${emp.burnout_risk}%). Le système exige une intervention de pilotage.`
      })),
      ...pendingLeaves.map(leave => ({
        id: leave.id, 
        type: 'DELAY', 
        priority: 'medium',
        message: `La demande de congé de ${leave.collaborateur} débute dans moins de 72h et n'est toujours pas traitée.`
      }))
    ]);
  }, [data.hr, managerId]);

  if (alerts.length === 0) return null;

  return (
    <div className="manager-alerts-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
        Pilotage Actif Requis
      </h3>
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            key={alert.id}
          >
            <div style={{
              padding: '1.5rem', borderRadius: '1rem', borderLeft: `6px solid ${alert.priority === 'high' ? '#EF4444' : '#F59E0B'}`,
              background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
              {alert.priority === 'high' ? <TrendingDown color="#EF4444" size={28} /> : <AlertTriangle color="#F59E0B" size={28} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{alert.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem', fontStyle: 'italic' }}>
                  Action recommandée : Planifier un point immédiat ou traiter la demande.
                </div>
              </div>
              <button style={{
                padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none',
                background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                Intervenir
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(ManagerPersonnelPilotage);
