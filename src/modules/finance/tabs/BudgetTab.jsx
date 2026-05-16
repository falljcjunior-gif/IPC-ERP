import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PiggyBank, Target, Activity, AlertTriangle, 
  CheckCircle2, Plus, Search, Filter, Layers, 
  Zap, TrendingUp, TrendingDown, RefreshCcw, 
  BarChart3, PieChart, Calculator
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';
import EnterpriseView from '../../../components/EnterpriseView';
import { budgetSchema } from '../../../schemas/budget.schema';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const BudgetTab = ({ data, formatCurrency, onOpenDetail }) => {
  const budgets = useMemo(() => data?.finance?.budgets || [], [data?.finance?.budgets]);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Budget Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
        {budgets.map((b, i) => {
           const burnRate = Math.round((b.realise / b.prevision) * 100);
           const isOver = burnRate > 100;
           return (
             <motion.div 
               key={b.id} 
               variants={item}
               whileHover={{ y: -5 }}
               className="glass" 
               style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                   <div style={{ background: isOver ? '#F43F5E15' : '#6366F115', color: isOver ? '#F43F5E' : '#6366F1', padding: '12px', borderRadius: '1rem' }}>
                     <Target size={24} />
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Burn Rate</div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: isOver ? '#F43F5E' : '#10B981' }}>{burnRate}%</div>
                   </div>
                </div>

                <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.1rem' }}>{b.departement}</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Consommé</span>
                      <span style={{ fontWeight: 800 }}>{formatCurrency(b.realise, true)}</span>
                   </div>
                   <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(burnRate, 100)}%` }} 
                        style={{ height: '100%', background: isOver ? '#F43F5E' : '#6366F1', borderRadius: '4px' }} 
                      />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      <span>0</span>
                      <span>Budget: {formatCurrency(b.prevision, true)}</span>
                   </div>
                </div>

                <button className="glass" onClick={() => onOpenDetail && onOpenDetail(b, 'budget', 'budgets')} style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', border: '1px solid var(--border)' }}>
                   <Activity size={14} /> Voir Détails OPEX
                </button>
             </motion.div>
           );
        })}
      </div>

      {/* Corporate Allocation / Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(min(100%, 300px), 1fr) 2fr', gap: '1.5rem' }}>
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem', alignSelf: 'flex-start' }}>Répartition Géographique</h4>
            <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
               <RechartsPie>
                  <Pie
                    data={budgets.map((b, i) => ({ name: b.departement, value: b.prevision }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {budgets.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </RechartsPie>
            </SafeResponsiveChart>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
               {budgets.map((b, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    {b.departement}
                 </div>
               ))}
            </div>
         </div>

         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Enveloppes de Dépenses</h4>
               <button className="btn-primary" onClick={() => onOpenDetail && onOpenDetail(null, 'budget', 'envelopes')} style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', background: '#6366F1', borderColor: '#6366F1', cursor: 'pointer' }}>
                 <Plus size={18} /> Nouvelle Enveloppe
               </button>
            </div>
            <EnterpriseView 
               moduleId="budget" 
               modelId="envelopes"
               schema={budgetSchema}
               onOpenDetail={onOpenDetail}
            />
         </div>
      </div>
    </motion.div>
  );
};

export default BudgetTab;
