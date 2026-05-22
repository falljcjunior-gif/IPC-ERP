import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

/**
 * ModuleLayout — standard wrapper for all ERP module views.
 *
 * Provides: page title, optional subtitle, back button, action slot,
 * and consistent spacing. Modules should wrap their content in this
 * component rather than managing header layout themselves.
 */
export default function ModuleLayout({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  actions,        // ReactNode — rendered in the header action slot
  onBack,         // If provided, shows a back button
  children,
  style = {},
  className = '',
}) {
  return (
    <motion.div
      className={`erp-module-layout${className ? ` ${className}` : ''}`}
      style={style}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Header */}
      <div className="erp-module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {onBack && (
            <motion.button
              onClick={onBack}
              className="erp-btn erp-btn-ghost"
              style={{ padding: '0.45rem 0.75rem' }}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <ChevronLeft size={16} />
            </motion.button>
          )}

          {Icon && (
            <div style={{
              width: 40, height: 40, borderRadius: '0.75rem',
              background: `${iconColor || '#10B981'}12`,
              border: `1px solid ${iconColor || '#10B981'}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={20} color={iconColor || '#10B981'} />
            </div>
          )}

          <div className="erp-module-title-group">
            <h1 className="erp-module-title">{title}</h1>
            {subtitle && <p className="erp-module-subtitle">{subtitle}</p>}
          </div>
        </div>

        {actions && (
          <div className="erp-module-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="erp-module-content">
        {children}
      </div>
    </motion.div>
  );
}
