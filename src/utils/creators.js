// Aucun email hardcodé — l'élévation SUPER_ADMIN passe exclusivement
// par bootstrapSuperAdmin() (Cloud Function) qui vérifie que l'appelant
// s'auto-bootstrap ET qu'aucun SUPER_ADMIN n'existe encore.
export const CREATOR_EMAILS = Object.freeze([]);

export const isCreatorEmail = (_email) => false;
