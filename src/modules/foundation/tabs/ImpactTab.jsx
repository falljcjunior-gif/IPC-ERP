/**
 * Foundation — Marketing & Impact Storytelling
 * Générateur d'Impact Cards, rapport automatique, chiffres clés
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Download, Share2,
  Leaf, Users, Heart, DollarSign, TrendingUp, Zap,
  Image, FileText, Eye, Copy, RefreshCw, Globe,
} from 'lucide-react';
import SmartButton from '../../../components/SmartButton';
import { useToastStore } from '../../../store/useToastStore';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Impact Cards data ───────────────────────────────────────────
const IMPACT_CARDS = [
  {
    id: 'ic1',
    type: 'environmental',
    title: '🌍 Impact Environnemental',
    stat: '66.3',
    unit: 'tonnes',
    desc: 'de plastique retirées de la nature en 2025',
    sub: 'Équivalent à 3 315 000 bouteilles PET récupérées',
    gradient: 'linear-gradient(135deg, #064E3B, #10B981)',
    accentColor: '#10B981',
    format: 'instagram',
  },
  {
    id: 'ic2',
    type: 'social',
    title: '💜 Femmes Autonomisées',
    stat: '8',
    unit: 'femmes',
    desc: 'ont démarré leur activité grâce à IPC Foundation',
    sub: '"Chaque formation est une vie qui change de trajectoire"',
    gradient: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
    accentColor: '#8B5CF6',
    format: 'instagram',
  },
  {
    id: 'ic3',
    type: 'financial',
    title: '💰 Transparence Financière',
    stat: '4.5M',
    unit: 'FCFA',
    desc: 'investis dans les projets communautaires',
    sub: '100% traçables — audit public disponible',
    gradient: 'linear-gradient(135deg, #1D4ED8, #06B6D4)',
    accentColor: '#06B6D4',
    format: 'linkedin',
  },
  {
    id: 'ic4',
    type: 'solidarity',
    title: '🤝 Indice de Solidarité',
    stat: '14%',
    unit: '',
    desc: 'des revenus du Groupe IPC reversés à la Foundation',
    sub: 'Mondhiro + SHAYNAYAH → Impact direct',
    gradient: 'linear-gradient(135deg, #9D174D, #EC4899)',
    accentColor: '#EC4899',
    format: 'instagram',
  },
];

const RAPPORT_SECTIONS = [
  { icon: Leaf,       title: 'Impact Environnemental', value: '66.3t de plastique recyclé', detail: '3 centres opérationnels, objectif 2025 atteint à 5.5%' },
  { icon: Users,      title: 'Impact Social',          value: '8 bénéficiaires actifs',     detail: '3 femmes en emploi, 1 autonome, 4 en formation' },
  { icon: Heart,      title: 'Formations Validées',    value: '4 certificats délivrés',     detail: 'Couture, Commerce Digital, Maraîchage, Micro-Entreprise' },
  { icon: DollarSign, title: 'Flux Financiers',        value: '4.5M FCFA investis',         detail: '3 subventions actives, 5 projets en cours' },
  { icon: TrendingUp, title: 'Croissance',             value: '+22% bénéficiaires (3m)',     detail: 'Objectif annuel : 50 femmes/jeunes autonomisés' },
  { icon: Globe,      title: 'Partenaires',            value: '3 institutions',              detail: 'ONU Femmes, Fondation Orange CI, ANADER' },
];

// Impact Card preview component
function ImpactCardPreview({ card, isSelected, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -4 }}
      onClick={onClick}
      style={{
        borderRadius: '1.25rem', overflow: 'hidden', cursor: 'pointer',
        border: isSelected ? `2px solid ${card.accentColor}` : '2px solid transparent',
        boxShadow: isSelected ? `0 0 0 3px ${card.accentColor}30` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Card visuelle */}
      <div style={{
        background: card.gradient,
        padding: '1.75rem',
        aspectRatio: card.format === 'instagram' ? '1/1' : '16/9',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* Logo badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            borderRadius: '0.6rem', padding: '4px 10px',
            fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em',
          }}>IPC FOUNDATION</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{card.format.toUpperCase()}</div>
        </div>

        {/* Chiffre clé */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{card.stat}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{card.unit}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>{card.desc}</div>
        </div>

        {/* Sub */}
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 8 }}>
          {card.sub}
        </div>
      </div>
    </motion.div>
  );
}

export default function ImpactTab() {
  const [selectedCard, setSelectedCard] = useState(IMPACT_CARDS[0].id);
  const [activeSection, setActiveSection] = useState('cards'); // 'cards' | 'rapport' | 'preview'
  const [generating, setGenerating] = useState(false);
  const { addToast } = useToastStore();

  const selected = IMPACT_CARDS.find(c => c.id === selectedCard);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(false);
    addToast('Rapport d\'impact généré avec succès — PDF disponible', 'success');
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header Banner */}
      <motion.div variants={fade} className="glass" style={{
        padding: '1.5rem 2rem', borderRadius: '1.5rem',
        background: 'linear-gradient(135deg, #064E3B0D, #10B98108)',
        border: '1px solid #10B98120',
        display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'linear-gradient(135deg,#064E3B,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>Impact Storytelling Engine</div>
          <div style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginTop: 3 }}>
            Transformez les données brutes en preuves d'impact pour vos partenaires, donateurs et réseaux sociaux
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <SmartButton variant="primary" icon={generating ? RefreshCw : Sparkles} onClick={handleGenerate}>
            {generating ? 'Génération…' : 'Générer Rapport IA'}
          </SmartButton>
          <SmartButton variant="secondary" icon={Download} onClick={() => addToast('Export PDF en cours…', 'info')}>Exporter PDF</SmartButton>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fade} style={{
        display: 'flex', background: 'var(--bg-subtle)', padding: '5px',
        borderRadius: '1.25rem', border: '1px solid var(--border)', width: 'fit-content', gap: 4,
      }}>
        {[
          { id: 'cards',   label: '🎨 Impact Cards' },
          { id: 'rapport', label: '📄 Rapport Synthèse' },
          { id: 'preview', label: '👁 Prévisualisation' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: '0.9rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.18s',
              background: activeSection === t.id ? 'var(--accent)' : 'transparent',
              color: activeSection === t.id ? '#fff' : 'var(--text-muted)',
            }}
          >{t.label}</button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* IMPACT CARDS */}
        {activeSection === 'cards' && (
          <motion.div key="cards" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {IMPACT_CARDS.map(card => (
                <ImpactCardPreview
                  key={card.id}
                  card={card}
                  isSelected={selectedCard === card.id}
                  onClick={() => setSelectedCard(card.id)}
                />
              ))}
            </div>

            {/* Panneau d'export pour la card sélectionnée */}
            {selected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}
              >
                <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-light)', fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: selected.accentColor }} />
                  {selected.title} — Options d'Export
                </div>
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Instagram (1080×1080)', icon: Image,    format: 'instagram', color: '#EC4899' },
                    { label: 'LinkedIn (1200×627)',   icon: FileText, format: 'linkedin',  color: '#0A66C2' },
                    { label: 'Rapport PDF',            icon: Download, format: 'pdf',       color: '#6366F1' },
                    { label: 'Copier le texte',        icon: Copy,    format: 'text',      color: '#F59E0B' },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.format}
                        onClick={() => addToast(`Export ${opt.format} de "${selected.title}" en cours…`, 'info')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '0.875rem 1.25rem', borderRadius: '1rem',
                          border: `1.5px solid ${opt.color}30`, background: `${opt.color}08`,
                          color: opt.color, fontWeight: 700, fontSize: '0.82rem',
                          cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}18`; e.currentTarget.style.borderColor = opt.color; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${opt.color}08`; e.currentTarget.style.borderColor = `${opt.color}30`; }}
                      >
                        <Icon size={16} /> {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Eye size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: selected.accentColor }}>{selected.stat} {selected.unit}</strong> — {selected.desc}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* RAPPORT SYNTHÈSE */}
        {activeSection === 'rapport' && (
          <motion.div key="rapport" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}
          >
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #064E3B, #10B981)', color: '#fff' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: 8 }}>
                RAPPORT D'IMPACT — IPC COLLECT FOUNDATION
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Bilan Trimestriel Q2 2025</div>
              <div style={{ fontSize: '0.87rem', opacity: 0.8, marginTop: 4 }}>Période : Avril — Juin 2025 · Généré automatiquement depuis Nexus OS</div>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ padding: '1rem 0' }}>
              {RAPPORT_SECTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={i} variants={fade}
                    style={{ padding: '1rem 1.5rem', borderBottom: i < RAPPORT_SECTIONS.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '0.75rem', background: '#10B98115', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color="#10B981" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.detail}</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#10B981', textAlign: 'right', flexShrink: 0 }}>{s.value}</div>
                  </motion.div>
                );
              })}
            </motion.div>
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.75rem' }}>
              <SmartButton variant="primary" icon={Download} onClick={() => addToast('Rapport PDF généré', 'success')}>Télécharger le Rapport</SmartButton>
              <SmartButton variant="secondary" icon={Share2} onClick={() => addToast('Lien partageable copié', 'info')}>Partager</SmartButton>
            </div>
          </motion.div>
        )}

        {/* PREVIEW RÉSEAUX */}
        {activeSection === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: '1.5rem' }}>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} color="var(--accent)" /> Prévisualisation Réseaux Sociaux
              </div>

              {/* Mockup Post Instagram */}
              <div style={{ maxWidth: 400, margin: '0 auto' }}>
                <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                  {/* Barre profil */}
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#064E3B,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#fff' }}>IPC</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>ipc_foundation_ci</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Abidjan, Côte d'Ivoire</div>
                    </div>
                  </div>
                  {/* Image card */}
                  <div style={{
                    aspectRatio: '1/1', background: IMPACT_CARDS[0].gradient,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    padding: '1.5rem', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>IPC FOUNDATION · 2025</div>
                    <div>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>66.3</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>tonnes</div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>de plastique retirées de la nature</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>Ensemble, on change les choses. 🌿</div>
                  </div>
                  {/* Actions */}
                  <div style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: 8 }}>
                      {['❤️', '💬', '📤', '🔖'].map((emoji, i) => <span key={i} style={{ fontSize: '1.2rem', cursor: 'pointer' }}>{emoji}</span>)}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>1 247 J'aime</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <strong>ipc_foundation_ci</strong> Ensemble, nous prouvons que chaque geste compte. 66 tonnes de plastique retirées de la nature par nos centres de tri. 🌊♻️ #ImpactEnvironnemental #CoteIvoire #PlasticFree
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
