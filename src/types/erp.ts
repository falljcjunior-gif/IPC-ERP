/**
 * ══════════════════════════════════════════════════════════════
 * IPC ERP — Shared TypeScript Types (source de vérité)
 * ══════════════════════════════════════════════════════════════
 *
 * Migrer les types progressivement :
 *   Phase 1 (actuel) : Types fondamentaux + RBAC + Entités
 *   Phase 2 (30j)    : Finance, HR, CRM, Inventory
 *   Phase 3 (90j)    : All modules + store slices
 */

import type { Timestamp } from 'firebase/firestore';

// ── Base ─────────────────────────────────────────────────────────────────────

export interface BaseDocument {
  id?:        string;
  entity_id:  string;
  _createdAt?: Timestamp | Date | string;
  _updatedAt?: Timestamp | Date | string;
  _createdBy?: string;
  _updatedBy?: string;
}

// ── RBAC ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HOLDING_ADMIN'
  | 'HOLDING_FINANCE'
  | 'COUNTRY_ADMIN'
  | 'SUBSIDIARY_ADMIN'
  | 'FOUNDATION_ADMIN'
  | 'HR_MANAGER'
  | 'HR'
  | 'FINANCE'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'GUEST'
  | 'READ_ONLY';

export interface UserProfile extends BaseDocument {
  uid:         string;
  email:       string;
  nom?:        string;
  prenom?:     string;
  displayName?: string;
  photoURL?:   string;
  role:        UserRole;
  statut:      'Actif' | 'Inactif' | 'Suspendu';
  phone?:      string;
  poste?:      string;
  department?: string;
  fcmTokens?:  Record<string, string>;
  mfaEnabled?: boolean;
  lastLoginAt?: Timestamp | Date;
}

// ── Entité / Tenant ───────────────────────────────────────────────────────────

export type EntityType = 'holding' | 'subsidiary' | 'foundation' | 'country';
export type EntityState = 'active' | 'suspended' | 'trial' | 'archived';

export interface Entity extends BaseDocument {
  id:           string;
  name:         string;
  type:         EntityType;
  state:        EntityState;
  parentId?:    string;
  countryCode?: string;
  currency:     string;
  siren?:       string;
  tva?:         string;
  address?:     Address;
  license?:     LicenseInfo;
}

export interface LicenseInfo {
  plan:      'starter' | 'pro' | 'enterprise';
  maxUsers:  number;
  expiresAt: Timestamp | Date | string;
  features:  string[];
}

export interface Address {
  line1:   string;
  line2?:  string;
  city:    string;
  zip:     string;
  country: string;
  region?: string;
}

// ── Finance ───────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export interface Invoice extends BaseDocument {
  num:        string;
  client_id:  string;
  clientName: string;
  status:     InvoiceStatus;
  total:      number;
  tva:        number;
  currency:   string;
  issueDate:  Timestamp | Date | string;
  dueDate:    Timestamp | Date | string;
  paidAt?:    Timestamp | Date | string;
  lines:      InvoiceLine[];
  notes?:     string;
}

export interface InvoiceLine {
  description: string;
  quantity:    number;
  unitPrice:   number;
  tvaRate:     number;
  total:       number;
}

export type AccountingEntryType = 'DEBIT' | 'CREDIT';

export interface AccountingEntry extends BaseDocument {
  journalCode:  string;
  journalLib:   string;
  ecritureNum:  string;
  ecritureDate: Timestamp | Date | string;
  compteNum:    string;
  compteLib:    string;
  debit:        number;
  credit:       number;
  pieceRef?:    string;
  ecritureLib?: string;
  validated:    boolean;
  exercice?:    string;
}

// ── RH ────────────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'Actif' | 'Inactif' | 'En congé' | 'En préavis' | 'Offboarded';
export type ContractType   = 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance' | 'Prestataire';

export interface Employee extends BaseDocument {
  nom:            string;
  prenom:         string;
  email:          string;
  phone?:         string;
  poste:          string;
  department:     string;
  statut:         EmployeeStatus;
  contractType:   ContractType;
  startDate:      Timestamp | Date | string;
  endDate?:       Timestamp | Date | string;
  salaire?:       number;
  managerId?:     string;
  photoURL?:      string;
  performanceScore?: number;
}

export interface LeaveRequest extends BaseDocument {
  employee_id:  string;
  employeeName: string;
  type:         'Congé payé' | 'RTT' | 'Maladie' | 'Maternité' | 'Paternité' | 'Autre';
  startDate:    Timestamp | Date | string;
  endDate:      Timestamp | Date | string;
  days:         number;
  statut:       'Brouillon' | 'En attente' | 'Approuvé' | 'Rejeté';
  reason?:      string;
  approvedBy?:  string;
  approvedAt?:  Timestamp | Date | string;
}

// ── CRM ───────────────────────────────────────────────────────────────────────

export type ContactType   = 'lead' | 'prospect' | 'client' | 'partenaire';
export type DealStage     = 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Contact extends BaseDocument {
  nom:         string;
  prenom?:     string;
  company?:    string;
  email?:      string;
  phone?:      string;
  type:        ContactType;
  source?:     string;
  tags?:       string[];
  rfm_recency?:   number;
  rfm_frequency?: number;
  rfm_monetary?:  number;
  lastActivity?:  Timestamp | Date | string;
}

export interface Deal extends BaseDocument {
  name:       string;
  client_id:  string;
  value:      number;
  currency:   string;
  stage:      DealStage;
  probability: number;   // 0-100
  expectedClose: Timestamp | Date | string;
  owner_id?:  string;
  notes?:     string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export type ProductType = 'product' | 'service' | 'consumable' | 'asset';

export interface Product extends BaseDocument {
  name:               string;
  sku?:               string;
  type:               ProductType;
  quantity:           number;
  unitPrice:          number;
  currency:           string;
  reorder_point?:     number;
  avg_daily_consumption?: number;
  category?:          string;
  supplier_id?:       string;
  location?:          string;
}

// ── EventBus ──────────────────────────────────────────────────────────────────

export interface BusEvent<TPayload = Record<string, unknown>> {
  eventId:   string;
  topic:     string;
  payload:   TPayload;
  source:    string;
  userId:    string | null;
  timestamp: Date;
}

export type BusHandler<TPayload = Record<string, unknown>> =
  (event: BusEvent<TPayload>) => void;

// ── AI Forecasting ────────────────────────────────────────────────────────────

export interface SalesForecast {
  forecast_4w:     number;
  forecast_8w:     number;
  forecast_12w:    number;
  confidence_pct:  number;
  trend:           'HAUSSE' | 'BAISSE' | 'STABLE';
  reasoning:       string;
  method:          'gemini' | 'linear_regression';
  series_weeks:    number;
}

export interface StockAlert {
  id:                   string;
  name:                 string;
  quantity:             number;
  daysUntilEmpty:       number;
  daysUntilReorder:     number;
  severity:             'CRITICAL' | 'HIGH' | 'MEDIUM';
  estimatedEmptyDate:   string;
}

export interface CashFlowForecast {
  inflows:   { d30: number; d60: number; d90: number };
  outflows:  { d30: number; d60: number; d90: number };
  netCashFlow: { d30: number; d60: number; d90: number };
  totalReceivables: number;
  totalPayables:    number;
  generatedAt:      string;
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export interface FeatureFlagDefaults {
  ai_forecasting:         boolean;
  beta_dashboard:         boolean;
  max_export_rows:        number;
  maintenance_banner_msg: string;
  slo_tracing_enabled:    boolean;
  new_crm_ui:             boolean;
  webrtc_stats_interval:  number;
  virtual_list_threshold: number;
  sentry_enabled:         boolean;
  api_rate_limit_burst:   number;
}

// ── SIEM ─────────────────────────────────────────────────────────────────────

export type SecurityEventType =
  | 'BRUTE_FORCE'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_EXFILTRATION'
  | 'MULTI_GEO'
  | 'ODD_HOURS_ACCESS'
  | 'RAPID_FIRE_API';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent extends BaseDocument {
  type:        SecurityEventType;
  severity:    SecuritySeverity;
  riskScore:   number;
  resolved:    boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp | Date | string;
  resolution?: string;
  userId?:     string;
  ip?:         string;
  [key: string]: unknown;
}

// ── Data Quality ──────────────────────────────────────────────────────────────

export interface DataQualityReport {
  date:         string;
  score:        number;
  duration:     string;
  orphanUsers?: { count: number; items: Array<{ uid: string; email?: string }> };
  invalidRoles?: { count: number; items: Array<{ uid: string; role: string }> };
  accountingBalance?: { imbalancedEntities: number; items: Array<unknown> };
  negativeStock?: { count: number; items: Array<{ id: string; quantity: number }> };
  employeeContracts?: { count: number; items: Array<unknown> };
  staleWebhooks?: { count: number; items: Array<unknown> };
  staleNotifications?: { count: number };
  generatedAt?: Timestamp | Date | string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Helper pour typer les données Firestore (pas de propriété 'id' native) */
export type FirestoreData<T extends BaseDocument> = Omit<T, 'id'>;

/** Rend toutes les propriétés optionnelles sauf les clés données */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Extraire les clés de type string */
export type StringKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
