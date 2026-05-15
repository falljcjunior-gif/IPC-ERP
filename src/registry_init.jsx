import React, { lazy } from 'react';
import { registry } from './services/Registry';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff, Landmark as LandmarkIcon,
  PieChart, History as HistoryIcon, Layout, UserCircle, Scale, Heart, Rocket, Brain, Inbox, Shield,
  Banknote, Wrench, Globe, Leaf, Smartphone, FlaskConical, GraduationCap
} from 'lucide-react';

// --- LAZY LOADED CORE COMPONENTS & MODULES ---
// This prevents circular dependencies and heavy initialization at startup.
const GlobalDashboard = lazy(() => import('./components/GlobalDashboard'));
const PersonalWorkspace = lazy(() => import('./components/PersonalWorkspace'));
const CRM = lazy(() => import('./modules/crm/CRM'));
const Sales = lazy(() => import('./modules/sales/Sales'));
const Production = lazy(() => import('./modules/production/Production'));
const LogisticsHub = lazy(() => import('./modules/logistics/LogisticsHub'));
const FinanceControlCenter = lazy(() => import('./modules/finance/FinanceControlCenter'));
const EnterpriseHub = lazy(() => import('./modules/enterprise/EnterpriseHub'));
const Connect = lazy(() => import('./modules/connect/ConnectHub'));
const ControlHub = lazy(() => import('./modules/admin/ControlHub'));
const WebsiteHub = lazy(() => import('./modules/website/WebsiteHub'));
const CommerceHub = lazy(() => import('./modules/sales/CommerceHub'));
const TalentHub = lazy(() => import('./modules/hr/TalentHub'));
const HR = lazy(() => import('./modules/HR'));
const Project = lazy(() => import('./modules/Project'));
const LegalHub = lazy(() => import('./modules/legal/LegalHub'));
const SignatureHub = lazy(() => import('./modules/signature/SignatureHub'));
const Marketing = lazy(() => import('./modules/marketing/Marketing'));
const BI = lazy(() => import('./modules/bi/BIHub'));
const MasterData = lazy(() => import('./modules/MasterData'));
const CalendarModule = lazy(() => import('./modules/Calendar'));
const Timesheets = lazy(() => import('./modules/Timesheets'));
const Quality = lazy(() => import('./modules/Quality'));
const Expenses = lazy(() => import('./modules/Expenses'));
const DMS = lazy(() => import('./modules/DMS'));
const Contracts = lazy(() => import('./modules/Contracts'));
const Planning = lazy(() => import('./modules/Planning'));
const Analytics = lazy(() => import('./modules/Analytics'));
const StaffPortal = lazy(() => import('./modules/StaffPortal'));
const History = lazy(() => import('./modules/History'));
const Workflows = lazy(() => import('./modules/Workflows'));
const Shipping = lazy(() => import('./modules/Shipping'));
const PlanningTemps = lazy(() => import('./components/PlanningTemps'));
const FleetHub = lazy(() => import('./modules/enterprise/FleetHub'));
const HelpdeskHub = lazy(() => import('./modules/enterprise/HelpdeskHub'));
const MissionsPortal = lazy(() => import('./modules/MissionsPortal'));
const NexusAcademy   = lazy(() => import('./modules/academy/NexusAcademy'));
const HoldingCockpit    = lazy(() => import('./modules/holding/HoldingCockpit'));
const FoundationCockpit = lazy(() => import('./modules/foundation/FoundationCockpit'));
const SubsidiaryCockpit = lazy(() => import('./modules/subsidiary/SubsidiaryCockpit'));
const MissionsHub    = lazy(() => import('./modules/missions/MissionsHub'));
const ExecutiveIntelligence = lazy(() => import('./modules/ExecutiveIntelligence'));
const SignatureModule = lazy(() => import('./modules/SignatureModule'));
const OfficeAdmin = lazy(() => import('./modules/OfficeAdmin'));
const ITModule = lazy(() => import('./modules/admin/ITModule'));
const Manufacturing = lazy(() => import('./modules/Manufacturing'));
const AuditHub = lazy(() => import('./modules/AuditHub'));
const MaintenanceHub = lazy(() => import('./modules/MaintenanceHub'));
const PayrollHub = lazy(() => import('./modules/PayrollHub'));
const ProcurementHub = lazy(() => import('./modules/ProcurementHub'));
const ESGHub = lazy(() => import('./modules/ESGHub'));
const MultiEntityHub = lazy(() => import('./modules/MultiEntityHub'));
const MobileCompanion = lazy(() => import('./modules/MobileCompanion'));
const StrategyLab     = lazy(() => import('./modules/strategy/StrategyLab'));

// Schemas (Keeping these eager for now as they are small and needed for UI metadata)
import { crmSchema } from './schemas/crm.schema';
import { hrSchema } from './schemas/hr.schema';
import { salesSchema } from './schemas/sales.schema';
import { inventorySchema } from './schemas/inventory.schema';
import { accountingSchema } from './schemas/accounting.schema';
import { financeSchema } from './schemas/finance.schema';
import { budgetSchema } from './schemas/budget.schema';
import { productionSchema } from './schemas/production.schema';
import { projectSchema } from './schemas/project.schema';
import { purchaseSchema } from './schemas/purchase.schema';
import { baseSchema } from './schemas/base.schema';
import { auditSchema } from './schemas/audit.schema';
import { adminSchema } from './schemas/admin.schema';
import { legalSchema } from './schemas/legal.schema';
import { helpdeskSchema } from './schemas/helpdesk.schema';
import { marketingSchema } from './schemas/marketing.schema';
import { signatureSchema } from './schemas/signature.schema';
import { websiteSchema } from './schemas/website.schema';
import { shippingSchema } from './schemas/shipping.schema';
import { commerceSchema } from './schemas/commerce.schema';
import { dmsSchema } from './schemas/dms.schema';
import { officeAdminSchema } from './schemas/office_admin.schema';
import { itSchema } from './schemas/it.schema';
import { maintenanceSchema } from './schemas/maintenance.schema';
import { payrollSchema } from './schemas/payroll.schema';
import { procurementSchema } from './schemas/procurement.schema';
import { esgSchema } from './schemas/esg.schema';

/**
 * Initialize the Platform Registry with Enterprise Modules
 * This follows Odoo's 'manifest' pattern.
 * Components are registered as types, Shell injects common props.
 */
let isInitialized = false;

export const initRegistry = () => {
  if (isInitialized) return;
  isInitialized = true;
  // Register Schemas
  [crmSchema, hrSchema, salesSchema, inventorySchema, accountingSchema, 
   financeSchema, budgetSchema, productionSchema, projectSchema, purchaseSchema,
    baseSchema, auditSchema, adminSchema, marketingSchema, legalSchema, signatureSchema, websiteSchema, shippingSchema, commerceSchema, dmsSchema, helpdeskSchema, officeAdminSchema, itSchema, maintenanceSchema, payrollSchema, procurementSchema, esgSchema].forEach(s => registry.registerSchema(s));

  // --- Cockpit ---
  registry.register({
    id: 'home', label: 'Espace Personnel', icon: <UserCircle size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SUPER_ADMIN', 'SALES', 'HR', 'FINANCE', 'STAFF', 'PRODUCTION'],
    component: PersonalWorkspace, priority: 1
  });

  registry.register({
    id: 'intelligence', label: 'Intelligence Stratégique', icon: <Brain size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
    component: ExecutiveIntelligence, priority: 2
  });

  registry.register({
    id: 'strategy_lab', label: 'Strategy Lab', icon: <FlaskConical size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
    component: StrategyLab, priority: 3
  });

  registry.register({
    id: 'missions', label: 'Portail des Missions', icon: <Rocket size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SUPER_ADMIN', 'SALES', 'HR', 'FINANCE', 'STAFF'],
    component: MissionsHub, priority: 3
  });


  registry.register({
    id: 'signature', label: 'Signature Électronique', icon: <FileSignature size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SUPER_ADMIN', 'SALES', 'FINANCE'],
    component: SignatureModule, priority: 5
  });

  registry.register({
    id: 'connect', label: 'Connect Plus', icon: <Zap size={18} />,
    category: 'cockpit', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE', 'STAFF'],
    component: Connect, priority: 4
  });


  // --- CRM & Ventes ---
  registry.register({
    id: 'crm', label: 'CRM & Ventes', icon: <Users size={18} />,
    category: 'crm', roles: ['ADMIN', 'SALES'],
    component: CRM, priority: 10
  });

  registry.register({
    id: 'sales', label: 'Ventes & Devis', icon: <ShoppingCart size={18} />,
    category: 'crm', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: Sales, priority: 11
  });

  registry.register({
    id: 'commerce', label: 'PdV & Abonnements', icon: <ShoppingBag size={18} />,
    category: 'crm', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: CommerceHub, priority: 12
  });

  registry.register({
    id: 'website', label: 'Sites Web', icon: <Layout size={18} />,
    category: 'crm', roles: ['ADMIN', 'SALES', 'MARKETING', 'STAFF'],
    component: WebsiteHub, priority: 13
  });

  registry.register({
    id: 'marketing', label: 'Marketing Digital', icon: <Mail size={18} />,
    category: 'crm', roles: ['ADMIN', 'HR', 'SALES'],
    component: Marketing, priority: 14
  });

  // --- Opérations & Logistique ---
  registry.register({
    id: 'inventory', label: 'Stocks & Logistique', icon: <Package size={18} />,
    category: 'operations', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: LogisticsHub, priority: 20
  });

  registry.register({
    id: 'shipping', label: 'Expéditions', icon: <Truck size={18} />,
    category: 'operations', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: Shipping, priority: 21
  });

  registry.register({
    id: 'purchase', label: 'Achats', icon: <ShoppingBag size={18} />,
    category: 'operations', roles: ['ADMIN', 'FINANCE'],
    component: LogisticsHub, priority: 22
  });

  registry.register({
    id: 'production', label: 'Production Avancée', icon: <Factory size={18} />,
    category: 'operations', roles: ['ADMIN', 'PRODUCTION', 'FINANCE', 'SUPER_ADMIN'],
    component: Manufacturing, priority: 23, schema: productionSchema
  });

  registry.register({
    id: 'quality', label: 'Qualité & HSE', icon: <ShieldCheck size={18} />,
    category: 'operations', roles: ['ADMIN', 'PRODUCTION', 'SUPER_ADMIN'],
    component: Quality, priority: 24
  });

  registry.register({
    id: 'projects', label: 'Projets', icon: <Briefcase size={18} />,
    category: 'operations', roles: ['ADMIN', 'FINANCE', 'SALES'],
    component: Project, priority: 24
  });

  registry.register({
    id: 'fleet', label: 'Flotte', icon: <Truck size={18} />,
    category: 'operations', roles: ['ADMIN', 'LOGISTICS', 'SUPER_ADMIN'],
    component: FleetHub, priority: 25
  });

  registry.register({
    id: 'maintenance', label: 'GMAO (Maintenance)', icon: <Wrench size={18} />,
    category: 'operations', roles: ['ADMIN', 'PRODUCTION', 'SUPER_ADMIN'],
    component: MaintenanceHub, priority: 26, schema: maintenanceSchema
  });

  // --- Finance & Stratégie ---
  registry.register({
    id: 'finance', label: 'Finance & Comptabilité', icon: <CreditCard size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: FinanceControlCenter, priority: 30
  });

  registry.register({
    id: 'legal', label: 'Juridique', icon: <Scale size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'LEGAL'],
    component: LegalHub, priority: 31
  });

  registry.register({
    id: 'accounting', label: 'Comptabilité', icon: <LandmarkIcon size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: lazy(() => import('./modules/finance/AccountingCenter')), priority: 32
  });

  registry.register({
    id: 'budget', label: 'Budget', icon: <PiggyBank size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: FinanceControlCenter, priority: 33
  });

  registry.register({
    id: 'expenses', label: 'Notes de Frais', icon: <Wallet size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'HR', 'STAFF'],
    component: Expenses, priority: 34
  });

  registry.register({
    id: 'bi', label: 'Business Intelligence', icon: <PieChart size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'SALES'],
    component: BI, priority: 35
  });

  registry.register({
    id: 'analytics', label: 'Analyses Avancées', icon: <BarChart3 size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: Analytics, priority: 36
  });

  registry.register({
    id: 'audit_hub', label: 'Audit & Conformité', icon: <ShieldCheck size={18} />,
    category: 'finance', roles: ['ADMIN', 'SUPER_ADMIN', 'LEGAL'],
    component: AuditHub, priority: 37, schema: auditSchema
  });

  // --- RH & Collaboration ---
  registry.register({
    id: 'hr', label: 'Ressources Humaines', icon: <Users2 size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR'],
    component: HR, priority: 40
  });

  registry.register({
    id: 'talent', label: 'People & Culture', icon: <Heart size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR'],
    component: TalentHub, priority: 41
  });

  registry.register({
    id: 'planning', label: 'Planning & Événements', icon: <Calendar size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'STAFF', 'SALES', 'FINANCE', 'PRODUCTION', 'SUPER_ADMIN'],
    component: PlanningTemps, priority: 42
  });

  registry.register({
    id: 'helpdesk', label: 'Support & Helpdesk', icon: <LifeBuoy size={18} />,
    category: 'hr', roles: ['ADMIN', 'STAFF', 'SUPER_ADMIN'],
    component: HelpdeskHub, priority: 43
  });

  registry.register({
    id: 'dms', label: 'Documents Cloud', icon: <Folder size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'],
    component: DMS, priority: 44
  });

  registry.register({
    id: 'office_admin', label: 'Services Généraux', icon: <Inbox size={18} />,
    category: 'hr', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'STAFF', 'MANAGER'],
    component: OfficeAdmin, priority: 45
  });

  registry.register({
    id: 'signature', label: 'Signature Électronique', icon: <FileSignature size={18} />,
    category: 'hr', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER'],
    component: SignatureHub, priority: 45
  });

  registry.register({
    id: 'payroll', label: 'Paie & Social', icon: <Banknote size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'FINANCE', 'SUPER_ADMIN'],
    component: PayrollHub, priority: 46, schema: payrollSchema
  });

  // --- Stratégie & International ---
  registry.register({
    id: 'procurement', label: 'Appels d\'Offres', icon: <ShoppingBag size={18} />,
    category: 'operations', roles: ['ADMIN', 'FINANCE', 'SUPER_ADMIN'],
    component: ProcurementHub, priority: 27, schema: procurementSchema
  });

  registry.register({
    id: 'esg', label: 'ESG & Environnement', icon: <Leaf size={18} />,
    category: 'operations', roles: ['ADMIN', 'SUPER_ADMIN', 'PRODUCTION'],
    component: ESGHub, priority: 28, schema: esgSchema
  });

  registry.register({
    id: 'multi_entity', label: 'Multi-Société & Devises', icon: <Globe size={18} />,
    category: 'finance', roles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
    component: MultiEntityHub, priority: 38
  });

  // --- Configuration & Admin ---
  registry.register({
    id: 'control_hub', label: 'Administration', icon: <Settings size={18} />,
    category: 'admin', roles: ['ADMIN', 'SUPER_ADMIN'],
    component: ControlHub, priority: 50
  });

  registry.register({
    id: 'it', label: 'IT Operations', icon: <Shield size={18} />,
    category: 'admin', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER'],
    component: ITModule, priority: 51
  });

  registry.register({
    id: 'mobile', label: 'Application Mobile', icon: <Smartphone size={18} />,
    category: 'admin', roles: ['ADMIN', 'SUPER_ADMIN'],
    component: MobileCompanion, priority: 52
  });

  // --- Nexus Academy ---
  registry.register({
    id: 'academy', label: 'Nexus Academy', icon: <GraduationCap size={18} />,
    category: 'cockpit',
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SALES', 'PRODUCTION', 'STAFF'],
    component: NexusAcademy, priority: 9
  });

  // ══════════════════════════════════════════════════════════
  // GROUP GOVERNANCE — Holding / Foundation Cockpits
  // Architecture 3 niveaux : HOLDING > FILIALES > FOUNDATION
  // ══════════════════════════════════════════════════════════

  // --- Holding Cockpit (Niveau 1 — Vue Groupe) ---
  registry.register({
    id: 'holding', label: 'Cockpit Groupe', icon: <Landmark size={18} />,
    category: 'cockpit',
    entityTypes: ['HOLDING'],   // [3-SPACE] Visible UNIQUEMENT pour Holding
    roles: [
      'SUPER_ADMIN',
      'HOLDING_CEO', 'HOLDING_CFO', 'HOLDING_CSO', 'HOLDING_CHRO',
      'HOLDING_CTO', 'HOLDING_AUDITOR', 'HOLDING_LEGAL', 'GROUP_AUDITOR',
    ],
    component: HoldingCockpit, priority: 1
  });

  // --- Subsidiary Cockpit (Niveau 2 — Vue Filiale) ---
  registry.register({
    id: 'subsidiary', label: 'Cockpit Filiale', icon: <Landmark size={18} />,
    category: 'cockpit',
    entityTypes: ['SUBSIDIARY'],   // [3-SPACE] Visible UNIQUEMENT pour Filiales
    roles: [
      'SUPER_ADMIN', 'ADMIN',
      'SUBSIDIARY_DG', 'SUBSIDIARY_CFO', 'SUBSIDIARY_RH',
      'COUNTRY_DIRECTOR_SUBSIDIARY', 'COUNTRY_HR', 'COUNTRY_FINANCE',
      'COUNTRY_OPERATIONS', 'COUNTRY_AUDITOR',
      'MANAGER', 'DIRECTOR',
    ],
    component: SubsidiaryCockpit, priority: 1
  });

  // --- Foundation Cockpit (Niveau 3 — Entité Non-Lucrative) ---
  registry.register({
    id: 'foundation', label: 'IPC Foundation', icon: <Heart size={18} />,
    category: 'cockpit',
    entityTypes: ['FOUNDATION'],   // [3-SPACE] Visible UNIQUEMENT pour Foundation
    roles: [
      'SUPER_ADMIN',
      'HOLDING_CEO', 'HOLDING_CFO', 'GROUP_AUDITOR',
      'FOUNDATION_DG', 'FOUNDATION_MANAGER', 'FOUNDATION_STAFF', 'FOUNDATION_AUDITOR',
      'COUNTRY_DIRECTOR_FOUNDATION',
    ],
    component: FoundationCockpit, priority: 1
  });
};
