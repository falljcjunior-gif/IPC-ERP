import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Terminal, Cpu, Globe, Waves, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from './ToastProvider';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import heroImage from '../assets/login_hero.png';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const { globalSettings } = useStore();
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

      addToast(`Noyau synchronisé. Connexion établie.`, 'success');
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Accès refusé : Identifiants invalides.');
    } finally {
      if (!mustChange) setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les clés ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le code doit contenir au moins 6 caractères.');
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
      setError('Échec de la mise à jour de sécurité.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      background: 'var(--bg)',
      overflow: 'hidden',
      fontFamily: 'var(--font-main)'
    }}>
      {/* 🟢 LEFT SIDE: AUTH FORM */}
      <div style={{ 
        flex: '0 0 45%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 10,
        background: 'var(--bg)'
      }}>
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           style={{ width: '100%', maxWidth: '420px' }}
        >
          {/* Header Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
             <div style={{ 
               width: '42px', height: '42px', background: 'var(--accent)', 
               borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
               boxShadow: '0 8px 16px var(--accent-glow)'
             }}>
                <Sparkles size={24} color="white" />
             </div>
             <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                  IPC <span style={{ color: 'var(--accent)' }}>Intelligence</span>
                </h2>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                  Business Operating System
                </div>
             </div>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.04em', color: 'var(--text)' }}>
             {mustChange ? t('auth.new_key') : t('auth.login')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
             {mustChange ? t('auth.new_key_desc', { defaultValue: 'Veuillez définir votre clé d’accès personnelle.' }) : t('auth.login_desc', { defaultValue: 'Identifiez-vous pour accéder au cockpit de pilotage.' })}
          </p>

          <form onSubmit={mustChange ? handleChangePassword : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.08)', 
                    color: '#EF4444', padding: '1rem', borderRadius: '1rem', fontSize: '0.85rem',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {!mustChange && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.2rem' }}>{t('auth.cloud_id')}</label>
                  <div className="input-field" style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom.prenom@ipc.com"
                      style={{ 
                        width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '1rem',
                        background: 'var(--bg-subtle)', border: '2px solid transparent',
                        color: 'var(--text)', outline: 'none', fontSize: '0.95rem', fontWeight: 600,
                        transition: 'all 0.3s'
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.2rem' }}>{t('auth.access_key')}</label>
                    <a href="#" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>{t('auth.forgot_key', { defaultValue: 'Oubliée ?' })}</a>
                  </div>
                  <div className="input-field" style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ 
                        width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '1rem',
                        background: 'var(--bg-subtle)', border: '2px solid transparent',
                        color: 'var(--text)', outline: 'none', fontSize: '0.95rem', fontWeight: 600,
                        transition: 'all 0.3s'
                      }}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {mustChange && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nouvelle Clé</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ 
                      width: '100%', padding: '1.1rem 1.25rem', borderRadius: '1rem',
                      background: 'var(--bg-subtle)', border: '2px solid transparent',
                      color: 'var(--text)', outline: 'none', fontSize: '0.95rem', fontWeight: 600
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirmation</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ 
                      width: '100%', padding: '1.1rem 1.25rem', borderRadius: '1rem',
                      background: 'var(--bg-subtle)', border: '2px solid transparent',
                      color: 'var(--text)', outline: 'none', fontSize: '0.95rem', fontWeight: 600
                    }}
                    required
                  />
                </div>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{ 
                padding: '1.1rem', borderRadius: '1.1rem', background: 'var(--accent)',
                color: 'white', border: 'none', cursor: isLoading ? 'wait' : 'pointer',
                fontWeight: 900, fontSize: '1rem', marginTop: '1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: '0 12px 24px var(--accent-glow)'
              }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              ) : (
                <>
                  {t('auth.authenticate')} <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Info */}
          <div style={{ marginTop: '4rem', display: 'flex', alignItems: 'center', gap: '1.5rem', opacity: 0.5 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800 }}>
                <ShieldCheck size={14} color="#10B981" /> SECURE LINK
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800 }}>
                <Globe size={14} /> CLOUD NODES : ACTIVE
             </div>
          </div>
        </motion.div>

        {/* CSS for hover effects */}
        <style>{`
          .input-field input:focus { border-color: var(--accent) !important; background: var(--bg) !important; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
          .spinner { animation: spin 0.8s linear infinite; }
        `}</style>
      </div>

      {/* 🌊 WAVY DIVIDER & HERO SIDE */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden',
        background: '#0F172A'
      }}>
        {/* The Hero Image */}
        <motion.div
           initial={{ scale: 1.1, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           style={{ 
             position: 'absolute', inset: 0, 
             backgroundImage: `url(${heroImage})`, 
             backgroundSize: 'cover', 
             backgroundPosition: 'center' 
           }}
        >
          {/* Overlay gradient for text readability if needed */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15, 23, 42, 0.4), transparent)' }} />
        </motion.div>

        {/* Wavy Svg Mask */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ 
            position: 'absolute', top: 0, left: '-1px', height: '100%', width: '12%', 
            fill: 'var(--bg)', zIndex: 5, pointerEvents: 'none' 
          }}
        >
          <path d="M0,0 C20,20 20,40 0,60 C-20,80 -20,100 0,100 L0,100 L0,0 Z" transform="scale(1, 1)" />
        </svg>

        {/* Floating Intelligence Badge */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            position: 'absolute', bottom: '3rem', right: '3rem', 
            padding: '1.5rem', background: 'rgba(255,255,255,0.05)', 
            backdropFilter: 'blur(16px)', borderRadius: '2rem',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10, display: 'flex', alignItems: 'center', gap: '1rem'
          }}
        >
           <div style={{ 
             width: '48px', height: '48px', background: 'var(--accent)', 
             borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
              <Terminal color="white" size={24} />
           </div>
           <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>Business Intelligence v4.2</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.75rem' }}>Processing 1.2M nodes/sec</div>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
