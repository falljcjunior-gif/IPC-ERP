import { collection, doc, setDoc, getDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 📧 IPC MAIL SERVICE
 * Handles OAuth integration and mailbox synchronization for Gmail, Outlook, and Private Servers.
 */
class MailService {
  /**
   * Initialize a mail connection for the current user
   * @param {string} userId - Current user UID
   * @param {string} provider - 'gmail' | 'outlook' | 'private'
   * @param {Object} config - Connection details (credentials or tokens)
   */
  async connectAccount(userId, provider, config) {
    const accountRef = doc(db, 'user_mail_accounts', userId);
    
    // In a real app, this would trigger an OAuth flow via Cloud Functions
    // Here we store the configuration securely (Vault pattern)
    await setDoc(accountRef, {
      userId,
      provider,
      config, // Should be encrypted in production
      status: 'CONNECTED',
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  }

  /**
   * Listen to user's mailbox (Mocked or via Cloud Functions polling)
   */
  subscribeToMails(userId, callback) {
    const mailsRef = collection(db, 'user_mails');
    const q = query(
      mailsRef, 
      where('userId', '==', userId), 
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snap) => {
      const mails = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(mails);
    });
  }

  /**
   * Trigger OAuth flow (Mock helper)
   */
  getOAuthUrl(provider) {
    const urls = {
      gmail: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...'
    };
    return urls[provider];
  }

  /**
   * Send mail via IPC Bridge
   */
  async sendMail(userId, mailData) {
    // Add to outbox queue for Cloud Functions to process
    const outboxRef = collection(db, 'mail_outbox');
    await setDoc(doc(outboxRef), {
      ...mailData,
      userId,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
    
    return { success: true };
  }
}

export const mailService = new MailService();
