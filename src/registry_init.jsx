import React from 'react';
import { registry } from './services/Registry';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff, Landmark as LandmarkIcon,
  PieChart, History as HistoryIcon, Layout, UserCircle, Scale
} from 'lucide-react';

// Core Components & Modules
import GlobalDashboard from './components/GlobalDashboard';
import PersonalWorkspace from './components/PersonalWorkspace';
import CRM from './modules/crm/CRM';
import Sales from './modules/sales/Sales';
import Inventory from './modules/logistics/LogisticsHub';
import Accounting from './modules/finance/AccountingCenter';
import Finance from './modules/finance/FinanceControlCenter';
import Budget from './modules/finance/FinanceControlCenter';
import HR from './modules/HR';
import Production from './modules/production/Production';
import Project from './modules/logistics/LogisticsHub';
import Purchase from './modules/logistics/LogisticsHub';
import LegalHub from './modules/legal/LegalHub';
import SignatureHub from './modules/signature/SignatureHub';
import Marketing from './modules/marketing/Marketing';
import BI from './modules/bi/BIHub';
import MasterData from './modules/MasterData';
import CalendarModule from './modules/Calendar';
import Helpdesk from './modules/enterprise/EnterpriseHub';
import Timesheets from './modules/Timesheets';
import Fleet from './modules/enterprise/EnterpriseHub';
import Quality from './modules/Quality';
import Expenses from './modules/Expenses';
import DMS from './modules/DMS';
import Contracts from './modules/Contracts';
import Manufacturing from './modules/production/Production';
import Planning from './modules/Planning';
import Analytics from './modules/Analytics';
import StaffPortal from './modules/StaffPortal';
import Connect from './modules/connect/ConnectHub';
import ControlHub from './modules/admin/ControlHub';
import History from './modules/History';
import Workflows from './modules/Workflows';
import Shipping from './modules/Shipping';
import WebsiteHub from './modules/website/WebsiteHub';
import CommerceHub from './modules/sales/CommerceHub';
import TalentHub from './modules/hr/TalentHub';

// Schemas
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
    id: 'connect', label: 'IPC CONNECT', icon: <Zap size={18} />,
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
    id: 'analytics', label: 'Analyses IP', icon: <BarChart3 size={18} />,
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
    id: 'talent', label: 'Talents & Congés', icon: <Users2 size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR'],
    component: TalentHub, priority: 31
  });

  registry.register({
    id: 'dms', label: 'G.E.D', icon: <Folder size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'],
    component: DMS, priority: 35
  });

  registry.register({
    id: 'staff_portal', label: 'Portail Employé', icon: <UserCircle size={18} />,
    category: 'hr', roles: ['STAFF', 'ADMIN', 'HR'],
    component: StaffPortal, priority: 36
  });

  registry.register({
    id: 'signature', label: 'Signature Électronique', icon: <FileSignature size={18} />,
    category: 'hr', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER'],
    component: SignatureHub, priority: 37
  });

  // --- Configuration & Admin ---
  registry.register({
    id: 'control_hub', label: 'Administration', icon: <Settings size={18} />,
    category: 'admin', roles: ['ADMIN', 'SUPER_ADMIN'],
    component: ControlHub, priority: 90
  });
};
