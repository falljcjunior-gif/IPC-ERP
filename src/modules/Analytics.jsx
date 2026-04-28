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
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const Analytics = () => {
  const { data, formatCurrency, seedDemoData, shellView } = useStore();
  const [enableDemoHistory, setEnableDemoHistory] = useState(false);

  const invoices     = data.finance?.invoices      || [];
  const vendorBills  = data.finance?.vendor_bills  || [];
  const opportunities = data.crm?.opportunities    || [];
  const employees    = data.hr?.employees           || [];

  const caGenere      = invoices.reduce((acc, inv) => acc + (parseFloat(inv.montant || 0)), 0);
  const dettes        = vendorBills.reduce((acc, bill) => acc + (parseFloat(bill.montant || 0)), 0);
  const pipelineValue = opportunities.filter(o => o.etape !== 'Perdu').reduce((acc, o) => acc + (parseFloat(o.montant || 0)), 0);
  const masseSalariale = employees.reduce((acc, emp) => acc + (parseFloat(emp.salaire || 0)), 0);
  const activeWorkflows = (Array.isArray(data.workflows) ? data.workflows : (data.workflows?.[''] || data.workflows?.workflows || [])).filter(w => w.active).length;
  const signedDocs    = (data.signature?.requests || []).filter(r => r.statut === 'Signé').length;

  const oppStageCount = opportunities.reduce((acc, o) => { acc[o.etape] = (acc[o.etape] || 0) + 1; return acc; }, {});
  const pieData       = Object.keys(oppStageCount).map(key => ({ name: key, value: oppStageCount[key] }));

  const cashflowTrend = useMemo(() => {
    if (enableDemoHistory) {
      return ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'].map(m => ({ m, ca: Math.round(caGenere * (0.1 + Math.random() * 0.15)), depenses: Math.round(dettes * (0.1 + Math.random() * 0.2)) }));
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

  const kpis = [
    { label: 'CA Brut Consolidé', value: caGenere,       isAmount: true,  color: '#10B981', tag: 'Revenue',   icon: <DollarSign size={24} />, sub: '+12.4% vs LMT', subColor: '#10B981' },
    { label: 'Pipeline Pondéré',  value: pipelineValue,  isAmount: true,  color: '#3B82F6', tag: 'Sales',     icon: <Target size={24} />,     sub: `${opportunities.filter(o=>o.etape!=='Perdu').length} opps actives`, subColor: '#3B82F6' },
    { label: 'Dettes à 30j',      value: dettes,         isAmount: true,  color: '#EF4444', tag: 'Liability', icon: <TrendingUp size={24} />, sub: '7 Factures en retard', subColor: '#EF4444' },
    { label: 'Masse Salariale',   value: masseSalariale, isAmount: true,  color: '#F59E0B', tag: 'Payroll',   icon: <Users size={24} />,      sub: `${employees.length} Collaborateurs`, subColor: '#F59E0B' },
  ];

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Nexus C-Level Strategic Control</div>
          <h1 className="luxury-title">Cockpit <strong>Décisionnel</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button onClick={seedDemoData} className="luxury-widget" style={{ padding: '0.9rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.07)', border: 'none', cursor: 'pointer', borderRadius: '1.25rem' }}>
            <Sparkles size={18} /> Générer Historique
          </button>
          <div className="luxury-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Mode Démo</span>
            <button onClick={() => setEnableDemoHistory(!enableDemoHistory)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: enableDemoHistory ? '#10B981' : '#cbd5e1' }}>
              {enableDemoHistory ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI BENTO ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {kpis.map((k, i) => (
          <div key={i} className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: k.color, opacity: 0.04, borderRadius: '50%', filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: `${k.color}15`, padding: '14px', borderRadius: '1rem', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: 'var(--luxury-xs)', fontWeight: 800, color: k.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.tag}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-1px' }}>
                {k.isAmount ? formatCurrency(k.value) : <AnimatedCounter from={0} to={k.value} duration={1.5} />}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: k.subColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} /> {k.sub}
              </div>
            </div>
          </div>
        ))}

        {/* ── CASHFLOW CHART ── */}
        <div className="luxury-widget" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={24} color="#10B981" /> Flux de Trésorerie Consolidé
            </h4>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {[['#10B981','Encaissements'],['#EF4444','Dépenses']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: c }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowTrend}>
                <defs>
                  <linearGradient id="luxCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="luxDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.8} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} tickFormatter={v => `${v/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)', padding: '1rem' }} />
                <Area type="monotone" name="Encaissements" dataKey="ca" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#luxCa)" dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: 'white' }} />
                <Area type="monotone" name="Dépenses" dataKey="depenses" stroke="#EF4444" strokeWidth={4} fillOpacity={1} fill="url(#luxDep)" dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: 'white' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── LIVE ACTIVITY FEED ── */}
        <div className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={20} color="#F59E0B" /> Flux d'Activité Live
          </h4>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '320px' }}>
            {[
              { user: 'Raphaël',    action: 'Devis #942 approuvé',       time: 'Il y a 2m',  color: '#3B82F6' },
              { user: 'Système',    action: 'Backup IPC terminé',         time: 'Il y a 15m', color: '#10B981' },
              { user: 'Marie',      action: 'Nouvel employé : Jean D.',   time: 'Il y a 1h',  color: '#8B5CF6' },
              { user: 'Finance',    action: 'Rapprochement effectué',     time: 'Il y a 3h',  color: '#F59E0B' },
              { user: 'Logistique', action: 'Arrivage Stock A-12',        time: 'Il y a 5h',  color: '#EF4444' },
              { user: 'Marketing',  action: 'Campagne été lancée',        time: 'Il y a 1j',  color: '#10B981' },
            ].map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: log.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{log.user} · {log.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ width: '100%', padding: '0.875rem', borderRadius: '1rem', border: '2px dashed #e2e8f0', background: 'transparent', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            Voir tout l'historique
          </button>
        </div>

        {/* ── PIPELINE PIE ── */}
        <div className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={20} color="#3B82F6" /> Répartition Pipeline
          </h4>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── DEPT COST BAR ── */}
        <div className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="#F59E0B" /> Coût par Département
          </h4>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={hrDeptCost}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} tickFormatter={v => `${v/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cost" fill="#F59E0B" radius={[8, 8, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── STRATEGIC INSIGHT ── */}
        <div className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem', background: '#0f172a', color: 'white', position: 'relative', overflow: 'hidden', borderRadius: '1.5rem' }}>
          <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '250px', height: '250px', background: '#10B981', opacity: 0.08, filter: 'blur(80px)' }} />
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 800, fontSize: '1rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={18} /> Strategic Insight
          </h4>
          <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>
            Votre ratio de solvabilité est <span style={{ color: '#10B981', fontWeight: 800 }}>excellent (1.82)</span>. Recommandation : augmenter les investissements R&D de 15% pour optimiser le levier fiscal.
          </p>
          <div style={{ padding: '1rem 1.5rem', borderRadius: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Focus Semaine</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Réduction DSO de 2 jours</div>
          </div>
        </div>

        {/* ── STAT MINI CARDS ── */}
        {[
          { label: 'Règles BPM Actives',  value: activeWorkflows, color: '#10B981' },
          { label: 'Documents Scellés',    value: signedDocs,      color: '#1e293b' },
          { label: 'Disponibilité IPC',    value: '100%',          color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className="luxury-widget" style={{ gridColumn: 'span 4', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: s.color, marginBottom: '0.5rem', letterSpacing: '-2px' }}>
              {typeof s.value === 'number' ? <AnimatedCounter from={0} to={s.value} duration={1.5} formatter={v => `${Math.round(v)}`} /> : s.value}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Analytics);
