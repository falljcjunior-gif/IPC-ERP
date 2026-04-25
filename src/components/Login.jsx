import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Terminal } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from './ToastProvider';
import { useBusiness } from '../BusinessContext';

const Login = ({ onLogin }) => {
  const { globalSettings } = useBusiness();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profile?.active === false) {
          setError('Votre compte a été désactivé par l\'administrateur.');
          setIsLoading(false);
          return;
        }
        
        if (userData.profile?.mustChangePassword) {
          setMustChange(true);
          setUserId(user.uid);
          setIsLoading(false);
          return;
        }
      }

      addToast(`Bienvenue, accès autorisé au Noyau Intelligence.`, 'success');
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Erreur de connexion : ' + err.message);
    } finally {
      if (!mustChange) setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', userId), {
        'profile.mustChangePassword': false
      });
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Erreur lors du changement de mot de passe : ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Immersive Background Effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(100px)' }}
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(100px)' }}
        />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '4rem 3rem',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)',
          zIndex: 10,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow behind logo */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '150px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }} />

        <div style={{ 
          width: '80px', 
          height: '80px', 
          margin: '0 auto 2rem',
          background: 'var(--accent)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px var(--accent-glow)',
          transform: 'rotate(-5deg)'
        }}>
           <Sparkles size={40} color="white" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            {mustChange ? 'Sécurité Access' : 'IPC Intelligence Engine'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem', fontWeight: 500 }}>
            {mustChange ? 'Protégez votre accès avec un nouveau code.' : 'Authentification requise pour accéder au cockpit Business OS.'}
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#EF4444', 
                padding: '1rem', 
                borderRadius: '1rem', 
                marginBottom: '2rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!mustChange ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identifiant Cloud</label>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', 
                borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'var(--transition)'
              }}>
                <Mail size={20} color="var(--accent)" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ipc-ops.com" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem', fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clé de Sécurité</label>
                <a href="#" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>Oubliée ?</a>
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', 
                borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <Lock size={20} color="var(--accent)" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem', fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{ 
                padding: '1.25rem', 
                borderRadius: '1.25rem', 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 15px 30px var(--accent-glow)',
                transition: 'var(--transition)'
              }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              ) : (
                <>
                  Connecter <ArrowRight size={22} />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>Nouveau mot de passe</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Lock size={20} color="var(--accent)" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>Confirmer le mot de passe</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Lock size={20} color="var(--accent)" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem' }}
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{ 
                padding: '1.25rem', 
                borderRadius: '1.25rem', 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              ) : (
                <>
                  Sécuriser l'accès <ShieldCheck size={22} />
                </>
              )}
            </motion.button>
          </form>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} /> Core V4.2
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={14} color="#10B981" /> Encrypted
              </div>
           </div>
        </div>
      </motion.div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
        .spinner { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};

export default Login;
