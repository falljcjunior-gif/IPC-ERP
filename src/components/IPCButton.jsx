import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * IPC BUTTON SYSTEM — Design System Unifié
 * ════════════════════════════════════════
 * Variants :  primary | secondary | ghost | danger | success | glass
 * Sizes     :  sm | md | lg
 * 
 * Usage :
 *   <IPCButton variant="primary" icon={<Plus size={16} />} onClick={fn}>Nouveau</IPCButton>
 *   <IPCButton variant="danger" size="sm" loading={isDeleting}>Supprimer</IPCButton>
 *   <IPCButton variant="ghost" iconOnly icon={<Edit size={16} />} label="Modifier" />
 */

const VARIANTS = {
  primary: {
    bg: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 15px -3px rgba(16, 185, 129, 0.45)',
    shadowHover: '0 8px 25px -4px rgba(16, 185, 129, 0.55)',
    bgHover: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  },
  secondary: {
    bg: 'var(--bg-subtle)',
    color: 'var(--text)',
    border: '1.5px solid var(--border)',
    shadow: '0 1px 4px rgba(0,0,0,0.04)',
    shadowHover: '0 4px 12px rgba(0,0,0,0.08)',
    bgHover: 'var(--bg)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--text-muted)',
    border: '1.5px solid transparent',
    shadow: 'none',
    shadowHover: '0 2px 8px rgba(0,0,0,0.06)',
    bgHover: 'var(--bg-subtle)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 15px -3px rgba(239, 68, 68, 0.35)',
    shadowHover: '0 8px 25px -4px rgba(239, 68, 68, 0.5)',
    bgHover: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
  },
  success: {
    bg: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 15px -3px rgba(34, 197, 94, 0.35)',
    shadowHover: '0 8px 25px -4px rgba(34, 197, 94, 0.5)',
    bgHover: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
  },
  glass: {
    bg: 'var(--glass-bg)',
    color: 'var(--text)',
    border: '1px solid var(--glass-border)',
    shadow: 'var(--glass-shadow)',
    shadowHover: '0 8px 24px rgba(0,0,0,0.12)',
    bgHover: 'rgba(255,255,255,0.9)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#fff',
    border: 'none',
    shadow: '0 4px 15px -3px rgba(245, 158, 11, 0.35)',
    shadowHover: '0 8px 25px -4px rgba(245, 158, 11, 0.5)',
    bgHover: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
  },
};

const SIZES = {
  xs: { padding: '0.3rem 0.7rem', fontSize: '0.72rem', iconSize: 12, gap: '0.35rem', radius: '0.6rem', height: '28px' },
  sm: { padding: '0.45rem 0.9rem', fontSize: '0.8rem', iconSize: 14, gap: '0.45rem', radius: '0.7rem', height: '34px' },
  md: { padding: '0.6rem 1.2rem', fontSize: '0.875rem', iconSize: 16, gap: '0.55rem', radius: '0.85rem', height: '40px' },
  lg: { padding: '0.8rem 1.6rem', fontSize: '0.95rem', iconSize: 18, gap: '0.65rem', radius: '1rem', height: '48px' },
  xl: { padding: '1rem 2rem', fontSize: '1.05rem', iconSize: 20, gap: '0.75rem', radius: '1.1rem', height: '56px' },
};

export const IPCButton = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  iconOnly = false,
  loading = false,
  disabled = false,
  onClick,
  label, // for iconOnly accessibility
  fullWidth = false,
  style = {},
  className = '',
  type = 'button',
  active = false,
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconOnly ? 0 : s.gap,
        padding: iconOnly ? `calc(${s.padding.split(' ')[0]} + 0.05rem)` : s.padding,
        height: iconOnly ? s.height : undefined,
        width: iconOnly ? s.height : (fullWidth ? '100%' : undefined),
        aspectRatio: iconOnly ? '1' : undefined,
        fontSize: s.fontSize,
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '-0.01em',
        background: active ? v.bgHover : v.bg,
        color: v.color,
        border: v.border,
        borderRadius: s.radius,
        boxShadow: v.shadow,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        whiteSpace: 'nowrap',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: variant === 'glass' ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: variant === 'glass' ? 'blur(12px)' : undefined,
        ...style,
      }}
      className={className}
      onMouseEnter={e => {
        if (!isDisabled) {
          e.currentTarget.style.background = v.bgHover;
          e.currentTarget.style.boxShadow = v.shadowHover;
          if (variant === 'ghost') e.currentTarget.style.borderColor = 'var(--border)';
          if (variant === 'glass') e.currentTarget.style.borderColor = 'var(--accent)';
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled) {
          e.currentTarget.style.background = active ? v.bgHover : v.bg;
          e.currentTarget.style.boxShadow = v.shadow;
          if (variant === 'ghost') e.currentTarget.style.borderColor = 'transparent';
          if (variant === 'glass') e.currentTarget.style.borderColor = 'var(--glass-border)';
        }
      }}
    >
      {/* Shimmer effect on primary */}
      {variant === 'primary' && !isDisabled && (
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          animation: 'btn-shimmer 3s infinite linear',
          pointerEvents: 'none',
        }} />
      )}

      {/* Loading spinner or icon */}
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Loader2 size={s.iconSize} />
        </motion.span>
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { size: icon.props.size || s.iconSize })}
        </span>
      ) : null}

      {/* Label */}
      {!iconOnly && children && (
        <span style={{ position: 'relative', zIndex: 1 }}>
          {loading ? 'Chargement...' : children}
        </span>
      )}

      {/* Right icon */}
      {iconRight && !iconOnly && !loading && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.7 }}>
          {React.cloneElement(iconRight, { size: s.iconSize - 2 })}
        </span>
      )}
    </motion.button>
  );
};

/**
 * IPCButtonGroup — Groupe de boutons jointifs style segmented control
 */
export const IPCButtonGroup = ({ children, style = {} }) => (
  <div style={{
    display: 'inline-flex',
    gap: '2px',
    background: 'var(--bg-subtle)',
    padding: '3px',
    borderRadius: '0.9rem',
    border: '1px solid var(--border)',
    ...style,
  }}>
    {children}
  </div>
);

/**
 * IPCActionBar — Barre d'actions flottante en bas de module
 */
export const IPCActionBar = ({ actions = [], info }) => {
  if (!actions.length) return null;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.25rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        flexWrap: 'wrap',
      }}
    >
      {info && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.5rem' }}>{info}</span>}
      {actions.map((a, i) => (
        <IPCButton
          key={i}
          variant={a.variant || 'secondary'}
          size={a.size || 'sm'}
          icon={a.icon}
          loading={a.loading}
          disabled={a.disabled}
          onClick={a.onClick}
        >
          {a.label}
        </IPCButton>
      ))}
    </motion.div>
  );
};

/**
 * IPCStatButton — Bouton avec compteur statistique (pour SmartButtons style)
 */
export const IPCStatButton = ({ icon, count, label, active = false, onClick, color }) => (
  <motion.button
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.1rem',
      background: active
        ? `linear-gradient(135deg, var(--accent), var(--accent-hover))`
        : 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: active ? 'none' : '1px solid var(--border)',
      borderRadius: '1rem',
      cursor: 'pointer',
      boxShadow: active ? '0 4px 15px -3px rgba(16,185,129,0.4)' : 'var(--shadow-sm)',
      transition: 'all 0.25s ease',
      minWidth: '100px',
    }}
  >
    <div style={{
      width: '36px', height: '36px',
      background: active ? 'rgba(255,255,255,0.2)' : (color ? `${color}18` : 'var(--bg-subtle)'),
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? '#fff' : (color || 'var(--accent)'),
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{
        fontSize: '1.15rem', fontWeight: 900,
        color: active ? '#fff' : 'var(--text)',
        lineHeight: 1.1, fontFamily: 'var(--font-heading)',
      }}>
        {count ?? '—'}
      </span>
      <span style={{
        fontSize: '0.65rem', fontWeight: 700,
        color: active ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.6px',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  </motion.button>
);

export default IPCButton;
