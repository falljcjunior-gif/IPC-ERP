import React from 'react';

const MODULE_NODES = [
  { id: 'erp', label: 'ERP', x: 50, y: 50, size: 96, color: '#064E3B', delay: '0s' },
  { id: 'crm', label: 'CRM', x: 76, y: 32, size: 66, color: '#10B981', delay: '-1.2s' },
  { id: 'finance', label: 'Finance', x: 24, y: 35, size: 72, color: '#059669', delay: '-2.4s' },
  { id: 'rh', label: 'RH', x: 70, y: 72, size: 62, color: '#34D399', delay: '-3.1s' },
  { id: 'stock', label: 'Stock', x: 28, y: 70, size: 62, color: '#6EE7B7', delay: '-1.8s' },
  { id: 'production', label: 'Prod', x: 52, y: 18, size: 58, color: '#A7F3D0', delay: '-2.8s' },
];

const CONNECTIONS = [
  ['erp', 'crm'],
  ['erp', 'finance'],
  ['erp', 'rh'],
  ['erp', 'stock'],
  ['erp', 'production'],
  ['crm', 'rh'],
  ['finance', 'stock'],
  ['rh', 'production'],
];

const nodeById = MODULE_NODES.reduce((acc, node) => {
  acc[node.id] = node;
  return acc;
}, {});

export default function ERPOrbitalScene({ scrollProgress = 0, style = {} }) {
  const rotation = scrollProgress * 18;
  const scale = 1 + scrollProgress * 0.08;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 360,
        overflow: 'hidden',
        isolation: 'isolate',
        ...style,
      }}
    >
      <style>
        {`
          @keyframes ipc-orbit-float {
            0%, 100% { transform: translate(-50%, -50%) translate3d(0, 0, 0) rotate(0deg); }
            50% { transform: translate(-50%, -50%) translate3d(0, -12px, 0) rotate(2deg); }
          }
          @keyframes ipc-flow-pulse {
            0%, 100% { opacity: .18; stroke-dashoffset: 28; }
            50% { opacity: .58; stroke-dashoffset: 0; }
          }
          @keyframes ipc-core-glow {
            0%, 100% { box-shadow: 0 24px 80px rgba(6, 78, 59, .24), inset 0 1px 0 rgba(255,255,255,.46); }
            50% { box-shadow: 0 34px 110px rgba(16, 185, 129, .34), inset 0 1px 0 rgba(255,255,255,.6); }
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          inset: '8%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 48%, rgba(16,185,129,.18), rgba(6,78,59,.07) 34%, transparent 68%)',
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: 'transform 160ms ease-out',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: 'transform 160ms ease-out',
          zIndex: 1,
        }}
      >
        {CONNECTIONS.map(([from, to]) => {
          const a = nodeById[from];
          const b = nodeById[to];
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2 - 7;
          return (
            <path
              key={`${from}-${to}`}
              d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
              fill="none"
              stroke="rgba(16,185,129,.58)"
              strokeWidth="0.42"
              strokeLinecap="round"
              strokeDasharray="3 7"
              style={{ animation: 'ipc-flow-pulse 4.8s ease-in-out infinite' }}
            />
          );
        })}
      </svg>

      {MODULE_NODES.map((node) => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
            borderRadius: node.id === 'erp' ? 24 : 18,
            display: 'grid',
            placeItems: 'center',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(145deg, ${node.color}, rgba(247, 254, 251, .84))`,
            border: '1px solid rgba(255,255,255,.72)',
            color: node.id === 'production' || node.id === 'stock' ? '#064E3B' : '#F7FEFB',
            fontWeight: 900,
            fontSize: node.id === 'erp' ? 18 : 12,
            letterSpacing: 0,
            textTransform: 'uppercase',
            zIndex: node.id === 'erp' ? 4 : 3,
            animation: `ipc-orbit-float 6.5s ease-in-out infinite ${node.delay}`,
            boxShadow:
              node.id === 'erp'
                ? '0 24px 80px rgba(6, 78, 59, .24), inset 0 1px 0 rgba(255,255,255,.46)'
                : '0 18px 50px rgba(6, 78, 59, .18), inset 0 1px 0 rgba(255,255,255,.5)',
            ...(node.id === 'erp' ? { animation: `ipc-orbit-float 7.2s ease-in-out infinite, ipc-core-glow 5.8s ease-in-out infinite` } : {}),
          }}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
}
