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
  collection, query, orderBy, limit, where, onSnapshot, collectionGroup,
  serverTimestamp as firebaseServerTimestamp, writeBatch, arrayUnion, arrayRemove, increment
} from 'firebase/firestore';

export const serverTimestamp = firebaseServerTimestamp;
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';
import { validateData } from '../utils/validation';
import { getTenantFields, getTenantContext, isHoldingSession } from './TenantContext';


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
 * CRITICAL: Préserve les sentinelles Firebase (serverTimestamp, increment, etc.)
 */
const isFirebaseSentinel = (v) => {
  // Firebase FieldValue sentinels have _methodName (v9) or type property
  // They must NOT be recursively processed by sanitizeData
  if (!v || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  // Plain objects have Object.prototype or null — anything else is a class instance (like FieldValue)
  return proto !== null && proto !== Object.prototype;
};

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !isFirebaseSentinel(v)
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
  /**
   * Crée un document avec ID auto-généré.
   * Injecte automatiquement les métadonnées d'audit et de cycle de vie.
   * @returns {Promise<string>} ID du document créé
   */
  async createDocument(collectionName, data, schema = null) {
    const user = requireAuth();
    
    // Optional Schema Validation
    if (schema) {
      const { valid, errors } = validateData(schema, data);
      if (!valid) throw new FirestoreServiceError('VALIDATION_ERROR', errors.join(' '));
    }

    try {
      // [MULTI-TENANT] Injection automatique des champs d'isolation
      // tenant_id, company_id, branch_id proviennent du TenantContext singleton
      // peuplé par BusinessContext après auth. Garantit que TOUT document
      // appartient à un tenant et une société spécifiques côté serveur.
      const tenantFields = getTenantFields();

      const safeData = sanitizeData({
        ...tenantFields,  // tenant_id, company_id, branch_id (si définis)
        ...data,          // les données métier (peuvent surcharger si besoin)
        _createdAt: serverTimestamp(),
        _createdBy: user.uid,
        _updatedAt: serverTimestamp(),
        _deletedAt: null, // [SOFT-DELETE] Initialisé à null
      });
      const docRef = await addDoc(collection(db, collectionName), safeData);
      return { id: docRef.id };
    } catch (err) {
      if (err instanceof FirestoreServiceError) throw err;
      throw wrapFirestoreError(err, `createDocument(${collectionName})`);
    }
  },

  /**
   * Alias pour createDocument utilisé par certains services legacy.
   */
  async addDocument(collectionName, data) {
    return this.createDocument(collectionName, data);
  },

  /**
   * Crée ou remplace un document avec ID défini.
   */
  async setDocument(collectionName, documentId, data, merge = true) {
    const user = requireAuth();
    try {
      // [MULTI-TENANT] Pour les creates (merge=false), injecter les champs tenant
      const tenantFields = !merge ? getTenantFields() : {};

      const safeData = sanitizeData({
        ...tenantFields,
        ...data,
        _updatedAt: serverTimestamp(),
        _updatedBy: user.uid,
      });
      // Si c'est une création (pas merge), on s'assure que _createdAt et _deletedAt sont là
      if (!merge) {
        safeData._deletedAt = null;
        if (!safeData._createdAt) safeData._createdAt = serverTimestamp();
        if (!safeData._createdBy) safeData._createdBy = user.uid;
      }

      
      await setDoc(doc(db, collectionName, documentId), safeData, { merge });
    } catch (err) {
      throw wrapFirestoreError(err, `setDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Met à jour des champs spécifiques d'un document existant.
   */
  async updateDocument(collectionName, documentId, updates, schema = null) {
    const user = requireAuth();

    // Optional Schema Validation (Partial validation for updates)
    if (schema) {
      // We only validate the fields being updated
      const partialSchema = { ...schema, fields: Object.fromEntries(Object.entries(schema.fields || {}).filter(([k]) => k in updates)) };
      const { valid, errors } = validateData(partialSchema, updates);
      if (!valid) throw new FirestoreServiceError('VALIDATION_ERROR', errors.join(' '));
    }

    try {
      const safeUpdates = sanitizeData({
        ...updates,
        _updatedAt: serverTimestamp(),
        _updatedBy: user.uid,
      });
      await updateDoc(doc(db, collectionName, documentId), safeUpdates);
    } catch (err) {
      if (err instanceof FirestoreServiceError) throw err;
      throw wrapFirestoreError(err, `updateDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Supprime un document (Soft-Delete par défaut).
   * WHY: Sécurité et piste d'audit. Le document reste en base mais marqué comme supprimé.
   */
  async deleteDocument(collectionName, documentId) {
    const user = requireAuth();
    try {
      // [SOFT-DELETE] On ne supprime pas, on marque comme supprimé
      await updateDoc(doc(db, collectionName, documentId), {
        _deletedAt: serverTimestamp(),
        _deletedBy: user.uid,
        _updatedAt: serverTimestamp()
      });
    } catch (err) {
      throw wrapFirestoreError(err, `deleteDocument(${collectionName}/${documentId})`);
    }
  },

  /**
   * Suppression définitive (Admin uniquement en théorie via Rules).
   */
  async permanentDelete(collectionName, documentId) {
    requireAuth();
    try {
      await deleteDoc(doc(db, collectionName, documentId));
    } catch (err) {
      throw wrapFirestoreError(err, `permanentDelete(${collectionName}/${documentId})`);
    }
  },

  /**
   * Abonnement temps réel à une collection avec filtrage automatique du soft-delete.
   * @returns {Function} Fonction de désabonnement (unsubscribe)
   */
  subscribeToCollection(collectionName, options = {}, onData, onError) {
    requireAuth();
    const { filters = [], orderByField, limitTo, descending = false, includeDeleted = false, skipEntityFilter = false } = options;
    try {
      let q = collection(db, collectionName);
      const constraints = [];

      // [SOFT-DELETE FILTER] Par défaut, on ne montre pas les supprimés
      if (!includeDeleted) {
        constraints.push(where('_deletedAt', '==', null));
      }

      // [3-SPACE ISOLATION] Filtre entity_id côté client DÉSACTIVÉ pour go-live.
      // Raison : nécessiterait des index composites Firestore pour chaque collection
      // (entity_id + _deletedAt + _createdAt). La sécurité est déjà garantie par
      // les Firestore Rules `canReadOwnEntity()`. Le defense-in-depth client pourra
      // être réactivé en V2 après création des index via `firebase deploy --only firestore:indexes`.
      // `skipEntityFilter` reste utilisable pour les collections globales.

      for (const filter of filters) {
        if (Array.isArray(filter)) {
          const [field, op, value] = filter;
          constraints.push(where(field, op, value));
        } else {
          const { field, operator, value } = filter;
          constraints.push(where(field, operator, value));
        }
      }
      
      if (orderByField) constraints.push(orderBy(orderByField, descending ? 'desc' : 'asc'));
      if (limitTo) constraints.push(limit(limitTo));
      
      return onSnapshot(
        query(q, ...constraints),
        (snap) => {
          if (typeof onData === 'function') {
            onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        },
        (err) => {
          if (typeof onError === 'function') {
            onError(wrapFirestoreError(err, `subscribe(${collectionName})`));
          } else {
            console.error(`[FirestoreService] Subscription error for ${collectionName}:`, err);
          }
        }
      );
    } catch (err) {
      onError?.(wrapFirestoreError(err, `subscribeSetup(${collectionName})`));
      return () => {}; // no-op unsubscribe
    }
  },

  /**
   * Abonnement temps réel à un groupe de collections (ex: toutes les 'hr_private').
   */
  subscribeToCollectionGroup(collectionGroupId, options = {}, onData, onError) {
    requireAuth();
    const { filters = [], orderByField, limitTo, descending = false, includeDeleted = false } = options;
    try {
      let q = collectionGroup(db, collectionGroupId);
      const constraints = [];
      
      if (!includeDeleted) constraints.push(where('_deletedAt', '==', null));

      for (const filter of filters) {
        const [field, op, value] = Array.isArray(filter) ? filter : [filter.field, filter.operator, filter.value];
        constraints.push(where(field, op, value));
      }
      
      if (orderByField) constraints.push(orderBy(orderByField, descending ? 'desc' : 'asc'));
      if (limitTo) constraints.push(limit(limitTo));
      
      return onSnapshot(
        query(q, ...constraints),
        (snap) => {
          if (typeof onData === 'function') {
            onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        },
        (err) => {
          if (typeof onError === 'function') {
            onError(wrapFirestoreError(err, `subscribeGroup(${collectionGroupId})`));
          } else {
            console.error(`[FirestoreService] Subscription group error for ${collectionGroupId}:`, err);
          }
        }
      );
    } catch (err) {
      onError?.(wrapFirestoreError(err, `subscribeGroupSetup(${collectionGroupId})`));
      return () => {};
    }
  },

  /**
   * Abonnement temps réel à un document unique.
   */
  subscribeToDocument(collectionName, documentId, onData, onError) {
    requireAuth();
    return onSnapshot(
      doc(db, collectionName, documentId),
      (snap) => {
        const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        // On renvoie null si le document est marqué comme supprimé
        if (data && data._deletedAt) return onData(null);
        onData(data);
      },
      (err) => onError?.(wrapFirestoreError(err, `subscribeDoc(${collectionName}/${documentId})`))
    );
  },

  /**
   * Écriture atomique en batch (multi-documents).
   */
  async batchWrite(operations) {
    const user = requireAuth();
    try {
      const batch = writeBatch(db);
      for (const op of operations) {
        const ref = doc(db, op.collection, op.id);
        if (op.op === 'set') {
          batch.set(ref, sanitizeData({ ...op.data, _updatedBy: user.uid, _deletedAt: null }), { merge: true });
        } else if (op.op === 'update') {
          batch.update(ref, sanitizeData({ ...op.data, _updatedBy: user.uid, _updatedAt: serverTimestamp() }));
        } else if (op.op === 'delete') {
          // [SOFT-DELETE] Conversion en update
          batch.update(ref, { _deletedAt: serverTimestamp(), _deletedBy: user.uid, _updatedAt: serverTimestamp() });
        } else if (op.op === 'permanentDelete') {
          batch.delete(ref);
        }
      }
      await batch.commit();
    } catch (err) {
      throw wrapFirestoreError(err, 'batchWrite');
    }
  },

  /**
   * Helpers pour les opérations atomiques Firestore
   */
  arrayUnion: (...values) => arrayUnion(...values),
  arrayRemove: (...values) => arrayRemove(...values),
  increment: (n) => increment(n),
  serverTimestamp: () => serverTimestamp(),
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
