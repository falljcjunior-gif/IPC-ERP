import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 *  NEXUS OS: NOTIFICATION & EVENT STORE
 * Centralized state for cross-module alerts, system events, and user notifications.
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

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => 
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0
        }));
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
