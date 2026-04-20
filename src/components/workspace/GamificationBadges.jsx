import React from 'react';
import { Shield, Star, Award, Zap } from 'lucide-react';

const GamificationBadges = ({ score, timesheets, leads }) => {
  const badges = [
    { id: 'master', label: "Maître de l'Orga", icon: <Shield size={24} color={score >= 80 ? "#10B981" : "var(--border)"} />, unlocked: score >= 80 },
    { id: 'contributor', label: "Contributeur", icon: <Award size={24} color={timesheets > 0 ? "#F59E0B" : "var(--border)"} />, unlocked: timesheets > 0 },
    { id: 'hunter', label: "Top Hunter", icon: <Star size={24} color={leads >= 5 ? "#3B82F6" : "var(--border)"} />, unlocked: leads >= 5 },
    { id: 'fast', label: "Réactif", icon: <Zap size={24} color="#EC4899" />, unlocked: true } // Default badge for motivation
  ];

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
        <Award size={14} /> Succès & Badges
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: 1 }}>
        {badges.map(b => (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: b.unlocked ? 'var(--bg)' : 'transparent', borderRadius: '1rem', padding: '1rem', opacity: b.unlocked ? 1 : 0.4, border: b.unlocked ? '1px solid var(--border)' : '1px dashed var(--border)' }}>
            <div style={{ marginBottom: '0.5rem' }}>{b.icon}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textAlign: 'center' }}>{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamificationBadges;
