import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Target } from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const VictoryHeartbeat = () => {
  const { data } = useBusiness();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Derive feed from data
  const feed = useMemo(() => {
    const items = [];
    
    // Won Deals
    const wonDeals = (data.crm?.opportunities || []).filter(o => o.status === 'Gagnée');
    wonDeals.forEach(d => items.push({
      id: `deal_${d.id}`,
      type: 'deal',
      icon: <TrendingUp color="#3B82F6" />,
      title: 'Nouveau Deal Fermé !',
      desc: `${d.assignee || 'Un collaborateur'} vient de signer avec ${d.nom} pour ${(d.valeur || 0).toLocaleString()} F !`
    }));

    // Completed Work Orders
    const doneOrders = (data.production?.workOrders || []).filter(w => w.statut === 'Terminé');
    doneOrders.forEach(w => items.push({
      id: `wo_${w.id}`,
      type: 'prod',
      icon: <Zap color="#F59E0B" />,
      title: 'Ligne de Prod Terminée',
      desc: `L'ordre #${w.num} (${w.produit}) est expédié avec succès.`
    }));

    // If feed is empty, add a placeholder
    if (items.length === 0) {
      items.push({
        id: 'empty',
        icon: <Target color="#10B981" />,
        title: "Prêt pour l'Action",
        desc: "En attente des prochains succès de l'équipe."
      });
    }

    // Shuffle array loosely or sort by random to make it look alive
    return items.sort(() => Math.random() - 0.5);
  }, [data]);

  useEffect(() => {
    if (feed.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % feed.length);
    }, 6000); // cycle every 6 seconds
    return () => clearInterval(interval);
  }, [feed.length]);

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
        <Trophy size={14} /> Mur des Victoires
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {feed[currentIndex].icon}
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', fontWeight: 800 }}>{feed[currentIndex].title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{feed[currentIndex].desc}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VictoryHeartbeat;
