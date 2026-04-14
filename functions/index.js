const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

/**
 * Exchange OAuth authorization code for Access Token
 * Supporting: Facebook, Instagram, LinkedIn
 */
exports.exchangeSocialToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  const { provider, code, redirectUri } = data;
  if (!provider || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Champs manquants');
  }

  try {
    // 1. Fetch API Credentials from secure firestore config
    const configSnap = await db.collection('system_config').doc('marketing_apis').get();
    if (!configSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Configuration API manquante');
    }
    const config = configSnap.data()[provider];

    if (provider === 'facebook' || provider === 'instagram') {
      // Exchange code for Short-lived token
      const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });

      const shortLivedToken = response.data.access_token;

      // Exchange for Long-lived token (60 days)
      const longLivedResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          fb_exchange_token: shortLivedToken
        }
      });

      return {
        accessToken: longLivedResponse.data.access_token,
        expiresIn: longLivedResponse.data.expires_in
      };
    }

    // Support for LinkedIn, etc. (Can be added later)
    return { success: true };

  } catch (error) {
    console.error(`Error exchanging ${provider} token:`, error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
