import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  handleReset = async () => {
    localStorage.clear();
    try {
      if (window.indexedDB && window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        for (let db of dbs) { window.indexedDB.deleteDatabase(db.name); }
      } else if (window.indexedDB) {
        window.indexedDB.deleteDatabase('firestore/[DEFAULT]/ipc-erp/main');
        window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
      }
    } catch (e) {
      console.error('Erreur purge indexedDB:', e);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#0f172a', 
          color: 'white', 
          fontFamily: 'sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Une erreur critique est survenue</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', maxWidth: '600px' }}>
            L'application a rencontré un problème inattendu. Cela peut être dû à des données locales corrompues.
          </p>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', fontSize: '0.8rem', color: '#f87171' }}>
            {this.state.error?.toString()}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Réessayer
            </button>
            <button 
              onClick={this.handleReset}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Réinitialiser les données
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
