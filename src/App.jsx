import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
const PlatformShell = React.lazy(() => import('./components/PlatformShell'));
import Login from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { initRegistry } from './registry_init';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastProvider';

const AuthObserver = () => {
  const { addToast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      const handleCallback = async () => {
        try {
          const functions = getFunctions();
          const exchangeFunc = httpsCallable(functions, 'exchangeSocialToken');
          
          const result = await exchangeFunc({
            provider: 'facebook',
            code: code,
            redirectUri: window.location.origin + '/'
          });

          const { accessToken } = result.data;

          await setDoc(doc(db, 'marketing', 'accounts_live'), {
            facebook: {
              accessToken,
              statut: 'Connecté',
              derniereSynchro: serverTimestamp()
            }
          }, { merge: true });

          window.history.replaceState({}, document.title, "/");
          addToast("Compte Marketing connecté avec succès !", 'success');
        } catch (error) {
          console.error("Erreur exchange token:", error);
          addToast("Échec de la connexion API. Vérifiez vos accès.", 'error');
        }
      };
      
      handleCallback();
    }
  }, [addToast]);

  return null;
};

function App() {
  const [view, setView] = useState('login');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initRegistry();
  }, []);
  
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ipc_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setView('dashboard');
      else setView('login');
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ipc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(v => v === 'light' ? 'dark' : 'light');

  if (isInitializing) return <InitializingView />;

  return (
    <ErrorBoundary>
      <BusinessProvider>
        <ToastProvider>
          <AuthObserver />
          <div className="app-container">
            {view === 'login' ? <Login onLogin={() => setView('dashboard')} /> : (
              <React.Suspense fallback={<InitializingView label="Chargement du Noyau..." />}>
                <PlatformShell toggleTheme={toggleTheme} theme={theme} setView={setView} />
              </React.Suspense>
            )}
          </div>
        </ToastProvider>
      </BusinessProvider>
    </ErrorBoundary>
  );
}

const InitializingView = ({ label = "Initialisation du noyau..." }) => (
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
    <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--bg-subtle)', borderTop: '4px solid var(--accent)', borderRadius: '50%', marginBottom: '1.5rem' }} />
    <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', opacity: 0.8 }}>BUSINESS OS</div>
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{label}</div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
  </div>
);
export default App;
