import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Scan, MapPin, ClipboardCheck, Bell, Truck, Clock, CheckCircle2 } from 'lucide-react';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

const MobileCompanion = () => {
  const features = [
    { icon: <Scan size={28} />, title: 'Scan d\'OF', desc: 'Scannez les ordres de fabrication et mettez à jour l\'avancement en temps réel.', color: '#3B82F6' },
    { icon: <ClipboardCheck size={28} />, title: 'Validation Livraison', desc: 'Confirmez les réceptions et expéditions avec signature tactile.', color: '#10B981' },
    { icon: <Clock size={28} />, title: 'Pointage Terrain', desc: 'Pointez vos heures directement depuis le chantier ou l\'usine.', color: '#F59E0B' },
    { icon: <Bell size={28} />, title: 'Notifications Push', desc: 'Recevez les alertes critiques (pannes, stocks bas) instantanément.', color: '#EF4444' },
    { icon: <MapPin size={28} />, title: 'Géolocalisation Flotte', desc: 'Suivez vos véhicules de livraison en temps réel sur la carte.', color: '#8B5CF6' },
    { icon: <Truck size={28} />, title: 'Suivi Livraisons', desc: 'Partagez un lien de suivi en temps réel avec vos clients.', color: '#059669' },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#111827', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <Smartphone size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#111827', textTransform: 'uppercase' }}>Nexus Mobile</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0 }}>Application Mobile</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Compagnon terrain pour les opérateurs, chauffeurs et managers.</p>
        </div>
      </div>

      {/* Phone Mockup + Features */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Phone */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} style={{ width: 280, borderRadius: '2.5rem', border: '8px solid #1e293b', background: '#0f172a', padding: '2rem', minHeight: 500, display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <div style={{ width: 60, height: 6, borderRadius: 999, background: '#334155' }} />
            </div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem', textAlign: 'center' }}>Nexus OS</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', fontWeight: 600 }}>IPC Green Blocks</div>
            {[{l:'Scan OF',c:'#3B82F6',i:'📷'},{l:'Pointer',c:'#10B981',i:'⏱'},{l:'Livraisons',c:'#F59E0B',i:'🚚'},{l:'Alertes (3)',c:'#EF4444',i:'🔔'}].map((b,i)=>(
              <motion.div key={i} whileTap={{scale:0.95}} style={{ padding: '1rem', borderRadius: '1rem', background: `${b.c}20`, display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.25rem' }}>{b.i}</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>{b.l}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <motion.div key={i} whileHover={{y:-6}} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white', border: '1px solid var(--border)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '1rem', background: `${f.color}15`, color: f.color, width: 'fit-content', marginBottom: '1.25rem' }}>{f.icon}</div>
              <h4 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>{f.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass" style={{ padding: '3rem', borderRadius: '2rem', background: 'white', textAlign: 'center', marginTop: '3rem', border: '1px solid var(--border)' }}>
        <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Prêt pour le Déploiement</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 2rem auto' }}>L'application mobile est compilée via Capacitor et prête à être publiée sur l'App Store et Google Play.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <SmartButton variant="primary" onClick={async () => useToastStore.getState().addToast('Build iOS lancé...', 'info')}>Build iOS</SmartButton>
          <SmartButton variant="secondary" onClick={async () => useToastStore.getState().addToast('Build Android lancé...', 'info')}>Build Android</SmartButton>
        </div>
      </div>
    </div>
  );
};

export default MobileCompanion;
