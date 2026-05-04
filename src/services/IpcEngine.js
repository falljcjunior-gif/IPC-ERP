/**
 * ══════════════════════════════════════════════════════════════
 * IPC ENGINE — Logique Métier Souveraine
 * ══════════════════════════════════════════════════════════════
 *
 * PHILOSOPHIE :
 * Chaque action métier est un DÉCLENCHEUR, pas un enregistrement isolé.
 * Un devis signé n'est pas qu'un papier — c'est une réservation de stock
 * ET une écriture financière future.
 *
 * RÈGLES IMMUABLES :
 * 1. Stock Physique ≥ 0 toujours (jamais négatif)
 * 2. Un document "verrouillé" ne peut être modifié — seulement "avenantisé"
 * 3. Le paiement fournisseur est impossible sans 3-Way Match parfait
 * 4. Chaque coût appartient à un Centre Analytique
 */

import { FirestoreService } from './firestore.service';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────────────────
// 1. CALCUL DES 3 TYPES DE STOCK
// Source de vérité : les données du store passées en paramètre
// ─────────────────────────────────────────────────────────────

/**
 * Calcule les 3 stocks pour un produit donné.
 *
 * • Physique  = ce qui est réellement en entrepôt
 * • Virtuel   = Physique - Réservé pour commandes clients en cours
 * • Disponible = Physique + Attendu Fournisseurs - Réservé Clients
 *
 * @param {string} productId
 * @param {object} storeData - { inventory, sales, purchase }
 * @returns {{ physique: number, virtuel: number, disponible: number }}
 */
export function computeStockLevels(productId, storeData) {
  const products = storeData.inventory?.products || [];
  const product = products.find(p => p.id === productId || p.code === productId);
  if (!product) return { physique: 0, virtuel: 0, disponible: 0 };

  const physique = parseFloat(product.stock || product.qteStock || 0);

  // Commandes clients confirmées mais pas encore livrées → réservé
  const reserveClients = (storeData.sales?.orders || [])
    .filter(o =>
      (o.produitId === productId || (o.items || []).some(i => i.productId === productId)) &&
      ['Confirmé', 'En préparation'].includes(o.statut)
    )
    .reduce((sum, o) => {
      const lineQte = (o.items || []).find(i => i.productId === productId)?.qte || o.qte || 0;
      return sum + parseFloat(lineQte);
    }, 0);

  // Commandes fournisseurs en cours → attendu
  const attenduFournisseurs = (storeData.purchase?.orders || [])
    .filter(o =>
      (o.produitId === productId) &&
      !['Réceptionné', 'Annulé'].includes(o.statut)
    )
    .reduce((sum, o) => sum + parseFloat(o.qte || 0), 0);

  const virtuel = physique - reserveClients;
  const disponible = physique + attenduFournisseurs - reserveClients;

  return {
    physique,
    virtuel: Math.max(virtuel, 0),
    disponible: Math.max(disponible, 0),
    reserveClients,
    attenduFournisseurs
  };
}

/**
 * Vérifie si le stock virtuel est suffisant pour honorer une commande.
 * Bloque la confirmation si insuffisant (règle IPC Green Block — jamais de stock négatif promis).
 *
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateStockForOrder(order, storeData) {
  const items = order.items || [];
  const blockers = [];

  items.forEach(item => {
    const levels = computeStockLevels(item.productId, storeData);
    if (levels.virtuel < parseFloat(item.qte || 0)) {
      const product = (storeData.inventory?.products || []).find(p => p.id === item.productId);
      blockers.push({
        produit: product?.nom || item.productId,
        demande: item.qte,
        disponible: levels.virtuel,
      });
    }
  });

  if (blockers.length > 0) {
    const detail = blockers.map(b => `${b.produit}: demandé ${b.demande}, virtuel ${b.disponible}`).join(' | ');
    return { ok: false, message: `Stock Virtuel insuffisant → ${detail}` };
  }
  return { ok: true };
}


// ─────────────────────────────────────────────────────────────
// 2. PROPAGATION EN CASCADE (Le "Engrenage" IPC Green Block)
// ─────────────────────────────────────────────────────────────

/**
 * Déclencheur principal : Devis → Bon de Commande Client (BC)
 * Appelé quand un devis passe au statut "Accepté" ou "Signé".
 *
 * Effet domino automatique :
 *   1. Crée le Bon de Commande
 *   2. Décrémente le Stock Virtuel (réservation immédiate)
 *   3. Si acompte > 0 → crée la Facture d'Acompte dans Finance
 *   4. Verrouille le devis source (immuable)
 *
 * @param {object} devis  - Le document devis signé
 * @param {object} get    - Accès au store Zustand (get())
 * @param {object} set    - Mutateur du store Zustand (set())
 */
export async function cascadeDevisToSaleOrder(devis, get, set) {
  logger.info('[IPC Green BlockEngine] CASCADE: Devis → BC', { devisId: devis.id });

  const orderNum = get().getNextSequence('sales_orders') || `BC-${Date.now().toString().slice(-6)}`;

  // 1. Créer le Bon de Commande
  const bonDeCommande = {
    id: `BC-${Date.now()}`,
    num: orderNum,
    sourceDevisId: devis.id,       // Traçabilité
    sourceDevisNum: devis.num,
    client: devis.client,
    clientContact: devis.clientContact || '',
    items: devis.items || [],
    montant: devis.montant || devis.totalTTC || 0,
    montantHT: devis.totalHT || 0,
    tva: devis.tva || 18,
    conditionsPaiement: devis.conditionsPaiement || '30j',
    statut: 'Confirmé',
    _locked: false,               // Sera verrouillé à l'expédition
    _createdFromCascade: true,
    createdAt: new Date().toISOString(),
  };

  // 2. Décrémentation Stock Virtuel (réservation — pas physique)
  //    Le stock physique ne bouge PAS encore. C'est la logique IPC Green Block.
  (devis.items || []).forEach(item => {
    if (item.productId && item.qte) {
      logger.info(`[IPC Green BlockEngine] Réservation stock virtuel: ${item.qte} × ${item.productId}`);
      // La réservation est implicite via l'existence du BC "Confirmé"
      // computeStockLevels() en tient compte automatiquement
    }
  });

  // 3. Facture d'Acompte si conditions de paiement l'exigent
  let factureAcompte = null;
  const tauxAcompte = parseFloat(devis.acompte || 0);
  if (tauxAcompte > 0) {
    const montantAcompte = Math.round(bonDeCommande.montant * (tauxAcompte / 100));
    const facNum = get().getNextSequence('finance_invoices') || `FA-${Date.now().toString().slice(-6)}`;
    factureAcompte = {
      id: `FA-${Date.now()}`,
      num: facNum,
      type: 'Acompte',
      client: devis.client,
      bcId: bonDeCommande.id,
      bcNum: bonDeCommande.num,
      montant: montantAcompte,
      tauxAcompte,
      statut: 'À Payer',
      dateEcheance: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      _createdFromCascade: true,
    };
  }

  // 4. Verrouiller le devis source (IMMUABLE après signature)
  const lockedDevis = { ...devis, _locked: true, _lockedAt: new Date().toISOString(), statut: 'Accepté' };

  // Application dans le store
  set(prev => {
    const nextOrders = [bonDeCommande, ...(prev.sales?.orders || [])];
    const nextQuotes = (prev.sales?.quotes || []).map(q => q.id === devis.id ? lockedDevis : q);
    let nextFinance = { ...prev.finance };

    if (factureAcompte) {
      nextFinance.invoices = [factureAcompte, ...(prev.finance?.invoices || [])];
    }

    return {
      ...prev,
      sales: { ...prev.sales, orders: nextOrders, quotes: nextQuotes },
      finance: nextFinance,
    };
  });

  // Persistance Firestore Atomique
  try {
    if (get().user) {
      const ops = [
        { 
          op: 'set', 
          collection: 'sales', 
          id: bonDeCommande.id, 
          data: { ...bonDeCommande, subModule: 'orders' } 
        },
        { 
          op: 'update', 
          collection: 'sales', 
          id: devis.id, 
          data: { _locked: true, _lockedAt: new Date().toISOString(), statut: 'Accepté' } 
        }
      ];

      if (factureAcompte) {
        ops.push({ 
          op: 'set', 
          collection: 'finance', 
          id: factureAcompte.id, 
          data: { ...factureAcompte, subModule: 'invoices' } 
        });
      }

      await FirestoreService.batchWrite(ops);
    }
  } catch (err) {
    logger.error('[IPC Green BlockEngine] Firestore cascade failed', err);
  }

  // Notifications UI
  get().addHint({
    title: '⚙️ Engrenage Activé',
    message: `Devis ${devis.num} → BC ${orderNum} créé. Stock virtuel réservé.${factureAcompte ? ` Facture acompte ${factureAcompte.num} émise.` : ''}`,
    type: 'success',
    appId: 'sales',
  });

  get().logAction('Cascade IPC Green Block', `Devis ${devis.num} → BC ${orderNum}`, 'sales', bonDeCommande.id);

  return { bonDeCommande, factureAcompte };
}


/**
 * Déclencheur : BC "Expédié" → Génère le Bon de Livraison + Facture Finale
 * Le stock PHYSIQUE diminue ici (pas avant).
 */
export async function cascadeBCToDelivery(bc, get, set) {
  logger.info('[IPC Green BlockEngine] CASCADE: BC → Livraison + Facture Finale', { bcId: bc.id });

  const blNum = get().getNextSequence('logistics_shipments') || `BL-${Date.now().toString().slice(-6)}`;
  const facNum = get().getNextSequence('finance_invoices') || `FAC-${Date.now().toString().slice(-6)}`;

  // Bon de Livraison
  const bonLivraison = {
    id: `BL-${Date.now()}`,
    num: blNum,
    bcId: bc.id, bcNum: bc.num,
    client: bc.client,
    items: bc.items || [],
    statut: 'En cours',
    dateExpedition: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    _createdFromCascade: true,
  };

  // Facture Finale Client
  const factureFinale = {
    id: `FAC-${Date.now()}`,
    num: facNum,
    type: 'Facture',
    client: bc.client,
    bcId: bc.id, bcNum: bc.num,
    blId: bonLivraison.id,
    montant: bc.montant,
    statut: 'À Payer',
    dateEcheance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    _createdFromCascade: true,
  };

  // Décrémentation Stock PHYSIQUE (le camion est parti)
  (bc.items || []).forEach(item => {
    if (item.productId && item.qte) {
      get().applyStockMove({
        productId: item.productId,
        qte: item.qte,
        type: 'Expédition',
        ref: `BL-${blNum}`,
        source: 'Entrepôt Principal',
        dest: bc.client,
      });
    }
  });

  // Verrouillage du BC (livré = immuable)
  set(prev => {
    const nextShipments = [bonLivraison, ...(prev.logistics?.shipments || [])];
    const nextInvoices = [factureFinale, ...(prev.finance?.invoices || [])];
    const nextOrders = (prev.sales?.orders || []).map(o =>
      o.id === bc.id ? { ...o, statut: 'Expédié', _locked: true, _lockedAt: new Date().toISOString() } : o
    );
    return {
      ...prev,
      logistics: { ...prev.logistics, shipments: nextShipments },
      finance: { ...prev.finance, invoices: nextInvoices },
      sales: { ...prev.sales, orders: nextOrders },
    };
  });

  // Persistance Firestore Atomique
  try {
    if (get().user) {
      const ops = [
        { 
          op: 'set', 
          collection: 'logistics', 
          id: bonLivraison.id, 
          data: { ...bonLivraison, subModule: 'shipments' } 
        },
        { 
          op: 'set', 
          collection: 'finance', 
          id: factureFinale.id, 
          data: { ...factureFinale, subModule: 'invoices' } 
        },
        { 
          op: 'update', 
          collection: 'sales', 
          id: bc.id, 
          data: { statut: 'Expédié', _locked: true, _lockedAt: new Date().toISOString() } 
        }
      ];
      await FirestoreService.batchWrite(ops);
    }
  } catch (err) {
    logger.error('[IPC Green BlockEngine] Firestore delivery cascade failed', err);
  }

  get().addHint({
    title: '🚚 Expédition Validée',
    message: `BL ${blNum} créé. Facture ${facNum} émise. Stock physique mis à jour.`,
    type: 'success', appId: 'logistics',
  });

  get().logAction('Cascade IPC Green Block', `BC ${bc.num} → BL ${blNum} + Facture ${facNum}`, 'logistics', bc.id);

  return { bonLivraison, factureFinale };
}


// ─────────────────────────────────────────────────────────────
// 3. THREE-WAY MATCHING — Moteur Anti-Fraude Achats
// ─────────────────────────────────────────────────────────────

/**
 * Exécute le 3-Way Match sur une facture fournisseur.
 * Compare : Bon de Commande (PO) ↔ Bon de Réception (BR) ↔ Facture
 *
 * Règle absolue : si les 3 ne concordent pas → paiement BLOQUÉ mathématiquement.
 *
 * @returns {{ matched: boolean, anomalies: string[], blockedAmount: number }}
 */
export function runThreeWayMatch(po, receptionData, invoiceData) {
  const anomalies = [];

  const qtePO = parseFloat(po.qte || 0);
  const prixPO = parseFloat(po.prixUnitaire || po.total / (po.qte || 1) || 0);

  const qteRecue = parseFloat(receptionData.qteRecue || receptionData.qte || 0);
  const qteFacturee = parseFloat(invoiceData.qteFacturee || invoiceData.qte || qtePO);
  const prixFacture = parseFloat(invoiceData.prixUnitaire || invoiceData.montant / (qteFacturee || 1) || 0);

  // Règle 1 : Quantité reçue ≤ Quantité commandée
  if (qteRecue > qtePO) {
    anomalies.push(`Réception (${qteRecue}) > Commande (${qtePO}) — Livraison non autorisée`);
  }

  // Règle 2 : Quantité facturée ≤ Quantité reçue
  if (qteFacturee > qteRecue) {
    anomalies.push(`Facturé (${qteFacturee}) > Reçu (${qteRecue}) — Facturation excessive`);
  }

  // Règle 3 : Prix facturé ≤ Prix PO (tolérance 2%)
  if (prixPO > 0 && prixFacture > prixPO * 1.02) {
    anomalies.push(`Prix facturé (${prixFacture}) > Prix PO (${prixPO}) — Dépassement de tarif`);
  }

  const matched = anomalies.length === 0;

  // Montant payable = uniquement ce qui a été reçu (pas la facture totale)
  const montantPayable = matched
    ? Math.round(qteRecue * (prixPO || prixFacture))
    : 0; // Bloqué si anomalie

  return {
    matched,
    anomalies,
    montantPayable,
    qtePayable: Math.min(qteRecue, qteFacturee),
    statut: matched ? 'Validé (Match Parfait)' : `Bloqué (${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''})`,
  };
}

/**
 * Applique le résultat du 3-Way Match dans le store.
 * Si bloqué : le paiement est impossible ET une alerte est levée.
 * Si validé : la facture fournisseur passe en "À Payer".
 */
export function applyThreeWayMatchResult(poId, matchResult, get, set) {
  if (matchResult.matched) {
    get().addHint({
      title: '✅ 3-Way Match Parfait',
      message: `Commande validée. Montant payable : ${matchResult.montantPayable.toLocaleString('fr-FR')} FCFA.`,
      type: 'success', appId: 'purchase',
    });
    get().logAction('3-Way Match', `PO ${poId} — Match parfait`, 'purchase', poId);
  } else {
    const detail = matchResult.anomalies.join(' | ');
    get().addHint({
      title: '🚨 Blocage 3-Way Match',
      message: `Paiement impossible → ${detail}`,
      type: 'error', appId: 'finance',
    });
    get().sendNotification(
      'FINANCE', '⚠️ Anomalie Facture Fournisseur',
      `La facture liée à PO ${poId} est bloquée : ${detail}`,
      'error', 'finance'
    );
    get().logAction('Alerte Fraude', `PO ${poId} — Blocage 3-Way Match : ${detail}`, 'finance', poId);
  }

  // Mettre à jour le statut de la facture fournisseur dans le store
  set(prev => {
    const nextBills = (prev.finance?.vendor_bills || []).map(b =>
      b.orderId === poId
        ? { ...b, statut: matchResult.statut, anomalies: matchResult.anomalies, montantPayable: matchResult.montantPayable }
        : b
    );
    return { ...prev, finance: { ...prev.finance, vendor_bills: nextBills } };
  });

  return matchResult.matched;
}


// ─────────────────────────────────────────────────────────────
// 4. VERROUILLAGE DE DOCUMENTS
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie si un document est verrouillé avant toute modification.
 * Un document verrouillé nécessite un "Avenant" — jamais une modification directe.
 *
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function checkDocumentLock(record, userRole) {
  if (!record._locked) return { blocked: false };

  // Super Admin et Juridique peuvent créer un Avenant, mais pas modifier directement
  if (['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
    return {
      blocked: true,
      reason: `Document verrouillé (${record._lockedAt?.split('T')[0] || 'date inconnue'}). Créez un Avenant pour modifier.`,
      canAmend: true,
    };
  }

  return {
    blocked: true,
    reason: `Document verrouillé. Contactez votre administrateur pour créer un Avenant.`,
    canAmend: false,
  };
}

/**
 * Crée un Avenant (amendment) lié à un document verrouillé.
 * L'original reste intact — l'avenant est un nouveau document lié.
 */
export function createAmendment(originalRecord, changes, get, set) {
  const amendNum = `AVN-${originalRecord.num || originalRecord.id}-${Date.now().toString().slice(-4)}`;

  const amendment = {
    id: `AVN-${Date.now()}`,
    num: amendNum,
    _isAmendment: true,
    _originalId: originalRecord.id,
    _originalNum: originalRecord.num,
    ...originalRecord,
    ...changes,
    _locked: false,
    statut: 'Brouillon',
    createdAt: new Date().toISOString(),
  };

  get().addHint({
    title: '📋 Avenant Créé',
    message: `L'Avenant ${amendNum} a été créé sur la base de ${originalRecord.num || originalRecord.id}.`,
    type: 'info',
  });

  get().logAction('Avenant', `Avenant ${amendNum} créé depuis ${originalRecord.num || originalRecord.id}`, 'legal', originalRecord.id);

  return amendment;
}


// ─────────────────────────────────────────────────────────────
// 5. COMPTABILITÉ ANALYTIQUE — Imputation par Centre de Coût
// ─────────────────────────────────────────────────────────────

/**
 * Définition des Centres Analytiques IPC
 * Chaque coût appartient à exactement 1 centre.
 */
export const CENTRES_ANALYTIQUES = {
  'PROD_PRESSE1': { label: 'Production — Presse à Blocs n°1', type: 'production' },
  'PROD_PRESSE2': { label: 'Production — Presse à Blocs n°2', type: 'production' },
  'LOG_EXPEDITION': { label: 'Logistique — Expédition', type: 'logistics' },
  'LOG_RECEPTION': { label: 'Logistique — Réception', type: 'logistics' },
  'ADMIN_GENERAL': { label: 'Administration Générale', type: 'admin' },
  'CHANTIER': { label: 'Chantier / Installation', type: 'production' },
  'COMMERCIAL': { label: 'Commercial & Ventes', type: 'sales' },
  'MAINTENANCE': { label: 'Maintenance & Entretien', type: 'production' },
};

/**
 * Impute le coût d'un pointage (timesheet) vers un centre analytique.
 * Calcul : Coût horaire chargé × Heures pointées → Écriture comptable
 *
 * @param {object} timesheet - { collaborateur, heures, centreAnalytique, projet, salaire }
 * @param {object} get       - Accès au store
 */
export function imputerCoutAnalytique(timesheet, get) {
  const employees = get().data?.hr?.employees || [];
  const employee = employees.find(e =>
    e.nom === timesheet.collaborateur || e.id === timesheet.employeeId
  );

  const salaireMensuel = parseFloat(employee?.salaire || timesheet.salaire || 150000);
  const tauxHoraire = salaireMensuel / 160; // 160h/mois = standard
  const heures = parseFloat(timesheet.heures || 0);
  const coutTotal = Math.round(heures * tauxHoraire);

  const centreLabel = CENTRES_ANALYTIQUES[timesheet.centreAnalytique]?.label
    || timesheet.centreAnalytique
    || timesheet.projet
    || 'Non défini';

  const entry = {
    libelle: `Imputation Analytique — ${timesheet.collaborateur} (${heures}h) → [${centreLabel}]`,
    date: timesheet.date || new Date().toISOString().split('T')[0],
    journalCode: 'J-OD',
    piece: timesheet.num || timesheet.id,
  };

  const lines = [
    // Débit : Charge de personnel affectée au centre
    {
      accountId: '641100',
      label: `Frais Personnel — ${timesheet.collaborateur}`,
      debit: coutTotal,
      credit: 0,
      profitCenter: centreLabel,
      centreAnalytique: timesheet.centreAnalytique,
    },
    // Crédit : Personnel rémunérations dues
    {
      accountId: '421000',
      label: 'Personnel — Rémunérations Dues',
      debit: 0,
      credit: coutTotal,
      profitCenter: 'ADMIN_GENERAL',
      centreAnalytique: 'ADMIN_GENERAL',
    },
  ];

  const success = get().addAccountingEntry(entry, lines);

  if (success) {
    get().addHint({
      title: '📊 Imputation Analytique',
      message: `${coutTotal.toLocaleString('fr-FR')} FCFA imputés sur [${centreLabel}] pour ${heures}h de ${timesheet.collaborateur}.`,
      type: 'success', appId: 'finance',
    });
    get().logAction('Analytique', `${coutTotal} FCFA → ${centreLabel} (${timesheet.collaborateur})`, 'hr');
  }

  return { coutTotal, centreLabel, success };
}

/**
 * Génère un rapport de coûts par centre analytique.
 * Agrège toutes les écritures comptables par profitCenter.
 *
 * @param {object} storeData - L'objet data du store
 * @returns {Array} Centres avec totaux débit/crédit
 */
export function rapportCoutsAnalytiques(storeData) {
  const lines = storeData.finance?.lines || [];
  const byCenter = {};

  lines.forEach(line => {
    const center = line.profitCenter || line.centreAnalytique || 'Non imputé';
    if (!byCenter[center]) {
      byCenter[center] = { centre: center, totalDebit: 0, totalCredit: 0, lignes: 0 };
    }
    byCenter[center].totalDebit += parseFloat(line.debit || 0);
    byCenter[center].totalCredit += parseFloat(line.credit || 0);
    byCenter[center].lignes += 1;
  });

  return Object.values(byCenter)
    .map(c => ({ ...c, solde: c.totalDebit - c.totalCredit }))
    .sort((a, b) => b.totalDebit - a.totalDebit);
}
