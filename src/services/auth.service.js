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
import { getRecaptchaToken, RECAPTCHA_ACTIONS } from '../utils/recaptcha';

export const AuthService = {

  /**
   * Récupère l'utilisateur Firebase actuel
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Récupère le token FCM pour les notifications
   */
  async getFCMToken() {
    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
    if (!vapidKey) {
      logger.warn('[AuthService] VITE_FCM_VAPID_KEY manquante — notifications push désactivées. Ajoutez-la dans .env');
      return null;
    }
    try {
      const token = await getToken(messaging, { vapidKey });
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
      // ── [SECURITY] Obtention du token reCAPTCHA Enterprise ──────────
      const recaptchaToken = await getRecaptchaToken(RECAPTCHA_ACTIONS.LOGIN);
      if (!recaptchaToken) {
        logger.warn('AuthService:login:recaptcha_unavailable — mode dégradé');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupération sécurisée du profil utilisateur
      const userData = await FirestoreService.getDocument('users', user.uid);
      
      if (!userData) {
        throw new Error('Profil utilisateur introuvable dans le système.');
      }

      // Vérification du statut du compte
      if (userData.profile?.active === false) {
        throw new Error('Votre compte a été désactivé par l\'administrateur.');
      }

      // Stocke le token reCAPTCHA pour vérification backend (ex: Cloud Function verifyRecaptcha)
      if (recaptchaToken) {
        await FirestoreService.updateDocument('users', user.uid, {
          '_security.lastRecaptchaToken': recaptchaToken,
          '_security.lastLoginAt': new Date().toISOString(),
        });
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
      // ── [SECURITY] Obtention du token reCAPTCHA Enterprise ──────────
      const recaptchaToken = await getRecaptchaToken(RECAPTCHA_ACTIONS.CHANGE_PASSWORD);
      if (!recaptchaToken) {
        logger.warn('AuthService:mandatoryPasswordUpdate:recaptcha_unavailable — mode dégradé');
      }

      await fbUpdatePassword(auth.currentUser, newPassword);
      
      const updateData = {
        'profile.mustChangePassword': false
      };

      if (recaptchaToken) {
        updateData['_security.lastRecaptchaToken'] = recaptchaToken;
        updateData['_security.lastPasswordChangeAt'] = new Date().toISOString();
      }

      await FirestoreService.updateDocument('users', auth.currentUser.uid, updateData);
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
