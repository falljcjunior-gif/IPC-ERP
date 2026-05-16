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

// [DEV-ONLY] Check for URL bypass before Firebase auth fires
const _devBypass = import.meta.env.DEV
  ? (() => {
      const p = new URLSearchParams(window.location.search);
      const role   = p.get('dev_role');
      const entity = p.get('dev_entity') || 'HOLDING';
      return role ? { role, entity } : null;
    })()
  : null;

function App() {
  const [view, setView] = useState(_devBypass ? 'dashboard' : 'login');
  const [isInitializing, setIsInitializing] = useState(!_devBypass);
  const _hasHydrated = useStore(state => state._hasHydrated);
  const globalSettings = useStore(state => state.globalSettings);

  useEffect(() => {
    initRegistry();
  }, []);

  // [DEV-ONLY] Inject mock user when URL bypass is active
  useEffect(() => {
    if (!_devBypass) return;
    useStore.getState().setCurrentUser({
      id: 'dev-audit', email: 'audit@ipc.com', nom: 'Audit QA',
      role: _devBypass.role, entity_type: _devBypass.entity,
      permissions: { roles: [_devBypass.role], allowedModules: [], moduleAccess: {} },
    });
  }, []);

  const theme = 'light';

  useEffect(() => {
    if (_devBypass) return; // skip Firebase auth when dev bypass is active
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
  <div style={{
    height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#FFFFFF', gap: 28,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  }}>
    {/* IPC Green Blocks cube mark */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width="34" height="30" viewBox="0 0 64 56" fill="none">
        <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="#0F0F10"/>
        <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.28)"/>
        <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.14)"/>
        <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(0,0,0,0.75)"/>
        <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.22)"/>
        <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.11)"/>
        <path d="M18 29 L34 20 L46 16 L46 32 L34 36 L18 45 Z" fill="rgba(0,0,0,0.07)"/>
      </svg>
      <div>
        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.24em', color: '#9CA3AF', textTransform: 'uppercase', lineHeight: 1 }}>
          I.P.C GREEN BLOCKS
        </div>
        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.32em', color: '#0F0F10', textTransform: 'uppercase', lineHeight: 1.4 }}>
          INTELLIGENCE
        </div>
      </div>
    </div>
    {/* Thin scan line */}
    <div style={{ width: 120, height: 1, background: 'rgba(0,0,0,0.08)', borderRadius: 1, overflow: 'hidden' }}>
      <div style={{ height: '100%', background: '#0F0F10', animation: 'ipc-scan 1.6s ease-in-out infinite' }} />
    </div>
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: '#9CA3AF', textTransform: 'uppercase' }}>
      {label}
    </div>
    <style>{`
      @keyframes ipc-scan {
        0%   { transform: scaleX(0); transform-origin: left; }
        49%  { transform: scaleX(1); transform-origin: left; }
        50%  { transform: scaleX(1); transform-origin: right; }
        100% { transform: scaleX(0); transform-origin: right; }
      }
    `}</style>
  </div>
);

export default App;
