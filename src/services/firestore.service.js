/**
 * ══════════════════════════════════════════════════════════════════
 * FIREBASE ABSTRACTION LAYER (FAL)
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: Aucun composant UI ne devrait connaître Firebase. Si on change
 * de backend (Firebase → Supabase), un seul fichier change.
 * PATTERN: Repository Pattern — fournit une interface stable
 * indépendante de l'implémentation.
 *
 * RÈGLE ABSOLUE: Toute interaction Firestore passe par ce service.
 */

import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, orderBy, limit, where, onSnapshot,
  serverTimestamp, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase/config';

// ── Type Guards internes ──────────────────────────────────────────────────────

/**
 * WHY: Vérification d'authentification centralisée.
 * Évite la duplication du check dans chaque méthode.
 */
const requireAuth = () => {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('NON_AUTHENTIFIÉ', 'Vous devez être connecté pour effectuer cette action.');
  return user;
};

/**
 * WHY: Sanitisation défensive de toutes les données écrites.
 * Supprime les valeurs `undefined` qui font crasher Firestore.
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
          ? sanitizeData(v)
          : v
      ])
  );
};

// ── Erreur typée (ne fuite jamais de stack trace à l'UI) ─────────────────────

export class FirestoreServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FirestoreServiceError';
    this.code = code;
  }
}

const wrapFirestoreError = (err, context) => {
  // WHY: Masquer les erreurs techniques Firestore brutes à l'utilisateur.
  // On loggue en interne, on retourne un message métier propre.
  const codeMap = {
    'permission-denied': 'Accès refusé. Contactez votre administrateur.',
    'not-found': 'Ressource introuvable.',
    'already-exists': 'Cet enregistrement existe déjà.',
    'unavailable': 'Service temporairement indisponible. Réessayez.',
    'unauthenticated': 'Session expirée. Veuillez vous reconnecter.',
  };
  const safeMessage = codeMap[err.code] || 'Une erreur est survenue. Réessayez.';
  console.error(`[FirestoreService:${context}]`, err.code, err.message);
  return new FirestoreServiceError(err.code || 'UNKNOWN', safeMessage);
};

// ══════════════════════════════════════════════════════════════════
// SERVICE PRINCIPAL
// ══════════════════════════════════════════════════════════════════

export const FirestoreService = {

  /**
   * Lit un document unique de manière sécurisée.
   * @returns {Promise<Object|null>}
   */
  async getDocument(collectionName, documentId) {
    requireAuth();
    try {
      const snap = await getDoc(doc(db, collectionName, documentId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (err) {
      throw wrapFirestoreError(err, `getDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Liste les documents d'une collection avec options de filtre/tri.
   * @param {string} collectionName
   * @param {Object} options - { filters: [[field, op, value]], orderByField, limitTo, descending }
   * @returns {Promise<Array>}
   */
  async listDocuments(collectionName, options = {}) {
    requireAuth();
    const { filters = [], orderByField, limitTo, descending = false } = options;
    try {
      let q = collection(db, collectionName);
      const constraints = [];
      for (const [field, op, value] of filters) {
        constraints.push(where(field, op, value));
      }
      if (orderByField) constraints.push(orderBy(orderByField, descending ? 'desc' : 'asc'));
      if (limitTo) constraints.push(limit(limitTo));
      const snap = await getDocs(query(q, ...constraints));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw wrapFirestoreError(err, `listDocuments(${collectionName})`);
    }
  },

  /**
   * Crée un document avec ID auto-généré.
   * Injecte automatiquement les métadonnées d'audit.
   * @returns {Promise<string>} ID du document créé
   */
  async createDocument(collectionName, data) {
    const user = requireAuth();
    try {
      const safeData = sanitizeData({
        ...data,
        _createdAt: serverTimestamp(),
        _createdBy: user.uid,
        _updatedAt: serverTimestamp(),
      });
      const docRef = await addDoc(collection(db, collectionName), safeData);
      return docRef.id;
    } catch (err) {
      throw wrapFirestoreError(err, `createDocument(${collectionName})`);
    }
  },

  /**
   * Crée ou remplace un document avec ID défini.
   */
  async setDocument(collectionName, documentId, data, merge = true) {
    const user = requireAuth();
    try {
      const safeData = sanitizeData({
        ...data,
        _updatedAt: serverTimestamp(),
        _updatedBy: user.uid,
      });
      await setDoc(doc(db, collectionName, documentId), safeData, { merge });
    } catch (err) {
      throw wrapFirestoreError(err, `setDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Met à jour des champs spécifiques d'un document existant.
   */
  async updateDocument(collectionName, documentId, updates) {
    const user = requireAuth();
    try {
      const safeUpdates = sanitizeData({
        ...updates,
        _updatedAt: serverTimestamp(),
        _updatedBy: user.uid,
      });
      await updateDoc(doc(db, collectionName, documentId), safeUpdates);
    } catch (err) {
      throw wrapFirestoreError(err, `updateDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Supprime un document.
   * WHY: Centralisé pour pouvoir ajouter du soft-delete ou audit trail plus tard.
   */
  async deleteDocument(collectionName, documentId) {
    requireAuth();
    try {
      await deleteDoc(doc(db, collectionName, documentId));
    } catch (err) {
      throw wrapFirestoreError(err, `deleteDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Abonnement temps réel à une collection.
   * @returns {Function} Fonction de désabonnement (unsubscribe)
   */
  subscribeToCollection(collectionName, options = {}, onData, onError) {
    requireAuth();
    const { filters = [], orderByField, limitTo, descending = false } = options;
    try {
      let q = collection(db, collectionName);
      const constraints = [];
      for (const [field, op, value] of filters) {
        constraints.push(where(field, op, value));
      }
      if (orderByField) constraints.push(orderBy(orderByField, descending ? 'desc' : 'asc'));
      if (limitTo) constraints.push(limit(limitTo));
      return onSnapshot(
        query(q, ...constraints),
        (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => onError?.(wrapFirestoreError(err, `subscribe(${collectionName})`))
      );
    } catch (err) {
      onError?.(wrapFirestoreError(err, `subscribeSetup(${collectionName})`));
      return () => {}; // no-op unsubscribe
    }
  },

  /**
   * Abonnement temps réel à un document unique.
   * @returns {Function} Fonction de désabonnement
   */
  subscribeToDocument(collectionName, documentId, onData, onError) {
    requireAuth();
    return onSnapshot(
      doc(db, collectionName, documentId),
      (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => onError?.(wrapFirestoreError(err, `subscribeDoc(${collectionName}/${documentId})`))
    );
  },

  /**
   * Écriture atomique en batch (multi-documents).
   * @param {Array<{op: 'set'|'update'|'delete', collection, id, data}>} operations
   */
  async batchWrite(operations) {
    const user = requireAuth();
    try {
      const batch = writeBatch(db);
      for (const op of operations) {
        const ref = doc(db, op.collection, op.id);
        if (op.op === 'set') batch.set(ref, sanitizeData({ ...op.data, _updatedBy: user.uid }), { merge: true });
        else if (op.op === 'update') batch.update(ref, sanitizeData({ ...op.data, _updatedBy: user.uid }));
        else if (op.op === 'delete') batch.delete(ref);
      }
      await batch.commit();
    } catch (err) {
      throw wrapFirestoreError(err, 'batchWrite');
    }
  },
};

// ── Storage Service (isolé — même principe) ──────────────────────────────────

export const StorageService = {
  /**
   * Upload un fichier et retourne son URL de téléchargement.
   * @param {File} file
   * @param {string} path - Chemin de stockage (ex: 'documents/2024/contrat.pdf')
   * @returns {Promise<string>} URL publique
   */
  async uploadFile(file, path) {
    requireAuth();
    if (!file) throw new FirestoreServiceError('FICHIER_MANQUANT', 'Aucun fichier fourni.');
    if (file.size > 50 * 1024 * 1024) {
      throw new FirestoreServiceError('FICHIER_TROP_GRAND', 'Le fichier dépasse 50 Mo.');
    }
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (err) {
      throw wrapFirestoreError(err, `uploadFile(${path})`);
    }
  },
};
