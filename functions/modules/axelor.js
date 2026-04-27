// const axios = require('axios');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * ══════════════════════════════════════════════════════════════
 * AXELOR OPEN SUITE — BRIDGE SERVICE (SSOT)
 * ══════════════════════════════════════════════════════════════
 */

/**
 * Synchronize a Firestore record to Axelor
 * @param {string} model - Axelor model name (e.g. 'com.axelor.apps.base.db.Partner')
 * @param {Object} data - The record data to sync
 * @param {string} sourceId - The Firestore document ID
 */
exports.syncRecord = async (model, data, sourceId) => {
  // const AXELOR_URL = process.env.AXELOR_API_URL || 'https://axelor.example.com/rest';
  const AXELOR_KEY = process.env.AXELOR_API_KEY;

  if (!AXELOR_KEY) {
    logger.warn(`Axelor Sync Skipped: API Key missing for ${sourceId}`);
    return { success: false, status: 'SKIPPED_CONFIG_MISSING' };
  }

  const syncLogRef = db.collection('system_sync_logs').doc();
  const startTime = Date.now();

  try {
    // Placeholder for actual Axelor REST API call
    // const response = await axios.post(`${AXELOR_URL}/${model}`, data, {
    //   headers: { 'X-API-KEY': AXELOR_KEY }
    // });

    logger.info(`Axelor Sync [STUB]: ${model}/${sourceId}`);

    await syncLogRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sourceId,
      model,
      status: 'SUCCESS_STUB',
      duration: Date.now() - startTime
    });

    return { success: true };
  } catch (error) {
    logger.error(`Axelor Sync Error [${model}/${sourceId}]:`, error.message);
    
    await syncLogRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sourceId,
      model,
      status: 'ERROR',
      errorMessage: error.message,
      duration: Date.now() - startTime
    });

    return { success: false, error: error.message };
  }
};
