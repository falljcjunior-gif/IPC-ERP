const admin = require('firebase-admin');

// Initialize Admin SDK once
admin.initializeApp();

/**
 * ══════════════════════════════════════════════════════════════
 * IPC-ERP BACKEND — MODULAR ARCHITECTURE (v2)
 * ══════════════════════════════════════════════════════════════
 */

// 1. Social & Webhooks
const social = require('./modules/social');
exports.exchangeSocialToken = social.exchangeSocialToken;
exports.metaWebhook = social.metaWebhook;

// 2. Admin & Security
const adminModule = require('./modules/admin');
exports.deleteUserAccount = adminModule.deleteUserAccount;

// 3. AI Copilot (Nexus)
const nexus = require('./modules/nexus');
exports.nexusChat = nexus.nexusChat;

// 4. Background Triggers (Inventory, Finance, Audit, Butler)
const triggers = require('./modules/triggers');
exports.globalAuditTrigger = triggers.globalAuditTrigger;
exports.syncAccountingOnInvoicePaid = triggers.syncAccountingOnInvoicePaid;
exports.updateStockOnProductionComplete = triggers.updateStockOnProductionComplete;
exports.onTaskAssigned = triggers.onTaskAssigned;
exports.onProjectAutoTag = triggers.onProjectAutoTag;
exports.checkTaskDeadlines = triggers.checkTaskDeadlines;
exports.archiveInactiveRooms = triggers.archiveInactiveRooms;


// 5. Monitoring & Health
const monitoring = require('./modules/monitoring');
exports.getBackendStatus = monitoring.getBackendStatus;

// 6. Automated Backups (Industry Grade)
const backups = require('./modules/backup_scheduler');
exports.scheduledFirestoreExport = backups.scheduledFirestoreExport;
exports.manualFirestoreExport = backups.manualFirestoreExport;

