// Source de vérité unique pour les emails créateurs (SUPER_ADMIN auto).
// Aligné avec firestore.rules:18-22 et functions/modules/admin.js.
export const CREATOR_EMAILS = Object.freeze([
  'fall.jcjunior@gmail.com',
  'ra.yoman@ipcgreenblocks.com',
  'ra.yoman@gmail.com',
  'yomanraphael26@gmail.com'
]);

export const isCreatorEmail = (email) => {
  if (!email) return false;
  return CREATOR_EMAILS.includes(String(email).toLowerCase());
};
