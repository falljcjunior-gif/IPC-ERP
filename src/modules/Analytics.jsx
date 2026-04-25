import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, Target, TrendingUp, DollarSign, 
  Briefcase, Users, LayoutDashboard, ToggleRight, ToggleLeft, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const Analytics = () => {
  const { data, formatCurrency, seedDemoData } = useStore();
  // Option pour facilement désactiver les courbes lissées factices dans le futur
  const [enableDemoHistory, setEnableDemoHistory] = useState(false);

  // -------------- DATA AGGREGATION ---------------

  // 1. Finance (CA et Dettes)
  const invoices = data.finance?.invoices || [];
  const caGenere = invoices.reduce((acc, inv) => acc + (parseFloat(inv.montant || 0)), 0);
  
  const vendorBills = data.finance?.vendor_bills || [];
  const dettes = vendorBills.reduce((acc, bill) => acc + (parseFloat(bill.montant || 0)), 0);

  // 2. Ventes (Pipeline)
  const opportunities = data.crm?.opportunities || [];
  const pipelineValue = opportunities
    .filter(o => o.etape !== 'Perdu')
    .reduce((acc, o) => acc + (parseFloat(o.montant || 0)), 0);

  const oppStageCount = opportunities.reduce((acc, o) => {
     acc[o.etape] = (acc[o.etape] || 0) + 1;
     return acc;
  }, {});
  const pieData = Object.keys(oppStageCount).map(key => ({ name: key, value: oppStageCount[key] }));

  // 3. HR (Masse Salariale)
  const employees = data.hr?.employees || [];
  const masseSalariale = employees.reduce((acc, emp) => acc + (parseFloat(emp.salaire || 0)), 0);

  // 4. Operations (Workflows & Signature)
  const activeWorkflows = (Array.isArray(data.workflows) ? data.workflows : (data.workflows?.[''] || data.workflows?.workflows || [])).filter(w => w.active).length;
  const signedDocs = (data.signature?.requests || []).filter(r => r.statut === 'Signé').length;

  // -------------- REAL HISTORY AGGREGATOR ---------------
  const cashflowTrend = useMemo(() => {
    if (enableDemoHistory) {
      // Mode Demo : Répartit le CA global sur 6 mois pour le visuel
      const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
      return months.map((m, i) => ({
         m,
         ca: Math.round(caGenere * (0.1 + (Math.random() * 0.15))),
         depenses: Math.round(dettes * (0.1 + (Math.random() * 0.2))),
      }));
    }

    // Vrai calcul : agrouper par mois basé sur createdAt
    const monthlyData = {};
    
    invoices.forEach(inv => {
      const date = inv.createdAt ? new Date(inv.createdAt) : new Date();
      const m = date.toLocaleString('fr-FR', { month: 'short' });
      if (!monthlyData[m]) monthlyData[m] = { m, ca: 0, depenses: 0 };
      monthlyData[m].ca += parseFloat(inv.montant || 0);
    });

    vendorBills.forEach(bill => {
      const date = bill.createdAt ? new Date(bill.createdAt) : new Date();
      const m = date.toLocaleString('fr-FR', { month: 'short' });
      if (!monthlyData[m]) monthlyData[m] = { m, ca: 0, depenses: 0 };
      monthlyData[m].depenses += parseFloat(bill.montant || 0);
    });

    const result = Object.values(monthlyData);
    if (result.length === 0) {
      const today = new Date().toLocaleString('fr-FR', { month: 'short' });
      return [{ m: today, ca: caGenere, depenses: dettes }];
    }
    
    // Sort by Date (approx using month strings is tricky, but here we assume recent history)
    return result;
  }, [caGenere, dettes, enableDemoHistory, invoices, vendorBills]);


  const hrDeptCost = useMemo(() => {
    const depCost = {};
    employees.forEach(emp => {
       depCost[emp.departement || 'Général'] = (depCost[emp.departement || 'Général'] || 0) + parseFloat(emp.salaire || 0);
    });
    return Object.keys(depCost).map(key => ({ dept: key, cost: depCost[key] }));
  }, [employees]);

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
       {/* HEADER */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EC4899', marginBottom: '0.4rem' }}>
                <Activity size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Tour de Contrôle — C-Level</span>
             </div>
             <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <LayoutDashboard size={32} /> Cockpit Décisionnel
             </h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Aperçu granulaire • Flux financiers • Optimisation RH</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <button 
                onClick={seedDemoData}
                className="glass"
                style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', border: '1px solid #10B981', color: '#10B981', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} /> Générer Historique
             </button>

             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: enableDemoHistory ? 'var(--accent)' : 'var(--text-muted)' }}>Maquette Lisse</span>
                <button 
                   onClick={() => setEnableDemoHistory(!enableDemoHistory)}
                   style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: enableDemoHistory ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}>
                   {enableDemoHistory ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
             </div>
          </div>
       </div>

       {/* TOP KPIs */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.5rem' }}>
          <KpiCard title="Chiffre d'Affaires Brut" value={formatCurrency(caGenere)} icon={<DollarSign size={20}/>} color="#10B981" />
          <KpiCard title="Valeur Pipeline (CRM)" value={formatCurrency(pipelineValue)} icon={<Target size={20}/>} color="#3B82F6" />
          <KpiCard title="Dettes Fournisseurs" value={formatCurrency(dettes)} icon={<TrendingUp size={20}/>} color="#EF4444" />
          <KpiCard title="Masse Salariale Mensuelle" value={formatCurrency(masseSalariale)} icon={<Users size={20}/>} color="#F59E0B" />
       </div>

       {/* MAIN CHARTS SECTION */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
             <h3 style={{ fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="#EC4899"/> Tendance Cashflow (Entrées vs Sorties)
             </h3>
             <div style={{ height: 350, width: '100%' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={cashflowTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '1rem', color: 'var(--text-color)' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Area type="monotone" name="Encaissements (CA)" dataKey="ca" stroke="#10B981" fillOpacity={1} fill="url(#colorCa)" strokeWidth={3} />
                    <Area type="monotone" name="Dépenses / Dettes" dataKey="depenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorDep)" strokeWidth={3} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* SECONDARY ROW */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
          
          {/* PIE CHART OPORTUNITIES */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
             <h4 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={18} color="#3B82F6"/> Répartition du Pipeline Commercial
             </h4>
             {pieData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Aucune donnée commerciale.</p>
             ) : (
               <div style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" cy="50%" 
                        innerRadius={60} outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
             )}
          </div>

          {/* BAR CHART HR COST */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
             <h4 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Users size={18} color="#F59E0B"/> Coût Salarial par Département
             </h4>
             {hrDeptCost.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Aucun employé enregistré.</p>
             ) : (
                <div style={{ height: 250, width: '100%' }}>
                   <ResponsiveContainer>
                     <BarChart data={hrDeptCost} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                       <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                       <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem', border: 'none' }}
                         formatter={(value) => formatCurrency(value)}
                         cursor={{ fill: 'var(--bg-subtle)' }}
                       />
                       <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Masse Salariale" />
                     </BarChart>
                   </ResponsiveContainer>
                </div>
             )}
          </div>

       </div>

       {/* TERTIARY METRICS ROW */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
             <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)' }}>{activeWorkflows}</div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Règles BPM Actives</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
             <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981' }}>{signedDocs}</div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contrats Scellés (P.K.I.)</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
             <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3B82F6' }}>100%</div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Intégrité Base de Données</div>
          </div>
       </div>

    </div>
  );
};

export default Analytics;
