/**
 * ══════════════════════════════════════════════════════════════════
 * AUTHENTICATION DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Isolation de l'authentification et de la session.
 * Centralise les logs de connexion et la gestion des droits.
 */

import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  updatePassword as fbUpdatePassword, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import logger from '../utils/logger';

export const AuthService = {

  /**
   * Connexion sécurisée avec vérification du statut du compte
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupération sécurisée du profil utilisateur
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Profil utilisateur introuvable dans le système.');
      }

      const userData = userDoc.data();

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
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
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
