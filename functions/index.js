const admin = require('firebase-admin');

// Initialize Admin SDK once
admin.initializeApp();

/**
 * ══════════════════════════════════════════════════════════════
 * IPC-ERP BACKEND — MODULAR ARCHITECTURE (v2)
 * ══════════════════════════════════════════════════════════════
 */

// 1. Social & Webhooks (Disabled for now)
// const social = require('./modules/social');
// exports.exchangeSocialToken = social.exchangeSocialToken;
// exports.metaWebhook = social.metaWebhook;

// 2. Admin & Security
const adminModule = require('./modules/admin');
exports.deleteUserAccount = adminModule.deleteUserAccount;

// 3. AI Copilot (Nexus)
const nexus = require('./modules/nexus');
exports.nexusChat = nexus.nexusChat;

// 4. Background Triggers (Inventory, Finance, Audit)
const triggers = require('./modules/triggers');
exports.globalAuditTrigger = triggers.globalAuditTrigger;
exports.syncAccountingOnInvoicePaid = triggers.syncAccountingOnInvoicePaid;
exports.updateStockOnProductionComplete = triggers.updateStockOnProductionComplete;

// 5. Monitoring & Health
const monitoring = require('./modules/monitoring');
exports.getBackendStatus = monitoring.getBackendStatus;
