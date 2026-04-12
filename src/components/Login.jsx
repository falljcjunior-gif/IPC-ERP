import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useBusiness } from '../BusinessContext';

const Login = ({ onLogin }) => {
  const { globalSettings } = useBusiness();
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
      
      // Check for mustChangePassword in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().profile?.mustChangePassword) {
        setMustChange(true);
        setUserId(user.uid);
        setIsLoading(false);
        return;
      }

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
      
      // Update Firestore flag
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
      background: 'radial-gradient(circle at top right, #3B82F615, transparent), radial-gradient(circle at bottom left, #10B98115, transparent)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity }}
        style={{ position: 'absolute', top: '10%', right: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.1 }}
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity }}
        style={{ position: 'absolute', bottom: '10%', left: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '3rem',
          borderRadius: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 10,
          textAlign: 'center'
        }}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src={globalSettings.logoUrl || "/logo.png"} alt={globalSettings.companyName || "IPC ERP"} className="logo-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {mustChange ? 'Sécurité' : `Espace ${globalSettings.companyName || 'IPC ERP'}`}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {mustChange ? 'Vous devez changer votre mot de passe pour continuer.' : 'Ravi de vous revoir. Connectez-vous à votre cockpit.'}
        </p>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ 
                background: '#EF444415', 
                color: '#EF4444', 
                padding: '0.75rem', 
                borderRadius: '0.75rem', 
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid #EF444430'
              }}
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!mustChange ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Email Professionnel</label>
              <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                <Mail size={20} color="var(--text-muted)" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="raphael@ipcerp.com" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Mot de passe</label>
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Oublié ?</a>
              </div>
              <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                <Lock size={20} color="var(--text-muted)" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '1rem' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ 
                padding: '1.25rem', 
                borderRadius: '1.25rem', 
                fontSize: '1rem', 
                fontWeight: 700, 
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
              ) : (
                <>
                  Accéder au Dashboard <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Nouveau mot de passe</label>
              <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                <Lock size={20} color="var(--text-muted)" />
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Confirmer le mot de passe</label>
              <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                <Lock size={20} color="var(--text-muted)" />
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

            <button 
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ 
                padding: '1.25rem', 
                borderRadius: '1.25rem', 
                fontSize: '1rem', 
                fontWeight: 700, 
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
              ) : (
                <>
                  Changer le mot de passe <ShieldCheck size={20} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Pas encore de compte ? <a href="#" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Demander un accès démo</a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
