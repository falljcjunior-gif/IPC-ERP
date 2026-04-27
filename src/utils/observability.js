/**
 * 🛰️ OBSERVABILITY ENGINE (SRE)
 * Tracking production health and module performance.
 */
import { FirestoreService } from '../services/firestore.service';

export const NexusMonitor = {
  
  /**
   * Loggue un incident de production (Error tracking)
   */
  async reportIncident(moduleName, error, severity = 'high') {
    console.error(`[SRE:${moduleName}]`, error);

    try {
      await FirestoreService.addDocument('system_incidents', {
        module: moduleName,
        error: error.message || error,
        stack: error.stack || null,
        severity,
        timestamp: new Date().toISOString(),
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    } catch (e) {
      // Si la DB est down, on ne peut rien faire d'autre qu'imprimer
      console.error('CRITICAL: Observability DB is unreachable', e);
    }
  },

  /**
   * Monitor de performance simple (Tracing)
   */
  trackDelay(moduleName, actionName, durationMs) {
    if (durationMs > 1000) {
      this.reportIncident(moduleName, `LATENCE EXTRÊME: ${actionName} a pris ${durationMs}ms`, 'medium');
    }
  }
};
