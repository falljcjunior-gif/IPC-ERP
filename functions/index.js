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
// exports.metaWebhook = social.metaWebhook; // Désactivé (Nécessite run.services.setIamPolicy)

// 2. Admin & Security
const adminModule = require('./modules/admin');
exports.deleteUserAccount = adminModule.deleteUserAccount;
exports.onUserCreated = adminModule.onUserCreated;
exports.backfillUsers = adminModule.backfillUsers;
exports.backfillGreenBlock = adminModule.backfillGreenBlock;

// 2b. RBAC — Custom Claims (source de vérité des rôles)
const rbac = require('./modules/rbac');
exports.setUserRole = rbac.setUserRole;
exports.bootstrapSuperAdmin = rbac.bootstrapSuperAdmin;

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
exports.validateAccountingEntry = triggers.validateAccountingEntry;
exports.onEmployeeOnboarded = triggers.onEmployeeOnboarded;
exports.onEmployeeOffboarded = triggers.onEmployeeOffboarded;
exports.hrPrivacyAudit = triggers.hrPrivacyAudit;
exports.generatePrePayroll = triggers.generatePrePayroll;
exports.refreshCockpitMetrics = triggers.refreshCockpitMetrics;

// 4. Monitoring & Backups
const monitoring = require('./modules/monitoring');
const backups = require('./modules/backup_scheduler');
exports.getBackendStatus = monitoring.getBackendStatus;
exports.scheduledFirestoreExport = backups.scheduledFirestoreExport;
exports.manualFirestoreExport = backups.manualFirestoreExport;

// 5. Outbox & Retry Worker (Cron)
const outbox = require('./modules/outbox');
exports.processOutboxQueue = outbox.processOutboxQueue;

// 6. RFM Engine — Client Segmentation (Runs daily)
const rfm = require('./modules/rfm_engine');
exports.computeRFMScores = rfm.computeRFMScores;
exports.recomputeClientRFMOnInvoice = rfm.recomputeClientRFMOnInvoice;

// 7. Sales Automation — Quote follow-ups, Stock reorders, Recurring Invoices
const salesAuto = require('./modules/automation_sales');
exports.devisRelanceAutomatic = salesAuto.devisRelanceAutomatic;
exports.stockReorderAlert = salesAuto.stockReorderAlert;
exports.generateRecurringInvoices = salesAuto.generateRecurringInvoices;
exports.clientEngagementAlerts = salesAuto.clientEngagementAlerts;

// 10. Mail Engine — Outbox processing
const mail = require('./modules/mail');
exports.processMailOutbox = mail.processMailOutbox;

// 8. Rate Limiter (middleware — importé par les autres modules)
// Pas d'export Cloud Function — utilisé comme middleware dans nexus.js et social.js
// const { RATE_PRESETS } = require('./modules/rate_limiter');

// 9. Firestore Partitioning Utilities
// Pas d'export Cloud Function — utilitaires pour la migration
// const partitioning = require('./modules/firestore_partitioning');
