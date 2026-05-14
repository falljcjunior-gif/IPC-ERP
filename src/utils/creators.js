// Source de vérité unique pour les emails autorisés (auto-élévation de rôle).
// Aligné avec functions/modules/admin.js.
export const CREATOR_EMAILS = Object.freeze([
  'ra.yoman@ipcgreenblocks.com',
  'yomanraphael26@gmail.com',
]);

export const isCreatorEmail = (email) => {
  if (!email) return false;
  return CREATOR_EMAILS.includes(String(email).toLowerCase());
};
