import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CreditCard, 
  PieChart, 
  Plus, 
  Search, 
  Download, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  Layout
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';
import { BarChartComp } from '../components/BusinessCharts';

const Accounting = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'invoices', 'treasury', 'dashboard', 'taxes', 'immo'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { invoices, treasury } = data.finance;

  const cashFlowData = [
    { name: 'Jan', value: 34000 },
    { name: 'Fév', value: -12000 },
    { name: 'Mar', value: 28000 },
    { name: 'Avr', value: -15000 },
    { name: 'Mai', value: 45000 },
    { name: 'Juin', value: 22000 },
  ];

  const handleSave = (formData) => {
    const subModule = view === 'invoices' ? 'invoices' : 'treasury';
    addRecord('finance', subModule, formData);
  };

  const modalFields = view === 'invoices' ? [
    { name: 'num', label: 'Numéro de Facture', required: true, placeholder: 'Ex: FACT-2026-X' },
    { name: 'client', label: 'Client', required: true },
    { name: 'echeance', label: 'Date d\'échéance', type: 'date', required: true },
    { name: 'montant', label: 'Montant TTC (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'En attente', 'Payé', 'Annulé'], required: true },
  ] : [
    { name: 'libelle', label: 'Libellé de l\'opération', required: true },
    { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'date', label: 'Date de l\'opération', type: 'date', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['Encaissement', 'Décaissement', 'Virement'], required: true },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Solde Trésorerie" 
          value={`${(treasury.reduce((sum, item) => sum + item.montant, 0) / 1000).toFixed(1)}k FCFA`}
          trend={4.2} 
          trendType="up" 
          icon={<DollarSign size={24} />} 
          color="#10B981"
          sparklineData={cashFlowData.map(d => ({ val: d.value }))}
        />
        <KpiCard 
          title="Créances Clients" 
          value={`${(invoices.filter(i => i.statut !== 'Payé').reduce((sum, i) => sum + i.montant, 0) / 1000).toFixed(1)}k FCFA`}
          trend={2.1} 
          trendType="down" 
          icon={<FileText size={24} />} 
          color="#3B82F6"
          sparklineData={[{val: 50}, {val: 48}, {val: 52}, {val: 45}, {val: 42}]}
        />
        <KpiCard 
          title="Délai de Paiement" 
          value="18 Jours"
          trend={1.2} 
          trendType="down" 
          icon={<Calendar size={24} />} 
          color="#F59E0B"
          sparklineData={[{val: 20}, {val: 19}, {val: 21}, {val: 18}, {val: 18}]}
        />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Flux de Trésorerie Mensuels</h3>
        <BarChartComp data={cashFlowData} color="#3B82F6" />
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem' }}>N° Facture</th>
            <th style={{ padding: '1rem 1.5rem' }}>Client</th>
            <th style={{ padding: '1rem 1.5rem' }}>Échéance</th>
            <th style={{ padding: '1rem 1.5rem' }}>Montant</th>
            <th style={{ padding: '1rem 1.5rem' }}>Statut</th>
            <th style={{ padding: '1rem 1.5rem' }}></th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {invoices.map((inv) => (
            <tr key={inv.id} onClick={() => onOpenDetail(inv, 'finance', 'invoices')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{inv.num}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{inv.client}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{inv.echeance}</td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{inv.montant.toLocaleString()} FCFA</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  background: inv.statut === 'Payé' ? '#10B98115' : '#F59E0B15', 
                  color: inv.statut === 'Payé' ? '#10B981' : '#F59E0B',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {inv.statut}
                </span>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <Download size={18} color="var(--text-muted)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Comptabilité & Finance</h1>
          <p style={{ color: 'var(--text-muted)' }}>Maîtrisez votre trésorerie et vos factures clients.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.8rem',
            border: '1px solid var(--border)' 
          }}>
             <button 
              onClick={() => setView('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'dashboard' ? 'var(--bg)' : 'transparent',
                color: view === 'dashboard' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <BarChart3 size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setView('invoices')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'invoices' ? 'var(--bg)' : 'transparent',
                color: view === 'invoices' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Layout size={16} /> Factures
            </button>
            <button onClick={() => setView('treasury')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'treasury' ? 'var(--bg)' : 'transparent', color: view === 'treasury' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Trésorerie</button>
            <button onClick={() => setView('taxes')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'taxes' ? 'var(--bg)' : 'transparent', color: view === 'taxes' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Taxes</button>
            <button onClick={() => setView('immo')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'immo' ? 'var(--bg)' : 'transparent', color: view === 'immo' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Immos</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'invoices' && renderInvoices()}
      {view === 'treasury' && (
        <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Mouvements de trésorerie détaillés...</p>
        </div>
      )}

      {view === 'taxes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {(data?.base?.taxes || []).map((tax, idx) => (
            <div key={tax?.id || idx} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{tax?.label || 'Taxe sans nom'}</h3>
                {tax?.default && <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Défaut</span>}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {((tax?.rate || 0) * 100).toFixed(1)}%
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Identifiant : {tax?.id || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'immo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { id: '1', item: 'Serveur Calcul Intense', date: '2025-10-12', purchase: 12000, current: 8500, years: 5 },
            { id: '2', item: 'Mobilier Bureau (Lot 10)', date: '2026-01-20', purchase: 4500, current: 4200, years: 10 },
            { id: '3', item: 'Véhicule Direction', date: '2024-05-15', purchase: 35000, current: 22000, years: 5 },
          ].map(im => (
            <div key={im.id} className="glass" style={{ padding: '1.5rem 2rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{im.item}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Acquis le {im.date} • Amortissement {im.years} ans</div>
               </div>
               <div style={{ display: 'flex', gap: '3rem', textAlign: 'right' }}>
                  <div>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>V. Acquisition</div>
                     <div style={{ fontWeight: 600 }}>{im.purchase.toLocaleString()} FCFA</div>
                  </div>
                  <div>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>V. Comptable Net</div>
                     <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>{im.current.toLocaleString()} FCFA</div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Nouveau Document"
        fields={modalFields}
      />
    </div>
  );
};

export default Accounting;
