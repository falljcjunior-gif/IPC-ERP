import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FirestoreService } from '../services/firestore.service';

/**
 *  NEXUS OS: NOTIFICATION & EVENT STORE
 * Centralized state for cross-module alerts, system events, and user notifications.
 *
 * [AUDIT FIX 2026-05-18] markAsRead + markAllAsRead now also persist to Firestore
 * so that read state survives page refresh and is consistent across devices/tabs.
 * Notifications from Firestore (`notifications` collection) use their Firestore doc ID.
 * Local hints (store-generated) use Date.now() IDs and are localStorage-only (via persist).
 */
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isSidebarOpen: false,

      /**
       *  ADD NOTIFICATION
       * @param {Object} notification - { id, title, message, type, module, priority, metadata }
       */
      addNotification: (notification) => {
        const newNotif = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'info', // info, warning, critical
          ...notification
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 100), // Keep last 100
          unreadCount: state.unreadCount + 1
        }));

        // Trigger system sound or vibration if critical
        if (notification.priority === 'critical') {
          console.warn(`[CRITICAL ALERT]: ${notification.title}`);
          // Potential integration with Browser Notification API here
        }
      },

      // [AUDIT FIX] Persist read state to Firestore for cross-session/cross-device sync.
      // Firestore notifications use a string ID; local hints use numeric timestamp IDs.
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        // Persist to Firestore if the notification has a Firestore doc ID (string)
        if (typeof id === 'string' && id.length > 10) {
          FirestoreService.updateDocument('notifications', id, { isRead: true, readAt: new Date().toISOString() })
            .catch(err => console.warn('[NotificationStore] markAsRead Firestore sync failed:', err.message));
        }
      },

      markAllAsRead: () => {
        const { notifications } = get();
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0
        }));
        // Batch persist all Firestore-backed notifications
        const firestoreIds = notifications.filter(n => !n.isRead && typeof n.id === 'string' && n.id.length > 10).map(n => n.id);
        if (firestoreIds.length > 0) {
          const now = new Date().toISOString();
          Promise.all(
            firestoreIds.map(id =>
              FirestoreService.updateDocument('notifications', id, { isRead: true, readAt: now })
                .catch(err => console.warn(`[NotificationStore] markAllAsRead failed for ${id}:`, err.message))
            )
          );
        }
      },

      toggleSidebar: (force) => {
        set((state) => ({ isSidebarOpen: force !== undefined ? force : !state.isSidebarOpen }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      }
    }),
    {
      name: 'nexus-notifications-storage',
    }
  )
);
