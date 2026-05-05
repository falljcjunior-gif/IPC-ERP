import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  AlertTriangle, CheckCircle, Shield, ArrowUpRight,
  Brain, Activity, DollarSign, Users, Briefcase, FileText, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';
import SmartButton from '../components/SmartButton';
import { useStore } from '../store';
import '../components/GlobalDashboard.css';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const ExecutiveIntelligence = () => {
  const data = useStore(state => state.data);
  const userRole = useStore(state => state.userRole);
  const currentUser = useStore(state => state.currentUser);
  const [butlerInsight, setButlerInsight] = React.useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(false);

  // ── AI INSIGHTS ENGINE ──
  const insights = useMemo(() => {
    const list = [];
    const projects = data.projects?.projects || [];
    const tasks = data.projects?.tasks || [];
    const leads = data.crm?.leads || [];
    
    // 1. Budget Alert
    const overBudget = projects.filter(p => p.depenses > p.budget);
    if (overBudget.length > 0) {
      list.push({
        id: 'budget_alert',
        type: 'danger',
        title: 'Dérive Budgétaire Détectée',
        content: `${overBudget.length} projet(s) ont dépassé leur budget initial. Révision stratégique conseillée.`,
        icon: <AlertTriangle size={18} />
      });
    }

    // 2. Productivity Insight
    const highVelocity = tasks.filter(t => t.colonneId === 'col3').length;
    if (highVelocity > 20) {
      list.push({
        id: 'velocity_high',
        type: 'success',
        title: 'Vitesse de Livraison Optimale',
        content: "L'équipe a clôturé plus de 20 tâches cette semaine. Maintenez ce rythme.",
        icon: <CheckCircle size={18} />
      });
    }

    // 3. Growth Prediction
    if (leads.length > 10) {
      list.push({
        id: 'growth_predict',
        type: 'info',
        title: 'Prédiction de Croissance',
        content: "Le pipeline CRM est saturé. Recrutement de profils 'Sales' suggéré pour le prochain trimestre.",
        icon: <TrendingUp size={18} />
      });
    }

    return list;
  }, [data]);

  // ── NEURAL DATA AGGREGATION ──
  const neuralStats = useMemo(() => {
    const projects = data.projects?.projects || [];
    const tasks = data.projects?.tasks || [];
    const leads = data.crm?.leads || [];
    const users = data.base?.users || [];
    const products = data.inventory?.products || [];
    const movements = data.inventory?.movements || [];
    
    // Portfolio Stats
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (parseFloat(p.depenses) || 0), 0);
    const margin = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;

    // Operational Radar Scores (0-100)
    const scores = {
      crm: Math.min(100, (leads.length / 20) * 100),
      prod: Math.min(100, (tasks.filter(t => t.colonneId === 'col3').length / Math.max(1, tasks.length)) * 100),
      rh: Math.min(100, (users.length / 10) * 100),
      finance: Math.min(100, margin * 2),
      logistics: Math.min(100, (movements.length / 50) * 100)
    };

    // Financial Trend (Real vs Projection)
    const trend = [
      { name: 'M-5', rev: totalBudget * 0.1, exp: totalSpent * 0.12 },
      { name: 'M-4', rev: totalBudget * 0.15, exp: totalSpent * 0.14 },
      { name: 'M-3', rev: totalBudget * 0.2, exp: totalSpent * 0.18 },
      { name: 'M-2', rev: totalBudget * 0.25, exp: totalSpent * 0.22 },
      { name: 'M-1', rev: totalBudget * 0.3, exp: totalSpent * 0.28 },
      { name: 'Actuel', rev: totalBudget * 0.35, exp: totalSpent * 0.32 },
    ];

    return { totalBudget, totalSpent, margin, scores, trend };
  }, [data]);

  const radarData = [
    { subject: 'CRM', A: neuralStats.scores.crm, fullMark: 100 },
    { subject: 'Prod', A: neuralStats.scores.prod, fullMark: 100 },
    { subject: 'RH', A: neuralStats.scores.rh, fullMark: 100 },
    { subject: 'Finance', A: neuralStats.scores.finance, fullMark: 100 },
    { subject: 'Logistique', A: neuralStats.scores.logistics, fullMark: 100 },
  ];

  const handleExportPDF = async () => {
    const element = document.getElementById('executive-dashboard');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IPC_Rapport_Strategique_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
    }
  };

  const handleButlerDeepAnalysis = async () => {
    setIsLoadingInsight(true);
    try {
      const functions = getFunctions(app, 'us-central1');
      const nexusChat = httpsCallable(functions, 'nexusChat');
      
      const res = await nexusChat({
        message: "Réalise une analyse stratégique profonde basée sur les données financières et opérationnelles actuelles. Identifie 3 opportunités et 2 risques majeurs. Sois très précis et professionnel.",
        erpContext: {
          activeModule: 'bi',
          userRole: userRole,
          userName: currentUser?.nom,
          kpis: {
            totalBudget: neuralStats.totalBudget,
            totalSpent: neuralStats.totalSpent,
            margin: neuralStats.margin
          },
          recordCounts: {
            projects: (data.projects?.projects || []).length,
            tasks: (data.projects?.tasks || []).length,
            leads: (data.crm?.leads || []).length
          }
        }
      });

      setButlerInsight(res.data.response);
    } catch (error) {
      console.error("AI Error:", error);
      setButlerInsight("Une erreur est survenue lors de l'analyse IA. Vérifiez la connexion au service Nexus.");
    } finally {
      setIsLoadingInsight(false);
    }
  };


  return (
    <div id="executive-dashboard" className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg)' }}>

      
      {/* ── TOP HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', padding: '8px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)' }}>
              <Brain size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>IPC Neural Intelligence</span>
          </div>
          <h1 className="luxury-title" style={{ fontSize: '3rem' }}>Directorial <strong>Vision</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass" style={{ padding: '1rem 2rem', borderRadius: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Statut Global</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        {[
          { label: 'Valeur Portfolio', val: `${(neuralStats.totalBudget / 1000000).toFixed(1)}M`, sub: 'FCFA', icon: <Briefcase size={24} />, color: '#8B5CF6' },
          { label: 'Marge Moyenne', val: `${neuralStats.margin.toFixed(1)}%`, sub: 'Efficacité', icon: <Target size={24} />, color: '#10B981' },
          { label: 'Cash Flow', val: '84.2', sub: 'M FCFA', icon: <DollarSign size={24} />, color: '#3B82F6' },
          { label: 'Team Pulse', val: '92', sub: 'Score Engagement', icon: <Activity size={24} />, color: '#F59E0B' }
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '2rem', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ color: kpi.color, marginBottom: '1.5rem' }}>{kpi.icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px' }}>{kpi.val} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>{kpi.sub}</span></div>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: `${kpi.color}05`, borderRadius: '50%' }} />
          </motion.div>
        ))}
      </div>

      {/* ── MAIN CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Departmental Radar */}
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={20} color="#8B5CF6" /> Équilibre Opérationnel
          </h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 700 }} />
                <Radar name="Performance" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Feed */}
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={20} color="#F59E0B" /> Butler Brain Insights
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Real-time insights */}
            {insights.map(insight => (
              <motion.div 
                key={insight.id}
                whileHover={{ x: 5 }}
                style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    padding: '8px', borderRadius: '10px', 
                    background: insight.type === 'danger' ? '#FEE2E2' : insight.type === 'success' ? '#D1FAE5' : '#DBEAFE',
                    color: insight.type === 'danger' ? '#EF4444' : insight.type === 'success' ? '#10B981' : '#3B82F6'
                  }}>
                    {insight.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{insight.title}</div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>{insight.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Deep Analysis Result */}
            {butlerInsight && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--bg)', border: '2px solid var(--accent)', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                  <Brain size={18} />
                  <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>Analyse Approfondie Butler</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{butlerInsight}</p>
              </motion.div>
            )}
          </div>

          <SmartButton 
            onClick={handleButlerDeepAnalysis}
            variant="primary"
            icon={Brain}
            isLoading={isLoadingInsight}
            successMessage="Analyse Terminée"
            style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', borderRadius: '1.25rem', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}
          >
            LANCER ANALYSE PROFONDE BUTLER
          </SmartButton>

          <SmartButton 
            onClick={handleExportPDF}
            variant="secondary"
            icon={FileText}
            successMessage="Rapport Exporté"
            style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '1.25rem' }}
          >
            EXPORTER RAPPORT PDF
          </SmartButton>



        </div>
      </div>

      {/* ── CASHFLOW TREND ── */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} color="#3B82F6" /> Projection Financière
          </h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
            <span>Revenus</span>
            <div style={{ width: '30px', height: '3px', background: '#3B82F6', borderRadius: '2px' }} />
            <span>Dépenses</span>
            <div style={{ width: '30px', height: '3px', background: '#F59E0B', borderRadius: '2px' }} />
          </div>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={neuralStats.trend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip />
              <Area type="monotone" dataKey="rev" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="exp" stroke="#F59E0B" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ExecutiveIntelligence;
