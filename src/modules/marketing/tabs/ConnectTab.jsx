import React from 'react';
import { motion } from 'framer-motion';
import { Link2, RefreshCcw, ShieldCheck, AlertCircle, Share2, Camera, Briefcase, Smartphone, Globe, Square } from 'lucide-react';
import Chip from '../components/Chip';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const ConnectTab = ({ accounts, apiKeys }) => {
  const socialConfig = {
    Facebook: { icon: <Square size={20} color="#1877F2" />, color: '#1877F2' },
    Instagram: { icon: <Camera size={20} color="#E4405F" />, color: '#E4405F' },
    LinkedIn: { icon: <Briefcase size={20} color="#0A66C2" />, color: '#0A66C2' },
    TikTok: { icon: <Smartphone size={20} color="#000000" />, color: '#000000' },
    Website: { icon: <Globe size={20} color="#3B82F6" />, color: '#3B82F6' },
  };

  const handleSocialConnect = (network) => {
    if (network === 'Facebook' || network === 'Instagram') {
      const clientId = apiKeys.facebook?.clientId;
      if (!clientId) {
        alert("Veuillez configurer votre App ID Facebook dans les paramètres (icône ⚙️) avant de vous connecter.");
        return;
      }
      const redirectUri = encodeURIComponent(window.location.origin + '/');
      const scope = encodeURIComponent('email,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights');
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=facebook_login`;
      window.location.href = authUrl;
    } else {
      alert(`La connexion directe pour ${network} sera disponible dans la prochaine mise à jour.`);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Gestion des Comptes</h3>
          <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Connectez vos plateformes pour activer l'IA et l'Inbox unifiée.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <RefreshCcw size={16} /> Tout Synchroniser
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {accounts.map((acc) => (
          <motion.div key={acc.id} whileHover={{ y: -5 }} className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, transform: 'rotate(15deg)' }}>
              {React.cloneElement(socialConfig[acc.reseau]?.icon || <Share2 />, { size: 120 })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: `${socialConfig[acc.reseau]?.color || '#64748B'}15`, padding: '12px', borderRadius: '1rem' }}>
                  {socialConfig[acc.reseau]?.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{acc.nom}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.reseau}</div>
                </div>
              </div>
              <Chip 
                label={acc.statut} 
                color={acc.statut === 'Connecté' ? '#10B981' : acc.statut === 'Erreur' ? '#EF4444' : '#64748B'} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
              {acc.statut === 'Connecté' ? (
                <>
                  <button className="glass" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>Paramètres</button>
                  <button className="glass" style={{ padding: '0.6rem', borderRadius: '0.75rem', color: '#EF4444' }}>Déconnecter</button>
                </>
              ) : (
                <button 
                  onClick={() => handleSocialConnect(acc.reseau)}
                  className="btn-primary" 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Link2 size={16} /> Connecter {acc.reseau}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security Status */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={18} color="#10B981" /> État du Pont Social (IPC Bridge)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>Infrastructure Cloud</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#10B981' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> Opérationnel
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>Chiffrement API</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>AES-256 Actif</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>Prochains Scopes</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent)' }}>LinkedIn, TikTok</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectTab;
