import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PiggyBank, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { BarChartComp } from '../components/BusinessCharts';

const Budget = () => {
  const { data } = useBusiness();
  const [selectedYear, setSelectedYear] = useState('2026');

  const budgetData = [
    { department: 'Marketing', planned: 50000, actual: 42000, color: '#3B82F6' },
    { department: 'R&D', planned: 120000, actual: 115000, color: '#10B981' },
    { department: 'Opérations', planned: 200000, actual: 215000, color: '#F59E0B' },
    { department: 'RH', planned: 30000, actual: 28500, color: '#8B5CF6' },
    { department: 'Ventes', planned: 45000, actual: 48000, color: '#EC4899' },
  ];

  const totalPlanned = budgetData.reduce((sum, b) => sum + b.planned, 0);
  const totalActual = budgetData.reduce((sum, b) => sum + b.actual, 0);
  const burnRate = (totalActual / totalPlanned) * 100;

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pilotage Budgétaire</h1>
          <p style={{ color: 'var(--text-muted)' }}>Contrôlez vos dépenses prévisionnelles vs réelles par pôle.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="glass"
            style={{ padding: '0.5rem 1rem', borderRadius: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600 }}
          >
            <option>2026</option>
            <option>2025</option>
          </select>
          <button className="btn btn-primary">
            <Plus size={18} /> Nouveau Budget
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>PREV. TOTAL</div>
               <PiggyBank size={18} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalPlanned.toLocaleString()} FCFA</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 600 }}>+5% vs 2025</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>CONSOMMÉ</div>
               <TrendingUp size={18} color={burnRate > 90 ? '#EF4444' : '#10B981'} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalActual.toLocaleString()} FCFA</div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', marginTop: '0.75rem' }}>
               <div style={{ width: `${burnRate}%`, height: '100%', background: burnRate > 100 ? '#EF4444' : 'var(--accent)', borderRadius: '3px' }} />
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>RESTE À ÉMETTRE</div>
               <Target size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{(totalPlanned - totalActual).toLocaleString()} FCFA</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Basé sur les PO approuvés</div>
         </div>
      </div>

      <div className="grid grid-2" style={{ gap: '1.5rem' }}>
         <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Structure des Coûts par Pôle</h3>
            <BarChartComp data={budgetData.map(d => ({ name: d.department, value: d.actual }))} color="var(--accent)" />
         </div>

         <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Détail des Enveloppes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {budgetData.map(b => (
                 <div key={b.department} style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                       <span style={{ fontWeight: 700 }}>{b.department}</span>
                       <span style={{ fontSize: '0.85rem', fontWeight: 800, color: b.actual > b.planned ? '#EF4444' : 'var(--text)' }}>
                          {b.actual.toLocaleString()} / {b.planned.toLocaleString()} FCFA
                       </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                       <div style={{ width: `${Math.min((b.actual/b.planned)*100, 100)}%`, height: '100%', background: b.actual > b.planned ? '#EF4444' : b.color, borderRadius: '2px' }} />
                    </div>
                    {b.actual > b.planned && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.65rem', fontWeight: 700, marginTop: '0.5rem' }}>
                         <AlertCircle size={10} /> Dépassement budgétaire détecté
                      </div>
                    )}
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Budget;
