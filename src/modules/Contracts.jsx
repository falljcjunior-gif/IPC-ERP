import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSignature, 
  Plus, 
  TrendingUp, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Building2,
  Lock,
  Search,
  ArrowRight
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { BarChartComp } from '../components/BusinessCharts';

const Contracts = () => {
  useBusiness();

  const contractsData = [];

  const mrrData = [];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Contrats & Abonnements</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos revenus récurrents et la fidélisation client.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCcw size={18} /> Renouvellements
          </button>
          <button className="btn btn-primary">
            <Plus size={18} /> Nouveau Contrat
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>MRR (REVENU RÉCURRENT)</div>
               <TrendingUp size={18} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>0 FCFA</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 700 }}>0% ce mois</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>TAUX DE CHURN</div>
               <AlertTriangle size={18} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>0%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Stable vs mois dernier</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>CONFORMITÉ SLA</div>
               <CheckCircle2 size={18} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>0%</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 700 }}>Obj: 99.9%</div>
         </div>
      </div>

      <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Croissance du Revenu Récurrent (MRR)</h3>
            <BarChartComp data={mrrData} color="var(--accent)" />
         </div>

         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontWeight: 700 }}>Contrats Stratégiques</h3>
               <button className="btn" style={{ fontSize: '0.75rem' }}>Voir tout</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {contractsData.map(contract => (
                 <div key={contract.id} className="glass" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                       <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileSignature size={20} color="var(--accent)" />
                       </div>
                       <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{contract.titre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Building2 size={12} /> {contract.client}
                          </div>
                       </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{contract.amount.toLocaleString()} FCFA / {contract.type.slice(0, 1)}</div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            background: contract.status === 'Actif' ? '#10B98120' : '#F59E0B20',
                            color: contract.status === 'Actif' ? '#10B981' : '#F59E0B',
                            fontWeight: 700
                          }}>
                             {contract.status}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Contracts;
