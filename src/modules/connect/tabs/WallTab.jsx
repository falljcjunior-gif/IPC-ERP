import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Megaphone, Target, Star, 
  MessageCircle, Heart, Share2, Plus,
  ShieldCheck, TrendingUp, Sparkles, Building2,
  Users2, HeartHandshake, Zap
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const WallTab = ({ data, currentUser }) => {
  // Mocking internal announcements & successes for high-fidelity preview
  const feed = [
    {
      id: 1, type: 'success', category: 'Sales',
      title: "Contrat Signé : Nouveau Partenariat Logistique !",
      content: "L'équipe Growth vient de finaliser un accord majeur avec Global Shipping Co. Félicitations à toute l'équipe pour ce jalon !",
      author: "Marie Dubois", date: "Il y a 2h", reactions: 24, comments: 5,
      color: "#8B5CF6"
    },
    {
      id: 2, type: 'announcement', category: 'RH',
      title: "Nouveau : Extension de l'Espace Collaboratif",
      content: "Le Hub People annonce l'ouverture du nouvel espace détente dès lundi. Venez découvrir le nouvel aménagement !",
      author: "Service RH", date: "Il y a 5h", reactions: 42, comments: 12,
      color: "#6366F1"
    },
    {
      id: 3, type: 'milestone', category: 'Production',
      title: "Record de Production : 10 000 Unités",
      content: "L'atelier Industrial OS a atteint son pic historique aujourd'hui sans aucun accident. Sécurité et Excellence !",
      author: "Jean Legrand", date: "Hier", reactions: 56, comments: 8,
      color: "#D946EF"
    }
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', gap: '2.5rem' }}>
      
      {/* Main Feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>Le Mur de l'Entreprise</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Célébrez les succès et restez informé des dernières annonces.</p>
           </div>
           <button className="btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', background: '#8B5CF6', borderColor: '#8B5CF6', fontWeight: 900, fontSize: '0.85rem' }}>
              <Plus size={18} /> Partager un Succès
           </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {feed.map(post => (
             <motion.div 
               key={post.id} 
               variants={item}
               whileHover={{ y: -4 }}
               className="glass"
               style={{ padding: '2rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                   <div style={{ padding: '15px', borderRadius: '1.5rem', background: `${post.color}15`, height: 'fit-content', color: post.color }}>
                      {post.type === 'success' ? <Trophy size={28} /> : post.type === 'announcement' ? <Megaphone size={28} /> : <Target size={28} />}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                         <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: post.color, letterSpacing: '1px' }}>{post.category}</span>
                            <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>{post.title}</h4>
                         </div>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{post.date}</span>
                      </div>
                      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>{post.content}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                         <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                               <Heart size={18} /> {post.reactions}
                            </button>
                            <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                               <MessageCircle size={18} /> {post.comments}
                            </button>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{post.author}</div>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                               {post.author[0]}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Sidebar Pulse */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '1.75rem', borderRadius: '2.5rem', background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1.5px' }}>
               <Sparkles size={16} /> Pulsation Sociale
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>+24%</div>
               <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Engagement d'équipe ce mois-ci</div>
               <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '74%', height: '100%', background: 'white' }} />
               </div>
            </div>
         </motion.div>

         <motion.div variants={item} className="glass" style={{ padding: '1.75rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', fontWeight: 900, fontSize: '0.9rem' }}>En Direct : Key Indicators</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {[
                 { label: 'Taux Satisfaction', value: '4.8/5', icon: <HeartHandshake size={16} color="#8B5CF6"/> },
                 { label: 'Bien-être Social', value: 'Élevé', icon: <Zap size={16} color="#F59E0B"/> },
                 { label: 'Connectivité', value: 'Strong', icon: <ShieldCheck size={16} color="#10B981"/> }
               ].map((stat, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                       {stat.icon} {stat.label}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>{stat.value}</div>
                 </div>
               ))}
            </div>
         </motion.div>
      </div>

    </motion.div>
  );
};

export default WallTab;
