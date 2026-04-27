import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * SafeResponsiveChart
 * - Stabilizes chart rendering when parent is hidden/animating (tabs, motion transitions)
 * - Avoids Recharts width/height -1 warnings
 * - Applies explicit minHeight and fallback dimensions
 */
const SafeResponsiveChart = ({
  minHeight = 240,
  fallbackHeight = 260,
  debounceMs = 50,
  isDataEmpty = false,
  placeholderTitle = "En attente de données",
  placeholderSubtitle = "Nexus IA synchronisera les graphiques dès que des enregistrements seront disponibles.",
  children
}) => {
  const hostRef = useRef(null);
  const frameRef = useRef(null);
  const timerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 0, height: fallbackHeight });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(0, Math.floor(rect.width));
      const rawHeight = Math.max(0, Math.floor(rect.height));
      const height = Math.max(minHeight, rawHeight || fallbackHeight);

      const visible = width > 0 && rect.height > 0;
      setSize({ width, height });
      setReady(visible);
    };

    const scheduleMeasure = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(measure);
      }, debounceMs);
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => scheduleMeasure());
      observer.observe(el);
    } else {
      window.addEventListener('resize', scheduleMeasure);
    }

    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', scheduleMeasure);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [debounceMs, fallbackHeight, minHeight]);

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        minHeight: `${minHeight}px`,
        height: '100%',
        position: 'relative'
      }}
    >
      {ready ? (
        <>
          {isDataEmpty && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.01)',
              backdropFilter: 'blur(4px)',
              borderRadius: '1rem',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'var(--bg-subtle)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem', border: '1px solid var(--border)'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
              </div>
              <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{placeholderTitle}</h5>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: 1.5 }}>{placeholderSubtitle}</p>
            </div>
          )}
          <div style={{ opacity: isDataEmpty ? 0.05 : 1, transition: 'opacity 0.5s ease', height: '100%', width: '100%' }}>
            <ResponsiveContainer width={size.width || "100%"} height={size.height || "100%"}>
              {children}
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', height: size.height }} />
      )}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SafeResponsiveChart;
