import { FirestoreService } from '../../services/firestore.service';

export const createCallSlice = (set, get) => ({
  activeCall: null,
  setActiveCall: (val) => set(typeof val === 'function' ? (state) => ({ activeCall: val(state.activeCall) }) : { activeCall: val }),

  playRingtone: () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const startTime = audioCtx.currentTime;
    
    const playNote = (freq, time, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    for (let i = 0; i < 4; i++) {
        const offset = i * 2;
        playNote(660, startTime + offset, 0.4);      
        playNote(660, startTime + offset + 0.5, 0.4); 
        playNote(660, startTime + offset + 1.2, 0.6); 
    }
  },

  acceptCall: async () => {
    const { activeCall } = get();
    if (!activeCall) return;
    try {
      // 1. Update local state instantly
      set(state => ({ 
        activeCall: state.activeCall ? { ...state.activeCall, accepted: true, status: 'ongoing' } : null 
      }));
      
      // 2. Sync with Firestore in background
      await FirestoreService.updateDocument('calls', activeCall.id, { status: 'accepted' });
    } catch (err) { 
      console.error("Accept Error:", err); 
    }
  },

  rejectCall: async () => {
    const { activeCall } = get();
    if (!activeCall) return;
    try {
      // 1. Close UI instantly
      set({ activeCall: null });
      
      // 2. Notify other side via Firestore
      await FirestoreService.updateDocument('calls', activeCall.id, { status: 'rejected' });
    } catch (err) { 
      console.error("Reject Error:", err); 
    }
  },
});
