import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
const PlatformShell = React.lazy(() => import('./components/PlatformShell'));
import Login from './components/Login';
import { BusinessProvider } from './BusinessContext';
import { initRegistry } from './registry_init';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ToastProvider, useToast } from './components/ToastProvider';
import { useStore } from './store';
import { UserService } from './services/user.service';
import { FirestoreService } from './services/firestore.service';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const AuthObserver = () => {
  const { addToast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // ── [SECURITY FIX V-07] Validation du state CSRF ──────────────────────
      const expectedState = sessionStorage.getItem('oauth_state');
      const receivedState = urlParams.get('state');
      sessionStorage.removeItem('oauth_state');

      if (!expectedState || expectedState !== receivedState) {
        console.error('[OAuth] CSRF détecté ou state manquant. Callback rejeté.');
        addToast('Connexion refusée : anomalie de sécurité détectée.', 'error');
        window.history.replaceState({}, document.title, '/');
        return;
      }

      const handleCallback = async () => {
        try {
          const functions = getFunctions(auth.app, 'europe-west1');
          const exchangeFunc = httpsCallable(functions, 'exchangeSocialToken');
          const result = await exchangeFunc({ provider: 'facebook', code, redirectUri: window.location.origin + '/' });
          const { accessToken } = result.data;
          await FirestoreService.setDocument('marketing', 'accounts_live', {
            facebook: { accessToken, statut: 'Connecté', derniereSynchro: new Date().toISOString() }
          }, true);
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
  const _hasHydrated = useStore(state => state._hasHydrated);
  const globalSettings = useStore(state => state.globalSettings);

  useEffect(() => {
    initRegistry();
  }, []);
  
  const theme = 'light';

  useEffect(() => {
    const setUser = useStore.getState().setUser;
    
    // Safety fallback: If Firebase doesn't respond in 5s, we force initialization
    const fallbackTimer = setTimeout(() => {
      if (isInitializing) {
        console.warn('Firebase Auth took too long to respond. Forcing initialization.');
        setIsInitializing(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimer);
      if (firebaseUser) {
        try {
          const userProfile = await UserService.syncProfile(firebaseUser);
          setUser(userProfile);
          
          // Initialize Realtime Presence
          import('./services/presence.service').then(({ PresenceService }) => {
            PresenceService.setPresence(firebaseUser.uid);
          });

          setView('dashboard');
        } catch (error) {
          console.error("[App] Erreur sync profil:", error);
          // Fallback minimal — rôle depuis Custom Claims (token signé, non modifiable côté client)
          try {
            const tokenResult = await firebaseUser.getIdTokenResult();
            const claimedRole = tokenResult.claims?.role || 'GUEST';
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              nom: firebaseUser.displayName || 'Utilisateur',
              role: claimedRole,
            });
            setView(claimedRole !== 'GUEST' ? 'dashboard' : 'login');
          } catch {
            setView('login');
          }
        }
      } else {
        setView('login');
      }
      setIsInitializing(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);
  if (isInitializing || !_hasHydrated) {
    return <InitializingView label={isInitializing ? "Vérification de la session..." : "Chargement du profil..."} />;
  }

  return (
    <ErrorBoundary>
      <BusinessProvider>
        <ToastProvider>
          <AuthObserver />
          <div className="app-container">
            {view === 'login' ? <Login onLogin={() => setView('dashboard')} /> : (
              <React.Suspense fallback={<InitializingView label="Chargement du Noyau..." />}>
                <PlatformShell theme={theme} setView={setView} />
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
    <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', opacity: 0.8 }}>IPC INTELLIGENCE</div>
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{label}</div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`}</style>
  </div>
);

export default App;
