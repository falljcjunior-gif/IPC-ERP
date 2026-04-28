import React, { useState, useEffect, useMemo } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripHorizontal, TrendingUp, TrendingDown, Minus, DollarSign, Users, Truck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useStore } from '../store';
import SafeResponsiveChart from './charts/SafeResponsiveChart';
import AnimatedCounter from './Dashboard/AnimatedCounter';
import './GlobalDashboard.css';

/* ────────────────────────────────
   Custom Tooltip for Area Chart
──────────────────────────────── */
const LuxuryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="luxury-tooltip">
        <p style={{ fontWeight: 400, color: '#9ca3af', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        <p style={{ color: '#111827', margin: 0, fontWeight: 300, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          {(payload[0].value / 1e6).toFixed(1)} M
        </p>
      </div>
    );
  }
  return null;
};

/* ────────────────────────────────
   Widgets Components
──────────────────────────────── */
const CashFlowWidget = ({ data, caComparaisonData, formatCurrency }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
    <div className="luxury-widget-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <DollarSign size={16} color="#9ca3af" />
        <span className="luxury-widget-title">Trésorerie & Cash-Flow</span>
      </div>
      <GripHorizontal className="luxury-drag-handle" size={20} />
    </div>
    
    <div>
      <div className="luxury-value-massive">
        <AnimatedCounter from={0} to={data.caRealise} duration={2} formatter={(v) => formatCurrency(v, true)} />
      </div>
      <div className="luxury-trend positive">
        <TrendingUp size={16} /> +12.4% vs M-1
      </div>
    </div>

    <div style={{ flex: 1, minHeight: '180px', marginTop: '1rem' }}>
      <SafeResponsiveChart>
        <AreaChart data={caComparaisonData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="luxuryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity={0.1}/>
              <stop offset="100%" stopColor="#111827" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="mois" axisLine={false} tickLine={false} dy={10} />
          <Tooltip content={<LuxuryTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="Réalisé" stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#luxuryGrad)" activeDot={{ r: 6, fill: '#111827', strokeWidth: 0 }} />
        </AreaChart>
      </SafeResponsiveChart>
    </div>
  </div>
);

const HRWidget = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="luxury-widget-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={16} color="#9ca3af" />
        <span className="luxury-widget-title">Pulsation RH</span>
      </div>
      <GripHorizontal className="luxury-drag-handle" size={20} />
    </div>
    
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={data.effectif} duration={1.5} />
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>Collaborateurs Actifs</div>
      <div className="luxury-trend neutral">
        <Minus size={16} /> Turnover stable (2.1%)
      </div>
    </div>
  </div>
);

const SupplyWidget = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="luxury-widget-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Truck size={16} color="#9ca3af" />
        <span className="luxury-widget-title">Chaîne Logistique</span>
      </div>
      <GripHorizontal className="luxury-drag-handle" size={20} />
    </div>
    
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={data.otif} duration={2} />
        <span className="luxury-value-unit" style={{ fontSize: '2rem' }}>%</span>
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>OTIF (On Time In Full)</div>
      <div className="luxury-trend negative">
        <TrendingDown size={16} /> -1.2% dû aux retards portuaires
      </div>
    </div>
  </div>
);

/* ────────────────────────────────
   Main Dashboard
──────────────────────────────── */
const GlobalDashboard = () => {
  const _incomes = useStore(s => s.data.finance?.incomes);
  const incomes = _incomes || [];
  const _employees = useStore(s => s.data.hr?.employees);
  const employees = _employees || [];
  const _shipments = useStore(s => s.data.inventory?.shipments);
  const shipments = _shipments || [];
  const formatCurrency = useStore(state => state.formatCurrency);

  // Default widget order
  const [widgets, setWidgets] = useState(['finance', 'hr', 'supply']);

  // Dynamic Data Calculation
  const { metrics, caComparaisonData } = useMemo(() => {
    const caRealise = incomes.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const effectif = employees.length || 142; // Fallback for UI testing
    const livres = shipments.filter(s => s.statut === 'Livré').length;
    const retardes = shipments.filter(s => s.statut === 'Retardé').length;
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 94;

    const moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const caComparaisonData = moisFr.map((mois, index) => {
       let realise = index <= currentMonth ? (caRealise > 0 ? (caRealise / (currentMonth + 1)) * (0.9 + Math.random() * 0.2) : 150000000 * (0.8 + Math.random() * 0.4)) : null;
       return { mois, Réalisé: realise };
    });

    return { metrics: { caRealise, effectif, otif }, caComparaisonData };
  }, [incomes, employees, shipments]);

  // Map widget IDs to their components
  const renderWidget = (id) => {
    switch(id) {
      case 'finance':
        return (
          <Reorder.Item key={id} value={id} className="luxury-widget" style={{ flex: '1 1 500px', minWidth: '300px' }}>
            <CashFlowWidget data={metrics} caComparaisonData={caComparaisonData} formatCurrency={formatCurrency} />
          </Reorder.Item>
        );
      case 'hr':
        return (
          <Reorder.Item key={id} value={id} className="luxury-widget" style={{ flex: '1 1 300px', minWidth: '300px' }}>
            <HRWidget data={metrics} />
          </Reorder.Item>
        );
      case 'supply':
        return (
          <Reorder.Item key={id} value={id} className="luxury-widget" style={{ flex: '1 1 300px', minWidth: '300px' }}>
            <SupplyWidget data={metrics} />
          </Reorder.Item>
        );
      default: return null;
    }
  };

  return (
    <motion.div 
      className="luxury-dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="luxury-header">
        <div>
          <div className="luxury-subtitle">Vue 360 • Espace de Direction</div>
          <h1 className="luxury-title">Nexus <strong>Cockpit</strong></h1>
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={widgets} 
        onReorder={setWidgets} 
        className="luxury-grid"
        style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' }}
      >
        {widgets.map(id => renderWidget(id))}
      </Reorder.Group>

    </motion.div>
  );
};

export default React.memo(GlobalDashboard);
