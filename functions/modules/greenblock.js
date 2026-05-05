const axios = require('axios');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * ══════════════════════════════════════════════════════════════
 * IPC GREEN BLOCK — BRIDGE SERVICE (SSOT)
 * ══════════════════════════════════════════════════════════════
 */

/**
 * Synchronize a Firestore record to IPC Green Block
 * @param {string} model - IPC Green Block model name (e.g. 'com.ipc.greenblock.base.db.Partner')
 * @param {Object} data - The record data to sync
 * @param {string} sourceId - The Firestore document ID
 */
exports.syncRecord = async (model, data, sourceId) => {
  const GREENBLOCK_URL = process.env.GREENBLOCK_API_URL || 'https://greenblock.ipc-platform.com/rest';
  const GREENBLOCK_KEY = process.env.GREENBLOCK_API_KEY;

  if (!GREENBLOCK_KEY) {
    logger.warn(`[Green Block] Sync SKIPPED: API Key missing for doc ${sourceId}. Ensure GREENBLOCK_API_KEY is set.`);
    return { success: false, status: 'SKIPPED_CONFIG_MISSING' };
  }

  const syncLogRef = db.collection('system_sync_logs').doc();
  const startTime = Date.now();

  try {
    // 🚀 ACTUAL IPC GREEN BLOCK REST API CALL
    const response = await axios.post(`${GREENBLOCK_URL}/${model}`, data, {
      headers: { 
        'X-API-KEY': GREENBLOCK_KEY,
        'Content-Type': 'application/json',
        'X-Source-ID': sourceId
      },
      timeout: 10000 // 10s timeout
    });

    logger.info(`[Green Block] Sync SUCCESS: ${model}/${sourceId}`, { status: response.status });

    await syncLogRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sourceId,
      model,
      status: 'SUCCESS',
      statusCode: response.status,
      duration: Date.now() - startTime
    });

    return { success: true, status: response.status };
  } catch (error) {
    const errorMsg = error.response ? 
      `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}` : 
      error.message;

    logger.error(`[Green Block] Sync ERROR [${model}/${sourceId}]:`, errorMsg);
    
    await syncLogRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sourceId,
      model,
      status: 'ERROR',
      errorMessage: errorMsg,
      duration: Date.now() - startTime
    });

    return { 
      success: false, 
      error: errorMsg,
      isRetryable: !error.response || (error.response.status >= 500) 
    };
  }
};
