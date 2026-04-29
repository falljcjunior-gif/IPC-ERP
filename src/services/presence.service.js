import { rtdb, auth } from '../firebase/config';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';

/**
 * IPC Presence Service (Realtime Database)
 * Optimizes costs by moving high-frequency status updates out of Firestore.
 */
export const PresenceService = {
  
  /**
   * Sync user online status and typing indicators
   */
  setPresence: (userId) => {
    if (!userId) return;

    const userStatusDatabaseRef = ref(rtdb, `/status/${userId}`);
    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };
    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(rtdb, '.info/connected');
    
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) return;

      onDisconnect(userStatusDatabaseRef)
        .set(isOfflineForDatabase)
        .then(() => {
          set(userStatusDatabaseRef, isOnlineForDatabase);
        });
    });
  },

  /**
   * Set typing status for a specific room
   */
  setTyping: (roomId, userId, isTyping) => {
    if (!roomId || !userId) return;
    const typingRef = ref(rtdb, `/typing/${roomId}/${userId}`);
    set(typingRef, isTyping ? serverTimestamp() : null);
  },

  /**
   * Listen for typing users in a room
   */
  subscribeToTyping: (roomId, callback) => {
    const typingRef = ref(rtdb, `/typing/${roomId}`);
    return onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      const typingUsers = Object.keys(data).filter(uid => {
        // Only count as typing if the timestamp is less than 5 seconds old
        const ts = data[uid];
        return ts && (Date.now() - ts < 5000);
      });
      callback(typingUsers);
    });
  }
};
