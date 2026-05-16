import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useToast } from './ToastProvider';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const L = {
  bg:          '#F9FAFB',
  panel:       '#FFFFFF',
  border:      'rgba(0,0,0,0.09)',
  borderFocus: 'rgba(0,0,0,0.22)',
  text:        '#0F0F10',
  sub:         '#6B7280',
  muted:       '#9CA3AF',
  dim:         '#D1D5DB',
  input:       '#FFFFFF',
  btnBg:       '#0F0F10',
  btnHover:    '#000000',
  errorColor:  'rgba(220,38,38,0.85)',
  errorBg:     'rgba(220,38,38,0.05)',
  errorBorder: 'rgba(220,38,38,0.15)',
};

/* ── IPC Green Blocks isometric logo mark ──────────────────────────────────── */
function IPCLogo({ size = 40 }) {
  return (
    <svg width={size} height={Math.round(size * 0.875)} viewBox="0 0 64 56" fill="none">
      <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="#0F0F10"/>
      <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.28)"/>
      <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.14)"/>
      <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(0,0,0,0.72)"/>
      <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.22)"/>
      <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.11)"/>
      <path d="M18 29 L34 20 L46 16 L46 32 L34 36 L18 45 Z" fill="rgba(0,0,0,0.06)"/>
    </svg>
  );
}

/* ── Reusable text input ────────────────────────────────────────────────────── */
function TextInput({ type = 'text', value, onChange, placeholder, required }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        width: '100%', padding: '0.875rem 1rem', boxSizing: 'border-box',
        background: L.input, border: `1px solid ${L.border}`,
        borderRadius: 10, color: L.text, outline: 'none',
        fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={e => { e.target.style.borderColor = L.borderFocus; }}
      onBlur={e => { e.target.style.borderColor = L.border; }}
    />
  );
}

/* ── Password input with visibility toggle ──────────────────────────────────── */
function PasswordInput({ value, onChange, placeholder, required }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '0.875rem 3rem 0.875rem 1rem', boxSizing: 'border-box',
          background: L.input, border: `1px solid ${L.border}`,
          borderRadius: 10, color: L.text, outline: 'none',
          fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={e => { e.target.style.borderColor = L.borderFocus; }}
        onBlur={e => { e.target.style.borderColor = L.border; }}
      />
      <button
        type="button" onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute', right: '0.875rem', top: '50%',
          transform: 'translateY(-50%)', background: 'none', border: 'none',
          cursor: 'pointer', color: L.muted, padding: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ── Field label ────────────────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <div style={{
      fontSize: '0.68rem', fontWeight: 700, color: L.sub,
      textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.5rem',
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOGIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [mustChange, setMustChange]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { user, userData } = await AuthService.login(email, password);
      if (userData.profile?.mustChangePassword) {
        setMustChange(true);
        setIsLoading(false);
        return;
      }
      addToast('Connexion établie.', 'success');
      onLogin();
    } catch (err) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      if (!mustChange) setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6)          { setError('Minimum 6 caractères requis.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await AuthService.mandatoryPasswordUpdate(newPassword);
      onLogin();
    } catch (err) {
      setError(err.message || 'Échec de la mise à jour.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex',
      background: L.bg, overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── LEFT PANEL — Form ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: '0 0 460px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '3rem 3.5rem',
          background: L.panel, borderRight: `1px solid ${L.border}`,
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '3.5rem' }}>
            <IPCLogo size={34} />
            <div>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.24em', color: L.muted, textTransform: 'uppercase', lineHeight: 1 }}>
                I.P.C GREEN BLOCKS
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.30em', color: L.text, textTransform: 'uppercase', lineHeight: 1.5 }}>
                HOLDING
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: '2.25rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: L.text, letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 0.5rem 0' }}>
              {mustChange ? 'Nouveau mot de passe' : 'Connexion'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: L.sub, lineHeight: 1.65, margin: 0 }}>
              {mustChange
                ? 'Définissez votre accès personnel pour continuer.'
                : "Identifiez-vous pour accéder à l'espace Holding."}
            </p>
          </div>

          {/* Error banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: L.errorBg, border: `1px solid ${L.errorBorder}`,
                  color: L.errorColor, padding: '0.75rem 1rem', borderRadius: 10,
                  fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <AlertCircle size={14} strokeWidth={2.5} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form fields */}
          <form onSubmit={mustChange ? handleChangePassword : handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {!mustChange && (
              <>
                <div>
                  <Label>Adresse email</Label>
                  <TextInput
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="prenom.nom@ipc.com" required
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Label>Mot de passe</Label>
                    <a href="#" style={{ fontSize: '0.7rem', fontWeight: 600, color: L.muted, textDecoration: 'none' }}>
                      Oublié ?
                    </a>
                  </div>
                  <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </>
            )}

            {mustChange && (
              <>
                <div>
                  <Label>Nouveau mot de passe</Label>
                  <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères" required />
                </div>
                <div>
                  <Label>Confirmation</Label>
                  <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Répétez le mot de passe" required />
                </div>
              </>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { backgroundColor: L.btnHover } : {}}
              whileTap={!isLoading ? { scale: 0.99 } : {}}
              style={{
                padding: '0.9rem 1.5rem', borderRadius: 10, marginTop: '0.375rem',
                background: L.btnBg, color: '#FFFFFF', border: 'none',
                cursor: isLoading ? 'wait' : 'pointer', fontWeight: 700,
                fontSize: '0.9rem', fontFamily: 'inherit', letterSpacing: '0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.15s ease',
              }}
            >
              {isLoading
                ? <div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'login-spin 0.7s linear infinite' }} />
                : <>{mustChange ? 'Définir le mot de passe' : 'Accéder au Holding'}<ArrowRight size={16} strokeWidth={2.5} /></>
              }
            </motion.button>
          </form>

          {/* Trust footer */}
          <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, color: L.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <ShieldCheck size={12} strokeWidth={2} /> Connexion chiffrée
            </div>
            <div style={{ width: 1, height: 11, background: L.dim }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: L.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ANTIGRAVITY OS v4
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL — Brand visual ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: '#F9FAFB', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Architectural grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        {/* Radial center glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 100%)',
        }} />

        {/* Hero mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <IPCLogo size={88} />
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.28em', color: L.muted, textTransform: 'uppercase', lineHeight: 1, marginBottom: 10 }}>
            I.P.C GREEN BLOCKS
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.22em', color: L.text, textTransform: 'uppercase', lineHeight: 1 }}>
            HOLDING
          </div>
          <div style={{ width: 36, height: 1, background: L.dim, margin: '24px auto' }} />
          <div style={{ fontSize: '0.78rem', color: L.muted, fontWeight: 400, lineHeight: 1.75, maxWidth: 260 }}>
            Système d'exploitation stratégique<br />pour la direction du Groupe
          </div>
        </motion.div>

        {/* Decorative card — bottom right */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', bottom: '2.5rem', right: '2.5rem',
            background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '1rem 1.25rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            zIndex: 10, minWidth: 170,
          }}
        >
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', color: L.muted, textTransform: 'uppercase', marginBottom: 10 }}>
            Groupe · Temps réel
          </div>
          {[
            { label: 'Filiales actives',  value: '—' },
            { label: 'Gouvernance',        value: '—' },
            { label: 'CA Consolidé',       value: '—' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 0',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <span style={{ fontSize: '0.72rem', color: L.sub }}>{item.label}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: L.text }}>{item.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Decorative badge — top left */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', top: '2.5rem', left: '2.5rem',
            background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 8, padding: '0.625rem 1rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0F0F10' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: L.sub, letterSpacing: '0.04em' }}>
            Accès sécurisé — Holding Executive
          </span>
        </motion.div>
      </motion.div>

      <style>{`@keyframes login-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
