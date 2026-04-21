import React, { lazy } from 'react';
import { registry } from './services/Registry';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff, Landmark as LandmarkIcon,
  PieChart, History as HistoryIcon, Layout, UserCircle, Scale, Heart
} from 'lucide-react';

// --- LAZY LOADED CORE COMPONENTS & MODULES ---
// This prevents circular dependencies and heavy initialization at startup.
const GlobalDashboard = lazy(() => import('./components/GlobalDashboard'));
const PersonalWorkspace = lazy(() => import('./components/PersonalWorkspace'));
const CRM = lazy(() => import('./modules/crm/CRM'));
const Sales = lazy(() => import('./modules/sales/Sales'));
const Inventory = lazy(() => import('./modules/logistics/LogisticsHub'));
const Accounting = lazy(() => import('./modules/finance/AccountingCenter'));
const Finance = lazy(() => import('./modules/finance/FinanceControlCenter'));
const Budget = lazy(() => import('./modules/finance/FinanceControlCenter')); // Shared file
const HR = lazy(() => import('./modules/HR'));
const Production = lazy(() => import('./modules/production/Production'));
const Project = lazy(() => import('./modules/Project'));
const Purchase = lazy(() => import('./modules/logistics/LogisticsHub')); // Shared file
const LegalHub = lazy(() => import('./modules/legal/LegalHub'));
const SignatureHub = lazy(() => import('./modules/signature/SignatureHub'));
const Marketing = lazy(() => import('./modules/marketing/Marketing'));
const BI = lazy(() => import('./modules/bi/BIHub'));
const MasterData = lazy(() => import('./modules/MasterData'));
const CalendarModule = lazy(() => import('./modules/Calendar'));
const Helpdesk = lazy(() => import('./modules/enterprise/EnterpriseHub'));
const Timesheets = lazy(() => import('./modules/Timesheets'));
const Fleet = lazy(() => import('./modules/enterprise/EnterpriseHub')); // Shared file
const Quality = lazy(() => import('./modules/Quality'));
const Expenses = lazy(() => import('./modules/Expenses'));
const DMS = lazy(() => import('./modules/DMS'));
const Contracts = lazy(() => import('./modules/Contracts'));
const Manufacturing = lazy(() => import('./modules/production/Production')); // Shared file
const Planning = lazy(() => import('./modules/Planning'));
const Analytics = lazy(() => import('./modules/Analytics'));
const StaffPortal = lazy(() => import('./modules/StaffPortal'));
const Connect = lazy(() => import('./modules/connect/ConnectHub'));
const ControlHub = lazy(() => import('./modules/admin/ControlHub'));
const History = lazy(() => import('./modules/History'));
const Workflows = lazy(() => import('./modules/Workflows'));
const Shipping = lazy(() => import('./modules/Shipping'));
const WebsiteHub = lazy(() => import('./modules/website/WebsiteHub'));
const CommerceHub = lazy(() => import('./modules/sales/CommerceHub'));
const TalentHub = lazy(() => import('./modules/hr/TalentHub'));
const PlanningTemps = lazy(() => import('./components/PlanningTemps'));

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
import { marketingSchema } from './schemas/marketing.schema';
import { signatureSchema } from './schemas/signature.schema';
import { websiteSchema } from './schemas/website.schema';
import { shippingSchema } from './schemas/shipping.schema';
import { commerceSchema } from './schemas/commerce.schema';
import { dmsSchema } from './schemas/dms.schema';

/**
 * Initialize the Platform Registry with Enterprise Modules
 * This follows Odoo's 'manifest' pattern.
 * Components are registered as types, Shell injects common props.
 */
export const initRegistry = () => {
  // Register Schemas
  [crmSchema, hrSchema, salesSchema, inventorySchema, accountingSchema, 
   financeSchema, budgetSchema, productionSchema, projectSchema, purchaseSchema,
   baseSchema, auditSchema, adminSchema, marketingSchema, legalSchema, signatureSchema, websiteSchema, shippingSchema, commerceSchema, dmsSchema].forEach(s => registry.registerSchema(s));

  // --- Cœur de Métier ---
  registry.register({
    id: 'home', label: 'Espace Personnel', icon: <UserCircle size={18} />,
    category: 'core', roles: ['ADMIN', 'SUPER_ADMIN', 'SALES', 'HR', 'FINANCE', 'STAFF', 'PRODUCTION'],
    component: PersonalWorkspace, priority: 1
  });

  registry.register({
    id: 'command_center', label: 'Vue 360°', icon: <Activity size={18} />,
    category: 'core', roles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
    component: GlobalDashboard, priority: 2
  });

  registry.register({
    id: 'connect', label: 'Connect Plus', icon: <Zap size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE', 'STAFF'],
    component: Connect, priority: 2
  });

  registry.register({
    id: 'crm', label: 'CRM', icon: <Users size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES'],
    component: CRM, priority: 2
  });

  registry.register({
    id: 'sales', label: 'Ventes', icon: <ShoppingCart size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: Sales, priority: 3
  });

  registry.register({
    id: 'commerce', label: 'PdV & Abonnements', icon: <ShoppingBag size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: CommerceHub, priority: 3
  });

  registry.register({
    id: 'website', label: 'Sites Web', icon: <Layout size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES', 'MARKETING', 'STAFF'],
    component: WebsiteHub, priority: 4
  });

  registry.register({
    id: 'marketing', label: 'Marketing', icon: <Mail size={18} />,
    category: 'core', roles: ['ADMIN', 'HR', 'SALES'],
    component: Marketing, priority: 4
  });

  // --- Opérations & Logistique ---
  registry.register({
    id: 'inventory', label: 'Stocks', icon: <Package size={18} />,
    category: 'operations', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: Inventory, priority: 10
  });

  registry.register({
    id: 'shipping', label: 'Expéditions', icon: <Truck size={18} />,
    category: 'operations', roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: Shipping, priority: 11
  });

  registry.register({
    id: 'purchase', label: 'Achats', icon: <ShoppingBag size={18} />,
    category: 'operations', roles: ['ADMIN', 'FINANCE'],
    component: Purchase, priority: 12
  });

  registry.register({
    id: 'production', label: 'Production', icon: <Factory size={18} />,
    category: 'operations', roles: ['ADMIN', 'PRODUCTION', 'FINANCE'],
    component: Production, priority: 13
  });

  registry.register({
    id: 'projects', label: 'Projets', icon: <Briefcase size={18} />,
    category: 'operations', roles: ['ADMIN', 'FINANCE', 'SALES'],
    component: Project, priority: 14
  });

  // --- Finance & Stratégie ---
  registry.register({
    id: 'finance', label: 'Finance', icon: <CreditCard size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: Finance, priority: 20
  });

  registry.register({
    id: 'legal', label: 'Juridique', icon: <Scale size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'LEGAL'],
    component: LegalHub, priority: 20.5
  });

  registry.register({
    id: 'accounting', label: 'Comptabilité', icon: <LandmarkIcon size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: Accounting, priority: 21
  });

  registry.register({
    id: 'budget', label: 'Budget', icon: <PiggyBank size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: Budget, priority: 22
  });

  registry.register({
    id: 'expenses', label: 'Notes de Frais', icon: <Wallet size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'HR', 'STAFF'],
    component: Expenses, priority: 23
  });

  registry.register({
    id: 'bi', label: 'Business Intelligence', icon: <PieChart size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE', 'SALES'],
    component: BI, priority: 24
  });

  registry.register({
    id: 'analytics', label: 'Analyses Avancées', icon: <BarChart3 size={18} />,
    category: 'finance', roles: ['ADMIN', 'FINANCE'],
    component: Analytics, priority: 25
  });

  // --- RH & Collaboration ---
  registry.register({
    id: 'hr', label: 'RH', icon: <Users2 size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR'],
    component: HR, priority: 30
  });

  registry.register({
    id: 'talent', label: 'People & Culture', icon: <Heart size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR'],
    component: TalentHub, priority: 31
  });

  registry.register({
    id: 'dms', label: 'G.E.D', icon: <Folder size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'],
    component: DMS, priority: 35
  });

  registry.register({
    id: 'signature', label: 'Signature Électronique', icon: <FileSignature size={18} />,
    category: 'hr', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER'],
    component: SignatureHub, priority: 37
  });

  registry.register({
    id: 'planning', label: 'Planning & Temps', icon: <Calendar size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'STAFF', 'SALES', 'FINANCE', 'PRODUCTION', 'SUPER_ADMIN'],
    component: PlanningTemps, priority: 33
  });

  registry.register({
    id: 'timesheets', label: 'Feuilles de Temps', icon: <Clock size={18} />,
    hidden: true,
    category: 'hr', roles: ['ADMIN', 'HR', 'STAFF', 'SALES', 'FINANCE', 'PRODUCTION', 'SUPER_ADMIN'],
    component: PlanningTemps, priority: 34
  });

  // --- Configuration & Admin ---
  registry.register({
    id: 'control_hub', label: 'Administration', icon: <Settings size={18} />,
    category: 'admin', roles: ['ADMIN', 'SUPER_ADMIN'],
    component: ControlHub, priority: 90
  });
};
