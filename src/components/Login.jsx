import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Terminal, Cpu, Globe, Waves } from 'lucide-react';
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

      addToast(`Intelligence Cloud Synchronisée. Bienvenue.`, 'success');
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Erreur d\'accès : Identifiants non reconnus par le Noyau.');
    } finally {
      if (!mustChange) setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les protocoles de sécurité différent.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Complexité insuffisante (min 6 caractères).');
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
      setError('Échec de la mise à jour du protocole.');
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
      background: '#0F172A', // Obsidian base
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'var(--font-main)'
    }}>
      {/* 🔮 IMMERSIVE AMBIENCE */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ 
            position: 'absolute', top: '-10%', left: '-10%', 
            width: '70vw', height: '70vw', 
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', 
            filter: 'blur(120px)' 
          }}
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ 
            position: 'absolute', bottom: '-15%', right: '-5%', 
            width: '60vw', height: '60vw', 
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', 
            filter: 'blur(100px)' 
          }}
        />

        {/* Floating Cyber Particles */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '60px 60px' }} />
        
        {/* Dynamic Scan Line */}
        <motion.div 
          animate={{ y: ['0%', '1000%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px', 
            background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent)', 
            zIndex: 1, pointerEvents: 'none' 
          }} 
        />
      </div>

      {/* 🚀 LOGIN ENGINE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '3.5rem 3rem',
          borderRadius: '2.5rem',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
          zIndex: 10,
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Core Identity */}
        <div style={{ position: 'relative', height: '100px' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ 
              position: 'absolute', top: '50%', left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '110px', height: '110px',
              borderRadius: '50%',
              border: '2px dashed rgba(16, 185, 129, 0.3)',
              marginTop: '-55px', marginLeft: '-55px'
            }}
          />
          <div style={{ 
            width: '74px', height: '74px', 
            background: 'var(--accent)',
            borderRadius: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 0 40px var(--accent-glow)',
            position: 'relative', zIndex: 2
          }}>
            <Sparkles size={38} color="white" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h1 style={{ 
            fontSize: '2.2rem', fontWeight: 900, marginTop: '2rem', marginBottom: '0.5rem', 
            color: 'white', letterSpacing: '-0.04em' 
          }}>
            Intelligence Engine
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Business OS</span>
            <span style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>v4.2 PRO</span>
          </div>
        </motion.div>

        {/* 🛂 ACCESS PROTOCOLS */}
        <form onSubmit={mustChange ? handleChangePassword : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  borderLeft: '4px solid #EF4444',
                  color: '#EF4444', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left'
                }}
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {/* Input Groups */}
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', 
                color: 'rgba(255,255,255,0.2)', zIndex: 1 
              }}>
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Identifiant Cloud"
                style={{ 
                  width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1.25rem', color: 'white', outline: 'none', fontSize: '1rem',
                  fontWeight: 500, transition: 'all 0.3s'
                }}
                className="login-input"
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', 
                color: 'rgba(255,255,255,0.2)', zIndex: 1 
              }}>
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Clé Access"
                style={{ 
                  width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1.25rem', color: 'white', outline: 'none', fontSize: '1rem',
                  fontWeight: 500, transition: 'all 0.3s'
                }}
                className="login-input"
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
              padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--accent)',
              color: 'white', border: 'none', cursor: isLoading ? 'wait' : 'pointer',
              fontWeight: 900, fontSize: '1.1rem', marginTop: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {isLoading ? (
               <div className="spinner" style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} />
            ) : (
              <>
                S'AUTHENTIFIER <ArrowRight size={22} />
              </>
            )}
            <div className="shimmer-effect" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          </motion.button>
        </form>

        {/* 🛠 FOOTER SYSTEM INFO */}
        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <Cpu size={14} /> CLOUD ENGINE READY
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <ShieldCheck size={14} /> SHA-512 ACTIVE
            </div>
        </div>

        <style>{`
          .login-input:focus { border-color: var(--accent) !important; background: rgba(16, 185, 129, 0.05) !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
          .spinner { animation: spin 0.8s linear infinite; }
        `}</style>
      </motion.div>

      {/* 🔮 ORNAMENTAL BLOB */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', zIndex: 0 }}>
        <Waves size={300} color="var(--accent)" opacity={0.03} />
      </div>
    </div>
  );
};

export default Login;
