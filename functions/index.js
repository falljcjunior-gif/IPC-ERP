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
exports.provisionUser = adminModule.provisionUser;
exports.updateUserPermissions = adminModule.updateUserPermissions;
exports.onUserCreated = adminModule.onUserCreated;
exports.backfillUsers = adminModule.backfillUsers;
exports.backfillGreenBlock = adminModule.backfillGreenBlock;

// 2b. RBAC — Custom Claims (source de vérité des rôles)
const rbac = require('./modules/rbac');
exports.setUserRole = rbac.setUserRole;
exports.bootstrapSuperAdmin = rbac.bootstrapSuperAdmin;
exports.migrateGuestToEmployee = rbac.migrateGuestToEmployee;

// 2d. Accounting ledger — bank-grade CF-only writes
const accounting = require('./modules/accounting');
exports.postAccountingEntry = accounting.postAccountingEntry;

// 2e. Daily orphan-user audit (data-integrity safety net)
const auditOrphans = require('./modules/audit_orphans');
exports.auditOrphanUsersScheduled = auditOrphans.auditOrphanUsersScheduled;
exports.auditOrphanUsersNow = auditOrphans.auditOrphanUsersNow;

// 2c. reCAPTCHA Enterprise — Vérification anti-bot
const recaptcha = require('./modules/recaptcha');
exports.verifyRecaptcha = recaptcha.verifyRecaptcha;

// 3. AI Copilot — JARVIS
const nexus = require('./modules/nexus');
exports.nexusChat = nexus.nexusChat;

// 3d. JARVIS Proactive Monitor — Scan autonome toutes les 2h
const jarvisMonitor = require('./modules/jarvis_monitor');
exports.jarvisMonitor = jarvisMonitor.jarvisMonitor;

// 3e. JARVIS Stream — SSE streaming + mémoire long terme + multimodal
const jarvisStreamModule = require('./modules/jarvis_stream');
exports.jarvisStream = jarvisStreamModule.jarvisStream;

// 3b. Le Commandant — Agent de Management Proactif (scan toutes les 4h)
const commander = require('./modules/commander');
exports.commanderScan = commander.commanderScan;
exports.commanderChat = commander.commanderChat;

// 3c. Nexus Score Engine — Évaluation multi-dimensionnelle (hebdo + mensuel + on-demand)
const nexusScore = require('./modules/nexus_score');
exports.computeNexusScoresWeekly  = nexusScore.computeNexusScoresWeekly;
exports.computeNexusScoresMonthly = nexusScore.computeNexusScoresMonthly;
exports.computeNexusScoresNow     = nexusScore.computeNexusScoresNow;

// 4. Background Triggers (Inventory, Finance, Audit, Butler)
const triggers = require('./modules/triggers');

// 4b. Missions Butler (Kanban automation + CRON + cross-module)
const missionsButler = require('./modules/missions_butler');
exports.onMissionsCardMoved         = missionsButler.onMissionsCardMoved;
exports.onMissionsCardCreated       = missionsButler.onMissionsCardCreated;
exports.missionsDeadlineScanner     = missionsButler.missionsDeadlineScanner;
exports.missionsWeeklyReport        = missionsButler.missionsWeeklyReport;
exports.missionsResetDueSoonFlags   = missionsButler.missionsResetDueSoonFlags;
exports.saveMissionsButlerRule      = missionsButler.saveMissionsButlerRule;
exports.deleteMissionsButlerRule    = missionsButler.deleteMissionsButlerRule;
exports.executeMissionsButlerRule   = missionsButler.executeMissionsButlerRule;
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
exports.validateHRApprovalRequest = triggers.validateHRApprovalRequest;
exports.personalManagerPilotage = triggers.personalManagerPilotage;

// 4a. Entity Provisioning — Holding SaaS lifecycle management
const entityProvisioning = require('./modules/entity_provisioning');
exports.createGroupEntity    = entityProvisioning.createGroupEntity;
exports.updateGroupEntity    = entityProvisioning.updateGroupEntity;
exports.changeEntityState    = entityProvisioning.changeEntityState;
exports.assignEntityLicense  = entityProvisioning.assignEntityLicense;
exports.approveEntityUpgrade = entityProvisioning.approveEntityUpgrade;
exports.duplicateGroupEntity = entityProvisioning.duplicateGroupEntity;

// 4b. Country Provisioning v3.0 — Holding → Country → {Subsidiary, Foundation}
const countryProvisioning = require('./modules/country_provisioning');
exports.provisionCountryScope   = countryProvisioning.provisionCountryScope;
exports.changeCountryScopeState = countryProvisioning.changeCountryScopeState;

// 4. Monitoring & Backups
const monitoring = require('./modules/monitoring');
const backups = require('./modules/backup_scheduler');
exports.getBackendStatus = monitoring.getBackendStatus;
exports.cleanupExpiredRateLimits = monitoring.cleanupExpiredRateLimits;
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

// 11. One-shot Migrations (A.1.b backfill, etc.) — SUPER_ADMIN only
const migrations = require('./modules/migrations');
exports.backfillHrPrivateEntityId = migrations.backfillHrPrivateEntityId;

// 8. Rate Limiter (middleware — importé par les autres modules)
// Pas d'export Cloud Function — utilisé comme middleware dans nexus.js et social.js
// const { RATE_PRESETS } = require('./modules/rate_limiter');

// 12. Webhooks sortants — Dispatch événements métier vers endpoints HTTP tiers
const webhooks = require('./modules/webhooks');
exports.dispatchWebhookEvent = webhooks.dispatchWebhookEvent;
exports.manageWebhook        = webhooks.manageWebhook;

// 13. API REST publique — Intégrations tierces (Zapier, Make, ERP partenaires)
const api_rest = require('./modules/api_rest');
exports.api = api_rest.api;

// 14a. SIEM — Détection d'anomalies de sécurité en temps réel (Zero Trust)
const siem = require('./modules/siem');
exports.detectBruteForce          = siem.detectBruteForce;
exports.detectPrivilegeEscalation = siem.detectPrivilegeEscalation;
exports.detectDataExfiltration    = siem.detectDataExfiltration;
exports.siemHourlyScan            = siem.siemHourlyScan;
exports.getSecurityEvents         = siem.getSecurityEvents;
exports.resolveSecurityEvent      = siem.resolveSecurityEvent;

// 14. Data Quality Monitor — Scan nocturne d'intégrité à 02:00 UTC
const dataQuality = require('./modules/data_quality');
exports.dataQualityScan       = dataQuality.dataQualityScan;
exports.dataQualityScanNow    = dataQuality.dataQualityScanNow;
exports.getDataQualityReport  = dataQuality.getDataQualityReport;

// 15. AI Forecasting — Prévisions Gemini (CA, Stock, Churn, Trésorerie)
const aiForecast = require('./modules/ai_forecasting');
exports.forecastSalesRevenue   = aiForecast.forecastSalesRevenue;
exports.forecastStockDepletion = aiForecast.forecastStockDepletion;
exports.forecastCashFlow       = aiForecast.forecastCashFlow;
exports.computeForecastNow     = aiForecast.computeForecastNow;

// 16. Holding Governance — Server-side approval validation (BUG-02 fix)
const holdingGovernance = require('./modules/holding_governance');
exports.approveGovernanceItem  = holdingGovernance.approveGovernanceItem;
exports.rejectGovernanceItem   = holdingGovernance.rejectGovernanceItem;

// 17. Holding Consolidation — Aggregate group metrics (BUG-01 fix)
const holdingConsolidation = require('./modules/holding_consolidation');
exports.aggregateHoldingMetrics       = holdingConsolidation.aggregateHoldingMetrics;
exports.triggerConsolidationRefresh   = holdingConsolidation.triggerConsolidationRefresh;

// 9. Firestore Partitioning Utilities
// Pas d'export Cloud Function — utilitaires pour la migration
// const partitioning = require('./modules/firestore_partitioning');
