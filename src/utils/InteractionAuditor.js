/**
 * 🕵️ NEXUS OS: INTERACTION AUDIT & DEBUGGER
 * Use this to test buttons and identify permission issues (RBAC).
 */
export const debugInteraction = async (actionName, promiseFn) => {
  console.group(`🔘 Interaction Audit: ${actionName}`);
  const startTime = performance.now();
  
  try {
    const result = await promiseFn();
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`✅ SUCCESS: ${actionName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`❌ FAILURE: ${actionName} failed after ${duration}ms`);
    
    // Check for common permission errors
    if (error.code === 'permission-denied') {
      console.warn('⚠️ RBAC ALERT: Firestore rejected this action. Check firestore.rules for SUPER_ADMIN sync.');
    }
    
    if (error.message?.includes('network')) {
      console.warn('🌐 NETWORK ALERT: Connection issue detected.');
    }

    throw error;
  } finally {
    console.groupEnd();
  }
};

/**
 * 📋 REDIRECTION AUDIT MAP
 * Standard routes to ensure no navigation cul-de-sacs.
 */
export const REDIRECTION_MAP = {
  EMPLOYEE_CREATED: '/hr/employees',
  LEAVE_APPROVED: '/hr/leaves',
  ASSET_ASSIGNED: '/it/assets',
  BUDGET_VALIDATED: '/finance/reports',
  TICKET_CLOSED: '/it/support',
  CANDIDATE_HIRED: '/hr/employees'
};
