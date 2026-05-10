/**
 * ═══════════════════════════════════════════════════════════════════
 *  NEXUS OS — MISSIONS MODULE : FIRESTORE DATA SCHEMA
 *  Architecture: Workspaces > Boards > Lists > Cards
 *
 *  Stratégie NoSQL choisie :
 *  - Workspaces / Boards / Lists / Cards → top-level collections
 *    (flat model = queries croisées, indexes composites sans limite)
 *  - Comments / Checklists / Attachments → sous-collections de cards/
 *    (évite la limite 1MB/doc, lecture à la demande uniquement)
 *  - Activity (audit) → sous-collection de cards/ (append-only)
 *  - customFields DEFINITION → array dans board (< 20 champs, jamais 1MB)
 *  - customFields VALUES → map inline dans card (lecture gratuite avec la card)
 *
 *  Tri & Drag & Drop : champ `rank` (LexoRank simplifié, base-36)
 *  Lecture garantie < 1 requête par vue grâce aux champs dénormalisés.
 * ═══════════════════════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────────────────────────
// COLLECTION : missions_workspaces/{workspaceId}
// ────────────────────────────────────────────────────────────────────
export const WorkspaceSchema = {
  id:          'string   — auto (nanoid)',
  name:        'string   — required',
  description: 'string   — optional',

  // Accès entreprise : PUBLIC = tous les users Nexus OS | PRIVATE = liste members
  visibility:  "enum ['PUBLIC', 'PRIVATE']",

  // Restriction par département (RBAC coarse-grain)
  // ex: ['production'] → seuls les users avec role=PRODUCTION_* y accèdent
  allowedRoles: 'string[] — [] = tous',

  members: [{
    uid:   'string — Firebase Auth UID',
    role:  "enum ['ADMIN', 'MEMBER', 'VIEWER']",
  }],

  boardCount:  'number — dénormalisé (inc/dec via trigger)',
  createdBy:   'string — UID',
  createdAt:   'Timestamp',
  updatedAt:   'Timestamp',
  isArchived:  'boolean — default false',

  // Intégration ERP : workspace lié à un périmètre métier
  erpContext: {
    module: "string | null — ex: 'production', 'crm', 'hr'",
    entityId: 'string | null — ex: projectId pour lier à un chantier',
  },
};

// ────────────────────────────────────────────────────────────────────
// COLLECTION : missions_boards/{boardId}
// ────────────────────────────────────────────────────────────────────
export const BoardSchema = {
  id:          'string',
  workspaceId: 'string — ref missions_workspaces',
  name:        'string — required',
  description: 'string',

  // Fond du board
  background: {
    type:  "enum ['color', 'gradient', 'image']",
    value: 'string — ex: #1E293B | url',
  },

  // Membres du board (peut être subset du workspace)
  members: [{
    uid:  'string',
    role: "enum ['ADMIN', 'MEMBER', 'VIEWER']",
  }],

  // CUSTOM FIELDS DEFINITIONS (stockées ici, values dans la card)
  // Max ~20 par board → jamais > 1MB même avec 20 définitions
  customFields: [{
    id:       'string — nanoid()',
    name:     'string',
    type:     "enum ['text', 'number', 'date', 'select', 'checkbox', 'erp_link']",
    options:  'string[] — pour type=select uniquement',
    icon:     'string — lucide icon name',
    position: 'number — ordre d\'affichage',
  }],

  // ÉTIQUETTES (labels)
  labels: [{
    id:    'string',
    name:  'string',
    color: 'string — hex',
  }],

  // RÈGLES BUTLER (automations)
  rules: [{
    id:        'string',
    name:      'string — libellé lisible',
    enabled:   'boolean',
    trigger: {
      event:   "enum ['card_moved', 'card_created', 'due_date_passed', 'label_added', 'checklist_completed']",
      listId:  'string | null — pour card_moved: liste de destination',
      labelId: 'string | null',
    },
    actions: [{
      type:    "enum ['move_card', 'set_due_complete', 'add_label', 'notify_user', 'create_erp_record', 'webhook']",
      payload: 'object — dépend du type',
    }],
    createdBy: 'string',
  }],

  listCount: 'number — dénormalisé',
  cardCount:  'number — dénormalisé',

  createdBy: 'string',
  createdAt: 'Timestamp',
  updatedAt: 'Timestamp',
  isArchived: 'boolean',
  isClosed:   'boolean',
};

// ────────────────────────────────────────────────────────────────────
// COLLECTION : missions_lists/{listId}
// ────────────────────────────────────────────────────────────────────
export const ListSchema = {
  id:         'string',
  boardId:    'string — ref missions_boards',
  workspaceId:'string — dénormalisé pour queries directes',
  name:       'string — required',

  // RANK = string lexicographique (LexoRank base-36)
  // ex: "0|hzzzzz:", "0|i00000:"
  // Déplacement d'une liste = recalcul du midpoint, jamais de batch update
  rank:       'string — LexoRank',

  // Limite optionnelle de cartes (WIP limit Kanban)
  wipLimit:   'number | null',

  cardCount:  'number — dénormalisé',
  isArchived: 'boolean',
  createdAt:  'Timestamp',
};

// ────────────────────────────────────────────────────────────────────
// COLLECTION : missions_cards/{cardId}
// ────────────────────────────────────────────────────────────────────
// STRATÉGIE CLÉ : tout ce qui est affiché sur la "face" de la carte
// est inline (évite les lectures supplémentaires pour le board view).
// Tout ce qui est affiché dans la "modale de carte" est en sous-collection.
export const CardSchema = {
  id:          'string',
  listId:      'string — ref missions_lists',
  boardId:     'string — dénormalisé',
  workspaceId: 'string — dénormalisé',

  // ── Contenu principal ──
  title:       'string — required',
  description: 'string — Markdown (stocké raw, rendu côté client)',

  // ── Tri drag & drop ──
  rank:        'string — LexoRank (dans la liste)',

  // ── Assignations ──
  members: ['string — UID'],

  // ── Étiquettes ──
  labelIds: ['string — ref board.labels[].id'],

  // ── Dates ──
  startDate:      'Timestamp | null',
  dueDate:        'Timestamp | null',
  dueDateComplete:'boolean — cochée par l\'user ou butler',

  // ── Couverture ──
  cover: {
    type:  "enum ['color', 'image'] | null",
    value: 'string',
  },

  // ── Champs personnalisés (VALUES, definitions dans board) ──
  // Map fieldId → valeur : lecture gratuite avec la card
  customFieldValues: {
    '[fieldId]': 'any — selon field.type',
  },

  // ── Liens ERP (système relationnel) ──
  linkedEntities: [{
    module:   "string — ex: 'crm', 'hr', 'production', 'finance'",
    model:    "string — ex: 'deals', 'employees', 'workOrders', 'invoices'",
    entityId: 'string — docId dans la collection ERP',
    label:    'string — dénormalisé pour affichage sans extra-fetch',
    url:      'string — route interne /crm/deals/{id}',
  }],

  // ── Compteurs dénormalisés (évite de lire les sous-collections pour KPIs) ──
  commentCount:    'number',
  attachmentCount: 'number',
  checklistProgress: {
    total:    'number',
    complete: 'number',
  },

  // ── Métadonnées ──
  createdBy:  'string — UID',
  createdAt:  'Timestamp',
  updatedAt:  'Timestamp',
  isArchived: 'boolean',
  position:   'number — legacy, remplacé par rank',
};

// ────────────────────────────────────────────────────────────────────
// SOUS-COLLECTION : missions_cards/{cardId}/comments/{commentId}
// Chargée uniquement à l'ouverture de la modale de carte
// ────────────────────────────────────────────────────────────────────
export const CommentSchema = {
  id:        'string',
  text:      'string — Markdown',
  authorUid: 'string',
  authorName:'string — dénormalisé',
  edited:    'boolean',
  createdAt: 'Timestamp',
  updatedAt: 'Timestamp',
};

// ────────────────────────────────────────────────────────────────────
// SOUS-COLLECTION : missions_cards/{cardId}/checklists/{checklistId}
// items[] en array : max ~100 items, jamais > 100KB
// ────────────────────────────────────────────────────────────────────
export const ChecklistSchema = {
  id:    'string',
  title: 'string',
  rank:  'string — LexoRank (ordre des checklists dans la carte)',
  items: [{
    id:        'string',
    text:      'string',
    complete:  'boolean',
    assignee:  'string | null — UID',
    dueDate:   'Timestamp | null',
    completedAt:'Timestamp | null',
    completedBy:'string | null — UID',
  }],
  createdAt: 'Timestamp',
};

// ────────────────────────────────────────────────────────────────────
// SOUS-COLLECTION : missions_cards/{cardId}/attachments/{attachmentId}
// Fichier stocké sur Firebase Storage
// ────────────────────────────────────────────────────────────────────
export const AttachmentSchema = {
  id:          'string',
  name:        'string — nom original du fichier',
  storagePath: 'string — chemin Firebase Storage',
  downloadUrl: 'string — URL signée ou publique',
  mimeType:    'string',
  size:        'number — bytes',
  isCover:     'boolean — si utilisé comme couverture de carte',
  uploadedBy:  'string — UID',
  createdAt:   'Timestamp',
};

// ────────────────────────────────────────────────────────────────────
// SOUS-COLLECTION : missions_cards/{cardId}/activity/{activityId}
// Journal d'audit de la carte (append-only, jamais modifié)
// ────────────────────────────────────────────────────────────────────
export const ActivitySchema = {
  id:        'string',
  type: `enum [
    'card_created', 'card_moved', 'card_renamed', 'card_archived',
    'member_added', 'member_removed',
    'label_added', 'label_removed',
    'due_date_set', 'due_date_removed', 'due_date_completed',
    'description_updated',
    'checklist_created', 'checklist_item_checked', 'checklist_item_unchecked',
    'attachment_added', 'attachment_removed',
    'custom_field_updated',
    'erp_link_added', 'erp_link_removed',
    'comment_added',
    'butler_action_fired'
  ]`,
  actorUid:  'string',
  actorName: 'string — dénormalisé',
  // Payload spécifique selon le type
  meta: {
    // card_moved:
    fromListId:   'string | null',
    fromListName: 'string | null',
    toListId:     'string | null',
    toListName:   'string | null',
    // custom_field_updated:
    fieldName:    'string | null',
    oldValue:     'any | null',
    newValue:     'any | null',
    // butler_action_fired:
    ruleId:       'string | null',
    ruleName:     'string | null',
  },
  createdAt: 'Timestamp',
};

// ────────────────────────────────────────────────────────────────────
// INDEX COMPOSITES REQUIS (à ajouter dans firestore.indexes.json)
// ────────────────────────────────────────────────────────────────────
export const REQUIRED_INDEXES = [
  // Charger toutes les listes d'un board, triées par rank
  { collection: 'missions_lists',  fields: ['boardId ASC', 'rank ASC', 'isArchived ASC'] },
  // Charger toutes les cartes d'une liste, triées par rank (vue kanban)
  { collection: 'missions_cards',  fields: ['listId ASC', 'rank ASC', 'isArchived ASC'] },
  // Charger toutes les cartes d'un board par date d'échéance (vue calendrier/gantt)
  { collection: 'missions_cards',  fields: ['boardId ASC', 'dueDate ASC', 'isArchived ASC'] },
  // Cartes assignées à un user sur tout un workspace (vue workload)
  { collection: 'missions_cards',  fields: ['workspaceId ASC', 'members ASC', 'dueDate ASC'] },
  // Activité d'une carte triée par date desc (journal)
  { collection: 'missions_cards',  subCollection: 'activity', fields: ['createdAt DESC'] },
];
