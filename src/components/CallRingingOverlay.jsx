import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, User, X } from 'lucide-react';
import { useStore } from '../store';
import { FirestoreService } from '../services/firestore.service';

const CallRingingOverlay = () => {
  const activeCall = useStore(s => s.activeCall);
  const setActiveCall = useStore(s => s.setActiveCall);
  const currentUser = useStore(s => s.user);
  
  const [audio] = useState(new Audio('https://assets.mixkit.net/active_storage/sfx/1359/1359-preview.mp3')); // Basic ringtone

  useEffect(() => {
    if (activeCall?.status === 'ringing' && activeCall?.role === 'receiver') {
      audio.loop = true;
      audio.play().catch(e => console.log("Audio play blocked", e));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    return () => {
      audio.pause();
    };
  }, [activeCall?.status, activeCall?.role]);

  if (!activeCall || activeCall.status !== 'ringing' || activeCall.role !== 'receiver') return null;

  const handleAccept = async () => {
    try {
      // 1. Update local state immediately to 'ongoing' to prevent BusinessContext race condition
      setActiveCall({ ...activeCall, accepted: true, status: 'ongoing' });

      // 2. Then update Firestore
      await FirestoreService.updateDocument('calls', activeCall.id, { 
        status: 'accepted',
        acceptedAt: new Date()
      });
    } catch (err) {
      console.error("Accept call error", err);
      // Optionnel: Revenir en arrière si erreur critique
    }
  };

  const handleDecline = async () => {
    try {
      await FirestoreService.updateDocument('calls', activeCall.id, { 
        status: 'declined',
        declinedAt: new Date()
      });
      setActiveCall(null);
    } catch (err) {
      console.error("Decline call error", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: '380px',
          maxWidth: '90vw',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid #8B5CF6' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{activeCall.contactName}</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7, fontWeight: 600 }}>
            {activeCall.type === 'video' ? 'Appel vidéo entrant...' : 'Appel audio entrant...'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleDecline}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#EF4444',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneOff size={24} />
          </button>
          
          <button
            onClick={handleAccept}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#10B981',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)'
            }}
          >
            {activeCall.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallRingingOverlay;
