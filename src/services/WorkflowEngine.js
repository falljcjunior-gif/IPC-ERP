/**
 * ══════════════════════════════════════════════════════════════════
 * NEXUS WORKFLOW ENGINE (V1)
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Transforme l'ERP passif en un système proactif.
 * Analyse les changements de données et déclenche les règles BPM.
 */

import { useStore } from '../store';
import { FirestoreService } from './firestore.service';
import logger from '../utils/logger';

class WorkflowEngine {
  constructor() {
    this.prevData = {};
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // S'abonner aux changements du store
    useStore.subscribe(
      (state) => state.data,
      (currentData) => this.processChanges(currentData)
    );
    
    this.initialized = true;
    logger.info('Nexus Workflow Engine: Initialized');
  }

  processChanges(currentData) {
    if (!currentData || Object.keys(currentData).length === 0) return;

    // [FIX] Initial load guard: If prevData is completely empty, this is the first sync.
    // We snapshot the data but don't trigger "onCreate" for the entire database.
    const isFirstRun = Object.keys(this.prevData).length === 0;

    // Détecter les changements sur les modules critiques
    const modulesToWatch = ['production', 'sales', 'inventory', 'purchase', 'hr'];

    // Champs métier surveillés — comparaison ciblée O(1) au lieu de JSON.stringify O(n)
    const WATCHED_FIELDS = {
      'workOrders': ['status', 'statut', 'progress', 'completedAt'],
      'products':   ['stock', 'statut', 'status', 'prix'],
      'orders':     ['statut', 'status', 'montant', 'total', 'paymentStatus'],
      'employees':  ['statut', 'status', 'contrat'],
      'default':    ['statut', 'status', 'montant', 'stock', 'progress']
    };

    modulesToWatch.forEach(moduleKey => {
      const currentModule = currentData[moduleKey] || {};
      const prevModule = this.prevData[moduleKey] || {};

      Object.keys(currentModule).forEach(subKey => {
        const currentItems = currentModule[subKey] || [];
        const prevItems = prevModule[subKey] || [];
        const watchedFields = WATCHED_FIELDS[subKey] || WATCHED_FIELDS['default'];

        currentItems.forEach(currentItem => {
          const prevItem = prevItems.find(p => p.id === currentItem.id);

          if (!prevItem) {
            if (!isFirstRun) {
              this.evaluateWorkflows(moduleKey, subKey, 'onCreate', currentItem, null);
            }
          } else {
            // Comparaison ciblée : uniquement les champs métier critiques
            const hasChanged = watchedFields.some(
              field => currentItem[field] !== prevItem[field]
            );
            if (hasChanged) {
              this.evaluateWorkflows(moduleKey, subKey, 'onUpdate', currentItem, prevItem);
            }
          }
        });
      });
    });

    // Snapshot léger : on ne clone que les champs surveillés pour économiser la mémoire
    this.prevData = {};
    modulesToWatch.forEach(mk => {
      if (!currentData[mk]) return;
      this.prevData[mk] = {};
      Object.keys(currentData[mk]).forEach(sk => {
        this.prevData[mk][sk] = (currentData[mk][sk] || []).map(item => {
          const fields = WATCHED_FIELDS[sk] || WATCHED_FIELDS['default'];
          const snapshot = { id: item.id };
          fields.forEach(f => { snapshot[f] = item[f]; });
          return snapshot;
        });
      });
    });
  }

  evaluateWorkflows(module, subModule, event, currentItem, prevItem) {
    const userWorkflows = useStore.getState().workflows || [];
    
    // Core Rules: Orchestration Native (Impossible à désactiver)
    const coreWorkflows = [
      {
        id: 'core_of_finish',
        name: 'Nexus: Production Terminée',
        targetModule: 'production.workOrders',
        triggerEvent: 'onUpdate',
        conditionField: 'status',
        operator: '==',
        value: 'Terminé',
        actionType: 'SEND_NOTIFICATION',
        actionPayload: 'L\'OF {num} ({label}) est terminé. Le stock de produits finis a été incrémenté.',
        actionTargetRole: 'Logistique'
      },
      {
        id: 'core_stock_critical',
        name: 'Nexus: Alerte Stock Critique',
        targetModule: 'inventory.products',
        triggerEvent: 'onUpdate',
        conditionField: 'stock',
        operator: '<',
        value: '10', // Seuil d'alerte global par défaut
        actionType: 'SEND_NOTIFICATION',
        actionPayload: 'Alerte Rupture: Le produit {label} est sous le seuil critique ({num} unités).',
        actionTargetRole: 'Achat'
      }
    ];

    const allWorkflows = [...coreWorkflows, ...userWorkflows];
    const targetPath = `${module}.${subModule}`;
    
    const activeWorkflows = allWorkflows.filter(wf => 
      (wf.active !== false) && 
      wf.targetModule === targetPath && 
      wf.triggerEvent === event
    );

    activeWorkflows.forEach(wf => {
      const field = wf.conditionField;
      const currentVal = currentItem[field];
      const prevVal = prevItem ? prevItem[field] : null;

      // Éviter de redéclencher si la valeur n'a pas changé (pour onUpdate)
      if (event === 'onUpdate' && currentVal === prevVal) return;

      let conditionMet = false;
      const targetVal = wf.value;

      switch (wf.operator) {
        case '==': conditionMet = String(currentVal) === String(targetVal); break;
        case '!=': conditionMet = String(currentVal) !== String(targetVal); break;
        case '>':  conditionMet = Number(currentVal) > Number(targetVal); break;
        case '<':  conditionMet = Number(currentVal) < Number(targetVal); break;
        default:   conditionMet = false;
      }

      if (conditionMet) {
        this.executeAction(wf, currentItem);
      }
    });
  }

  async executeAction(wf, item) {
    const { actionType, actionPayload, actionTargetRole } = wf;
    const currentUser = useStore.getState().currentUser;

    logger.info(`WorkflowEngine: Executing rule "${wf.name}"`);

    try {
      if (actionType === 'SEND_NOTIFICATION') {
        const message = actionPayload
          .replace('{id}', item.id)
          .replace('{num}', item.num || item.id)
          .replace('{statut}', item.statut || '')
          .replace('{label}', item.label || item.produit || '');

        // 1. Créer une notification système
        await FirestoreService.createDocument('notifications', {
          title: wf.name,
          message,
          type: 'workflow',
          targetRole: actionTargetRole,
          targetUserId: null,
          readBy: [],
          actionApp: wf.targetModule.split('.')[0]
        });

        // 2. Envoyer un message dans le salon "Général" si c'est important
        await FirestoreService.createDocument('messages', {
          text: `🤖 **Nexus Automator**: ${message}`,
          roomId: 'team_global',
          userId: 'nexus_bot',
          userName: 'Nexus Bot',
          readBy: [],
          type: 'system'
        });
      }

      if (actionType === 'UPDATE_STATUS') {
        // Logique de changement d'état automatique
        const [module, subModule] = wf.targetModule.split('.');
        await FirestoreService.updateDocument(module, item.id, {
          statut: actionPayload
        });
      }

      // Hint UI pour l'utilisateur local
      useStore.getState().addHint({
        title: "Automatisation active",
        message: `Règle appliquée : ${wf.name}`,
        type: 'success'
      });

    } catch (err) {
      logger.error('WorkflowEngine: Execution failed', err);
    }
  }
}

export const nexusWorkflowEngine = new WorkflowEngine();
