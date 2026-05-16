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

/* ── Social pill button ─────────────────────────────────────────────────────── */
function SocialBtn({ title, children }) {
  return (
    <motion.button
      type="button"
      title={title}
      whileHover={{ y: -1, backgroundColor: '#EFEFED' }}
      whileTap={{ scale: 0.97 }}
      style={{
        flex: 1, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FAFAF9', border: '1px solid rgba(0,0,0,0.09)',
        borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.15s ease, transform 0.15s ease',
      }}
    >
      {children}
    </motion.button>
  );
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

        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2.5rem' }}
        >
          <IPCLogo size={32} />
          <div>
            <div style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.26em', color: L.muted, textTransform: 'uppercase', lineHeight: 1 }}>
              I.P.C GREEN BLOCKS
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.32em', color: L.text, textTransform: 'uppercase', lineHeight: 1.5 }}>
              INTELLIGENCE
            </div>
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

        {/* ── Social buttons (login only) ───────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!mustChange && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.22, ease: EASE }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem' }}>
                {/* Apple */}
                <SocialBtn title="Continuer avec Apple">
                  <svg width="16" height="16" viewBox="0 0 814 1000" fill="#0F0F10">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 383.8 31.5 233.9 71.8 153.8c26.9-55.8 80.4-90.8 137.9-90.8 50.8 0 88.4 33.5 127.5 33.5 37.5 0 81.5-36.7 142.7-36.7 23.3 0 108.2 2.6 168.5 83.4zm-126.1-98.2c-32 40.8-59.2 97.3-59.2 146.5 0 2.6.3 5.2.6 7.9 7.3 1.9 15.9 2.6 24.5 2.6 33.5 0 68.7-16 91.3-40.8 21.3-23.3 38.7-60.4 38.7-99.9 0-3.2-.3-6.4-.6-9.6-4.8-.6-13.4-1.9-20.7-1.9-30.2 0-62.8 13.3-74.6 35.2z"/>
                  </svg>
                </SocialBtn>

                {/* Google */}
                <SocialBtn title="Continuer avec Google">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </SocialBtn>

                {/* Facebook */}
                <SocialBtn title="Continuer avec Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </SocialBtn>
              </div>

              {/* Separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
                <span style={{ fontSize: '9.5px', fontWeight: 600, color: L.muted, letterSpacing: '0.10em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  ou continuer avec e-mail
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            ANTIGRAVITY OS v4
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
      {/* YouTube iframe — oversized by 120px to clip YouTube chrome */}
      <iframe
        src={YT_SRC}
        title="IPC ERP ambient video"
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% + 120px)',
          height: 'calc(100% + 120px)',
          border: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Cinematic overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'linear-gradient(140deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.02) 45%, rgba(0,0,0,0.32) 100%)',
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
