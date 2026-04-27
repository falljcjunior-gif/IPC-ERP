/* global global */
import { vi } from 'vitest';

// [SDET] Mock Global de Firebase pour isolation totale
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn()
}));

// [SDET] Mock de Zustand pour éviter les persistances réelles
vi.mock('../store', () => ({
  useStore: vi.fn((selector) => {
    const mockState = {
      data: {},
      setAuth: vi.fn(),
      addRecord: vi.fn()
    };
    return selector ? selector(mockState) : mockState;
  })
}));

// Simulation de l'environnement Browser
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
