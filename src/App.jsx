import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import PlatformShell from './components/PlatformShell';
import Login from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { initRegistry } from './registry_init';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import './index.css';

function App() {
  const [view, setView] = useState('login'); // 'login', 'dashboard'
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Global Registry once at boot
  useEffect(() => {
    initRegistry();
  }, []);
  
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('daxcelor_theme') || 'light';
    } catch (e) {
      console.error("Erreur lecture thème:", e);
      return 'light';
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setView('dashboard');
      } else {
        // Only set to landing if we were on dashboard or explicitly logged out
        // to avoid flashing landing page if we are manually on login
        setView('login');
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  /* ─── OAuth Callback Detection ─── */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      const handleCallback = async () => {
        try {
          // 1. Appeler la Cloud Function pour l'échange de token
          const functions = getFunctions();
          const exchangeFunc = httpsCallable(functions, 'exchangeSocialToken');
          
          const result = await exchangeFunc({
            provider: 'facebook', // On commence par FB/IG
            code: code,
            redirectUri: window.location.origin + '/'
          });

          const { accessToken } = result.data;

          // 2. Enregistrer le compte connecté
          await setDoc(doc(db, 'marketing', 'accounts_live'), {
            facebook: {
              accessToken,
              statut: 'Connecté',
              derniereSynchro: serverTimestamp()
            }
          }, { merge: true });

          // 3. Nettoyer l'URL et alerter
          window.history.replaceState({}, document.title, "/");
          alert("Compte connecté avec succès !");
        } catch (error) {
          console.error("Erreur exchange token:", error);
          alert("Échec de la connexion. Vérifiez vos identifiants API.");
        }
      };
      
      handleCallback();
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('daxcelor_theme', theme);
    } catch (e) {
      console.error("Erreur persistence thème:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLoginSuccess = () => {
    setView('dashboard');
  };

  if (isInitializing) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div className="spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid var(--bg-subtle)', 
          borderTop: '4px solid var(--accent)', 
          borderRadius: '50%',
          marginBottom: '1.5rem'
        }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', opacity: 0.8 }}>BUSINESS OS</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Initialisation du noyau...</div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .spinner { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <BusinessProvider>
      <div className="app-container">
        {view === 'login' && (
          <Login onLogin={handleLoginSuccess} />
        )}

        {view === 'dashboard' && (
          <PlatformShell 
            toggleTheme={toggleTheme} 
            theme={theme} 
            setView={setView} 
          />
        )}
      </div>
    </BusinessProvider>
  );
}

export default App;
