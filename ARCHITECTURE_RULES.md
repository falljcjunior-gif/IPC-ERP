# La Règle d'Or de l'Architecture : Le SSOT (Single Source of Truth)

**Axelor est la Seule Source de Vérité (SSOT).**  
Flutter ne fait qu'afficher et capturer la donnée. Firebase ne sert que de salle d'attente (buffer) pour gérer le mode hors-ligne sur les chantiers/usines et envoyer des notifications en temps réel. **Aucun calcul financier ou d'inventaire ne doit être fait dans Firebase.** Tout doit être validé par la base PostgreSQL d'Axelor (règles ACID) pour éviter les doublons.

---

## 1. Module Ventes & CRM (La Porte d'Entrée)
**Fonctionnalité :** Gérer les prospects, les devis, les contrats cadres (B2B) et les commandes clients.

### Logique d'Alignement Strict (Workflow) :
- **Création (Flutter) :** Un commercial sur le terrain génère un Devis sur sa tablette Flutter.
- **Signature :** Le client signe. Le statut passe à "Gagné".
- **L'Engrenage (Axelor) :** Le passage en "Gagné" est le déclencheur absolu. Axelor transforme automatiquement le Devis en "Bon de Commande Client" (Sale Order).
- **Impact Stock (Immédiat) :** Axelor ne touche pas au stock physique, mais il décrémente instantanément le **Stock Virtuel** (ou Stock Disponible). Cela empêche un autre commercial de vendre des produits qui sont déjà promis à ce premier client.
- **Impact Finance (Immédiat) :** Si les conditions de paiement exigent un acompte (ex: 30% à la commande), le module Vente déclenche la création d'une "Facture d'Acompte" dans le module Comptabilité.

> **Risque d'erreur à éviter :** Permettre la modification d'un devis après sa signature.  
> **Solution technique :** Dès que le statut Firebase passe à "Signé", le document Axelor est verrouillé en base de données (Read-Only). Toute modification nécessite un "Avenant".

---

## 2. Module Gestion des Stocks & Logistique (Le Cœur Physique)
**Fonctionnalité :** Gérer les matières premières, les produits finis, les multi-entrepôts et les mouvements de stock.

### Logique d'Alignement Strict (Workflow) :
- **La Réception (Achats ➡️ Stock) :** Un camion livre de la matière première. Le magasinier scanne le Bon de Livraison via Flutter.
  - *Logique :* Le Stock Physique augmente. La valeur financière de l'inventaire dans la Comptabilité augmente proportionnellement au prix d'achat.
- **L'Expédition (Ventes ➡️ Stock) :** Un camion part livrer les blocs chez le client.
  - *Logique :* Le Bon de Commande (du module Vente) se transforme en "Bon de Livraison" (Delivery Order). Une fois validé, le Stock Physique diminue.
- **L'Alerte de Réassort (Stock ➡️ Achats) :**
  - *Logique :* Chaque article a un "Point de Commande". Le système lit la base de données toutes les heures. Si `(Stock Physique + Commandes Fournisseurs en cours - Commandes Clients) < Point de Commande`, Axelor génère automatiquement un "Brouillon de Commande Fournisseur".

> **Risque d'erreur à éviter :** Les stocks négatifs.  
> **Solution technique :** Le bouton "Valider l'expédition" sur Flutter doit être grisé si la requête API vers Axelor renvoie un stock physique insuffisant. Firebase met à jour l'interface en temps réel pour tous les magasiniers pour éviter les conflits d'expédition simultanés.

---

## 3. Module Achats & Approvisionnements (Le Contrôle des Coûts)
**Fonctionnalité :** Gérer les fournisseurs, les demandes de prix, les bons de commande et la réception.

### Logique d'Alignement Strict (Workflow) :
La règle absolue ici est le **"Three-Way Matching" (Rapprochement à 3 voies)**. C'est le standard industriel pour éviter les fraudes et les erreurs de facturation.
1. **Le Bon de Commande (PO) :** Axelor génère le PO (ex: 100 tonnes de matière à 10€/tonne).
2. **Le Bon de Réception (BR) :** Le magasinier confirme avoir reçu seulement 90 tonnes (via Flutter). Axelor met à jour le stock avec 90 tonnes.
3. **La Facture Fournisseur :** Le fournisseur envoie une facture de 1000€ (pour 100 tonnes).
- **L'Alignement :** Le module Achat d'Axelor va comparer le PO (100t), le BR (90t) et la Facture (100t). Le système **bloquera mathématiquement le paiement** dans le module Finance, car la Réception ne correspond pas à la Facture. Le comptable reçoit une alerte.

---

## 4. Module Comptabilité & Finance (Le Juge de Paix)
**Fonctionnalité :** Plan comptable, facturation, trésorerie, lettrage.

### Logique d'Alignement Strict (Workflow) :
Dans un ERP bien configuré, le comptable ne saisit presque rien manuellement ; il contrôle les flux générés par les autres départements.
- **Ventes ➡️ Finance :** La validation d'un Bon de Livraison génère la Facture Client finale. Les écritures comptables sont générées automatiquement.
- **Achats ➡️ Finance :** La validation de la facture fournisseur génère la dette fournisseur.
- **Rapprochement Bancaire :** Les relevés bancaires sont importés (via API bancaire ou fichier). Le système "lettre" (associe) automatiquement les encaissements avec les factures de vente ouvertes ayant le même montant et la même référence.

---

## 5. Module Ressources Humaines (Le Coût Opérationnel)
**Fonctionnalité :** Gestion des employés, contrats, présences (pointage).

### Logique d'Alignement Strict (Workflow) :
Ce module est vital si l'entreprise fait de la production ou de l'installation, car la main-d'œuvre est un coût variable lourd.
- **Pointage (Flutter ➡️ Firebase ➡️ Axelor) :** Les ouvriers pointent leur arrivée/départ sur tablette (avec géolocalisation pour les chantiers). Firebase gère l'envoi même si la connexion saute, puis synchronise avec Axelor.
- **Imputation Analytique (RH ➡️ Finance/Production) :** Si l'ouvrier A a passé 4 heures sur le centre de production de la "Presse à blocs n°1" et 4 heures sur l'expédition.
- **L'Alignement :** Axelor prend le coût horaire de cet ouvrier (chargé) et l'impute directement dans la Comptabilité Analytique. Cela permet de savoir exactement combien coûte la fabrication d'un lot en incluant la main-d'œuvre.

---

### ⚠️ Résumé Exécutif pour l'Équipe Technique
**Pour que tout soit fonctionnel sans erreur, le cahier des charges impose ceci : Aucun module ne fonctionne en silo.**
- Une vente n'est pas qu'un papier, c'est une réservation de stock et une écriture financière future.
- Un achat n'est pas qu'une dépense, c'est une entrée en stock et une mise à jour de la valeur de l'entreprise.
