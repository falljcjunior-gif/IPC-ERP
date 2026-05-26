/**
 * OnboardingWizard — Première connexion guidée par rôle
 *
 * Déclenché par PlatformShell quand currentUser.onboardingCompleted !== true.
 * Marque onboardingCompleted: true dans Firestore /users/{uid} à la fin.
 * Peut être ignoré (skip) : ne réapparaît pas (stocké en localStorage).
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ChevronRight, ChevronLeft, Sparkles, Users,
  BarChart3, Building2, FileText, Settings, Rocket, X, Shield,
  TrendingUp, Zap, Globe, Heart, ShoppingCart
} from 'lucide-react';
import { FirestoreService } from '../services/firestore.service';
import { useStore } from '../store';
import { useToastStore } from '../store/useToastStore';
import logger from '../utils/logger';

// ── Steps par rôle ─────────────────────────────────────────────────────────────
const STEPS_BY_ROLE = {
  SUPER_ADMIN: [
    {
      id: 'welcome',
      icon: <Sparkles size={32} color="#6366F1" />,
      title: 'Bienvenue sur IPC ERP',
      subtitle: "Votre plateforme de gestion d'entreprise — prête en quelques minutes.",
      description: "En tant que Super Administrateur, vous avez accès à toutes les fonctionnalités du groupe. Suivez ce guide rapide pour configurer l'espace de travail.",
      action: null,
    },
    {
      id: 'holding',
      icon: <Globe size={32} color="#0EA5E9" />,
      title: 'Structure du Groupe',
      subtitle: 'Configurez votre holding et vos entités.',
      description: "Le module Holding (accessible via la barre latérale) vous permet de gérer les filiales, fondations et licences. Créez vos premières entités depuis l'espace Holding.",
      checklist: [
        'Accéder au module Holding',
        'Créer la première entité filiale',
        'Assigner les licences modules',
      ],
      action: null,
    },
    {
      id: 'team',
      icon: <Users size={32} color="#10B981" />,
      title: 'Inviter votre équipe',
      subtitle: 'Les comptes sont créés via le module RH.',
      description: "Dans le module Ressources Humaines → onglet Annuaire, créez les fiches employés. Le module Admin → Permissions gère les rôles d'accès.",
      checklist: [
        'Créer les fiches employés (module RH)',
        'Attribuer les rôles (Admin → Permissions)',
        'Activer l\'authentification 2FA recommandée',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <Rocket size={32} color="#F59E0B" />,
      title: 'Vous êtes prêt·e !',
      subtitle: 'IPC ERP est opérationnel.',
      description: 'Explorez le tableau de bord global pour avoir une vue consolidée. L\'assistant IA JARVIS (icône ✦ en bas) est disponible pour vous guider à tout moment.',
      action: null,
    },
  ],

  ADMIN: [
    {
      id: 'welcome',
      icon: <Sparkles size={32} color="#6366F1" />,
      title: 'Bienvenue sur IPC ERP',
      subtitle: 'Votre espace de gestion est prêt.',
      description: 'Ce guide rapide vous présente les étapes essentielles pour démarrer. Vous pouvez le quitter à tout moment et y revenir depuis les paramètres.',
      action: null,
    },
    {
      id: 'modules',
      icon: <Settings size={32} color="#8B5CF6" />,
      title: 'Modules clés',
      subtitle: "L'ERP est modulaire — activez ce dont vous avez besoin.",
      description: "Naviguez dans la barre latérale pour découvrir les modules. Chaque module dispose d'un guide contextuel (icône en haut à droite).",
      checklist: [
        'Finance & Comptabilité — Facturation, trésorerie, immobilisations',
        'Ressources Humaines — Employés, paie, congés',
        'Ventes & CRM — Devis, factures, clients',
        'Production — Ordres de fabrication, OEE',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <Rocket size={32} color="#F59E0B" />,
      title: 'Vous êtes prêt·e !',
      subtitle: 'Bienvenue à bord.',
      description: "Le tableau de bord global est votre point d'entrée. JARVIS (✦) peut répondre à vos questions et générer des rapports à la demande.",
      action: null,
    },
  ],

  FINANCE: [
    {
      id: 'welcome',
      icon: <BarChart3 size={32} color="#0EA5E9" />,
      title: 'Module Finance',
      subtitle: 'Votre espace comptabilité & reporting.',
      description: "Bienvenue dans l'espace Finance d'IPC ERP. Les modules Finance, Comptabilité, Immobilisations et Business Intelligence sont à votre disposition.",
      action: null,
    },
    {
      id: 'setup',
      icon: <Building2 size={32} color="#6366F1" />,
      title: "Configurer l'exercice fiscal",
      subtitle: 'Essentiel avant toute saisie.',
      description: "Dans Finance → Paramètres, vérifiez les dates d'exercice et la devise. Les immobilisations se paramètrent dans le module dédié (barre latérale → Immobilisations).",
      checklist: [
        'Vérifier les dates d\'exercice fiscal',
        'Configurer le plan comptable (PCG ou personnalisé)',
        'Créer les premiers journaux comptables',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <TrendingUp size={32} color="#10B981" />,
      title: 'Finance opérationnelle',
      subtitle: 'Vous pouvez démarrer la saisie.',
      description: "Le tableau de bord Finance synthétise CA, trésorerie et EBITDA en temps réel. Les rapports PDF s'exportent depuis chaque module.",
      action: null,
    },
  ],

  HR: [
    {
      id: 'welcome',
      icon: <Heart size={32} color="#EC4899" />,
      title: 'Module RH',
      subtitle: 'Gérez vos équipes efficacement.',
      description: "Le module Ressources Humaines couvre le recrutement, la gestion des présences, la paie et l'onboarding employé. Commençons.",
      action: null,
    },
    {
      id: 'setup',
      icon: <Users size={32} color="#8B5CF6" />,
      title: 'Première configuration',
      subtitle: 'Trois éléments à mettre en place.',
      description: "Ces éléments structurants sont nécessaires avant d'ajouter des employés. Vous les trouverez dans le module RH → Paramètres.",
      checklist: [
        'Créer les départements de l\'entreprise',
        'Configurer les politiques de congés',
        'Importer ou créer les fiches employés',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <Sparkles size={32} color="#F59E0B" />,
      title: 'RH opérationnel',
      subtitle: 'Vos équipes peuvent se connecter.',
      description: "Le portail Staff permet à chaque employé d'accéder à ses documents, congés et fiches de paie. Les managers reçoivent les alertes en temps réel.",
      action: null,
    },
  ],

  SALES: [
    {
      id: 'welcome',
      icon: <ShoppingCart size={32} color="#10B981" />,
      title: 'Module Ventes & CRM',
      subtitle: 'Gérez votre pipeline commercial.',
      description: 'Devis, factures, clients, relances automatiques — tout est centralisé. Démarrons la configuration de votre espace commercial.',
      action: null,
    },
    {
      id: 'setup',
      icon: <TrendingUp size={32} color="#6366F1" />,
      title: 'Votre pipeline',
      subtitle: 'Configurez les étapes de vente.',
      description: "Dans CRM → Paramètres, personnalisez les étapes de votre pipeline (Prospect, Qualification, Proposition, Négociation, Gagné). Les devis s'envoient directement par e-mail.",
      checklist: [
        'Personnaliser les étapes du pipeline',
        'Créer votre première fiche client',
        'Émettre un premier devis',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <Zap size={32} color="#F59E0B" />,
      title: 'Pipeline actif !',
      subtitle: 'Vos opportunités sont suivies en temps réel.',
      description: "Le moteur RFM analyse automatiquement vos clients. Les relances de devis s'envoient sans intervention manuelle.",
      action: null,
    },
  ],

  STAFF: [
    {
      id: 'welcome',
      icon: <Sparkles size={32} color="#6366F1" />,
      title: "Bienvenue dans l'équipe",
      subtitle: 'Votre espace personnel est prêt.',
      description: 'IPC ERP est la plateforme de travail de votre entreprise. Voici un aperçu rapide de ce qui est disponible pour vous.',
      action: null,
    },
    {
      id: 'profile',
      icon: <Shield size={32} color="#10B981" />,
      title: 'Votre espace',
      subtitle: 'Accès rapide à vos outils quotidiens.',
      description: "Via l'icône Mon Espace, accédez à vos documents, fiches de paie, congés et pointages. Le module Connect regroupe la messagerie et les appels vidéo.",
      checklist: [
        'Compléter votre profil (photo, contact)',
        'Vérifier vos informations de paie',
        'Explorer le module Connect (messagerie)',
      ],
      action: null,
    },
    {
      id: 'done',
      icon: <Rocket size={32} color="#F59E0B" />,
      title: 'Vous êtes opérationnel·le !',
      subtitle: 'Bonne prise en main.',
      description: 'En cas de question, JARVIS (✦ en bas à droite) peut vous guider. Votre responsable RH est votre contact principal pour toute demande.',
      action: null,
    },
  ],
};

// Fallback générique
STEPS_BY_ROLE.LEGAL   = STEPS_BY_ROLE.ADMIN;
STEPS_BY_ROLE.MANAGER = STEPS_BY_ROLE.ADMIN;
STEPS_BY_ROLE.GUEST   = STEPS_BY_ROLE.STAFF;

// ── Composant principal ────────────────────────────────────────────────────────
const OnboardingWizard = ({ onComplete }) => {
  const currentUser = useStore(s => s.currentUser);
  const { addToast } = useToastStore();

  const role = currentUser?.role || 'STAFF';
  const steps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE.STAFF;

  const [stepIdx, setStepIdx] = useState(0);
  const [completing, setCompleting] = useState(false);

  const step = steps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === steps.length - 1;
  const progress = (stepIdx / (steps.length - 1)) * 100;

  const markDone = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      if (currentUser?.id && currentUser.id !== 'guest') {
        await FirestoreService.updateDocument('users', currentUser.id, { onboardingCompleted: true });
        // Also update local store
        useStore.getState().setUser({ ...currentUser, onboardingCompleted: true });
      }
    } catch (err) {
      logger.warn('[Onboarding] Could not persist completion:', err.message);
    } finally {
      // Store in localStorage as fallback
      try { localStorage.setItem(`ipc_onboarded_${currentUser?.id}`, '1'); } catch {}
      onComplete?.();
    }
  }, [currentUser, completing, onComplete]);

  const handleSkip = useCallback(async () => {
    // Skip: store in localStorage only (will not reappear this session, but may next)
    try { localStorage.setItem(`ipc_onboarded_${currentUser?.id}`, '1'); } catch {}
    onComplete?.();
  }, [currentUser, onComplete]);

  const handleNext = useCallback(() => {
    if (isLast) markDone();
    else setStepIdx(i => i + 1);
  }, [isLast, markDone]);

  const handleBack = useCallback(() => {
    if (!isFirst) setStepIdx(i => i - 1);
  }, [isFirst]);

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          key="onboarding-card"
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            width: '100%', maxWidth: '520px',
            background: 'var(--surface, #1C1C1E)',
            borderRadius: '20px',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Progress bar */}
          <div style={{ height: '3px', background: 'var(--border, rgba(255,255,255,0.08))' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
            />
          </div>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            aria-label="Ignorer l'assistant de démarrage"
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted, #6B7280)', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '44px', minHeight: '44px',
            }}
          >
            <X size={18} />
          </button>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ padding: '2rem 2rem 1.5rem' }}
            >
              {/* Step counter */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #6B7280)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>
                Étape {stepIdx + 1} / {steps.length}
              </div>

              {/* Icon */}
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {step.icon}
              </div>

              {/* Title */}
              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text, #F9FAFB)', letterSpacing: '-0.03em' }}>
                {step.title}
              </h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, color: '#6366F1' }}>
                {step.subtitle}
              </p>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: 'var(--text-muted, #9CA3AF)', lineHeight: 1.6 }}>
                {step.description}
              </p>

              {/* Checklist */}
              {step.checklist && (
                <ul style={{ margin: '0 0 1.5rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {step.checklist.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text, #E5E7EB)' }}>
                      <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {/* Dots */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ width: i === stepIdx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === stepIdx ? '#6366F1' : 'var(--border, rgba(255,255,255,0.12))', transition: 'all 0.3s' }} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ padding: '0 2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleBack}
              disabled={isFirst}
              aria-label="Étape précédente"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.2rem', borderRadius: '10px',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                background: 'transparent', color: isFirst ? 'var(--text-muted)' : 'var(--text, #E5E7EB)',
                cursor: isFirst ? 'not-allowed' : 'pointer',
                opacity: isFirst ? 0.4 : 1, fontWeight: 600, fontSize: '0.85rem',
                minHeight: '44px',
              }}
            >
              <ChevronLeft size={16} /> Retour
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              disabled={completing}
              aria-label={isLast ? 'Terminer la configuration' : 'Étape suivante'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.5rem', borderRadius: '10px',
                background: isLast ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#6366F1',
                color: 'white', border: 'none', cursor: completing ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: '0.9rem', minHeight: '44px',
                boxShadow: isLast ? '0 8px 20px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {completing ? 'En cours…' : isLast ? 'C\'est parti !' : 'Suivant'}
              {!completing && <ChevronRight size={16} />}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingWizard;
