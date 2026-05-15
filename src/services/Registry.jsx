import React from 'react';
import { Package } from 'lucide-react';

/**
 * I.P.C Platform Registry
 * Based on Odoo's Addon architecture. 
 * Allows dynamic module registration and metadata-driven UI rendering.
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.categories = [
      { id: 'cockpit', label: 'Cockpit' },
      { id: 'crm', label: 'CRM & Ventes' },
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
    if (!module || !module.id) return this;
    this.modules.set(module.id, {
      id: module.id,
      label: module.label,
      icon: module.icon || <Package size={18} />,
      category: module.category || 'core',
      roles: module.roles || ['ADMIN'],
      component: module.component,
      schema: module.schema || null,
      priority: module.priority || 100,
      hidden: module.hidden || false,
      // [3-SPACE ISOLATION] Conserver le filtre entity_type déclaré dans registry_init
      // undefined = global (visible partout) ; tableau = espaces autorisés uniquement
      entityTypes: module.entityTypes || null,
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

  /**
   * [3-SPACE ISOLATION] Filtre les modules visibles pour un type d'entité.
   *
   * Règle :
   *   - Module SANS `entityTypes` = GLOBAL (visible partout)
   *   - Module AVEC `entityTypes: ['HOLDING']` = visible uniquement Holding
   *   - Module AVEC `entityTypes: ['SUBSIDIARY','FOUNDATION']` = les 2 espaces
   *
   * @param {string} entityType - HOLDING | SUBSIDIARY | FOUNDATION
   * @returns {Array} liste de modules autorisés
   */
  getModulesByEntityType(entityType) {
    if (!entityType) return this.getAllModules();
    return this.getAllModules().filter(m => {
      // Pas de restriction → visible partout
      if (!m.entityTypes || m.entityTypes.length === 0) return true;
      return m.entityTypes.includes(entityType);
    });
  }

  /**
   * Variante de getModulesByCategory() qui applique le filtre entity_type.
   * Utilisée par PlatformShell pour générer la sidebar dynamique.
   */
  getModulesByCategoryForSpace(entityType) {
    const allowed = this.getModulesByEntityType(entityType);
    return this.categories.map(cat => ({
      ...cat,
      items: allowed.filter(m => m.category === cat.id),
    })).filter(cat => cat.items.length > 0);
  }
}

export const registry = new ModuleRegistry();

// Default modules registry (will be populated by modules later)
// For now, we initialize the structure.
