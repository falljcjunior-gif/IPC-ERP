import logger from './logger';

export const debugInteraction = async (actionName, promiseFn) => {
  const startTime = performance.now();

  try {
    const result = await promiseFn();
    const duration = (performance.now() - startTime).toFixed(2);
    logger.info(`[Audit] ${actionName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = (performance.now() - startTime).toFixed(2);
    logger.error(`[Audit] ${actionName} failed after ${duration}ms`, error);

    if (error.code === 'permission-denied') {
      logger.warn('[Audit] RBAC: Firestore rejected this action. Check firestore.rules.');
    }
    if (error.message?.includes('network')) {
      logger.warn('[Audit] Network issue detected during action.');
    }

    throw error;
  }
};

export const REDIRECTION_MAP = {
  EMPLOYEE_CREATED: '/hr/employees',
  LEAVE_APPROVED:   '/hr/leaves',
  ASSET_ASSIGNED:   '/it/assets',
  BUDGET_VALIDATED: '/finance/reports',
  TICKET_CLOSED:    '/it/support',
  CANDIDATE_HIRED:  '/hr/employees',
};
