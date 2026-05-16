/**
 * ════════════════════════════════════════════════════════════════════════════
 * ENTITY MANAGEMENT CENTER — Holding Group Governance
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The Holding's control panel for managing all group entities :
 * • List view — all subsidiaries + foundation with health scores
 * • Creation wizard — guided 6-step wizard (Type → Identity → Modules →
 * License → Director → Review + Provisioning)
 * • Lifecycle actions — activate, suspend, archive, delete
 * • Entity detail panel — quick settings, team, KPIs
 * • Health monitoring — configuration completeness scoring
 *
 * Access: Holding-level roles only (HOLDING_CEO, HOLDING_CFO, SUPER_ADMIN)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Heart, CheckCircle2, X,
  Folder, Settings2, Package, Key, UserCheck, Eye,
  Play, Pause, Edit3, Archive, Zap, Users, Trash2, AlertTriangle,
} from 'lucide-react';
import {
  GROUP_ENTITIES, ENTITY_TYPES, getSubsidiaries, getFoundation,
  isHoldingRole,
} from '../../../schemas/org.schema';
import {
  LICENSE_PLANS, LICENSE_PLAN_IDS, ENTITY_STATES,
  ENTITY_STATE_META, ALL_MODULES,
} from '../../../schemas/license.schema';
import { EntityService } from '../../../services/EntityService';
import { useStore } from '../../../store';

// ── Design ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#09090B', surface: '#0F0F11', card: '#141416',
  border: 'rgba(255,255,255,0.07)', accent: 'rgba(255,255,255,0.85)', gold: 'rgba(255,255,255,0.60)',
  blue: 'rgba(255,255,255,0.70)', red: 'rgba(248,113,113,0.75)', purple: 'rgba(255,255,255,0.55)',
  text: '#F4F4F5', muted: '#71717A', dim: 'rgba(255,255,255,0.04)',
};

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n);

// ── Wizard Steps ──────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 'type',     label: 'Type'        },
  { id: 'identity', label: 'Identité'    },
  { id: 'modules',  label: 'Modules'     },
  { id: 'license',  label: 'Licence'     },
  { id: 'director', label: 'Directeur'   },
  { id: 'review',   label: 'Confirmation'},
];

const WIZARD_ICONS = {
  type:     Folder,
  identity: Settings2,
  modules:  Package,
  license:  Key,
  director: UserCheck,
  review:   Eye,
};

const INDUSTRIES = [
  'Fabrication / Construction', 'Technologie & Communication', 'Commerce & Distribution',
  'Finance & Assurance', 'Hôtellerie & Restauration', 'Formation & Éducation',
  'Santé & Médical', 'Transport & Logistique', 'Agriculture & Agroalimentaire',
  'Énergie & Environnement', 'Services Professionnels', 'ONG / Social / ESG', 'Autre',
];

const COUNTRIES = ['Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Guinée', 'Cameroun', 'France', 'Autre'];
const CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'GBP'];
const AUTONOMY_LEVELS = [
  { id: 'full',       label: 'Pleine autonomie', desc: 'Le directeur gère tout sans validation Holding' },
  { id: 'supervised', label: 'Supervisée',        desc: 'Décisions stratégiques validées par Holding'   },
  { id: 'restricted', label: 'Restreinte',        desc: 'Toutes les décisions importantes remontent'    },
];

const MODULE_CATEGORIES = [...new Set(ALL_MODULES.map(m => m.category))];

export default function EntityManagementCenter() {
  const role = useStore(s => s.userRole || s.user?.role);
  const [entities, setEntities] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // entity being edited
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // entity to delete
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | subsidiary | foundation
  const [actionLoading, setActionLoading] = useState(null);

  // Wizard state
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState({
    type: ENTITY_TYPES.SUBSIDIARY,
    name: '', industry: '', country: 'Côte d\'Ivoire', currency: 'XOF',
    timezone: 'Africa/Abidjan', logo: null,
    modules: [],
    licensePlanId: LICENSE_PLAN_IDS.BUSINESS,
    director: { nom: '', prenom: '', email: '' },
    autonomyLevel: 'supervised',
    customQuotas: {},
  });
  const [provisioning, setProvisioning] = useState(null); // null | 'loading' | 'done' | 'error'

  useEffect(() => {
    // [GO-LIVE] Base: GROUP_ENTITIES depuis org.schema (données statiques de config).
    // En production, remplacé par FirestoreService.subscribeToCollection('entities', ...).
    setEntities(GROUP_ENTITIES.filter(e => e.type !== ENTITY_TYPES.HOLDING));
    // [GO-LIVE] Licences chargées depuis entity_licenses (Firestore).
    // Valeurs stables (non aléatoires) — userCount et storageGB à 0 jusqu'au premier provisioning.
    setLicenses(GROUP_ENTITIES.filter(e => e.type !== ENTITY_TYPES.HOLDING).map(e => ({
      entity_id: e.id,
      planId: e.type === ENTITY_TYPES.FOUNDATION ? 'FOUNDATION' : 'ENTERPRISE',
      state: e.id === 'ysee' ? ENTITY_STATES.SUSPENDED : ENTITY_STATES.ACTIVE,
      userCount: 0,
      storageGB: 0,
    })));
  }, []);

  const filteredEntities = entities.filter(e =>
    filter === 'all' ||
    (filter === 'subsidiary' && e.type === ENTITY_TYPES.SUBSIDIARY) ||
    (filter === 'foundation' && e.type === ENTITY_TYPES.FOUNDATION)
  );

  const selectedEntity = entities.find(e => e.id === selectedId);
  const selectedLicense = licenses.find(l => l.entity_id === selectedId);

  const handleWizardChange = useCallback((key, value) => {
    setWizard(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleModuleToggle = useCallback((moduleId) => {
    setWizard(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId],
    }));
  }, []);

  const handleProvisioning = async () => {
    setProvisioning('loading');
    try {
      await EntityService.createEntity(wizard);
      setProvisioning('done');
      setTimeout(() => {
        setShowWizard(false);
        setStep(0);
        setProvisioning(null);
        setWizard({
          type: ENTITY_TYPES.SUBSIDIARY, name: '', industry: '',
          country: 'Côte d\'Ivoire', currency: 'XOF', timezone: 'Africa/Abidjan',
          logo: null, modules: [], licensePlanId: LICENSE_PLAN_IDS.BUSINESS,
          director: { nom: '', prenom: '', email: '' }, autonomyLevel: 'supervised',
          customQuotas: {},
        });
      }, 3000);
    } catch (err) {
      console.error('[EMC] Provisioning failed:', err);
      setProvisioning('error');
    }
  };

  const handleStateChange = async (entityId, newState) => {
    setActionLoading(entityId);
    try {
      await EntityService.changeEntityState(entityId, newState,
        `Changed to ${newState} by Holding admin`);
      setLicenses(prev => prev.map(l =>
        l.entity_id === entityId ? { ...l, state: newState } : l
      ));
    } catch (err) {
      console.error('[EMC] State change failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Soft delete : archive l'entité + désactive sa licence + log audit
  const handleDeleteEntity = async (entity) => {
    setDeleteLoading(true);
    try {
      // 1. Désactiver la licence
      await EntityService.changeEntityState(entity.id, ENTITY_STATES.ARCHIVED,
        `Soft-deleted by Holding Super Admin`);
      // 2. Supprimer de la liste locale
      setEntities(prev => prev.filter(e => e.id !== entity.id));
      setLicenses(prev => prev.filter(l => l.entity_id !== entity.id));
      if (selectedId === entity.id) setSelectedId(null);
    } catch (err) {
      console.error('[EMC] Delete failed:', err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', minHeight: '70vh' }}>

      {/* ── Entity List (left panel) ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: `Toutes (${entities.length})` },
              { id: 'subsidiary', label: `Filiales (${entities.filter(e => e.type === ENTITY_TYPES.SUBSIDIARY).length})` },
              { id: 'foundation', label: `Foundation (${entities.filter(e => e.type === ENTITY_TYPES.FOUNDATION).length})` },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: filter === f.id ? `${T.accent}20` : T.dim,
                color: filter === f.id ? T.accent : T.muted,
                fontWeight: filter === f.id ? 700 : 400,
              }}>{f.label}</button>
            ))}
          </div>
          <button onClick={() => setShowWizard(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10,
            background: T.accent, border: 'none', cursor: 'pointer',
            color: '#000', fontWeight: 800, fontSize: 13,
          }}>
            <span style={{ fontSize: 16 }}>+</span> Créer une entité
          </button>
        </div>

        {/* Entity cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filteredEntities.map(entity => {
            const license = licenses.find(l => l.entity_id === entity.id);
            const state = license?.state || ENTITY_STATES.ACTIVE;
            const stateMeta = ENTITY_STATE_META[state] || ENTITY_STATE_META[ENTITY_STATES.ACTIVE];
            const plan = LICENSE_PLANS[license?.planId] || null;
            const healthScore = EntityService.computeHealthScore(entity, plan && { maxUsers: plan.maxUsers }, license);
            const isSelected = selectedId === entity.id;
            const isLoading = actionLoading === entity.id;

            return (
              <div key={entity.id} onClick={() => setSelectedId(isSelected ? null : entity.id)} style={{
                background: isSelected ? `${entity.color}12` : T.card,
                border: `1px solid ${isSelected ? entity.color : T.border}`,
                borderRadius: 16, padding: 20, cursor: 'pointer',
                transition: 'all .15s',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: `${entity.color}20`, border: `1px solid ${entity.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {entity.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{entity.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{entity.industry}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: `${stateMeta.color}20`, color: stateMeta.color,
                    }}>
                      {stateMeta.icon} {stateMeta.label}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 6,
                      background: `${plan?.color || T.muted}15`, color: plan?.color || T.muted,
                    }}>
                      {plan?.icon} {plan?.name || '—'}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Utilisateurs', value: license?.userCount || '—' },
                    { label: 'Stockage', value: license?.storageGB ? `${license.storageGB} Go` : '—' },
                    { label: 'Modules', value: entity.modules?.length || '—' },
                  ].map(m => (
                    <div key={m.label} style={{ background: T.surface, borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Health score */}
                <div style={{ marginBottom: isSelected ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: T.muted }}>Score de santé</span>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: healthScore >= 80 ? T.accent : healthScore >= 60 ? T.gold : T.red,
                    }}>
                      {healthScore}/100
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: T.dim }}>
                    <div style={{
                      width: `${healthScore}%`, height: '100%', borderRadius: 6,
                      background: healthScore >= 80 ? T.accent : healthScore >= 60 ? T.gold : T.red,
                      transition: 'width .6s ease',
                    }} />
                  </div>
                </div>

                {/* Actions (expanded) */}
                {isSelected && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                    {state !== ENTITY_STATES.ACTIVE && (
                      <ActionBtn color={T.accent} disabled={isLoading}
                        onClick={(e) => { e.stopPropagation(); handleStateChange(entity.id, ENTITY_STATES.ACTIVE); }}>
                        <Play size={11} strokeWidth={2.5} /> Activer
                      </ActionBtn>
                    )}
                    {state === ENTITY_STATES.ACTIVE && (
                      <ActionBtn color={T.gold} disabled={isLoading}
                        onClick={(e) => { e.stopPropagation(); handleStateChange(entity.id, ENTITY_STATES.SUSPENDED); }}>
                        <Pause size={11} strokeWidth={2.5} /> Suspendre
                      </ActionBtn>
                    )}
                    <ActionBtn color={T.blue} disabled={isLoading}
                      onClick={(e) => { e.stopPropagation(); setShowEditModal(entity); }}>
                      <Edit3 size={11} strokeWidth={2.5} /> Éditer
                    </ActionBtn>
                    <ActionBtn color={T.muted} disabled={isLoading}
                      onClick={(e) => { e.stopPropagation(); handleStateChange(entity.id, ENTITY_STATES.ARCHIVED); }}>
                      <Archive size={11} strokeWidth={2.5} /> Archiver
                    </ActionBtn>
                    <ActionBtn color={T.red} disabled={isLoading}
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(entity); }}>
                      <Trash2 size={11} strokeWidth={2.5} /> Supprimer
                    </ActionBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Entity Detail Panel (right drawer, shown on selection) ──────── */}
      {selectedEntity && (
        <div style={{
          width: 320, flexShrink: 0, marginLeft: 20,
          background: T.card, borderRadius: 16,
          border: `1px solid ${selectedEntity.color}33`,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
          maxHeight: '80vh', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{selectedEntity.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{selectedEntity.name}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{selectedEntity.industry}</div>
            </div>
          </div>

          <InfoRow label="Type" value={selectedEntity.type} />
          <InfoRow label="Pays" value={selectedEntity.country || 'CI'} />
          <InfoRow label="Devise" value={selectedEntity.currency} />
          <InfoRow label="Licence" value={LICENSE_PLANS[selectedLicense?.planId]?.name || '—'} />
          <InfoRow label="Utilisateurs" value={fmt(selectedLicense?.userCount || 0)} />

          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Modules activés</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(selectedEntity.modules || []).map(m => {
                const mod = ALL_MODULES.find(a => a.id === m);
                return mod ? (
                  <span key={m} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 20,
                    background: `${selectedEntity.color}15`,
                    color: selectedEntity.color,
                  }}>
                    {mod.icon} {mod.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          <button
            onClick={() => {
              // Navigate to LicenseCenter tab with this entity pre-selected
              window.dispatchEvent(new CustomEvent('holding:navigate', { detail: { tab: 'licenses' } }));
            }}
            style={{
              padding: '10px', borderRadius: 10,
              background: `${T.accent}18`, border: `1px solid ${T.accent}33`,
              color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <Key size={14} strokeWidth={2} /> Gérer la licence
          </button>
          <button
            onClick={() => setShowEditModal(selectedEntity)}
            style={{
              padding: '10px', borderRadius: 10,
              background: `${T.blue}18`, border: `1px solid ${T.blue}33`,
              color: T.blue, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <Edit3 size={14} strokeWidth={2} /> Modifier l'entité
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL (soft delete sécurisé)
          ════════════════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 20, border: `1px solid ${T.red}44`,
            width: '100%', maxWidth: 480, padding: 32,
            boxShadow: '0 24px 80px rgba(239, 68, 68, 0.12)',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: `${T.red}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Trash2 size={22} strokeWidth={1.75} style={{ color: T.red }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 6 }}>
                  Supprimer l'entité ?
                </div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                  <strong style={{ color: T.text }}>{showDeleteConfirm.name}</strong> sera archivée
                  (soft delete). Sa licence sera désactivée, ses accès révoqués et ses données
                  conservées 30 jours pour restauration. La suppression définitive est irréversible
                  et réservée au SUPER_ADMIN.
                </div>
              </div>
            </div>
            <div style={{
              padding: 14, borderRadius: 10, background: `${T.gold}10`,
              border: `1px solid ${T.gold}33`, fontSize: 12, color: T.muted, marginBottom: 20,
            }}>
              <AlertTriangle size={13} style={{ color: T.gold, marginRight: 6, verticalAlign: 'middle' }} />
              Cette action désactivera <strong>{showDeleteConfirm.modules?.length || 0} modules</strong>,
              {' '}révoquera tous les accès utilisateurs et enregistrera un log d'audit horodaté.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: T.dim, border: 'none', color: T.muted,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                Annuler
              </button>
              <button
                onClick={() => handleDeleteEntity(showDeleteConfirm)}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: T.red, border: 'none', color: '#fff',
                  fontWeight: 800, fontSize: 13, cursor: deleteLoading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: deleteLoading ? 0.7 : 1,
                }}>
                {deleteLoading
                  ? 'Suppression...'
                  : <><Trash2 size={14} strokeWidth={2.5} /> Confirmer la suppression</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          EDIT ENTITY MODAL (ouverture rapide — formulaire identité)
          ════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`,
            width: '100%', maxWidth: 560, padding: 32,
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
                Modifier — {showEditModal.name}
              </div>
              <button onClick={() => setShowEditModal(null)} style={{
                background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center',
              }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FieldGroup label="Nom de l'entité" colSpan={2}>
                <WizardInput value={showEditModal.name} onChange={() => {}} placeholder="Nom" />
              </FieldGroup>
              <FieldGroup label="Secteur d'activité">
                <WizardSelect value={showEditModal.industry} onChange={() => {}} options={INDUSTRIES} />
              </FieldGroup>
              <FieldGroup label="Pays">
                <WizardSelect value={showEditModal.country || "Côte d'Ivoire"} onChange={() => {}} options={COUNTRIES} />
              </FieldGroup>
            </div>
            <div style={{
              marginTop: 20, padding: 14, borderRadius: 10,
              background: `${T.blue}08`, border: `1px solid ${T.blue}22`,
              fontSize: 12, color: T.muted,
            }}>
              La modification complète des entités (modules, licences, directeur) est disponible
              via le workflow de gouvernance Holding pour traçabilité audit.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowEditModal(null)} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: T.dim, border: 'none', color: T.muted,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Fermer
              </button>
              <button onClick={() => setShowEditModal(null)} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: T.accent, border: 'none', color: '#fff',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CheckCircle2 size={14} strokeWidth={2.5} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CREATION WIZARD MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 20,
            border: `1px solid ${T.border}`,
            width: '100%', maxWidth: 760,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.15)',
          }}>
            {/* Wizard header */}
            <div style={{
              padding: '20px 28px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: T.surface, zIndex: 10,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
 Créer une entité groupe
 </div>
              <button onClick={() => { setShowWizard(false); setStep(0); }} style={{
                background: 'none', border: 'none', color: T.muted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4,
              }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', padding: '16px 28px', gap: 4 }}>
              {WIZARD_STEPS.map((s, i) => (
                <div key={s.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 50, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < step ? T.accent : i === step ? `${T.accent}30` : T.dim,
                    border: `2px solid ${i <= step ? T.accent : T.border}`,
                    fontSize: 11,
                    color: i < step ? '#fff' : i === step ? T.accent : T.muted,
                    fontWeight: 800,
                  }}>
                    {i < step ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}
                  </div>
                  <div style={{
                    fontSize: 11, color: i <= step ? T.text : T.muted,
                    fontWeight: i === step ? 700 : 400,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {(() => { const StepIcon = WIZARD_ICONS[s.id]; return <StepIcon size={11} strokeWidth={2} />; })()}
                    <span>{s.label}</span>
                  </div>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < step ? T.accent : T.dim, borderRadius: 2 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div style={{ padding: '8px 28px 28px' }}>
              {step === 0 && <StepType wizard={wizard} onChange={handleWizardChange} />}
              {step === 1 && <StepIdentity wizard={wizard} onChange={handleWizardChange} />}
              {step === 2 && <StepModules wizard={wizard} onToggle={handleModuleToggle} />}
              {step === 3 && <StepLicense wizard={wizard} onChange={handleWizardChange} />}
              {step === 4 && <StepDirector wizard={wizard} onChange={(key, val) =>
                handleWizardChange('director', { ...wizard.director, [key]: val })} />}
              {step === 5 && (
                <StepReview
                  wizard={wizard}
                  provisioning={provisioning}
                  onProvision={handleProvisioning}
                />
              )}
            </div>

            {/* Navigation */}
            {step < 5 && (
              <div style={{
                padding: '16px 28px', borderTop: `1px solid ${T.border}`,
                display: 'flex', justifyContent: 'space-between',
                position: 'sticky', bottom: 0, background: T.surface,
              }}>
                <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{
                  padding: '10px 24px', borderRadius: 10,
                  background: T.dim, border: 'none', color: T.muted,
                  fontWeight: 700, fontSize: 13, cursor: step === 0 ? 'not-allowed' : 'pointer',
                  opacity: step === 0 ? 0.4 : 1,
                }}
                  disabled={step === 0}>
                  ← Précédent
                </button>
                <button onClick={() => setStep(s => Math.min(5, s + 1))} style={{
                  padding: '10px 28px', borderRadius: 10,
                  background: T.accent, border: 'none', color: '#000',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer',
                }}>
                  {step === 4 ? 'Récapitulatif →' : 'Suivant →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wizard Step Components ────────────────────────────────────────────────────

function StepType({ wizard, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
        Quel type d&apos;entité souhaitez-vous créer ?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          {
            type: ENTITY_TYPES.SUBSIDIARY,
            Icon: Building2, title: 'Filiale',
            desc: 'Société opérationnelle — CRM, Ventes, Production, Finance, RH...',
            color: '#3B82F6',
            examples: 'IPC Green Blocks, Nexus Academy, Hôtel Sana...',
          },
          {
            type: ENTITY_TYPES.FOUNDATION,
            Icon: Heart, title: 'Foundation',
            desc: 'Entité non-lucrative — Impact social, Dons, ESG, Programmes...',
            color: '#8B5CF6',
            examples: 'IPC Foundation, IPC Social...',
          },
        ].map(opt => (
          <div key={opt.type} onClick={() => onChange('type', opt.type)} style={{
            padding: 24, borderRadius: 16, cursor: 'pointer',
            border: `2px solid ${wizard.type === opt.type ? opt.color : T.border}`,
            background: wizard.type === opt.type ? `${opt.color}10` : T.card,
            transition: 'all .15s',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, marginBottom: 16,
              background: `${opt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <opt.Icon size={28} strokeWidth={1.75} style={{ color: opt.color }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>{opt.title}</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>{opt.desc}</div>
            <div style={{ fontSize: 11, color: opt.color, fontStyle: 'italic' }}>ex: {opt.examples}</div>
            {wizard.type === opt.type && (
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: opt.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} strokeWidth={2.5} /> Sélectionné
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepIdentity({ wizard, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Identité de l&apos;entité</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FieldGroup label="Nom de l'entité *" colSpan={2}>
          <WizardInput value={wizard.name} onChange={v => onChange('name', v)} placeholder="ex: IPC Green Blocks SAS" />
        </FieldGroup>
        <FieldGroup label="Secteur d'activité *">
          <WizardSelect value={wizard.industry} onChange={v => onChange('industry', v)} options={INDUSTRIES} />
        </FieldGroup>
        <FieldGroup label="Pays">
          <WizardSelect value={wizard.country} onChange={v => onChange('country', v)} options={COUNTRIES} />
        </FieldGroup>
        <FieldGroup label="Devise">
          <WizardSelect value={wizard.currency} onChange={v => onChange('currency', v)} options={CURRENCIES} />
        </FieldGroup>
        <FieldGroup label="Niveau d'autonomie">
          <WizardSelect
            value={wizard.autonomyLevel}
            onChange={v => onChange('autonomyLevel', v)}
            options={AUTONOMY_LEVELS.map(a => a.label)}
            valueMap={AUTONOMY_LEVELS.reduce((acc, a) => { acc[a.label] = a.id; return acc; }, {})}
          />
        </FieldGroup>
      </div>
      <div style={{ padding: 14, borderRadius: 10, background: `${T.blue}10`, border: `1px solid ${T.blue}33`, fontSize: 12, color: T.muted }}>
 Un identifiant unique sera généré automatiquement à partir du nom.
 </div>
    </div>
  );
}

function StepModules({ wizard, onToggle }) {
  const plan = LICENSE_PLANS[wizard.licensePlanId] || {};
  const planMods = plan.modules?.includes('all') ? ALL_MODULES.map(m => m.id) : (plan.modules || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Modules à activer</div>
        <span style={{ fontSize: 12, color: T.muted }}>{wizard.modules.length} sélectionné(s)</span>
      </div>
      {MODULE_CATEGORIES.map(cat => {
        const catModules = ALL_MODULES.filter(m => m.category === cat &&
          (wizard.type === ENTITY_TYPES.FOUNDATION ? true : !m.id.startsWith('foundation_')));
        if (!catModules.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: 8 }}>
              {cat}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 8 }}>
              {catModules.map(mod => {
                const inPlan = planMods.includes(mod.id);
                const enabled = wizard.modules.includes(mod.id);
                return (
                  <div key={mod.id} onClick={() => onToggle(mod.id)} style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${enabled ? T.accent : T.border}`,
                    background: enabled ? `${T.accent}10` : T.card,
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: !inPlan ? 0.45 : 1,
                    transition: 'all .12s',
                  }}>
                    <span style={{ fontSize: 16 }}>{mod.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: enabled ? 700 : 400, color: enabled ? T.accent : T.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mod.label}
                      </div>
                      {!inPlan && <div style={{ fontSize: 10, color: T.muted }}>hors plan</div>}
                    </div>
                    {enabled && <CheckCircle2 size={15} strokeWidth={2.5} style={{ color: T.accent, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepLicense({ wizard, onChange }) {
  const plansForType = wizard.type === ENTITY_TYPES.FOUNDATION
    ? [LICENSE_PLAN_IDS.FOUNDATION, LICENSE_PLAN_IDS.TRIAL]
    : [LICENSE_PLAN_IDS.STARTER, LICENSE_PLAN_IDS.BUSINESS, LICENSE_PLAN_IDS.ENTERPRISE,
       LICENSE_PLAN_IDS.INDUSTRIAL, LICENSE_PLAN_IDS.ACADEMY, LICENSE_PLAN_IDS.TRIAL];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Attribuer une licence</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
        {plansForType.map(planId => {
          const plan = LICENSE_PLANS[planId];
          const selected = wizard.licensePlanId === planId;
          return (
            <div key={planId} onClick={() => onChange('licensePlanId', planId)} style={{
              padding: 18, borderRadius: 14, cursor: 'pointer',
              border: `2px solid ${selected ? plan.color : T.border}`,
              background: selected ? `${plan.color}10` : T.card, transition: 'all .15s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{plan.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: plan.color }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: T.muted, margin: '4px 0 10px' }}>{plan.description}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  `${plan.maxUsers === -1 ? '∞' : plan.maxUsers} utilisateurs`,
                  `${plan.maxProjects === -1 ? '∞' : plan.maxProjects} projets`,
                  `${plan.aiTokensMonthly === -1 ? '∞' : (plan.aiTokensMonthly/1000)+'k'} tokens IA/mois`,
                ].map(item => (
                  <div key={item} style={{ fontSize: 11, color: T.muted }}>{item}</div>
                ))}
              </div>
              {selected && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: plan.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={13} strokeWidth={2.5} /> Sélectionné
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDirector({ wizard, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Directeur de l&apos;entité</div>
      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
        Le directeur recevra une invitation par email, un accès sécurisé et un onboarding guidé pour configurer son organisation.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FieldGroup label="Prénom *">
          <WizardInput value={wizard.director.prenom} onChange={v => onChange('prenom', v)} placeholder="Jean" />
        </FieldGroup>
        <FieldGroup label="Nom *">
          <WizardInput value={wizard.director.nom} onChange={v => onChange('nom', v)} placeholder="Kouassi" />
        </FieldGroup>
        <FieldGroup label="Email professionnel *" colSpan={2}>
          <WizardInput value={wizard.director.email} onChange={v => onChange('email', v)} placeholder="directeur@ipc-group.ci" type="email" />
        </FieldGroup>
      </div>
      <div style={{ padding: 14, borderRadius: 10, background: `${T.accent}08`, border: `1px solid ${T.accent}22`, fontSize: 12, color: T.muted }}>
 Un email d&apos;invitation sera envoyé avec les instructions d&apos;activation et un lien sécurisé d&apos;onboarding.
 </div>
    </div>
  );
}

function StepReview({ wizard, provisioning, onProvision }) {
  const plan = LICENSE_PLANS[wizard.licensePlanId];
  const isLoading = provisioning === 'loading';
  const isDone = provisioning === 'done';
  const isError = provisioning === 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Récapitulatif & Provisioning</div>

      {/* Summary */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Type', value: `${wizard.type === ENTITY_TYPES.SUBSIDIARY ? 'Filiale' : 'Foundation'}` },
          { label: 'Nom', value: wizard.name || '—' },
          { label: 'Secteur', value: wizard.industry || '—' },
          { label: 'Pays', value: wizard.country },
          { label: 'Devise', value: wizard.currency },
          { label: 'Licence', value: `${plan?.icon} ${plan?.name}` },
          { label: 'Modules', value: `${wizard.modules.length} modules sélectionnés` },
          { label: 'Directeur', value: `${wizard.director.prenom} ${wizard.director.nom} — ${wizard.director.email}` },
          { label: 'Autonomie', value: AUTONOMY_LEVELS.find(a => a.id === wizard.autonomyLevel)?.label || '—' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Provisioning steps list */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>
          Le système va automatiquement :
        </div>
        {[
          'Créer la structure organisationnelle (company_id, scopes, branches)',
          `Activer ${wizard.modules.length} modules ERP`,
          'Provisionner les permissions et rôles par défaut',
          'Créer les workflows de validation',
          'Initialiser l\'espace Connect Plus (social interne)',
          `Appliquer la licence ${plan?.name} avec ses quotas`,
          `Envoyer l'invitation directeur à ${wizard.director.email}`,
          'Générer le tableau de bord onboarding directeur',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
            borderBottom: i < 7 ? `1px solid ${T.border}22` : 'none' }}>
            <span style={{
              width: 20, height: 20, borderRadius: 50, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDone ? `${T.accent}20` : isLoading ? `${T.blue}20` : `${T.muted}20`,
              color: isDone ? T.accent : isLoading ? T.blue : T.muted,
            }}>
              {isDone ? <CheckCircle2 size={12} strokeWidth={2.5} /> : isLoading ? '⋯' : i + 1}
            </span>
            <span style={{ fontSize: 13, color: T.muted }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      {!isDone && !isLoading && (
        <button onClick={onProvision} style={{
          padding: '14px', borderRadius: 12,
          background: T.accent, border: 'none', cursor: 'pointer',
          color: '#fff', fontWeight: 800, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Zap size={16} strokeWidth={2.5} /> Lancer le provisioning
        </button>
      )}
      {isLoading && (
        <div style={{ padding: 14, borderRadius: 12, background: `${T.blue}15`,
          border: `1px solid ${T.blue}33`, textAlign: 'center', fontSize: 13, color: T.blue, fontWeight: 700 }}>
 Provisioning en cours... Veuillez patienter.
 </div>
      )}
      {isDone && (
        <div style={{ padding: 14, borderRadius: 12, background: `${T.accent}15`,
          border: `1px solid ${T.accent}33`, fontSize: 13, color: T.accent, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CheckCircle2 size={16} strokeWidth={2.5} /> Entité créée ! Invitation envoyée à {wizard.director.email}.
        </div>
 )}
 {isError && (
 <div style={{ padding: 14, borderRadius: 12, background:`${T.red}15`,
          border: `1px solid ${T.red}33`, textAlign: 'center', fontSize: 13, color: T.red, fontWeight: 700 }}>
 Erreur de provisioning. Vérifiez les données et réessayez.
 </div>
      )}
    </div>
  );
}

// ── Reusable form sub-components ──────────────────────────────────────────────

function FieldGroup({ label, children, colSpan }) {
  return (
    <div style={{ gridColumn: colSpan === 2 ? 'span 2' : 'auto' }}>
      <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function WizardInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
        background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, outline: 'none',
      }}
    />
  );
}

function WizardSelect({ value, onChange, options, valueMap }) {
  return (
    <select value={value} onChange={e => onChange(valueMap ? valueMap[e.target.value] : e.target.value)}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
        background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, outline: 'none',
        cursor: 'pointer',
      }}>
      {options.map(opt => (
        <option key={opt} value={valueMap ? valueMap[opt] : opt}>{opt}</option>
      ))}
    </select>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 8, borderBottom: `1px solid ${T.border}22` }}>
      <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value}</span>
    </div>
  );
}

function ActionBtn({ children, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 12px', borderRadius: 8, border: 'none', cursor: disabled ? 'wait' : 'pointer',
      background: `${color}15`, color, fontWeight: 700, fontSize: 11,
      opacity: disabled ? 0.6 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {children}
    </button>
  );
}
