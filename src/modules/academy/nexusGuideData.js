/**
 * ══════════════════════════════════════════════════════════════════
 * NEXUS ACADEMY — BASE DE CONNAISSANCE UTILISATEUR
 * ══════════════════════════════════════════════════════════════════
 *
 * Structure par module :
 *   id          — identifiant unique (= module ID dans le registry)
 *   label       — nom affiché dans la sidenav
 *   icon        — nom lucide-react (string, résolu dans le composant)
 *   color       — couleur accent du module
 *   tagline     — phrase-clé du module
 *   overview    — texte d'introduction
 *   articles[]  — articles pratiques (logic + finality + bullets)
 *   faq[]       — questions / réponses
 *
 * Chaque guide vit dans son propre fichier sous ./guides/ et est
 * agrégé ici. Pour ajouter un guide : créer le fichier puis l'importer.
 */

// ── Lot 1 — Pilotage ──────────────────────────────────────────────
import cockpitGroupe   from './guides/cockpit-groupe';
import cockpitFiliale  from './guides/cockpit-filiale';
import cockpitFondation from './guides/cockpit-fondation';
import academy         from './guides/academy';
import connect         from './guides/connect';

// ── Lot 2 — Commercial ────────────────────────────────────────────
import crm             from './guides/crm';
import sales           from './guides/sales';
import marketing       from './guides/marketing';
import projects        from './guides/projects';
import missions        from './guides/missions';

// ── Lot 3 — Opérations ────────────────────────────────────────────
import inventory       from './guides/inventory';
import shipping        from './guides/shipping';
import production      from './guides/production';
import quality         from './guides/quality';
import fleet           from './guides/fleet';

// ── Lot 4 — Finance ───────────────────────────────────────────────
import finance         from './guides/finance';
import accounting      from './guides/accounting';
import expenses        from './guides/expenses';
import legal           from './guides/legal';
import audit           from './guides/audit';

// ── Lot 5 — RH & Collab ───────────────────────────────────────────
import hr              from './guides/hr';
import talent          from './guides/talent';
import payroll         from './guides/payroll';
import planning        from './guides/planning';
import helpdesk        from './guides/helpdesk';

export const NEXUS_GUIDE_DATA = [
  cockpitGroupe,
  cockpitFiliale,
  cockpitFondation,
  academy,
  connect,
  crm,
  sales,
  marketing,
  projects,
  missions,
  inventory,
  shipping,
  production,
  quality,
  fleet,
  finance,
  accounting,
  expenses,
  legal,
  audit,
  hr,
  talent,
  payroll,
  planning,
  helpdesk,
];

/**
 * Recherche sémantique dans toute la base de connaissance
 * @param {string} query
 * @returns {{ moduleId, articleId, type, title, excerpt, score }[]}
 */
export function searchGuide(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  for (const mod of NEXUS_GUIDE_DATA) {
    // Recherche dans les articles
    for (const article of mod.articles) {
      let score = 0;
      const titleMatch = article.title.toLowerCase().includes(q);
      const logicMatch = article.logic.content.toLowerCase().includes(q);
      const finalityMatch = article.finality.content.toLowerCase().includes(q);
      const bulletMatch = article.logic.bullets?.some(b => b.toLowerCase().includes(q));

      if (titleMatch) score += 10;
      if (logicMatch) score += 5;
      if (finalityMatch) score += 5;
      if (bulletMatch) score += 3;

      if (score > 0) {
        results.push({
          moduleId: mod.id,
          moduleLabel: mod.label,
          articleId: article.id,
          type: 'article',
          title: article.title,
          excerpt: titleMatch
            ? article.logic.content.slice(0, 120) + '…'
            : (logicMatch ? article.logic.content.slice(0, 120) + '…' : article.finality.content.slice(0, 120) + '…'),
          score,
          color: mod.color,
        });
      }
    }

    // Recherche dans les FAQ
    for (const item of mod.faq) {
      let score = 0;
      if (item.q.toLowerCase().includes(q)) score += 8;
      if (item.a.toLowerCase().includes(q)) score += 4;
      if (score > 0) {
        results.push({
          moduleId: mod.id,
          moduleLabel: mod.label,
          articleId: null,
          type: 'faq',
          title: item.q,
          excerpt: item.a.slice(0, 120) + '…',
          score,
          color: mod.color,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
