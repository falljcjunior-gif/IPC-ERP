const { onCall, onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { z } = require('zod');

const db = admin.firestore();

// Input Validation Schema
const ExchangeTokenSchema = z.object({
  provider: z.enum(['facebook', 'instagram', 'linkedin']),
  code: z.string().min(1),
  redirectUri: z.string().url()
});

/**
 * Exchange OAuth authorization code for Access Token
 */
exports.exchangeSocialToken = onCall({
  maxInstances: 5
}, async (request) => {
  if (!request.auth) throw new Error('unauthenticated');

  // Validate Input
  const result = ExchangeTokenSchema.safeParse(request.data);
  if (!result.success) {
    throw new Error(`invalid-argument: ${result.error.message}`);
  }

  const { provider, code, redirectUri } = result.data;

  try {
    const configSnap = await db.collection('system_config').doc('marketing_apis').get();
    if (!configSnap.exists) throw new Error('not-found: Configuration API manquante');
    const apiConfig = configSnap.data();

    if (provider === 'facebook' || provider === 'instagram') {
      const config = apiConfig.facebook;
      if (!config?.clientId) throw new Error('failed-precondition: Meta keys missing');

      const shortRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: { client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: redirectUri, code }
      });
      const shortToken = shortRes.data.access_token;

      const longRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: { grant_type: 'fb_exchange_token', client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: shortToken }
      });
      const longToken = longRes.data.access_token;

      const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
        params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' }
      });

      await db.collection('system_config').doc('social_tokens').set({
        facebook: {
          userToken: longToken,
          pages: pagesRes.data.data || [],
          connectedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      return { success: true, provider, pages: pagesRes.data.data || [] };
    }

    if (provider === 'linkedin') {
      const config = apiConfig.linkedin;
      if (!config?.clientId) throw new Error('failed-precondition: LinkedIn keys missing');

      const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: config.clientId, client_secret: config.clientSecret }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const liToken = tokenRes.data.access_token;

      const profileRes = await axios.get('https://api.linkedin.com/v2/me', { headers: { Authorization: `Bearer ${liToken}` } });

      await db.collection('system_config').doc('social_tokens').set({
        linkedin: {
          accessToken: liToken,
          profile: profileRes.data,
          connectedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      return { success: true, provider, profile: profileRes.data };
    }

  } catch (error) {
    logger.error(`Error exchanging ${provider} token:`, error.response?.data || error.message);
    throw new Error(`INTERNAL_ERROR: ${error.message}`);
  }
});

/**
 * Meta Webhook Handler
 */
exports.metaWebhook = onRequest({
  maxInstances: 5,
  secrets: ['META_WEBHOOK_VERIFY_TOKEN'],
}, async (req, res) => {
  // ── [SECURITY FIX V-05] Pas de fallback hardcodé — échec sécurisé si non configuré ──
  const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!WEBHOOK_VERIFY_TOKEN) {
    logger.error('[Webhook] META_WEBHOOK_VERIFY_TOKEN not set in environment.');
    return res.status(500).send('Server configuration error.');
  }

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    const body = req.body;
    try {
      if (body.object === 'instagram' || body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const msg of entry.messaging || []) {
            if (msg.message) {
              await db.collection('marketing_messages').add({
                sender: msg.sender.id,
                source: body.object,
                content: msg.message.text || '[Media]',
                receivedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      logger.error('Webhook error:', err);
      return res.status(500).send('Error');
    }
  }

  return res.status(405).send('Method Not Allowed');
});
