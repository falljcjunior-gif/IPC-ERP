import { create } from 'zustand';

/**
 *  NEXUS OS: EPHEMERAL TOAST STORE
 * Handles non-intrusive UI feedback for actions (Success, Error, Info).
 */
export const useToastStore = create((set) => ({
  toasts: [],
  
  addToast: (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
