import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { GripHorizontal, TrendingUp, TrendingDown, Minus, DollarSign, Users, Truck, Target, Activity, Plus, X, Megaphone } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
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
const BaseWidget = ({ title, icon: Icon, children, onRemove }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
    <div className="luxury-widget-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={16} color="#9ca3af" />
        <span className="luxury-widget-title">{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GripHorizontal className="luxury-drag-handle" size={20} />
      </div>
    </div>
    <button onClick={onRemove} className="luxury-remove-btn" title="Masquer ce widget">
      <X size={16} />
    </button>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

const CashFlowWidget = ({ data, caComparaisonData, formatCurrency, onRemove }) => (
  <BaseWidget title="Trésorerie & Cash-Flow" icon={DollarSign} onRemove={onRemove}>
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
  </BaseWidget>
);

const HRWidget = ({ data, onRemove }) => (
  <BaseWidget title="Pulsation RH" icon={Users} onRemove={onRemove}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={data.effectif} duration={1.5} />
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>Collaborateurs Actifs</div>
      <div className="luxury-trend neutral">
        <Minus size={16} /> Turnover stable (2.1%)
      </div>
    </div>
  </BaseWidget>
);

const SupplyWidget = ({ data, onRemove }) => (
  <BaseWidget title="Chaîne Logistique" icon={Truck} onRemove={onRemove}>
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
  </BaseWidget>
);

const CRMWidget = ({ data, onRemove }) => (
  <BaseWidget title="Performance CRM" icon={Target} onRemove={onRemove}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={data.conversionRate} duration={2} />
        <span className="luxury-value-unit" style={{ fontSize: '2rem' }}>%</span>
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>Taux de Conversion (Win Rate)</div>
      <div className="luxury-trend positive">
        <TrendingUp size={16} /> {data.activeDeals} deals actifs en pipeline
      </div>
    </div>
  </BaseWidget>
);

const ProductionWidget = ({ data, onRemove }) => (
  <BaseWidget title="Activité Usine" icon={Activity} onRemove={onRemove}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={data.prodScore} duration={2} />
        <span className="luxury-value-unit" style={{ fontSize: '2rem' }}>%</span>
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>Achèvement des OTs</div>
      <div className="luxury-trend positive">
        <TrendingUp size={16} /> Flux de production nominal
      </div>
    </div>
  </BaseWidget>
);

const MarketingWidget = ({ data, onRemove }) => (
  <BaseWidget title="Impact Marketing" icon={Megaphone} onRemove={onRemove}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="luxury-value-massive" style={{ fontSize: '6rem' }}>
        <AnimatedCounter from={0} to={1240} duration={2} />
        <span className="luxury-value-unit" style={{ fontSize: '2rem' }}>K</span>
      </div>
      <div style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1rem' }}>Portée Globale (Reach)</div>
      <div className="luxury-trend positive">
        <TrendingUp size={16} /> Campagne en cours ultra performante
      </div>
    </div>
  </BaseWidget>
);

/* ────────────────────────────────
   Main Dashboard
──────────────────────────────── */
const WIDGET_REGISTRY = {
  'finance': { id: 'finance', label: 'Trésorerie & Cash-Flow', icon: DollarSign },
  'crm': { id: 'crm', label: 'Performance CRM', icon: Target },
  'production': { id: 'production', label: 'Activité Usine', icon: Activity },
  'hr': { id: 'hr', label: 'Pulsation RH', icon: Users },
  'supply': { id: 'supply', label: 'Chaîne Logistique', icon: Truck },
  'marketing': { id: 'marketing', label: 'Impact Marketing', icon: Megaphone },
};

const GlobalDashboard = () => {
  const _incomes = useStore(s => s.data.finance?.incomes);
  const incomes = _incomes || [];
  const _employees = useStore(s => s.data.hr?.employees);
  const employees = _employees || [];
  const _shipments = useStore(s => s.data.inventory?.shipments);
  const shipments = _shipments || [];
  const _workOrders = useStore(s => s.data.production?.workOrders);
  const workOrders = _workOrders || [];
  const _deals = useStore(s => s.data.crm?.deals);
  const deals = _deals || [];
  
  const formatCurrency = useStore(state => state.formatCurrency);

  // Default widget order
  const [widgets, setWidgets] = useState(['finance', 'crm', 'production', 'hr', 'supply']);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Handle outside click for popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableWidgets = Object.values(WIDGET_REGISTRY).filter(w => !widgets.includes(w.id));

  const addWidget = (id) => {
    setWidgets([...widgets, id]);
    setIsPopoverOpen(false);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(wId => wId !== id));
  };

  // Dynamic Data Calculation
  const { metrics, caComparaisonData } = useMemo(() => {
    const caRealise = incomes.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const effectif = employees.length || 142; // Fallback for UI testing
    const livres = shipments.filter(s => s.statut === 'Livré').length;
    const retardes = shipments.filter(s => s.statut === 'Retardé').length;
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 94;
    const prodScore = workOrders.length > 0 ? Math.round((workOrders.filter(o => o.statut === 'Terminé').length / workOrders.length) * 100) : 88;
    const wonDeals = deals.filter(d => d.statut === 'Gagné').length;
    const activeDeals = deals.filter(d => d.statut !== 'Gagné' && d.statut !== 'Perdu').length;
    const conversionRate = deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 68; 

    const moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const caComparaisonData = moisFr.map((mois, index) => {
       let realise = index <= currentMonth ? (caRealise > 0 ? (caRealise / (currentMonth + 1)) * (0.9 + Math.random() * 0.2) : 150000000 * (0.8 + Math.random() * 0.4)) : null;
       return { mois, Réalisé: realise };
    });

    return { 
      metrics: { caRealise, effectif, otif, prodScore, conversionRate, activeDeals }, 
      caComparaisonData 
    };
  }, [incomes, employees, shipments, workOrders, deals]);

  // Map widget IDs to their components
  const renderWidget = (id) => {
    switch(id) {
      case 'finance':
        return <CashFlowWidget data={metrics} caComparaisonData={caComparaisonData} formatCurrency={formatCurrency} onRemove={() => removeWidget(id)} />;
      case 'crm':
        return <CRMWidget data={metrics} onRemove={() => removeWidget(id)} />;
      case 'production':
        return <ProductionWidget data={metrics} onRemove={() => removeWidget(id)} />;
      case 'hr':
        return <HRWidget data={metrics} onRemove={() => removeWidget(id)} />;
      case 'supply':
        return <SupplyWidget data={metrics} onRemove={() => removeWidget(id)} />;
      case 'marketing':
        return <MarketingWidget data={metrics} onRemove={() => removeWidget(id)} />;
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
        <AnimatePresence>
          {widgets.map(id => (
            <Reorder.Item 
              key={id} 
              value={id} 
              className="luxury-widget" 
              style={{ flex: id === 'finance' ? '1 1 500px' : '1 1 300px', minWidth: '300px' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              {renderWidget(id)}
            </Reorder.Item>
          ))}
        </AnimatePresence>

        {/* Add Widget Button */}
        {availableWidgets.length > 0 && (
          <motion.div 
            layout
            className="luxury-widget luxury-add-widget" 
            style={{ flex: '1 1 300px', minWidth: '300px', position: 'relative' }}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          >
            <Plus size={48} strokeWidth={1} />
            <span style={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Ajouter un Département
            </span>

            {/* Popover */}
            <AnimatePresence>
              {isPopoverOpen && (
                <motion.div 
                  ref={popoverRef}
                  className="luxury-popover"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Départements Disponibles
                  </div>
                  {availableWidgets.map(w => (
                    <div key={w.id} className="luxury-popover-item" onClick={() => addWidget(w.id)}>
                      <w.icon size={18} />
                      {w.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </Reorder.Group>

    </motion.div>
  );
};

export default React.memo(GlobalDashboard);
