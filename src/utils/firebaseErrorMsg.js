/**
 * firebaseErrorMsg.js — Messages d'erreur Firebase lisibles en français
 *
 * Usage :
 *   import { getFirebaseError } from '../utils/firebaseErrorMsg';
 *   addToast(getFirebaseError(err), 'error');
 */

const FIREBASE_ERRORS = {
  // Auth
  'auth/user-not-found':         'Utilisateur introuvable.',
  'auth/wrong-password':         'Mot de passe incorrect.',
  'auth/email-already-in-use':   'Cet email est déjà utilisé.',
  'auth/weak-password':          'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/invalid-email':          'Adresse email invalide.',
  'auth/too-many-requests':      'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/requires-recent-login':  'Session expirée. Reconnectez-vous et réessayez.',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
  'auth/user-disabled':          'Ce compte a été désactivé.',
  'auth/popup-closed-by-user':   'Connexion annulée.',

  // Firestore
  'permission-denied':           'Permission refusée. Vous n\'avez pas accès à cette ressource.',
  'not-found':                   'Ressource introuvable. Elle a peut-être été supprimée.',
  'already-exists':              'Cet enregistrement existe déjà.',
  'resource-exhausted':          'Quota dépassé. Réessayez dans quelques instants.',
  'unavailable':                 'Service temporairement indisponible. Réessayez.',
  'deadline-exceeded':           'Délai dépassé. La connexion est trop lente.',
  'cancelled':                   'Opération annulée.',
  'data-loss':                   'Erreur intégrité des données. Contactez le support.',
  'unauthenticated':             'Vous devez être connecté pour effectuer cette action.',

  // Cloud Functions
  'functions/permission-denied': 'Permission refusée par le serveur.',
  'functions/unauthenticated':   'Authentification requise.',
  'functions/not-found':         'Fonction introuvable.',
  'functions/internal':          'Erreur interne du serveur. Contactez le support.',
  'functions/invalid-argument':  'Données invalides. Vérifiez les champs saisis.',
  'functions/deadline-exceeded': 'Délai dépassé. La requête a pris trop de temps.',
  'functions/resource-exhausted':'Quota dépassé. Réessayez plus tard.',

  // Storage
  'storage/unauthorized':        'Accès au fichier refusé.',
  'storage/object-not-found':    'Fichier introuvable.',
  'storage/quota-exceeded':      'Espace de stockage insuffisant.',
  'storage/canceled':            'Téléchargement annulé.',
};

/**
 * Retourne un message d'erreur lisible en français.
 * @param {Error|object} err - Erreur Firebase
 * @param {string} fallback - Message par défaut si code inconnu
 * @returns {string}
 */
export function getFirebaseError(err, fallback = 'Une erreur est survenue. Réessayez.') {
  if (!err) return fallback;

  // Code Firebase standard (ex: { code: 'permission-denied' })
  const code = err?.code || err?.message || '';

  // Chercher correspondance exacte
  if (FIREBASE_ERRORS[code]) return FIREBASE_ERRORS[code];

  // Chercher correspondance partielle (ex: 'auth/user-not-found' contient 'user-not-found')
  for (const [key, msg] of Object.entries(FIREBASE_ERRORS)) {
    if (code.includes(key)) return msg;
  }

  // Si le message est court et lisible, l'utiliser directement
  if (err?.message && err.message.length < 120 && !err.message.includes('Firebase')) {
    return err.message;
  }

  return fallback;
}

export default getFirebaseError;
