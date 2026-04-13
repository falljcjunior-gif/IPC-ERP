import React from 'react';
import { registry } from './services/Registry';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff, Landmark as LandmarkIcon
} from 'lucide-react';

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
 */
export const initRegistry = (onOpenDetail) => {
  const common = { onOpenDetail };

  // Register Schemas
  [crmSchema, hrSchema, salesSchema, inventorySchema, accountingSchema, 
   financeSchema, budgetSchema, productionSchema, projectSchema, purchaseSchema,
   baseSchema, auditSchema, adminSchema].forEach(s => registry.registerSchema(s));

  // --- Cœur de Métier ---
  registry.register({
    id: 'home',
    label: 'Tableau de bord',
    icon: <Home size={18} />,
    category: 'core',
    roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'],
    component: () => <GlobalDashboard />,
    priority: 1
  });

  registry.register({
    id: 'crm',
    label: 'CRM',
    icon: <Users size={18} />,
    category: 'core',
    roles: ['ADMIN', 'SALES'],
    component: () => <CRM {...common} />,
    priority: 2
  });

  registry.register({
    id: 'sales',
    label: 'Ventes',
    icon: <ShoppingCart size={18} />,
    category: 'core',
    roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: () => <Sales {...common} />,
    priority: 3
  });

  registry.register({
    id: 'marketing',
    label: 'Marketing',
    icon: <Mail size={18} />,
    category: 'core',
    roles: ['ADMIN', 'HR', 'SALES'],
    component: () => <Marketing {...common} />,
    priority: 4
  });

  // --- Opérations & Logistique ---
  registry.register({
    id: 'inventory',
    label: 'Stocks',
    icon: <Package size={18} />,
    category: 'operations',
    roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: () => <Inventory {...common} />,
    priority: 10
  });

  registry.register({
    id: 'shipping',
    label: 'Expéditions',
    icon: <Truck size={18} />,
    category: 'operations',
    roles: ['ADMIN', 'SALES', 'FINANCE'],
    component: () => <Shipping {...common} />,
    priority: 11
  });

  registry.register({
    id: 'purchase',
    label: 'Achats',
    icon: <ShoppingBag size={18} />,
    category: 'operations',
    roles: ['ADMIN', 'FINANCE'],
    component: () => <Purchase {...common} />,
    priority: 12
  });

  registry.register({
    id: 'production',
    label: 'Production',
    icon: <Factory size={18} />,
    category: 'operations',
    roles: ['ADMIN', 'PRODUCTION', 'FINANCE'],
    component: () => <Production {...common} />,
    priority: 13
  });

  registry.register({
    id: 'projects',
    label: 'Projets',
    icon: <Briefcase size={18} />,
    category: 'operations',
    roles: ['ADMIN', 'FINANCE', 'SALES'],
    component: () => <Project {...common} />,
    priority: 14
  });

  // --- Finance ---
  registry.register({
    id: 'finance',
    label: 'Finance',
    icon: <CreditCard size={18} />,
    category: 'finance',
    roles: ['ADMIN', 'FINANCE'],
    component: () => <Finance {...common} />,
    priority: 20
  });

  registry.register({
    id: 'accounting',
    label: 'Comptabilité',
    icon: <LandmarkIcon size={18} />,
    category: 'finance',
    roles: ['ADMIN', 'FINANCE'],
    component: () => <Accounting {...common} />,
    priority: 21
  });

  registry.register({
    id: 'budget',
    label: 'Budget',
    icon: <PiggyBank size={18} />,
    category: 'finance',
    roles: ['ADMIN', 'FINANCE'],
    component: () => <Budget {...common} />,
    priority: 22
  });

  registry.register({
    id: 'expenses',
    label: 'Notes de Frais',
    icon: <Wallet size={18} />,
    category: 'finance',
    roles: ['ADMIN', 'FINANCE', 'HR', 'STAFF'],
    component: () => <Expenses {...common} />,
    priority: 23
  });

  // --- RH & Collaboration ---
  registry.register({
    id: 'hr',
    label: 'RH',
    icon: <Users2 size={18} />,
    category: 'hr',
    roles: ['ADMIN', 'HR'],
    component: () => <HR {...common} />,
    priority: 30
  });

  registry.register({
    id: 'dms',
    label: 'G.E.D',
    icon: <Folder size={18} />,
    category: 'hr',
    roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'],
    component: () => <DMS />,
    priority: 35
  });

  // --- Configuration ---
  registry.register({
    id: 'settings',
    label: 'Paramètres',
    icon: <Settings size={18} />,
    category: 'admin',
    roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'],
    component: () => <SettingsModule {...common} />,
    priority: 100
  });

  registry.register({
    id: 'user_management',
    label: 'Gestion Utilisateurs',
    icon: <ShieldCheck size={18} />,
    category: 'admin',
    roles: ['SUPER_ADMIN'],
    component: () => <UserManagement {...common} />,
    priority: 101
  });
};
