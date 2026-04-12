import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight,
  UserPlus,
  Lock,
  Eye,
  MoreVertical,
  Tally3,
  Trash2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const UserManagement = () => {
  const { data, permissions, updateUserRole, toggleModuleAccess, createFullUser, deleteFullUser, currentUser } = useBusiness();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Extract users from hr.employees
  const users = data.hr?.employees || [];
  
  // All possible modules (tabs)
  const allModules = [
    { id: 'home', label: 'Tableau de Bord', category: 'Cœur' },
    { id: 'crm', label: 'CRM', category: 'Cœur' },
    { id: 'sales', label: 'Ventes', category: 'Cœur' },
    { id: 'marketing', label: 'Marketing', category: 'Cœur' },
    { id: 'inventory', label: 'Stocks', category: 'Opérations' },
    { id: 'production', label: 'Projets Prod', category: 'Opérations' },
    { id: 'manufacturing', label: 'Manufacturing', category: 'Opérations' },
    { id: 'purchase', label: 'Achats', category: 'Opérations' },
    { id: 'fleet', label: 'Parc Auto', category: 'Opérations' },
    { id: 'quality', label: 'Qualité', category: 'Opérations' },
    { id: 'accounting', label: 'Comptabilité', category: 'Finance' },
    { id: 'expenses', label: 'Frais', category: 'Finance' },
    { id: 'budget', label: 'Budget', category: 'Finance' },
    { id: 'contracts', label: 'Contrats', category: 'Finance' },
    { id: 'bi', label: 'Analyses BI', category: 'Finance' },
    { id: 'analytics', label: 'Enterprise BI', category: 'Finance' },
    { id: 'hr', label: 'RH', category: 'Collaboration' },
    { id: 'timesheets', label: 'Temps', category: 'Collaboration' },
    { id: 'projects', label: 'Projets Collab', category: 'Collaboration' },
    { id: 'calendar', label: 'Agenda', category: 'Collaboration' },
    { id: 'planning', label: 'Planning Global', category: 'Collaboration' },
    { id: 'dms', label: 'G.E.D', category: 'Collaboration' },
    { id: 'helpdesk', label: 'Helpdesk', category: 'Collaboration' },
    { id: 'masterdata', label: 'Données Maîtres', category: 'Config' },
    { id: 'studio', label: 'IPC Studio', category: 'Config' },
    { id: 'settings', label: 'Paramètres', category: 'Config' },
    { id: 'staff_portal', label: 'Espace Collaborateur', category: 'Staff' },
    { id: 'user_management', label: 'Gestion Utilisateurs', category: 'Admin' },
  ];

  const roles = [
    { id: 'SUPER_ADMIN', label: 'Super Administrateur', color: '#EF4444' },
    { id: 'ADMIN', label: 'Administrateur', color: '#3B82F6' },
    { id: 'MANAGER', label: 'Manager', color: '#F59E0B' },
    { id: 'STAFF', label: 'Collaborateur', color: '#10B981' },
    { id: 'SALES', label: 'Commercial', color: '#8B5CF6' }
  ];

  const filteredUsers = users.filter(u => 
    u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.poste.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (formData) => {
    setIsCreating(true);
    setSaveStatus({ type: 'info', message: 'Création du compte Firebase...' });
    try {
      await createFullUser(formData);
      setSaveStatus({ type: 'success', message: 'Compte créé avec succès !' });
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus({ type: '', message: '' });
      }, 1500);
    } catch (error) {
      setSaveStatus({ type: 'error', message: `Erreur: ${error.message}` });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte administrateur.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.")) {
      try {
        await deleteFullUser(userId);
        setSelectedUser(null);
        alert("Utilisateur supprimé avec succès.");
      } catch (error) {
        alert("Erreur lors de la suppression : " + error.message);
      }
    }
  };

  const modalFields = [
    { name: 'nom', label: 'Nom Complet', required: true },
    { name: 'email', label: 'Email Professionnel', type: 'email', required: true, placeholder: 'raphael@ipcerp.com' },
    { name: 'password', label: 'Mot de passe initial', type: 'password', required: true, placeholder: 'Min 6 caractères' },
    { name: 'poste', label: 'Poste / Fonction', required: true },
    { name: 'dept', label: 'Département', type: 'select', options: ['IT', 'Ventes', 'RH', 'Finance', 'Production', 'Marketing'], required: true },
    { name: 'manager', label: 'Manager / Responsable', required: true },
    { name: 'avatar', label: 'Initiales (Avatar)', required: true, placeholder: 'Ex: JD' },
    { name: 'role', label: 'Rôle Système', type: 'select', options: ['STAFF', 'ADMIN', 'MANAGER', 'SALES'], required: true },
  ];

  const getPermissions = (userId) => {
    return permissions[userId] || { roles: ['STAFF'], allowedModules: [] };
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={32} color="var(--accent)" />
            Centre de Contrôle
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Gérez les rôles et les accès granulaires aux modules de l'entreprise.</p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={20} /> Nouvel Utilisateur
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* User List Panel */}
        <section className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un membre..." 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 3rem', 
                  borderRadius: '1rem', 
                  background: 'var(--bg-subtle)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none'
                }} 
              />
            </div>
          </div>
          
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredUsers.map(user => {
              const userPerms = getPermissions(user.id);
              const isActive = selectedUser?.id === user.id;
              const roleInfo = roles.find(r => r.id === userPerms.roles[0]) || roles[3];

              return (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer',
                    transition: '0.2s',
                    background: isActive ? 'var(--accent)10' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{ 
                    width: '45px', height: '45px', borderRadius: '12px', background: 'var(--primary)', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 
                  }}>
                    {user.avatar || user.nom[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.nom}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.poste}</div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.5rem',
                    background: `${roleInfo.color}20`,
                    color: roleInfo.color,
                    textTransform: 'uppercase'
                  }}>
                    {roleInfo.label.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Permissions Panel */}
        <section style={{ height: '100%' }}>
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div 
                key={selectedUser.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass"
                style={{ borderRadius: '1.5rem', padding: '2rem', height: '100%' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '80px', height: '80px', borderRadius: '20px', background: 'var(--primary)', 
                      fontSize: '2rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 
                    }}>
                      {selectedUser.avatar || selectedUser.nom[0]}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{selectedUser.nom}</h2>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{selectedUser.dept} • {selectedUser.poste}</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                        <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>Actif</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleDelete(selectedUser.id)}
                      className="btn" 
                      style={{ 
                        background: '#EF444415', 
                        color: '#EF4444', 
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.75rem'
                      }}
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button className="btn" style={{ background: 'var(--bg-subtle)', padding: '0.5rem' }}><MoreVertical size={20} /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                  <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                     <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={14} /> Rôle Principal
                     </div>
                     <select 
                      value={getPermissions(selectedUser.id).roles[0]}
                      onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                      style={{ 
                        width: '100%', padding: '0.75rem', borderRadius: '0.75rem', 
                        background: 'var(--bg)', border: '1px solid var(--border)', 
                        color: 'var(--text)', fontWeight: 600, outline: 'none' 
                      }}
                     >
                        {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                     </select>
                  </div>
                  <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                     <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={14} /> Niveau d'Accès
                     </div>
                     <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '75%', height: '100%', background: 'var(--accent)' }} />
                        </div>
                        <span style={{ fontWeight: 800 }}>Confirme</span>
                     </div>
                  </div>
                </div>

                <div>
                   <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Accès aux Onglets (Graine d'accès)</span>
                      <span>{getPermissions(selectedUser.id).allowedModules.length} Modules activés</span>
                   </div>

                   <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                     gap: '1rem',
                     maxHeight: '400px',
                     overflowY: 'auto',
                     padding: '0.5rem'
                   }}>
                      {allModules.map(module => {
                        const hasAccess = getPermissions(selectedUser.id).allowedModules.includes(module.id);
                        return (
                          <div 
                            key={module.id}
                            onClick={() => toggleModuleAccess(selectedUser.id, module.id)}
                            style={{ 
                              padding: '1rem', 
                              borderRadius: '1rem', 
                              background: hasAccess ? 'var(--accent)10' : 'var(--bg-subtle)',
                              border: hasAccess ? '2px solid var(--accent)' : '2px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: '0.2s'
                            }}
                          >
                            {hasAccess ? <CheckCircle2 size={20} color="var(--accent)" /> : <XCircle size={20} color="var(--text-muted)" />}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: hasAccess ? 'var(--text)' : 'var(--text-muted)' }}>{module.label}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{module.category}</div>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </motion.div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-subtle)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                }}>
                  <Users size={48} opacity={0.3} />
                </div>
                <h3>Sélectionnez un membre</h3>
                <p>Pour gérer ses permissions et son rôle dans l'ERP.</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Nouvel Utilisateur"
        fields={modalFields}
        isLoading={isCreating}
      >
        {saveStatus.message && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: '0.8rem', 
            background: saveStatus.type === 'error' ? '#EF444415' : saveStatus.type === 'success' ? '#10B98115' : 'var(--accent)15',
            color: saveStatus.type === 'error' ? '#EF4444' : saveStatus.type === 'success' ? '#10B981' : 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            {saveStatus.message}
          </div>
        )}
      </RecordModal>
    </div>
  );
};

export default UserManagement;
