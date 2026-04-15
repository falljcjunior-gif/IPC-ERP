import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, RefreshCcw, ShieldCheck, Camera, Briefcase, Smartphone, Globe, Square, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import Chip from '../components/Chip';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const SOCIAL_CONFIG = {
  Facebook: { icon: <Square size={20} color="#1877F2" fill="#1877F2" />, color: '#1877F2', provider: 'facebook' },
  Instagram: { icon: <Camera size={20} color="#E4405F" />, color: '#E4405F', provider: 'instagram' },
  LinkedIn: { icon: <Briefcase size={20} color="#0A66C2" />, color: '#0A66C2', provider: 'linkedin' },
  TikTok: { icon: <Smartphone size={20} color="#010101" />, color: '#010101', provider: 'tiktok' },
  Website: { icon: <Globe size={20} color="#3B82F6" />, color: '#3B82F6', provider: 'web' },
};

const REDIRECT_URI = window.location.origin + '/';

const ConnectTab = ({ accounts, apiKeys }) => {
  const [connectionStatus, setConnectionStatus] = useState({});
  const [loading, setLoading] = useState({});
  const [linkedinConfig, setLinkedinConfig] = useState({ clientId: '', clientSecret: '' });
  const [showLinkedinConfig, setShowLinkedinConfig] = useState(false);

  // Check existing token statuses from Firestore on mount
  useEffect(() => {
    const checkTokens = async () => {
      const snap = await getDoc(doc(db, 'system_config', 'social_tokens'));
      if (snap.exists()) {
        const tokens = snap.data();
        const status = {};
        if (tokens.facebook?.userToken) status['Facebook'] = 'connected';
        if (tokens.facebook?.userToken) status['Instagram'] = 'connected';
        if (tokens.linkedin?.accessToken) status['LinkedIn'] = 'connected';
        setConnectionStatus(status);
      }
    };

    const fetchLinkedinKeys = async () => {
      const snap = await getDoc(doc(db, 'system_config', 'marketing_apis'));
      if (snap.exists() && snap.data().linkedin) {
        setLinkedinConfig(snap.data().linkedin);
      }
    };

    checkTokens();
    fetchLinkedinKeys();

    // Handle OAuth callback (code in URL after redirect from Facebook/LinkedIn)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code, state) => {
    const provider = state.split('_')[0]; // e.g. "facebook_login" → "facebook"
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const functions = getFunctions();
      const exchangeToken = httpsCallable(functions, 'exchangeSocialToken');
      const result = await exchangeToken({ provider, code, redirectUri: REDIRECT_URI });

      if (result.data.success) {
        if (provider === 'facebook') {
          setConnectionStatus(prev => ({ ...prev, Facebook: 'connected', Instagram: 'connected' }));
        } else if (provider === 'linkedin') {
          setConnectionStatus(prev => ({ ...prev, LinkedIn: 'connected' }));
        }
        alert(`✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} connecté avec succès !`);
      }
    } catch (err) {
      console.error('OAuth Exchange Error:', err);
      alert(`❌ Erreur de connexion : ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleConnect = (network) => {
    const sc = SOCIAL_CONFIG[network];
    if (!sc) return;

    if (network === 'Facebook' || network === 'Instagram') {
      const clientId = apiKeys?.facebook?.clientId;
      if (!clientId) {
        alert('⚙️ Veuillez d\'abord configurer votre Meta App ID dans Marketing → ⚙️ (bouton en haut à droite)');
        return;
      }
      // Only request basic scopes that don't require App Review
      // Advanced scopes (instagram_basic, pages_manage_posts) must be added
      // in the App console first under "Permissions & Features"
      const scope = encodeURIComponent([
        'email',
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'instagram_business_basic'
      ].join(','));
      const redirectUri = encodeURIComponent(REDIRECT_URI);
      const state = `facebook_login`;
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
      window.location.href = authUrl;
    }

    if (network === 'LinkedIn') {
      if (!linkedinConfig.clientId) {
        setShowLinkedinConfig(true);
        return;
      }
      const redirectUri = encodeURIComponent(REDIRECT_URI);
      const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social rw_organization_admin');
      const state = `linkedin_oauth`;
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinConfig.clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
      window.location.href = authUrl;
    }

    if (network === 'TikTok') {
      alert('🚧 La connexion TikTok for Business sera disponible dans la prochaine mise à jour. TikTok exige une validation de l\'app en production.');
    }
  };

  const handleSaveLinkedinKeys = async () => {
    const snap = await getDoc(doc(db, 'system_config', 'marketing_apis'));
    const existing = snap.exists() ? snap.data() : {};
    await setDoc(doc(db, 'system_config', 'marketing_apis'), {
      ...existing,
      linkedin: linkedinConfig
    });
    setShowLinkedinConfig(false);
    // Now trigger OAuth
    handleConnect('LinkedIn');
  };

  const getStatus = (accountName) => {
    if (loading[SOCIAL_CONFIG[accountName]?.provider]) return 'loading';
    if (connectionStatus[accountName] === 'connected') return 'connected';
    const base = accounts?.find(a => a.nom === accountName || a.reseau === accountName);
    return base?.statut === 'Connecté' ? 'connected' : 'disconnected';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Gestion des Comptes</h3>
          <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Connectez vos plateformes pour activer l'IA et l'Inbox unifiée.
          </p>
        </div>
        <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
          <RefreshCcw size={16} /> Tout Synchroniser
        </button>
      </div>

      {/* LinkedIn Config Modal */}
      {showLinkedinConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '480px', padding: '2.5rem', borderRadius: '2rem', background: 'var(--bg)' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="#0A66C2" /> Configurer LinkedIn API
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Créez votre app sur <strong>linkedin.com/developers</strong> → récupérez le <strong>Client ID</strong> et <strong>Client Secret</strong>.
              <br />Ajoutez comme <strong>Redirect URL</strong> : <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>{REDIRECT_URI}</code>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Client ID</label>
                <input className="glass" value={linkedinConfig.clientId} onChange={e => setLinkedinConfig(p => ({ ...p, clientId: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.9rem' }} placeholder="86xxxxxxxxxx" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Client Secret</label>
                <input type="password" className="glass" value={linkedinConfig.clientSecret} onChange={e => setLinkedinConfig(p => ({ ...p, clientSecret: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.9rem' }} placeholder="••••••••••" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowLinkedinConfig(false)} className="btn" style={{ flex: 1, padding: '0.75rem' }}>Annuler</button>
              <button onClick={handleSaveLinkedinKeys} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', background: '#0A66C2', border: 'none' }}>
                Sauvegarder & Connecter
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Social Account Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {(accounts?.length > 0 ? accounts : [
          { id: '1', nom: 'IPC Facebook', reseau: 'Facebook' },
          { id: '2', nom: 'IPC Instagram', reseau: 'Instagram' },
          { id: '3', nom: 'IPC LinkedIn', reseau: 'LinkedIn' },
          { id: '4', nom: 'IPC TikTok', reseau: 'TikTok' },
        ]).map((acc) => {
          const status = getStatus(acc.nom === acc.reseau ? acc.reseau : acc.nom) || getStatus(acc.reseau);
          const sc = SOCIAL_CONFIG[acc.reseau] || {};
          const isConnected = status === 'connected';
          const isLoading = status === 'loading';

          return (
            <motion.div key={acc.id} whileHover={{ y: -5 }} className="glass"
              style={{ padding: '1.75rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden', border: `1px solid ${isConnected ? sc.color + '30' : 'var(--border)'}` }}
            >
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.04, transform: 'rotate(15deg)' }}>
                {React.cloneElement(sc.icon || <Globe />, { size: 120 })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: `${sc.color || '#64748B'}15`, padding: '12px', borderRadius: '1rem' }}>
                    {sc.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{acc.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.reseau}</div>
                  </div>
                </div>
                <Chip
                  label={isLoading ? 'Connexion…' : isConnected ? 'Connecté' : 'Déconnecté'}
                  color={isLoading ? '#F59E0B' : isConnected ? '#10B981' : '#64748B'}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                {isConnected ? (
                  <>
                    <button className="glass" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={14} color="#10B981" /> Synchroniser
                    </button>
                    <button className="glass" style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700 }}>Déconnecter</button>
                  </>
                ) : isLoading ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.6rem' }}>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Échange du token…
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(acc.reseau)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: sc.color, borderColor: sc.color }}
                  >
                    <Link2 size={16} /> Connecter {acc.reseau}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security Status Panel */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={18} color="#10B981" /> État du Pont Social (IPC Bridge)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { label: 'Infrastructure Cloud', value: 'Firebase Functions', status: 'ok' },
            { label: 'Chiffrement API', value: 'AES-256 Actif', status: 'ok' },
            { label: 'OAuth Meta', value: apiKeys?.facebook?.clientId ? `App ${apiKeys.facebook.clientId.slice(0,8)}…` : 'Non configuré', status: apiKeys?.facebook?.clientId ? 'ok' : 'warn' },
            { label: 'OAuth LinkedIn', value: linkedinConfig.clientId ? 'Configuré' : 'À configurer', status: linkedinConfig.clientId ? 'ok' : 'warn' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: item.status === 'ok' ? '#10B981' : '#F59E0B', fontSize: '0.85rem' }}>
                {item.status === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectTab;
