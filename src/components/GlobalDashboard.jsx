import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Target, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Activity as ActivityIcon,
  Calendar,
  Zap,
  Briefcase,
  AlertTriangle,
  BrainCircuit,
  Package,
  Truck,
  HeartPulse
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import KpiCard from './KpiCard';
import { AreaChartComp, BarChartComp } from './BusinessCharts';
import DrillDownModal from './DrillDownModal';

const GlobalDashboard = () => {
  const { data, currentUser, navigateTo, formatCurrency } = useBusiness();
  const [activeDrillDown, setActiveDrillDown] = useState(null);

  // -------------------------------------------------------------
  // Role & Permissions Logic
  // -------------------------------------------------------------
  const role = currentUser.role || 'STAFF';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCFO = isSuperAdmin || role === 'CFO' || currentUser.dept === 'Finance';
  const isHR = isSuperAdmin || role === 'HR_MANAGER' || currentUser.dept === 'RH';
  const isSupply = isSuperAdmin || role === 'SUPPLY_MANAGER' || currentUser.dept === 'Logistique';
  const isSales = isSuperAdmin || role === 'SALES_DIRECTOR' || currentUser.dept === 'Commercial';

  // -------------------------------------------------------------
  // Data Aggregation & KPI Calculations (Simulated for Enterprise)
  // -------------------------------------------------------------

  const metrics = useMemo(() => {
    // Sales Logic
    const caRealise = 2540000000;
    const caPrevu = 2800000000;
    const cac = 125000; // Coût moyen d'acquisition
    const ltv = 8500000; // Valeur Vie Client
    const pipelineEvo = 15.2;

    // Finance Logic
    const cashFlow = 850000000;
    const dso = 42; // Days Sales Outstanding
    const margeNette = 18.5; // %

    // HR Logic
    const masseSalariale = 120000000;
    const turnover = 4.2; // %
    const absenteisme = 2.1; // %

    // Supply Logic
    const rotationStocks = 8.5; // fois par an
    const otif = 94.2; // On Time In Full %
    const coutLogistique = 15000; // par commande moy

    return {
      sales: { caRealise, caPrevu, cac, ltv, pipelineEvo },
      finance: { cashFlow, dso, margeNette },
      hr: { masseSalariale, turnover, absenteisme },
      supply: { rotationStocks, otif, coutLogistique }
    };
  }, [data]);

  // -------------------------------------------------------------
  // Drill-Down Handlers
  // -------------------------------------------------------------
  const handleDrillDown = (type) => {
    // Generate contextual data based on type
    let modalData = {};
    switch(type) {
      case 'sales_ca':
        modalData = {
          title: "Chiffre d'Affaires Détaillé",
          config: { color: "#3B82F6", columns: [
            { key: 'region', label: 'Région' },
            { key: 'ca', label: 'CA Réalisé', format: (val) => formatCurrency(val) },
            { key: 'target', label: 'Objectif', format: (val) => formatCurrency(val) },
            { key: 'perf', label: 'Performance' },
          ]},
          data: {
            chartData: [
              { name: 'Europe', val: 1200000000 },
              { name: 'Afrique', val: 800000000 },
              { name: 'Amériques', val: 540000000 },
            ],
            tableData: [
              { region: 'Europe', ca: 1200000000, target: 1100000000, perf: '+9%' },
              { region: 'Afrique', ca: 800000000, target: 1000000000, perf: '-20%' },
              { region: 'Amériques', ca: 540000000, target: 500000000, perf: '+8%' },
            ]
          }
        };
        break;
      case 'supply_otif':
        modalData = {
          title: "OTIF (On Time In Full) - Analyse des Retards",
          config: { color: "#F59E0B", columns: [
            { key: 'cause', label: 'Cause Racine' },
            { key: 'impact', label: 'Impact (Commandes)' },
            { key: 'cost', label: 'Coût Estimé', format: (val) => formatCurrency(val) },
          ]},
          data: {
            chartData: [
              { name: 'Transporteur', val: 45 },
              { name: 'Rupture Stock', val: 30 },
              { name: 'Erreur Prépa', val: 15 },
              { name: 'Douane', val: 10 },
            ],
            tableData: [
              { cause: 'Retards Transporteur', impact: 450, cost: 2500000 },
              { cause: 'Rupture de Stock', impact: 300, cost: 8000000 },
              { cause: 'Erreur Préparation', impact: 150, cost: 500000 },
            ]
          }
        };
        break;
      case 'finance_dso':
        modalData = {
          title: "DSO - Analyse des Créances Clients",
          config: { color: "#10B981", columns: [
            { key: 'client', label: 'Client' },
            { key: 'days', label: 'Jours de retard' },
            { key: 'amount', label: 'Montant Dû', format: (val) => formatCurrency(val) },
          ]},
          data: {
            chartData: [
              { name: '< 30J', val: 60 },
              { name: '30-60J', val: 25 },
              { name: '60-90J', val: 10 },
              { name: '> 90J', val: 5 },
            ],
            tableData: [
              { client: 'MegaCorp Inc.', days: 95, amount: 45000000 },
              { client: 'TechGlobal', days: 62, amount: 12000000 },
              { client: 'AeroSpace Ltd', days: 45, amount: 8500000 },
            ]
          }
        };
        break;
      // Add more cases as needed
      default:
        modalData = { title: "Analyse non disponible", data: null };
    }
    setActiveDrillDown(modalData);
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              <ActivityIcon size={20} fill="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Command Center ERP</span>
           </div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Bonjour, {currentUser.nom} 👋</h1>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Voici l'état de santé stratégique de votre organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
             onClick={() => navigateTo('analytics')}
             className="glass" 
             style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-subtle)', color: 'var(--text)' }}
           >
              Rapports Complets <ArrowUpRight size={16} />
           </button>
        </div>
      </div>

      {/* AI Action Center (Predictive Insights) */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <BrainCircuit size={24} color="#8B5CF6" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Anticipation IA & Alertes</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', borderLeft: '4px solid #F43F5E', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F43F5E', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} /> Baisse de trésorerie prévue
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Le DSO élevé (42 jours) combiné aux décaissements massifs prévus en Q3 risque de créer un trou de trésorerie de {formatCurrency(150000000, true)} d'ici 3 mois. Action requise sur le recouvrement.
            </p>
          </div>
          
          <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', borderLeft: '4px solid #F59E0B', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <TrendingDown size={16} /> Rupture de stock imminente
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              La demande en Europe pour le produit "Serveur Gen3" a augmenté de 15%. Risque de rupture d'ici 14 jours si le réassort n'est pas anticipé aujourd'hui.
            </p>
          </div>

          <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', borderLeft: '4px solid #10B981', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <TrendingUp size={16} /> Opportunité de Marge
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Le CAC a baissé de 8% ce mois-ci sur le segment B2B. L'IA recommande d'augmenter le budget d'acquisition marketing de 20% pour maximiser le pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Role-Based Dashboards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* VENTES & COMMERCE */}
        {isSales && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target color="#3B82F6" /> Direction Commerciale
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <KpiCard 
                title="Chiffre d'Affaires vs Prévisions" 
                value={formatCurrency(metrics.sales.caRealise, true)}
                trend={-9.2} 
                trendType="down" 
                icon={<DollarSign size={24} />} 
                color="#3B82F6"
                sparklineData={[{val: 10}, {val: 15}, {val: 12}, {val: 9}, {val: 8}]}
                onDrillDown={() => handleDrillDown('sales_ca')}
              />
              <KpiCard 
                title="Évolution du Pipeline" 
                value={`${metrics.sales.pipelineEvo}%`}
                trend={metrics.sales.pipelineEvo} 
                trendType="up" 
                icon={<Briefcase size={24} />} 
                color="#8B5CF6"
                sparklineData={[{val: 5}, {val: 8}, {val: 10}, {val: 12}, {val: 15}]}
              />
              <KpiCard 
                title="Coût d'Acquisition (CAC)" 
                value={formatCurrency(metrics.sales.cac, true)}
                trend={-5.4} 
                trendType="up" 
                icon={<ShoppingCart size={24} />} 
                color="#10B981"
                sparklineData={[{val: 140}, {val: 135}, {val: 130}, {val: 128}, {val: 125}]}
              />
              <KpiCard 
                title="Valeur Vie Client (LTV)" 
                value={formatCurrency(metrics.sales.ltv, true)}
                trend={2.1} 
                trendType="up" 
                icon={<Users size={24} />} 
                color="#F43F5E"
                sparklineData={[{val: 80}, {val: 82}, {val: 83}, {val: 84}, {val: 85}]}
              />
            </div>
          </div>
        )}

        {/* FINANCE */}
        {isCFO && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign color="#10B981" /> Direction Financière (CFO)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <KpiCard 
                title="Cash-flow Opérationnel" 
                value={formatCurrency(metrics.finance.cashFlow, true)}
                trend={4.5} 
                trendType="up" 
                icon={<ActivityIcon size={24} />} 
                color="#10B981"
                sparklineData={[{val: 700}, {val: 750}, {val: 800}, {val: 780}, {val: 850}]}
              />
              <KpiCard 
                title="DSO (Délai Recouvrement)" 
                value={`${metrics.finance.dso} Jours`}
                trend={12.5} 
                trendType="down" // Down is bad here (represented as red if needed, but trend logic in kpicard assumes up = green. Let's flip trendType interpretation or just pass raw data)
                icon={<Calendar size={24} />} 
                color="#F59E0B"
                sparklineData={[{val: 35}, {val: 36}, {val: 38}, {val: 40}, {val: 42}]}
                onDrillDown={() => handleDrillDown('finance_dso')}
              />
              <KpiCard 
                title="Marge Nette Globale" 
                value={`${metrics.finance.margeNette}%`}
                trend={1.2} 
                trendType="up" 
                icon={<ArrowUpRight size={24} />} 
                color="#06B6D4"
                sparklineData={[{val: 17}, {val: 17.5}, {val: 18}, {val: 18.2}, {val: 18.5}]}
              />
            </div>
          </div>
        )}

        {/* SUPPLY CHAIN */}
        {isSupply && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck color="#F59E0B" /> Supply Chain & Logistique
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <KpiCard 
                title="Taux de Service (OTIF)" 
                value={`${metrics.supply.otif}%`}
                trend={-2.1} 
                trendType="down" 
                icon={<Target size={24} />} 
                color="#F59E0B"
                sparklineData={[{val: 96}, {val: 95.5}, {val: 95}, {val: 94.8}, {val: 94.2}]}
                onDrillDown={() => handleDrillDown('supply_otif')}
              />
              <KpiCard 
                title="Rotation des Stocks" 
                value={`${metrics.supply.rotationStocks}x/an`}
                trend={0.5} 
                trendType="up" 
                icon={<Package size={24} />} 
                color="#8B5CF6"
                sparklineData={[{val: 7.8}, {val: 8.0}, {val: 8.2}, {val: 8.4}, {val: 8.5}]}
              />
              <KpiCard 
                title="Coût Logistique / Cmd" 
                value={formatCurrency(metrics.supply.coutLogistique)}
                trend={-1.5} 
                trendType="up"
                icon={<ArrowDownRight size={24} />} 
                color="#10B981"
                sparklineData={[{val: 15500}, {val: 15400}, {val: 15200}, {val: 15100}, {val: 15000}]}
              />
            </div>
          </div>
        )}

        {/* RESSOURCES HUMAINES */}
        {isHR && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse color="#F43F5E" /> Ressources Humaines
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <KpiCard 
                title="Masse Salariale" 
                value={formatCurrency(metrics.hr.masseSalariale, true)}
                trend={2.4} 
                trendType="up" 
                icon={<Users size={24} />} 
                color="#3B82F6"
                sparklineData={[{val: 110}, {val: 112}, {val: 115}, {val: 118}, {val: 120}]}
              />
              <KpiCard 
                title="Taux de Turnover" 
                value={`${metrics.hr.turnover}%`}
                trend={-0.8} 
                trendType="up" 
                icon={<ActivityIcon size={24} />} 
                color="#10B981"
                sparklineData={[{val: 5.2}, {val: 5.0}, {val: 4.8}, {val: 4.5}, {val: 4.2}]}
              />
              <KpiCard 
                title="Taux d'Absentéisme" 
                value={`${metrics.hr.absenteisme}%`}
                trend={0.3} 
                trendType="down" 
                icon={<AlertTriangle size={24} />} 
                color="#F43F5E"
                sparklineData={[{val: 1.8}, {val: 1.9}, {val: 1.9}, {val: 2.0}, {val: 2.1}]}
              />
            </div>
          </div>
        )}
      </div>

      <DrillDownModal 
        isOpen={!!activeDrillDown} 
        onClose={() => setActiveDrillDown(null)}
        title={activeDrillDown?.title}
        data={activeDrillDown?.data}
        config={activeDrillDown?.config}
      />
    </div>
  );
};

export default GlobalDashboard;
