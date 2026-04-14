import React from 'react';
import { registry } from './services/Registry';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff, Landmark as LandmarkIcon,
  PieChart, History as HistoryIcon, Layout, UserCircle
} from 'lucide-react';

// Core Components & Modules
import GlobalDashboard from './components/GlobalDashboard';
import CRM from './modules/CRM';
import Sales from './modules/Sales';
import Inventory from './modules/Inventory';
import Accounting from './modules/Accounting';
import Finance from './modules/Finance';
import HR from './modules/HR';
import Production from './modules/Production';
import Project from './modules/Project';
import Purchase from './modules/Purchase';
import Marketing from './modules/Marketing';
import BI from './modules/BI';
import MasterData from './modules/MasterData';
import CalendarModule from './modules/Calendar';
import Helpdesk from './modules/Helpdesk';
import Timesheets from './modules/Timesheets';
import Fleet from './modules/Fleet';
import Quality from './modules/Quality';
import Expenses from './modules/Expenses';
import Budget from './modules/Budget';
import DMS from './modules/DMS';
import Contracts from './modules/Contracts';
import Manufacturing from './modules/Manufacturing';
import Planning from './modules/Planning';
import Analytics from './modules/Analytics';
import StaffPortal from './modules/StaffPortal';
import UserManagement from './modules/UserManagement';
import History from './modules/History';
import Workflows from './modules/Workflows';
import SettingsModule from './modules/Settings';
import Shipping from './modules/Shipping';
import Studio from './modules/Studio';

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

/**
 * Initialize the Platform Registry with Enterprise Modules
 * This follows Odoo's 'manifest' pattern.
 * Components are registered as types, Shell injects common props.
 */
export const initRegistry = () => {
  // Register Schemas
  [crmSchema, hrSchema, salesSchema, inventorySchema, accountingSchema, 
   financeSchema, budgetSchema, productionSchema, projectSchema, purchaseSchema,
   baseSchema, auditSchema, adminSchema].forEach(s => registry.registerSchema(s));

  // --- Cœur de Métier ---
  registry.register({
    id: 'home', label: 'Tableau de bord', icon: <Home size={18} />,
    category: 'core', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'],
    component: GlobalDashboard, priority: 1
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
    id: 'dms', label: 'G.E.D', icon: <Folder size={18} />,
    category: 'hr', roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'],
    component: DMS, priority: 35
  });

  registry.register({
    id: 'staff_portal', label: 'Portail Employé', icon: <UserCircle size={18} />,
    category: 'hr', roles: ['STAFF', 'ADMIN', 'HR'],
    component: StaffPortal, priority: 36
  });

  // --- Configuration & Admin ---
  registry.register({
    id: 'masterdata', label: 'Données Maîtres', icon: <Layout size={18} />,
    category: 'admin', roles: ['ADMIN'],
    component: MasterData, priority: 90
  });

  registry.register({
    id: 'history', label: 'Historique & Audit', icon: <HistoryIcon size={18} />,
    category: 'admin', roles: ['SUPER_ADMIN'],
    component: History, priority: 91
  });

  registry.register({
    id: 'studio', label: 'IPC Studio', icon: <Zap size={18} />,
    category: 'admin', roles: ['SUPER_ADMIN'],
    component: Studio, priority: 95
  });

  registry.register({
    id: 'user_management', label: 'Gestion Utilisateurs', icon: <ShieldCheck size={18} />,
    category: 'admin', roles: ['SUPER_ADMIN'],
    component: UserManagement, priority: 100
  });

  registry.register({
    id: 'settings', label: 'Paramètres', icon: <Settings size={18} />,
    category: 'admin', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'],
    component: SettingsModule, priority: 101
  });
};
