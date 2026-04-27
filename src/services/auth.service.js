/**
 * ══════════════════════════════════════════════════════════════════
 * AUTHENTICATION DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Isolation de l'authentification et de la session.
 * Centralise les logs de connexion et la gestion des droits.
 */

import { auth } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  updatePassword as fbUpdatePassword, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { FirestoreService } from './firestore.service';
import { messaging } from '../firebase/config';
import { getToken } from 'firebase/messaging';
import logger from '../utils/logger';

export const AuthService = {

  /**
   * Récupère le token FCM pour les notifications
   */
  async getFCMToken() {
    try {
      const token = await getToken(messaging, {
        vapidKey: 'BJp_9p1X0-8Zz8X_X_X_X_X_X' // Replace with real VAPID key if needed
      });
      return token;
    } catch (err) {
      logger.warn('AuthService:getFCMToken:failed', err);
      return null;
    }
  },

  /**
   * Connexion sécurisée avec vérification du statut du compte
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupération sécurisée du profil utilisateur
      const userData = await FirestoreService.getDocument('users', user.uid);
      
      if (!userData) {
        throw new Error('Profil utilisateur introuvable dans le système.');
      }

      // userData is already data object from getDocument

      // Vérification du statut du compte
      if (userData.profile?.active === false) {
        throw new Error('Votre compte a été désactivé par l\'administrateur.');
      }

      logger.info('AuthService:login:success', { uid: user.uid, email: user.email });
      return { user, userData };
    } catch (err) {
      logger.error('AuthService:login:failed', err);
      throw err;
    }
  },

  /**
   * Changement de mot de passe obligatoire
   */
  async mandatoryPasswordUpdate(newPassword) {
    if (!auth.currentUser) throw new Error('Aucun utilisateur connecté.');

    try {
      await fbUpdatePassword(auth.currentUser, newPassword);
      await FirestoreService.updateDocument('users', auth.currentUser.uid, {
        'profile.mustChangePassword': false
      });
      logger.info('AuthService:passwordUpdate:success', { uid: auth.currentUser.uid });
    } catch (err) {
      logger.error('AuthService:passwordUpdate:failed', err);
      throw err;
    }
  },

  /**
   * Déconnexion propre
   */
  async logout() {
    try {
      await fbSignOut(auth);
      logger.info('AuthService:logout:success');
    } catch (err) {
      logger.error('AuthService:logout:failed', err);
    }
  }
};
