/**
 * ══════════════════════════════════════════════════════════════════
 * USER DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: Centralise la synchronisation du profil utilisateur.
 * Garantit que le rôle vient TOUJOURS de Firestore (source de vérité).
 * Gère la mise à jour du token FCM à chaque connexion.
 */

import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import logger from '../utils/logger';

export const UserService = {

  /**
   * Synchronise le profil Firebase Auth avec les données Firestore.
   * Crée un profil minimal si l'utilisateur n'existe pas encore.
   * @param {Object} fbUser - Objet Firebase Auth user
   * @returns {Promise<Object>} Profil complet de l'utilisateur
   */
  async syncProfile(fbUser) {
    if (!fbUser?.uid) throw new Error('[UserService] fbUser invalide');

    try {
      // ── [SECURITY] Lire le rôle depuis les Custom Claims (token signé côté serveur) ──
      // Immuable côté client — seul le SDK Admin peut modifier les claims.
      const tokenResult = await fbUser.getIdTokenResult(true); // force refresh
      const claimedRole = tokenResult.claims?.role || null;

      const profile = await FirestoreService.getDocument('users', fbUser.uid);

      if (!profile) {
        logger.warn(`[UserService] Profil introuvable pour ${fbUser.uid} — création automatique`);
        // Le rôle initial vient des claims, sinon STAFF
        const defaultRole = claimedRole || 'STAFF';
        const newProfile = {
          nom: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          role: defaultRole,
          departement: defaultRole === 'SUPER_ADMIN' ? 'DIRECTION' : '',
          avatar: fbUser.photoURL || null,
          profile: {
            active: true,
            mustChangePassword: false,
            createdAt: new Date().toISOString()
          }
        };
        await FirestoreService.setDocument('users', fbUser.uid, newProfile, false);
        return { id: fbUser.uid, ...newProfile };
      }

      if (profile.profile?.active === false) {
        throw new Error('Votre compte a été désactivé par l\'administrateur.');
      }

      try {
        const fcmToken = await AuthService.getFCMToken();
        if (fcmToken && fcmToken !== profile.fcmToken) {
          await FirestoreService.updateDocument('users', fbUser.uid, { fcmToken });
          logger.info('[UserService] FCM token mis à jour', { uid: fbUser.uid });
        }
      } catch (fcmErr) {
        logger.warn('[UserService] FCM token update failed', fcmErr);
      }

      // ── [SECURITY] Source de vérité du rôle = Custom Claims (token) ──
      // Si aucun claim défini, on utilise le rôle Firestore comme fallback de migration.
      const finalRole = claimedRole || profile.role || 'STAFF';

      return {
        id: fbUser.uid,
        email: fbUser.email,
        nom: profile.profile?.nom || profile.nom || fbUser.displayName || 'Utilisateur',
        role: finalRole,
        avatar: profile.avatar || null,
        departement: profile.departement || '',
        mustChangePassword: profile.profile?.mustChangePassword || false,
        fcmToken: profile.fcmToken || null,
      };

    } catch (err) {
      logger.error('[UserService] syncProfile failed', err);
      throw err;
    }
  },

  /**
   * Met à jour le profil d'un utilisateur (admin uniquement pour le rôle).
   */
  async updateProfile(uid, updates) {
    // Le rôle ne peut être modifié que via Cloud Functions ou console Firebase
    // On le retire des updates côté client pour forcer le passage par l'admin
    const { role: _ignoredRole, ...safeUpdates } = updates;
    if (Object.keys(safeUpdates).length === 0) return;
    return FirestoreService.updateDocument('users', uid, safeUpdates);
  },

  /**
   * Liste tous les utilisateurs (admins seulement côté UI — Firestore Rules protègent).
   */
  async listUsers() {
    return FirestoreService.listDocuments('users', {
      filters: [['profile.active', '==', true]],
    });
  }
};
