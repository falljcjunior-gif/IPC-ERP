const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

/**
 * IPC MAIL ENGINE — v2
 *
 * Processes mail_outbox and sends emails via Resend API.
 *
 * Configuration (Firebase Functions environment variables):
 *   RESEND_API_KEY  — API key from resend.com (free tier: 100 emails/day)
 *   MAIL_FROM       — Sender address, e.g. "IPC Platform <no-reply@ipcgreenblocks.com>"
 *
 * To set:
 *   firebase functions:secrets:set RESEND_API_KEY
 *   firebase functions:config:set mail.from="IPC Platform <no-reply@ipcgreenblocks.com>"
 *
 * Without RESEND_API_KEY, emails are logged to Cloud Functions console
 * and marked PENDING for retry once the key is configured.
 */

const db = admin.firestore();

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const BATCH_SIZE      = 20;

async function sendViaResend({ to, subject, html, from }) {
  const { safeGet, RESEND_API_KEY: RESEND_SECRET, MAIL_FROM: MAIL_FROM_SECRET } = require('./secrets');
  const apiKey = safeGet(RESEND_SECRET, 'RESEND_API_KEY');
  const sender = from || safeGet(MAIL_FROM_SECRET, 'MAIL_FROM') || 'IPC Platform <no-reply@ipcgreenblocks.com>';

  if (!apiKey) {
    // No key configured — log and signal so the caller can keep status PENDING
    logger.warn('[Mail Engine] RESEND_API_KEY not set. Email not sent — will retry when key is configured.', { to, subject });
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await axios.post(RESEND_ENDPOINT, {
    from: sender,
    to:   Array.isArray(to) ? to : [to],
    subject,
    html,
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    timeout: 10000,
  });

  if (!response.data?.id) {
    throw new Error(`Resend returned unexpected response: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

/**
 * Process pending emails in the outbox.
 * Called by the scheduled cron every 5 minutes.
 */
exports.processMailOutbox = async () => {
  logger.info('[Mail Engine] Checking mail_outbox for pending messages...');

  let pendingMails;
  try {
    pendingMails = await db.collection('mail_outbox')
      .where('status', '==', 'PENDING')
      .limit(BATCH_SIZE)
      .get();
  } catch (err) {
    logger.error('[Mail Engine] Failed to query mail_outbox:', err.message);
    throw err;
  }

  if (pendingMails.empty) {
    logger.info('[Mail Engine] No pending emails.');
    return { processed: 0 };
  }

  let successCount = 0;
  let failCount    = 0;

  for (const doc of pendingMails.docs) {
    const mail   = doc.data();
    const mailId = doc.id;

    try {
      const result = await sendViaResend({
        to:      mail.to,
        subject: mail.subject,
        html:    mail.html || mail.body,
        from:    mail.from,
      });

      await doc.ref.update({
        status:    'SENT',
        sentAt:    admin.firestore.FieldValue.serverTimestamp(),
        messageId: result.id,
        provider:  'resend',
      });
      successCount++;
      logger.info(`[Mail Engine] Sent ${mailId} → ${mail.to} (resend id: ${result.id})`);

    } catch (err) {
      failCount++;

      const isConfigError = err.message.includes('RESEND_API_KEY not configured');
      logger.error(`[Mail Engine] Failed to send ${mailId}:`, err.message);

      await doc.ref.update({
        // Keep PENDING if it's a config issue so it retries automatically once key is set
        status:        isConfigError ? 'PENDING' : 'FAILED',
        error:         err.message,
        attempts:      admin.firestore.FieldValue.increment(1),
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  logger.info(`[Mail Engine] Done: ${successCount} sent, ${failCount} failed.`);
  return { successCount, failCount };
};
