import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store';

const FocusTracker = () => {
  const { addRecord, currentUser } = useStore();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionCompleted(true);
      setShowLogModal(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = (newDuration = duration) => { setIsRunning(false); setDuration(newDuration); setTimeLeft(newDuration * 60); setSessionCompleted(false); };

  const logTimesheet = () => {
    if (!taskName) return alert("Veuillez entrer le nom de la tâche.");
    addRecord('hr', 'timesheets', {
      date: new Date().toISOString().split('T')[0],
      collaborateur: currentUser?.nom,
      projet: 'Deep Work (Pomodoro)',
      tache: taskName,
      heures: Number((duration / 60).toFixed(2)),
      facturable: false,
      statut: 'Validé' // Auto-validated if it's personal focus tracking
    });
    setShowLogModal(false);
    reset();
    alert("Session enregistrée dans vos pointages !");
  };

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background progress ring */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, pointerEvents: 'none' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#EC4899', transition: 'width 1s linear' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EC4899', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
          <Clock size={14} /> Focus Tracker
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[15, 25, 45, 60].map(mins => (
             <button 
               key={mins}
               onClick={() => !isRunning && reset(mins)}
               style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, border: 'none', cursor: isRunning ? 'default' : 'pointer', background: duration === mins ? '#EC4899' : 'transparent', color: duration === mins ? 'white' : 'var(--text-muted)' }}
             >
               {mins}m
             </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-2px', color: isRunning ? '#EC4899' : 'var(--text)' }}>
          {m}:{s}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button onClick={toggle} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: isRunning ? '#F59E0B' : '#EC4899', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> {timeLeft < duration * 60 ? 'Reprendre' : 'Start'}</>}
        </button>
        <button onClick={() => reset(duration)} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: 'none', cursor: 'pointer' }}>
          <RotateCcw size={16} />
        </button>
      </div>

      {showLogModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 10 }}>
          <CheckCircle2 color="#10B981" size={48} style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Session Terminée</h3>
          <input 
            autoFocus
            placeholder="Sur quoi avez-vous travaillé ?" 
            value={taskName} 
            onChange={e => setTaskName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', marginBottom: '1rem' }} 
          />
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button onClick={logLog => setShowLogModal(false)} style={{ flex: 1, padding: '0.7rem', border: 'none', borderRadius: '0.5rem', background: '#333', color: 'white', cursor: 'pointer' }}>Ignorer</button>
            <button onClick={logTimesheet} style={{ flex: 1, padding: '0.7rem', border: 'none', borderRadius: '0.5rem', background: '#10B981', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Pointer le temps</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusTracker;
