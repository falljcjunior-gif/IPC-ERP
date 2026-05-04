/**
 * ══════════════════════════════════════════════════════════════════
 * HR STATE SLICE (ZUSTAND) - STRATEGIC CAPITAL HUMAN ENGINE
 * ══════════════════════════════════════════════════════════════════
 */

export const createHrSlice = (set, get) => ({
  hr: {
    employees: [],
    attendance: [],
    payroll: [],
    loading: false,
    talentMetrics: {
      avgPerformance: 85,
      retentionRate: 94,
      happinessIndex: 7.8
    }
  },

  hrActions: {
    /**
     * 🧠 TALENT INTELLIGENCE: 360° Scoring Engine
     * Dynamically calculates performance based on cross-module activity.
     */
    calculateTalentIntelligence: async () => {
      const state = get();
      const employees = state.data?.hr?.employees || [];
      const orders = state.data?.sales?.orders || [];
      const workOrders = state.data?.production?.workOrders || [];

      const updatedEmployees = employees.map(emp => {
        // Sales performance (if sales role)
        const empSales = orders.filter(o => o.ownerId === emp.id && o.statut === 'Payé');
        const salesScore = empSales.length > 0 ? Math.min(100, empSales.length * 10) : 80;

        // Production performance (if production role)
        const empProd = workOrders.filter(o => o.operatorId === emp.id && o.statut === 'Terminé');
        const prodScore = empProd.length > 0 ? Math.min(100, empProd.length * 5) : 80;

        // Final weighted score (simulated mix)
        const performance_score = Math.round((salesScore + prodScore) / 2);
        
        // Burnout Risk logic (simulated based on pending workOrders)
        const pendingLoad = workOrders.filter(o => o.operatorId === emp.id && o.statut === 'En cours').length;
        const burnout_risk = Math.min(100, pendingLoad * 15);

        return {
          ...emp,
          performance_score: performance_score || emp.performance_score || 85,
          burnout_risk: burnout_risk || emp.burnout_risk || 10,
          engagement_level: 90 - (burnout_risk / 2),
          retention_score: 100 - burnout_risk
        };
      });

      // Batch update to Firestore
      for (const emp of updatedEmployees) {
        state.updateRecord('hr', 'employees', emp.id, {
          performance_score: emp.performance_score,
          burnout_risk: emp.burnout_risk,
          engagement_level: emp.engagement_level,
          retention_score: emp.retention_score
        });
      }

      state.addHint({
        title: "Intelligence Talent Mise à Jour",
        message: "Les scores 360° ont été recalculés sur la base des activités CRM et Production.",
        type: "success"
      });
    },

    hireEmployee: async (data) => {
      set(state => ({ hr: { ...state.hr, loading: true } }));
      try {
        get().logAction?.('RH', `Recrutement: ${data.nom}`, 'hr');
      } finally {
        set(state => ({ hr: { ...state.hr, loading: false } }));
      }
    }
  }
});
