import React from 'react';
import { 
  Home, Users, ShoppingCart, Mail, Package, Truck, ShoppingBag, 
  Factory, Layers, CreditCard, Landmark, Wallet, PiggyBank, 
  FileSignature, TrendingUp, BarChart3, Users2, Clock, Briefcase, 
  Calendar, Folder, LifeBuoy, Grid, Activity, Zap, ShieldCheck, 
  Settings, MessageCircle, Pin, PinOff
} from 'lucide-react';

/**
 * IPC ERP Platform Registry
 * Based on Odoo's Addon architecture. 
 * Allows dynamic module registration and metadata-driven UI rendering.
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.categories = [
      { id: 'core', label: 'Cœur de Métier' },
      { id: 'operations', label: 'Opérations & Logistique' },
      { id: 'finance', label: 'Finance & Stratégie' },
      { id: 'hr', label: 'RH & Collaboration' },
      { id: 'admin', label: 'Configuration' }
    ];
    this.schemas = new Map();
  }

  registerSchema(schema) {
    if (!schema || !schema.id) return;
    this.schemas.set(schema.id, schema);
    return this;
  }

  getSchema(id) {
    return this.schemas.get(id);
  }

  /**
   * Register a new module/addon
   */
  register(module) {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered. Overwriting.`);
    }
    this.modules.set(module.id, {
      id: module.id,
      label: module.label,
      icon: module.icon || <Package size={18} />,
      category: module.category || 'core',
      roles: module.roles || ['ADMIN'],
      component: module.component,
      schema: module.schema || null,
      priority: module.priority || 100
    });
    return this;
  }

  getModule(id) {
    return this.modules.get(id);
  }

  getAllModules() {
    return Array.from(this.modules.values()).sort((a, b) => a.priority - b.priority);
  }

  getModulesByCategory() {
    return this.categories.map(cat => ({
      ...cat,
      items: this.getAllModules().filter(m => m.category === cat.id)
    })).filter(cat => cat.items.length > 0);
  }
}

export const registry = new ModuleRegistry();

// Default modules registry (will be populated by modules later)
// For now, we initialize the structure.
