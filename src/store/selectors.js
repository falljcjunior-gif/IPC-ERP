/**
 * ══════════════════════════════════════════════════════════════════
 * STORE SELECTORS — Interface publique du Store Zustand
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: 73 composants couplés directement à useStore() = couplage fort.
 * Si la structure du store change, 73 fichiers cassent.
 *
 * PATTERN: Selector Pattern — Les composants n'accèdent au store
 * QUE via ces sélecteurs typés. Si le store change, seul ce fichier
 * est mis à jour. Les composants restent intacts.
 *
 * RÈGLE: Tout nouveau accès au store doit passer par ce fichier.
 */

//
import { useStore } from './index';

// ── Authentification & Utilisateur ───────────────────────────────────────────

/** Utilisateur courant ou null si non connecté */
export const useCurrentUser = () => useStore(s => s.currentUser ?? null);

/** Rôle de l'utilisateur courant */
export const useUserRole = () => useStore(s => s.userRole ?? 'STAFF');

/** Vrai si l'utilisateur est SUPER_ADMIN */
export const useIsSuperAdmin = () => useStore(s => s.userRole === 'SUPER_ADMIN');

/** Vrai si l'utilisateur a l'un des rôles donnés */
export const useHasRole = (...roles) => useStore(s =>
  s.userRole === 'SUPER_ADMIN' || roles.includes(s.userRole)
);

// ── Interface (Shell) ────────────────────────────────────────────────────────

/** Vue mobile ou desktop */
export const useShellView = () => useStore(s => s.shellView ?? { mobile: false });

/** Module actuellement actif */
export const useActiveApp = () => useStore(s => s.activeApp ?? 'dashboard');

/** Setter pour le module actif */
export const useSetActiveApp = () => useStore(s => s.setActiveApp);

/** Fonction de navigation globale */
export const useNavigateTo = () => useStore(s => s.navigateTo);

// ── Configuration ────────────────────────────────────────────────────────────

/** Configuration complète de la plateforme */
export const useConfig = () => useStore(s => s.config ?? {});

/** Permissions de l'utilisateur */
export const usePermissions = () => useStore(s => s.permissions ?? {});

/** Vérifie l'accès à un module spécifique */
export const useModuleAccess = () => useStore(s => s.getModuleAccess ?? (() => 'none'));

// ── Données métier ───────────────────────────────────────────────────────────

/** Toutes les données ERP (utiliser avec modération) */
export const useAllData = () => useStore(s => s.data ?? {});

/**
 * Données d'un module spécifique avec valeur par défaut sûre.
 * @param {'base'|'hr'|'crm'|'marketing'} module
 */
export const useModuleData = (module) => useStore(s => s.data?.[module] ?? {});

/** Données HR */
export const useHRData = () => {
  const employees = useStore(s => s.data?.hr?.employees);
  const payroll = useStore(s => s.data?.hr?.payroll);
  return {
    employees: employees ?? [],
    payroll: payroll ?? [],
  };
};

/** Données CRM */
export const useCRMData = () => {
  const leads = useStore(s => s.data?.crm?.leads);
  const customers = useStore(s => s.data?.crm?.customers);
  return {
    leads: leads ?? [],
    customers: customers ?? [],
  };
};

// ── Actions CRUD ─────────────────────────────────────────────────────────────

/** Ajouter un enregistrement */
export const useAddRecord = () => useStore(s => s.addRecord);

/** Mettre à jour un enregistrement */
export const useUpdateRecord = () => useStore(s => s.updateRecord);

/** Supprimer un enregistrement */
export const useDeleteRecord = () => useStore(s => s.deleteRecord);

/** Recherche globale */
export const useGlobalSearch = () => useStore(s => s.globalSearch);

// ── Notifications & Activités ────────────────────────────────────────────────

/** Notifications de l'utilisateur */
export const useNotifications = () => useStore(s => s.notifications ?? []);

/** Activités récentes */
export const useActivities = () => useStore(s => s.activities ?? []);

// ── Multi-Brand ──────────────────────────────────────────────────────────────

/** Brand active */
export const useActiveBrand = () => useStore(s => s.activeBrand ?? 'IPC_CORE');

/** Paramètres globaux */
export const useGlobalSettings = () => useStore(s => s.globalSettings ?? {});

// ── Formatage ────────────────────────────────────────────────────────────────

/** Fonction de formatage monétaire */
export const useFormatCurrency = () => useStore(s =>
  s.formatCurrency ?? ((v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`)
);

// ── Appels WebRTC ────────────────────────────────────────────────────────────

/** Appel actif */
export const useActiveCall = () => useStore(s => s.activeCall ?? null);

/** Setter appel actif */
export const useSetActiveCall = () => useStore(s => s.setActiveCall);

/** Accepter un appel */
export const useAcceptCall = () => useStore(s => s.acceptCall);

/** Rejeter un appel */
export const useRejectCall = () => useStore(s => s.rejectCall);

// ── Admin Actions ────────────────────────────────────────────────────────────

/** Déclencher un backup Firestore manuel */
export const useTriggerManualBackup = () => useStore(s => s.triggerManualBackup);

