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
  const { data, formatCurrency, seedDemoData, shellView } = useStore();
  const [enableDemoHistory, setEnableDemoHistory] = useState(false);

  // -------------- DATA AGGREGATION ---------------
  const invoices = data.finance?.invoices || [];
  const caGenere = invoices.reduce((acc, inv) => acc + (parseFloat(inv.montant || 0)), 0);
  const vendorBills = data.finance?.vendor_bills || [];
  const dettes = vendorBills.reduce((acc, bill) => acc + (parseFloat(bill.montant || 0)), 0);
  const opportunities = data.crm?.opportunities || [];
  const pipelineValue = opportunities.filter(o => o.etape !== 'Perdu').reduce((acc, o) => acc + (parseFloat(o.montant || 0)), 0);
  const oppStageCount = opportunities.reduce((acc, o) => { acc[o.etape] = (acc[o.etape] || 0) + 1; return acc; }, {});
  const pieData = Object.keys(oppStageCount).map(key => ({ name: key, value: oppStageCount[key] }));
  const employees = data.hr?.employees || [];
  const masseSalariale = employees.reduce((acc, emp) => acc + (parseFloat(emp.salaire || 0)), 0);
  const activeWorkflows = (Array.isArray(data.workflows) ? data.workflows : (data.workflows?.[''] || data.workflows?.workflows || [])).filter(w => w.active).length;
  const signedDocs = (data.signature?.requests || []).filter(r => r.statut === 'Signé').length;

  const cashflowTrend = useMemo(() => {
    if (enableDemoHistory) {
      const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
      return months.map((m, i) => ({ m, ca: Math.round(caGenere * (0.1 + (Math.random() * 0.15))), depenses: Math.round(dettes * (0.1 + (Math.random() * 0.2))) }));
    }
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
    return result.length === 0 ? [{ m: new Date().toLocaleString('fr-FR', { month: 'short' }), ca: caGenere, depenses: dettes }] : result;
  }, [caGenere, dettes, enableDemoHistory, invoices, vendorBills]);

  const hrDeptCost = useMemo(() => {
    const depCost = {};
    employees.forEach(emp => { depCost[emp.departement || 'Général'] = (depCost[emp.departement || 'Général'] || 0) + parseFloat(emp.salaire || 0); });
    return Object.keys(depCost).map(key => ({ dept: key, cost: depCost[key] }));
  }, [employees]);

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <LayoutDashboard size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus C-Level Strategic Control
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Cockpit Décisionnel
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Visualisez l'état de santé global de votre entreprise avec des indicateurs de performance consolidés en temps réel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="nexus-card" 
              onClick={seedDemoData}
              style={{ background: 'white', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)', border: '1px solid var(--nexus-primary)', cursor: 'pointer' }}
            >
              <Sparkles size={18} /> Générer Historique
            </button>
            
            <div className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', background: 'white' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Mode Démo</span>
              <button 
                onClick={() => setEnableDemoHistory(!enableDemoHistory)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: enableDemoHistory ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)' }}>
                {enableDemoHistory ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Bento Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white', position: 'relative', overflow: 'hidden' }}>
            <div className="nexus-glow" style={{ position: 'absolute', top: '-20%', right: '-10%', width: '100px', height: '100px', background: 'var(--nexus-primary)', opacity: 0.05, filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><DollarSign size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)', letterSpacing: '1px' }}>REVENUE</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>CA Brut Consolidé</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(caGenere)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> +12.4% vs LMT
            </div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px', color: '#3B82F6' }}><Target size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3B82F6', letterSpacing: '1px' }}>SALES</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Pipeline Pondéré</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(pipelineValue)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6' }}>85 Opportunités actives</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '10px', color: '#EF4444' }}><TrendingUp size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#EF4444', letterSpacing: '1px' }}>LIABILITY</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Dettes à 30j</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(dettes)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#EF4444' }}>7 Factures en retard</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><Users size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B', letterSpacing: '1px' }}>PAYROLL</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Masse Salariale</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(masseSalariale)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B' }}>{employees.length} Collaborateurs Nexus</div>
        </div>

        {/* Main Cashflow Chart + Side Panel */}
        <div className="nexus-card" style={{ gridColumn: 'span 8', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={20} color="var(--nexus-primary)" strokeWidth={3} /> Flux de Trésorerie Consolidé
              </h4>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--nexus-primary)' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Encaissements</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#EF4444' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Dépenses</span>
                </div>
              </div>
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowTrend}>
                  <defs>
                    <linearGradient id="nexusCa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--nexus-primary)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--nexus-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="nexusDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nexus-border)" opacity={0.4} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 12, fontWeight: 800 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)', padding: '1rem' }} />
                  <Area type="monotone" name="Encaissements" dataKey="ca" stroke="var(--nexus-primary)" strokeWidth={4} fillOpacity={1} fill="url(#nexusCa)" />
                  <Area type="monotone" name="Dépenses" dataKey="depenses" stroke="#EF4444" strokeWidth={4} fillOpacity={1} fill="url(#nexusDep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Live Activity Feed */}
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={18} color="var(--nexus-primary)" /> Flux d'Activité Live
           </h4>
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px' }}>
              {[
                { user: 'Raphaël', action: 'Devis #942 approuvé', time: 'Il y a 2m', type: 'sales' },
                { user: 'Système', action: 'Backup Nexus terminé', time: 'Il y a 15m', type: 'system' },
                { user: 'Marie', action: 'Nouvel employé : Jean D.', time: 'Il y a 1h', type: 'hr' },
                { user: 'Finance', action: 'Rapprochement effectué', time: 'Il y a 3h', type: 'finance' },
                { user: 'Logistique', action: 'Arrivage Stock A-12', time: 'Il y a 5h', type: 'inventory' },
                { user: 'Marketing', action: 'Campagne été lancée', time: 'Il y a 1j', type: 'marketing' }
              ].map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--nexus-border)', background: 'var(--bg-subtle)' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--nexus-primary)' }} />
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-secondary)' }}>{log.action}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>{log.user} • {log.time}</div>
                   </div>
                </div>
              ))}
           </div>
           <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px dashed var(--nexus-border)', background: 'transparent', color: 'var(--nexus-text-muted)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
              Voir tout l'historique
           </button>
        </div>

        {/* Secondary Row: Pipeline & HR */}
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Briefcase size={18} color="#3B82F6" /> Répartition Pipeline
            </h4>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={18} color="#F59E0B" /> Coût par Département
            </h4>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={hrDeptCost}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nexus-border)" opacity={0.4} />
                  <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 800 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => `${v/1000}k`} />
                  <Bar dataKey="cost" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={40} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Strategic Intelligence Panel */}
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '1.5rem', background: 'var(--nexus-secondary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '200px', height: '200px', background: 'var(--nexus-primary)', opacity: 0.1, filter: 'blur(60px)' }} />
           <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={18} /> Strategic Insight
           </h4>
           <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              "Votre ratio de solvabilité est <span style={{ color: 'var(--nexus-primary)', fontWeight: 800 }}>excellent (1.82)</span>. Nexus recommande d'augmenter les investissements R&D de 15% pour optimiser le levier fiscal du prochain trimestre."
           </p>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-primary)', textTransform: 'uppercase' }}>Focus SEMAINE</div>
                 <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Réduction DSO de 2 jours</div>
              </div>
           </div>
        </div>

        {/* System Integrity Bento */}
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--nexus-primary)', marginBottom: '0.5rem' }}>{activeWorkflows}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Règles BPM Actives</div>
        </div>
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--nexus-secondary)', marginBottom: '0.5rem' }}>{signedDocs}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Documents Scellés</div>
        </div>
        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--nexus-primary)', marginBottom: '0.5rem' }}>100%</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Disponibilité Nexus</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
