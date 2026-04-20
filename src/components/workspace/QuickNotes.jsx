import React, { useState, useEffect } from 'react';
import { Edit3, Check } from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const QuickNotes = () => {
  const { currentUser } = useBusiness();
  const storageKey = `ipc_quicknotes_${currentUser?.id || 'guest'}`;
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedNote = localStorage.getItem(storageKey);
    if (savedNote) setNote(savedNote);
  }, [storageKey]);

  const handleChange = (e) => {
    setNote(e.target.value);
    localStorage.setItem(storageKey, e.target.value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
          <Edit3 size={14} /> Scratchpad
        </div>
        {saved && <span style={{ fontSize: '0.65rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10}/> Sauvegardé</span>}
      </div>
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="Écrivez une idée, un numéro, un rappel..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          resize: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};

export default QuickNotes;
