import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Plus, MapPin, Fuel, Wrench, AlertTriangle, 
  CheckCircle2, Clock, BarChart3, Navigation, Car,
  Calendar, Shield, TrendingUp, X
} from 'lucide-react';
import { useStore } from '../../store';

const FLEET_STATUS_COLORS = {
  'Disponible':  { bg: '#10B98115', color: '#10B981' },
  'En mission':  { bg: '#3B82F615', color: '#3B82F6' },
  'Maintenance': { bg: '#F59E0B15', color: '#F59E0B' },
  'Hors service':{ bg: '#EF444415', color: '#EF4444' },
};

const TABS = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <BarChart3 size={16} /> },
  { id: 'vehicles',  label: 'Véhicules',       icon: <Car size={16} /> },
  { id: 'missions',  label: 'Missions',         icon: <Navigation size={16} /> },
  { id: 'maintenance', label: 'Maintenance',    icon: <Wrench size={16} /> },
];

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ color, background: `${color}15`, padding: '8px', borderRadius: '10px' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

const FleetHub = ({ onOpenDetail, accessLevel }) => {
  const fleetData = useStore(state => state.data.fleet);
  const data = useStore(state => state.data); // Keep for cross-module fallback if needed, but fleetData is preferred
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const formatCurrency = useStore(state => state.formatCurrency);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ immatriculation: '', marque: '', modele: '', type: 'Camion', statut: 'Disponible', chauffeur: '', kmActuel: 0, prochainVidange: '' });
  const [newMission, setNewMission] = useState({ titre: '', vehiculeId: '', chauffeur: '', depart: '', arrivee: '', dateMission: '', statut: 'Planifiée' });

  const vehicles = useMemo(() => data?.fleet?.vehicles || [], [data?.fleet?.vehicles]);
  const missions = useMemo(() => data?.fleet?.missions || [], [data?.fleet?.missions]);
  const maintenances = useMemo(() => data?.fleet?.maintenances || [], [data?.fleet?.maintenances]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    disponibles: vehicles.filter(v => v.statut === 'Disponible').length,
    enMission: vehicles.filter(v => v.statut === 'En mission').length,
    maintenance: vehicles.filter(v => v.statut === 'Maintenance').length,
    kmTotal: vehicles.reduce((s, v) => s + Number(v.kmActuel || 0), 0),
  }), [vehicles]);

  const handleAddVehicle = () => {
    addRecord('fleet', 'vehicles', { ...newVehicle, id: `VEH-${Date.now()}`, createdAt: new Date().toISOString() });
    setShowVehicleModal(false);
    setNewVehicle({ immatriculation: '', marque: '', modele: '', type: 'Camion', statut: 'Disponible', chauffeur: '', kmActuel: 0, prochainVidange: '' });
  };

  const handleAddMission = () => {
    addRecord('fleet', 'missions', { ...newMission, id: `MIS-${Date.now()}`, createdAt: new Date().toISOString() });
    setShowMissionModal(false);
    setNewMission({ titre: '', vehiculeId: '', chauffeur: '', depart: '', arrivee: '', dateMission: '', statut: 'Planifiée' });
  };

  const inputStyle = { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', width: '100%' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={14} /> Fleet Management
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Gestion Flotte</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Suivi temps-réel de vos véhicules, missions et maintenance.
          </p>
        </div>
        {accessLevel !== 'read' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowMissionModal(true)} className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={16} /> Nouvelle Mission
            </button>
            <button onClick={() => setShowVehicleModal(true)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Ajouter Véhicule
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.75rem 1.25rem', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.2s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <StatCard icon={<Car size={20} />} label="Total Véhicules" value={stats.total} color="#F59E0B" sub={`${stats.disponibles} disponibles`} />
            <StatCard icon={<CheckCircle2 size={20} />} label="En Mission" value={stats.enMission} color="#3B82F6" />
            <StatCard icon={<Wrench size={20} />} label="En Maintenance" value={stats.maintenance} color="#EF4444" sub="À planifier" />
            <StatCard icon={<Navigation size={20} />} label="KM Total Fleet" value={stats.kmTotal.toLocaleString('fr-FR')} color="#10B981" sub="kilométrage cumulé" />
          </div>

          {vehicles.length === 0 && (
            <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
              <Truck size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Aucun véhicule enregistré</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Ajoutez votre premier véhicule pour commencer le suivi de flotte.</p>
              {accessLevel !== 'read' && <button onClick={() => setShowVehicleModal(true)} className="btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}>+ Ajouter un Véhicule</button>}
            </div>
          )}

          {vehicles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {vehicles.slice(0, 6).map(v => {
                const colors = FLEET_STATUS_COLORS[v.statut] || FLEET_STATUS_COLORS['Disponible'];
                return (
                  <motion.div key={v.id} whileHover={{ scale: 1.02 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onOpenDetail?.(v, 'fleet', 'vehicles')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{v.immatriculation}</div>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, ...colors }}>{v.statut}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.marque} {v.modele}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{v.type} · {Number(v.kmActuel || 0).toLocaleString('fr-FR')} km</div>
                    {v.chauffeur && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Chauffeur: {v.chauffeur}</div>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {['Immatriculation', 'Marque / Modèle', 'Type', 'Statut', 'Km', 'Chauffeur', 'Prochain Vidange'].map(h => (
                    <th key={h} style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun véhicule. Ajoutez-en un via le bouton ci-dessus.</td></tr>
                )}
                {vehicles.map(v => {
                  const colors = FLEET_STATUS_COLORS[v.statut] || FLEET_STATUS_COLORS['Disponible'];
                  return (
                    <tr key={v.id} onClick={() => onOpenDetail?.(v, 'fleet', 'vehicles')} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} className="glass-hover">
                      <td style={{ padding: '1rem', fontWeight: 800, fontSize: '0.9rem' }}>{v.immatriculation}</td>
                      <td style={{ padding: '1rem' }}>{v.marque} {v.modele}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{v.type}</td>
                      <td style={{ padding: '1rem' }}><span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, ...colors }}>{v.statut}</span></td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{Number(v.kmActuel || 0).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{v.chauffeur || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{v.prochainVidange || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {missions.length === 0 && (
            <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
              <Navigation size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Aucune mission planifiée</p>
              {accessLevel !== 'read' && <button onClick={() => setShowMissionModal(true)} className="btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}>Créer une Mission</button>}
            </div>
          )}
          {missions.map(m => (
            <div key={m.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{m.titre}</div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span>🚀 {m.depart}</span>
                  <span>📍 {m.arrivee}</span>
                  <span>📅 {m.dateMission}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: m.statut === 'Terminée' ? '#10B98115' : m.statut === 'En cours' ? '#3B82F615' : '#F59E0B15', color: m.statut === 'Terminée' ? '#10B981' : m.statut === 'En cours' ? '#3B82F6' : '#F59E0B' }}>{m.statut}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.chauffeur}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: maintenances.length === 0 ? 'center' : 'left' }}>
            {maintenances.length === 0 ? (
              <>
                <Wrench size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Aucune maintenance planifiée</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Les alertes de maintenance apparaîtront ici automatiquement.</p>
              </>
            ) : (
              <p>Historique maintenance disponible.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal: Nouveau Véhicule */}
      <AnimatePresence>
        {showVehicleModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVehicleModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ajouter un Véhicule</h2>
                <button onClick={() => setShowVehicleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Immatriculation', key: 'immatriculation' },
                  { label: 'Marque', key: 'marque' },
                  { label: 'Modèle', key: 'modele' },
                  { label: 'Chauffeur Attitré', key: 'chauffeur' },
                  { label: 'Kilométrage Actuel', key: 'kmActuel', type: 'number' },
                  { label: 'Prochain Vidange', key: 'prochainVidange', type: 'date' },
                ].map(({ label, key, type = 'text' }) => (
                  <div key={key}>
                    <div style={labelStyle}>{label}</div>
                    <input type={type} value={newVehicle[key]} onChange={e => setNewVehicle(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <div style={labelStyle}>Type</div>
                  <select value={newVehicle.type} onChange={e => setNewVehicle(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    {['Camion', 'Berline', 'SUV', 'Minibus', 'Utilitaire', 'Moto'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Statut Initial</div>
                  <select value={newVehicle.statut} onChange={e => setNewVehicle(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                    {Object.keys(FLEET_STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowVehicleModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
                <button onClick={handleAddVehicle} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700 }}>Enregistrer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Nouvelle Mission */}
      <AnimatePresence>
        {showMissionModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMissionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Créer une Mission</h2>
                <button onClick={() => setShowMissionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Titre de la Mission', key: 'titre' },
                  { label: 'Lieu de Départ', key: 'depart' },
                  { label: 'Destination', key: 'arrivee' },
                  { label: 'Chauffeur', key: 'chauffeur' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div style={labelStyle}>{label}</div>
                    <input value={newMission[key]} onChange={e => setNewMission(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <div style={labelStyle}>Date de Mission</div>
                  <input type="date" value={newMission.dateMission} onChange={e => setNewMission(p => ({ ...p, dateMission: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Véhicule</div>
                  <select value={newMission.vehiculeId} onChange={e => setNewMission(p => ({ ...p, vehiculeId: e.target.value }))} style={inputStyle}>
                    <option value="">— Sélectionner un véhicule —</option>
                    {vehicles.filter(v => v.statut === 'Disponible').map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowMissionModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
                <button onClick={handleAddMission} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700 }}>Lancer Mission</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FleetHub;
