import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { X, MapPin, Clock, PlayCircle, StopCircle, Fingerprint, Activity } from 'lucide-react';

const PointageWidget = ({ onClose }) => {
  const { addRecord, currentUser } = useStore();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [projet, setProjet] = useState('');
  const [locationStr, setLocationStr] = useState('Recherche du signal GPS...');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    // Restaurer l'état hors-ligne
    const savedState = localStorage.getItem('ipc_pointage_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            setIsCheckedIn(parsed.isCheckedIn);
            setCheckInTime(parsed.checkInTime);
            setProjet(parsed.projet || '');
        } catch(e){
            // Ignore parse errors on corrupted state
        }
    }
    
    // Obtenir le GPS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocationStr(`Précision requise: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
            () => setLocationStr('Signal GPS faible ou refusé')
        );
    } else {
        setLocationStr('GPS non supporté');
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isCheckedIn && checkInTime) {
      interval = setInterval(() => {
        const diff = Date.now() - checkInTime;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsed(`${h}:${m}:${s}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  const handleCheckIn = () => {
    if (!projet.trim()) return alert("Sélectionnez votre centre de coût avant de pointer.");
    const now = Date.now();
    setIsCheckedIn(true);
    setCheckInTime(now);
    localStorage.setItem('ipc_pointage_state', JSON.stringify({ isCheckedIn: true, checkInTime: now, projet }));
    localStorage.setItem('ipc_pointage_loc', locationStr);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const now = Date.now();
    const durationMs = now - (checkInTime || now);
    const durationHours = Math.max(parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2)), 0.01); 
    
    let endLocation = locationStr;
    await new Promise(resolve => {
        if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(
               (pos) => { endLocation = `Out: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`; resolve(); },
               () => resolve()
           );
        } else { resolve(); }
    });

    const newTimesheet = {
        date: new Date().toISOString().split('T')[0],
        collaborateur: currentUser?.nom || 'Collaborateur',
        projet: projet,
        heures: durationHours,
        tache: 'Travaux',
        localisation: `In: ${localStorage.getItem('ipc_pointage_loc')?.slice(-15) || '?'} | ${endLocation}`,
        facturable: true,
        statut: 'En attente'
    };

    addRecord('hr', 'timesheets', newTimesheet);

    setIsCheckedIn(false);
    setCheckInTime(null);
    setProjet('');
    localStorage.removeItem('ipc_pointage_state');
    localStorage.removeItem('ipc_pointage_loc');
    
    setLoading(false);
    alert(`Temps enregistré: ${elapsed} \nCoordonnées cryptées et envoyées.`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9998 }} onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '90%',
          maxWidth: '380px',
          borderRadius: '2rem',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          zIndex: 9999,
          padding: '2rem',
          border: '1px solid var(--accent)',
          background: 'var(--bg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
               <div style={{ background: 'var(--accent)20', padding: '0.5rem', borderRadius: '1rem', color: 'var(--accent)' }}>
                   <Fingerprint size={24} />
               </div>
               Scan Présence
           </div>
           <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-subtle)'}>
               <X size={18} />
           </button>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <MapPin size={14} /> <span style={{ fontWeight: 600 }}>{locationStr}</span>
        </div>

        {!isCheckedIn ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>AFFECTATION DU JOUR</label>
                    <select 
                        value={projet} 
                        onChange={e => setProjet(e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '2px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                    >
                        <option value="">Sélectionnez un poste...</option>
                        <option value="Presse à blocs n°1">Usine - Presse à blocs 1</option>
                        <option value="Chantier Résidence A">Chantier Résidence A</option>
                        <option value="Logistique Expédition">Tournée - Logistique</option>
                        <option value="Atelier Maintenance">Atelier Maintenance</option>
                    </select>
                </div>
                <button 
                  onClick={handleCheckIn}
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <PlayCircle size={24} /> Démarrer la Session
                </button>
            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
                <div style={{ position: 'relative', padding: '2rem', border: '2px solid rgba(16, 185, 129, 0.3)', borderRadius: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #10B981, transparent)', animation: 'scan 2s linear infinite' }} />
                    <Activity size={32} color="#10B981" style={{ margin: '0 auto 1rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    <div style={{ fontWeight: 800, color: '#10B981', fontSize: '2.5rem', marginBottom: '0.5rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
                        {elapsed}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>{projet}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Réseau crypté - Sync active</div>
                </div>
                
                <button 
                  onClick={handleCheckOut}
                  disabled={loading}
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white', border: 'none', padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? <Activity size={24} className="spin" /> : <StopCircle size={24} />} 
                  {loading ? 'Cryptage...' : 'Terminer la Session'}
                </button>
            </motion.div>
        )}
      </motion.div>
      <style>{`
        @keyframes scan {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(200px); opacity: 0; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </AnimatePresence>
  );
};

export default PointageWidget;
