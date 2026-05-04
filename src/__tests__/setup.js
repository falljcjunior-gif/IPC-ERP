import { vi } from 'vitest';

// ── Firebase App ──────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

// ── Firebase Auth ─────────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// ── Firebase Firestore ────────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), commit: vi.fn(() => Promise.resolve()) })),
  onSnapshot: vi.fn((_q, cb) => { if (typeof cb === 'function') cb({ docs: [] }); return () => {}; }),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
  FieldValue: { serverTimestamp: vi.fn(), increment: vi.fn(), arrayUnion: vi.fn() },
}));

// ── Firebase Messaging (FCM — non supporté en jsdom) ──────────────────────
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));

// ── Firebase Database (RTDB) ──────────────────────────────────────────────
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  onValue: vi.fn(),
  set: vi.fn(),
}));

// ── Firebase Storage ──────────────────────────────────────────────────────
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// ── Zustand Store ─────────────────────────────────────────────────────────
vi.mock('../store', () => ({
  useStore: vi.fn((selector) => {
    const mockState = {
      data: {},
      currentUser: { uid: 'test-uid', role: 'ADMIN' },
      setAuth: vi.fn(),
      addRecord: vi.fn(),
      hasPermission: vi.fn(() => true),
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

// ── Firebase config (court-circuit l'import qui crash) ────────────────────
vi.mock('../firebase/config', () => ({
  app: {},
  db: {},
  auth: { currentUser: null },
  storage: {},
  rtdb: {},
  messaging: null,
}));

// ── Browser APIs ──────────────────────────────────────────────────────────
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.navigator.serviceWorker = {
  register: vi.fn(() => Promise.resolve()),
};
