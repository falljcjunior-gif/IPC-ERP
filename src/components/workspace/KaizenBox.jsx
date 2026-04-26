import React, { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { useStore } from '../../store';

const KaizenBox = () => {
  const { currentUser, addRecord } = useStore();
  const [idea, setIdea] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idea.trim()) return;
    // Assuming basic storage via addRecord. 
    // In real app, there's a specialized schema. For now we just push logic.
    try { 
      addRecord('hr', 'kaizen', { auteur: currentUser?.nom, idee: idea, date: new Date().toISOString() }); 
    } catch(err) {
      console.warn('Failed to submit Kaizen idea:', err);
    }
    setSent(true);
    setIdea('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06B6D4', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '1rem' }}>
        <Lightbulb size={14} /> Boîte à Idées (Kaizen)
      </div>
      
      {sent ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#10B981', textAlign: 'center' }}>
          <Lightbulb size={32} style={{ marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Merci ! Votre idée a été soumise à la direction.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea 
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Une idée pour améliorer l'entreprise ? Écrivez..."
            style={{ flex: 1, background: 'var(--bg-subtle)', border: 'none', borderRadius: '1rem', padding: '1rem', color: 'var(--text)', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
          />
          <button type="submit" style={{ padding: '0.75rem', borderRadius: '1rem', background: '#06B6D4', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={16} /> Soumettre
          </button>
        </form>
      )}
    </div>
  );
};

export default KaizenBox;
