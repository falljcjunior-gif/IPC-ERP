import { onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useStore } from '../store';

/**
 * CallListener Service
 * Decoupled listener for WebRTC signaling to avoid BusinessContext bloat.
 */
export const CallListener = {
  unsubscribe: null,

  init(userId) {
    if (this.unsubscribe) this.unsubscribe();
    if (!userId) return;

    console.log(`[CallListener] Initializing for user: ${userId}`);

    const q = query(
      collection(db, 'calls'), 
      where('receiverId', '==', userId), 
      where('status', '==', 'ringing'), 
      limit(1)
    );

    this.unsubscribe = onSnapshot(q, (snap) => {
      const { activeCall, setActiveCall } = useStore.getState();
      
      if (snap.empty) {
        if (activeCall?.status === 'ringing' && activeCall?.role === 'receiver') {
          console.log("[CallListener] Call cancelled or answered elsewhere");
          setActiveCall(null);
        }
        return;
      }

      const callDoc = snap.docs[0];
      const callData = callDoc.data();
      
      if (activeCall?.id === callDoc.id) return;

      console.log(`[CallListener] Incoming call detected: ${callDoc.id}`);
      setActiveCall({ 
        id: callDoc.id, 
        roomId: callData.roomId || callDoc.id,
        role: 'receiver', 
        type: callData.type, 
        contactName: callData.callerName || 'Collègue',
        status: 'ringing'
      });
    });
  },

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
};
