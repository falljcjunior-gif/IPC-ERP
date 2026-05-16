import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useToast } from './ToastProvider';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const L = {
  bg:          '#F7F7F5',
  panel:       '#FFFFFF',
  border:      'rgba(0,0,0,0.08)',
  borderFocus: 'rgba(0,0,0,0.28)',
  input:       '#F9F9F8',
  text:        '#0F0F10',
  sub:         '#6B7280',
  muted:       '#9CA3AF',
  dim:         '#D1D5DB',
  btnBg:       '#0F0F10',
  btnHover:    '#000000',
  errorColor:  'rgba(220,38,38,0.85)',
  errorBg:     'rgba(220,38,38,0.04)',
  errorBorder: 'rgba(220,38,38,0.15)',
};

const EASE = [0.16, 1, 0.3, 1];

/* ── YouTube video URL ─────────────────────────────────────────────────────── */
const YT_SRC = 'https://www.youtube.com/embed/OkvaJl0emPQ?autoplay=1&mute=1&loop=1&playlist=OkvaJl0emPQ&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&playsinline=1';

/* ── IPC isometric logo ────────────────────────────────────────────────────── */
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

/* ── Text input ────────────────────────────────────────────────────────────── */
function TextInput({ type = 'text', value, onChange, placeholder, required }) {
  const onFocus = e => {
    e.target.style.borderColor   = L.borderFocus;
    e.target.style.boxShadow     = '0 0 0 3px rgba(0,0,0,0.06)';
    e.target.style.background    = '#FFFFFF';
  };
  const onBlur = e => {
    e.target.style.borderColor   = L.border;
    e.target.style.boxShadow     = 'none';
    e.target.style.background    = L.input;
  };
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      onFocus={onFocus} onBlur={onBlur}
      style={{
        width: '100%', padding: '14px 16px', boxSizing: 'border-box',
        background: L.input, border: `1px solid ${L.border}`,
        borderRadius: 12, color: L.text, outline: 'none',
        fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
      }}
    />
  );
}

/* ── Password input ────────────────────────────────────────────────────────── */
function PasswordInput({ value, onChange, placeholder, required }) {
  const [visible, setVisible] = useState(false);
  const onFocus = e => {
    e.target.style.borderColor = L.borderFocus;
    e.target.style.boxShadow   = '0 0 0 3px rgba(0,0,0,0.06)';
    e.target.style.background  = '#FFFFFF';
  };
  const onBlur = e => {
    e.target.style.borderColor = L.border;
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = L.input;
  };
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={onFocus} onBlur={onBlur}
        style={{
          width: '100%', padding: '14px 3rem 14px 16px', boxSizing: 'border-box',
          background: L.input, border: `1px solid ${L.border}`,
          borderRadius: 12, color: L.text, outline: 'none',
          fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        }}
      />
      <button
        type="button" onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute', right: '0.875rem', top: '50%',
          transform: 'translateY(-50%)', background: 'none', border: 'none',
          cursor: 'pointer', color: L.muted, padding: 0,
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = L.sub)}
        onMouseLeave={e => (e.currentTarget.style.color = L.muted)}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ── Field label ─────────────────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <div style={{
      fontSize: '0.67rem', fontWeight: 700, color: L.sub,
      textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.45rem',
    }}>
      {children}
    </div>
  );
}

/* ── Entity logo marks ──────────────────────────────────────────────────────── */
function HoldingMark({ size = 56 }) {
  return <img src="/logo-holding.png" alt="IPC Green Blocks Holding" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}
function SubsidiaryMark({ size = 56 }) {
  return <img src="/logo-filiale.png" alt="IPC Green Blocks Filiale" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}
function FoundationMark({ size = 56 }) {
  return <img src="/logo-fondation.png" alt="Fondation IPC-Collect" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}

/* ── Floating glass chip (on video panel) ───────────────────────────────────── */
function GlassChip({ pos, delay, icon, label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      style={{
        position: 'absolute', ...pos,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
        borderRadius: 14, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 20, pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.13em', color: L.muted, textTransform: 'uppercase', lineHeight: 1, marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: L.text, lineHeight: 1 }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [mustChange,      setMustChange]      = useState(false);
  const [isMobile,        setIsMobile]        = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Auth handlers ──────────────────────────────────────────────────────── */
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

  /* ════════════════════════════════════════════════════════════════════════
     LEFT PANEL — form
  ════════════════════════════════════════════════════════════════════════ */
  const LeftPanel = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{
        flex: isMobile ? '0 0 auto' : '0 0 460px',
        width: isMobile ? '100%' : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '2rem 1.75rem 2.25rem' : '2.5rem 3rem',
        background: L.panel,
        borderLeft:   isMobile ? 'none' : undefined,
        borderRight:  isMobile ? 'none' : `1px solid ${L.border}`,
        borderTop:    isMobile ? `1px solid ${L.border}` : 'none',
        position: 'relative', zIndex: 10,
      }}
    >
      <div style={{ width: '100%', maxWidth: isMobile ? 420 : 360 }}>

        {/* ── Three entity logos ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' }}
        >
          {/* Holding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <HoldingMark size={48} />
          </div>

          <div style={{ width: 1, height: 48, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />

          {/* Subsidiary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <SubsidiaryMark size={48} />
          </div>

          <div style={{ width: 1, height: 48, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />

          {/* Foundation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <FoundationMark size={48} />
          </div>
        </motion.div>

        {/* ── Headline ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: EASE }}
          style={{ marginBottom: '1.75rem' }}
        >
          {!mustChange && (
            <p style={{ fontSize: '0.78rem', color: L.muted, fontWeight: 500, margin: '0 0 5px 0', letterSpacing: '-0.005em' }}>
              Bonne journée,
            </p>
          )}
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: L.text, letterSpacing: '-0.04em', lineHeight: 1.18, margin: 0 }}>
            {mustChange
              ? <>Nouveau mot<br />de passe</>
              : <>Content de<br />vous revoir.</>
            }
          </h1>
        </motion.div>


        {/* ── Error banner ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                overflow: 'hidden',
                background: L.errorBg, border: `1px solid ${L.errorBorder}`,
                color: L.errorColor, padding: '0.75rem 1rem',
                borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <AlertCircle size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28, ease: EASE }}
          onSubmit={mustChange ? handleChangePassword : handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {!mustChange && (
            <>
              <div>
                <Label>Adresse e-mail</Label>
                <TextInput
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom.nom@ipc.com" required
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <Label>Mot de passe</Label>
                  <a
                    href="#"
                    style={{ fontSize: '0.68rem', fontWeight: 600, color: L.muted, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target.style.color = L.text)}
                    onMouseLeave={e => (e.target.style.color = L.muted)}
                  >
                    Oublié ?
                  </a>
                </div>
                <PasswordInput
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />
              </div>
            </>
          )}

          {mustChange && (
            <>
              <div>
                <Label>Nouveau mot de passe</Label>
                <PasswordInput
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères" required
                />
              </div>
              <div>
                <Label>Confirmation</Label>
                <PasswordInput
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe" required
                />
              </div>
            </>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.006, backgroundColor: L.btnHover } : {}}
            whileTap={!isLoading ? { scale: 0.994 } : {}}
            style={{
              width: '100%', padding: '15px 1.5rem',
              borderRadius: 12, marginTop: '0.2rem',
              background: L.btnBg, color: '#FFFFFF', border: 'none',
              cursor: isLoading ? 'wait' : 'pointer',
              fontWeight: 700, fontSize: '0.92rem', fontFamily: 'inherit',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background 0.15s ease',
            }}
          >
            {isLoading
              ? <div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'login-spin 0.7s linear infinite' }} />
              : <>{mustChange ? 'Définir le mot de passe' : 'Se connecter'}<ArrowRight size={16} strokeWidth={2.5} /></>
            }
          </motion.button>
        </motion.form>

        {/* ── Trust footer ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginTop: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', fontWeight: 700, color: L.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <ShieldCheck size={11} strokeWidth={2} /> Connexion chiffrée
          </div>
          <div style={{ width: 1, height: 10, background: L.dim }} />
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: L.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            I.P.C OS v4
          </div>
        </motion.div>

      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RIGHT PANEL — immersive YouTube video
  ════════════════════════════════════════════════════════════════════════ */
  const VideoPanel = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 0,
        minHeight: isMobile ? 220 : undefined,
        height: isMobile ? '42vw' : undefined,
        maxHeight: isMobile ? 300 : undefined,
      }}
    >
      {/* YouTube iframe — cover fill: maintain 16:9 aspect, scale to cover */}
      <iframe
        src={YT_SRC}
        title="IPC ERP ambient video"
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) scale(1.18)',
          width: '177.78vh',   /* 16/9 × 100vh — always wider than container */
          minWidth: '100%',
          height: '56.25vw',   /* 9/16 × 100vw — always taller than container */
          minHeight: '100%',
          border: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Cinematic overlay — pointerEvents:all blocks YouTube controls from appearing */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'linear-gradient(140deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.02) 45%, rgba(0,0,0,0.32) 100%)',
        pointerEvents: 'all', cursor: 'default',
      }} />

      {/* Floating chip — top left (brand) */}
      {!isMobile && (
        <GlassChip
          pos={{ top: '1.75rem', left: '1.75rem' }}
          delay={0.85}
          icon={<IPCLogo size={16} />}
          label="IPC Group"
          value="Antigravity OS"
        />
      )}

      {/* Floating chip — bottom right (spaces) */}
      {!isMobile && (
        <GlassChip
          pos={{ bottom: '1.75rem', right: '1.75rem' }}
          delay={1.05}
          icon={<Zap size={14} strokeWidth={2} style={{ color: '#0F0F10' }} />}
          label="3 espaces actifs"
          value="Holding · Filiale · Foundation"
        />
      )}
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: isMobile ? 'auto' : 'hidden',
      fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {VideoPanel}
      {LeftPanel}

      <style>{`
        @keyframes login-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #B0B0B0 !important; }
      `}</style>
    </div>
  );
};

export default Login;
