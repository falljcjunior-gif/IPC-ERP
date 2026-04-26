import React from 'react';

/**
 * Enhanced ErrorBoundary
 * Handles:
 * - React render errors
 * - Failed lazy chunk imports (stale cache after deploy)
 * - Runtime exceptions in child components
 *
 * Auto-recovery: If error is a "Failed to fetch dynamically imported module",
 * the boundary clears cache and reloads ONCE automatically.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isChunkError: false,
      autoReloading: false,
    };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || '';
    const isChunkError = 
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Unable to preload CSS') ||
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk');

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error?.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);

    // Auto-recovery for stale chunk errors (only once per session)
    const { isChunkError } = this.state;
    const hasAutoReloaded = sessionStorage.getItem('ipc_chunk_reload');
    
    if (isChunkError && !hasAutoReloaded) {
      console.warn('[ErrorBoundary] Stale chunk detected — auto-reloading...');
      sessionStorage.setItem('ipc_chunk_reload', '1');
      this.setState({ autoReloading: true });
      
      // Clear caches then reload
      setTimeout(async () => {
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
        } catch (e) {
          console.error('Cache clear failed:', e);
        } finally {
          window.location.reload(true);
        }
      }, 800);
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem('ipc_chunk_reload');
    this.setState({ hasError: false, error: null, isChunkError: false, autoReloading: false });
  };

  handleHardReset = async () => {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear IndexedDB
      if (window.indexedDB?.databases) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
      } else if (window.indexedDB) {
        window.indexedDB.deleteDatabase('firestore/[DEFAULT]/ipc-erp/main');
        window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
      }
    } catch (e) {
      console.error('Hard reset error:', e);
    } finally {
      window.location.reload(true);
    }
  };

  render() {
    const { hasError, error, isChunkError, autoReloading } = this.state;

    if (!hasError) return this.props.children;

    // Auto-reload screen
    if (autoReloading) {
      return (
        <div style={{
          height: '100vh', width: '100vw',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: 'white',
          fontFamily: 'system-ui, sans-serif', gap: '1.5rem'
        }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(16,185,129,0.2)',
            borderTopColor: '#10b981',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Mise à jour détectée
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Rechargement automatique en cours...
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    return (
      <div style={{
        height: '100vh', width: '100vw',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: 'white',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem', textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '20px',
          background: isChunkError ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isChunkError ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '1.5rem'
        }}>
          {isChunkError ? '🔄' : '⚠️'}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          {isChunkError ? 'Nouvelle version disponible' : 'Erreur inattendue'}
        </h1>

        <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '500px', lineHeight: 1.6 }}>
          {isChunkError
            ? 'L\'application a été mise à jour. Rechargez la page pour accéder à la dernière version.'
            : 'L\'application a rencontré un problème. Si le problème persiste, réinitialisez les données locales.'
          }
        </p>

        {/* Error detail (collapsed) */}
        {error && !isChunkError && (
          <div style={{
            background: '#1e293b', padding: '1rem 1.25rem',
            borderRadius: '0.75rem', marginBottom: '2rem',
            fontSize: '0.78rem', color: '#f87171',
            maxWidth: '600px', width: '100%',
            textAlign: 'left', wordBreak: 'break-word',
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', opacity: 0.6, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Détail technique</div>
            {error.toString()}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload(true)}
            style={{
              padding: '0.75rem 1.75rem', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #10b981, #0891b2)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem'
            }}
          >
            🔄 Recharger
          </button>

          {!isChunkError && (
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.75rem', borderRadius: '0.75rem',
                background: 'rgba(255,255,255,0.08)',
                color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
              }}
            >
              ↩ Réessayer
            </button>
          )}

          <button
            onClick={this.handleHardReset}
            style={{
              padding: '0.75rem 1.75rem', borderRadius: '0.75rem',
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
            }}
          >
            🗑 Vider le cache
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
