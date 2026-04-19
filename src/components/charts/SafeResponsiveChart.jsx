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
        height: '100%'
      }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div style={{ width: '100%', height: size.height }} />
      )}
    </div>
  );
};

export default SafeResponsiveChart;
