import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Layout
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';
import { FunnelChartComp, DonutChartComp } from '../components/BusinessCharts';

import KanbanBoard from '../components/KanbanBoard';

const CRM = ({ onOpenDetail }) => {
   const { data, addRecord, updateRecord } = useBusiness();
   const [view, setView] = useState('kanban'); // 'leads', 'opportunities', 'kanban', 'dashboard'
   const [isModalOpen, setIsModalOpen] = useState(false);
   const { leads, opportunities } = data.crm;
   const contacts = data.base.contacts;

  const stages = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];

  const handleSave = (formData) => {
    const subModule = (view === 'opportunities' || view === 'kanban') ? 'opportunities' : 'leads';
    addRecord('crm', subModule, formData);
  };

  const handleMoveOpportunity = (item, nextCol) => {
    updateRecord('crm', 'opportunities', item.id, { etape: nextCol });
  };

  const funnelData = [
    { name: 'Nouveau', value: opportunities.length + leads.length },
    { name: 'Qualification', value: opportunities.filter(o => o.etape !== 'Nouveau').length },
    { name: 'Proposition', value: opportunities.filter(o => ['Proposition', 'Négociation', 'Gagné'].includes(o.etape)).length },
    { name: 'Gagné', value: opportunities.filter(o => o.etape === 'Gagné').length },
  ];

  const sourceData = [
    { name: 'Site Web', value: leads.filter(l => l.source === 'Site Web').length },
    { name: 'E-mail', value: leads.filter(l => l.source === 'E-mail').length },
    { name: 'Appel entrant', value: leads.filter(l => l.source === 'Appel entrant').length },
    { name: 'Partenaires', value: leads.filter(l => l.source === 'Partenaire').length },
  ];

  const modalFields = (view === 'opportunities' || view === 'kanban') ? [
    { name: 'titre', label: 'Titre de l\'opportunité', required: true, placeholder: 'Ex: Migration Cloud' },
    { name: 'client', label: 'Client / Entreprise', type: 'select', options: contacts.map(c => c.nom), required: true },
    { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'probabilite', label: 'Probabilité (%)', type: 'number', required: true },
    { name: 'etape', label: 'Étape', type: 'select', options: ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'], required: true },
    { name: 'dateCloture', label: 'Date de clôture prévue', type: 'date', required: true },
  ] : [
    { name: 'prenom', label: 'Prénom', required: true },
    { name: 'nom', label: 'Nom', required: true },
    { name: 'entreprise', label: 'Entreprise', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'source', label: 'Source', type: 'select', options: ['Site Web', 'E-mail', 'Appel entrant', 'Conférence', 'Partenaire'], required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Nouveau', 'En cours', 'Assigné', 'Terminé'], required: true },
    { name: 'valeur', label: 'Valeur estimée (FCFA)', type: 'number', required: true },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Conversion Leads" 
          value={`${Math.round((opportunities.length / (leads.length || 1)) * 100)}%`}
          trend={12.5} 
          trendType="up" 
          icon={<Target size={24} />} 
          color="#3B82F6"
          sparklineData={[{val: 10}, {val: 15}, {val: 12}, {val: 18}, {val: 25}]}
        />
        <KpiCard 
          title="Valeur Pipeline" 
          value={`${(opportunities.reduce((sum, o) => sum + o.montant, 0) / 1000).toFixed(1)}k FCFA`}
          trend={8.2} 
          trendType="up" 
          icon={<DollarSign size={24} />} 
          color="#10B981"
          sparklineData={[{val: 30}, {val: 25}, {val: 35}, {val: 45}, {val: 40}]}
        />
        <KpiCard 
          title="Temps Moyen Vente" 
          value="24 Jours"
          trend={5.1} 
          trendType="down" 
          icon={<Calendar size={24} />} 
          color="#F59E0B"
          sparklineData={[{val: 10}, {val: 12}, {val: 9}, {val: 11}, {val: 8}]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Entonnoir de Ventes</h3>
          <FunnelChartComp data={funnelData} />
        </div>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Sources des Leads</h3>
          <DonutChartComp data={sourceData} />
        </div>
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {opportunities.map((opp) => (
        <motion.div
           key={opp.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(opp, 'crm', 'opportunities')}
           className="glass"
           style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: '1rem', 
              background: 'var(--accent)15', 
              color: 'var(--accent)', 
              fontSize: '0.75rem', 
              fontWeight: 600 
            }}>
              {opp.etape}
            </span>
            <MoreVertical size={16} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{opp.titre}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <Building2 size={14} /> {opp.client}
          </div>
          
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valeur</div>
               <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{opp.montant.toLocaleString()} FCFA</div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Probabilité</div>
               <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{opp.probabilite}%</div>
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ 
          padding: '1.5rem', 
          borderRadius: '1.25rem', 
          border: '2px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          cursor: 'pointer',
          color: 'var(--text-muted)'
        }}
      >
        <Plus size={32} />
        <span>Nouvelle Opportunité</span>
      </motion.div>
    </div>
  );

  const renderKanban = () => (
    <KanbanBoard 
      columns={stages}
      items={opportunities}
      columnMapping="etape"
      onMove={handleMoveOpportunity}
      onItemClick={(item) => onOpenDetail(item, 'crm', 'opportunities')}
      onAddClick={() => setIsModalOpen(true)}
      renderCardContent={(item) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
            {item.titre}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Building2 size={12} /> {item.client}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 800 }}>{item.montant.toLocaleString()} FCFA</div>
            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.probabilite}%</div>
          </div>
        </div>
      )}
    />
  );

  const renderLeads = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem' }}>Nom</th>
            <th style={{ padding: '1rem 1.5rem' }}>Entreprise</th>
            <th style={{ padding: '1rem 1.5rem' }}>Source</th>
            <th style={{ padding: '1rem 1.5rem' }}>Statut</th>
            <th style={{ padding: '1rem 1.5rem' }}>Email</th>
            <th style={{ padding: '1rem 1.5rem' }}>Valeur</th>
            <th style={{ padding: '1rem 1.5rem' }}></th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {leads.map((lead) => (
            <tr key={lead.id} onClick={() => onOpenDetail(lead, 'crm', 'leads')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <td style={{ padding: '1rem 1.5rem' }}>{lead.prenom} {lead.nom}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{lead.entreprise}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{lead.source}</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  background: 'var(--accent)10', 
                  color: 'var(--accent)',
                  fontSize: '0.75rem'
                }}>
                  {lead.statut}
                </span>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}>{lead.email}</td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{lead.valeur.toLocaleString()} FCFA</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                 <MoreVertical size={16} color="var(--text-muted)" />
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion CRM</h1>
          <p style={{ color: 'var(--text-muted)' }}>Suivez vos prospects et transformez vos opportunités.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.75rem',
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
              onClick={() => setView('kanban')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'kanban' ? 'var(--bg)' : 'transparent',
                color: view === 'kanban' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Layout size={16} /> Kanban
            </button>
            <button 
              onClick={() => setView('opportunities')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'opportunities' ? 'var(--bg)' : 'transparent',
                color: view === 'opportunities' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Détail
            </button>
            <button 
              onClick={() => setView('leads')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'leads' ? 'var(--bg)' : 'transparent',
                color: view === 'leads' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Pistes
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau {view === 'leads' ? 'Prospect' : 'Dossier'}
          </button>
        </div>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'opportunities' && renderOpportunities()}
      {view === 'kanban' && renderKanban()}
      {view === 'leads' && renderLeads()}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'opportunities' ? "Nouvelle Opportunité" : "Nouveau Prospect"}
        fields={modalFields}
      />
    </div>
  );
};

export default CRM;
