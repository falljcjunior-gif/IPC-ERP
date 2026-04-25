import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Megaphone, Target, Heart, MessageCircle, Plus,
  Sparkles, Zap, ShieldCheck, HeartHandshake, Send, X, TrendingUp
} from 'lucide-react';
import { useStore } from '../../../store';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const POST_TYPES = [
  { id: 'success', label: 'Succès', icon: <Trophy size={16} />, color: '#8B5CF6' },
  { id: 'announcement', label: 'Annonce', icon: <Megaphone size={16} />, color: '#6366F1' },
  { id: 'milestone', label: 'Jalon', icon: <Target size={16} />, color: '#D946EF' },
];

const INITIAL_FEED = [];

const WallTab = ({ data, currentUser }) => {
  const { addConnectPost, addConnectComment } = useStore();

  // Local feed state so likes update immediately in the UI
  const [feed, setFeed] = useState(() =>
    data?.connect?.posts?.length > 0 ? data.connect.posts : INITIAL_FEED
  );
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ type: 'success', title: '', content: '', category: '' });
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});

  // Sync when new posts are added from context
  React.useEffect(() => {
    if (data?.connect?.posts?.length > 0) {
      setFeed(prev => {
        // Preserve local liked/reactions state for existing posts
        const likedMap = {};
        prev.forEach(p => { likedMap[p.id] = { liked: p.liked, reactions: p.reactions }; });
        return data.connect.posts.map(p => likedMap[p.id] ? { ...p, ...likedMap[p.id] } : p);
      });
    }
  }, [data?.connect?.posts?.length]);

  const handleLike = (id) => {
    setFeed(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, reactions: p.liked ? p.reactions - 1 : p.reactions + 1, liked: !p.liked }
          : p
      )
    );
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const comment = { id: Date.now(), author: currentUser?.nom || 'Moi', text, time: 'À l\'instant' };
    // Update local feed immediately
    setFeed(prev =>
      prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p)
    );
    addConnectComment(postId, comment);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handlePublish = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const typeConf = POST_TYPES.find(t => t.id === form.type);
    const newPost = {
      id: `f${Date.now()}`,
      type: form.type,
      category: form.category || typeConf?.label || 'Général',
      title: form.title,
      content: form.content,
      author: currentUser?.nom || 'Moi',
      authorInit: (currentUser?.nom || 'M')[0],
      color: typeConf?.color || '#8B5CF6',
      date: 'À l\'instant',
      reactions: 0,
      liked: false,
      comments: []
    };
    // Add to local feed immediately
    setFeed(prev => [newPost, ...prev]);
    addConnectPost(newPost);
    setForm({ type: 'success', title: '', content: '', category: '' });
    setShowCompose(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      {/* Main Feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Mur de l'Entreprise</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Célébrez les succès et restez informé.</p>
          </div>
          <button onClick={() => setShowCompose(true)} className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '1rem', background: '#8B5CF6', border: 'none', fontWeight: 800 }}>
            <Plus size={18} /> Partager
          </button>
        </div>

        {/* Compose Modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div initial={{ opacity: 0, height: 0, overflow: 'hidden' }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass" style={{ padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #8B5CF630' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, fontWeight: 900 }}>Partager avec l'équipe</h4>
                <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>

              {/* Type selector */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {POST_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: `1px solid ${form.type === t.id ? t.color : 'var(--border)'}`,
                      background: form.type === t.id ? `${t.color}15` : 'transparent', color: form.type === t.id ? t.color : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="Catégorie (ex: Ventes, Production, RH…)"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', marginBottom: '0.75rem', fontSize: '0.9rem' }} />
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre…"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }} />
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Décrivez le succès ou l'annonce…" rows={3}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', marginBottom: '1rem', fontSize: '0.9rem', resize: 'vertical', lineHeight: 1.5 }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setShowCompose(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>Annuler</button>
                <button onClick={handlePublish} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.75rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Publier</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed posts */}
        {feed.map(post => (
          <motion.div key={post.id} variants={item} whileHover={{ y: -3 }} className="glass"
            style={{ padding: '1.75rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ padding: '12px', borderRadius: '1.25rem', background: `${post.color}15`, height: 'fit-content', color: post.color, flexShrink: 0 }}>
                {post.type === 'success' ? <Trophy size={24} /> : post.type === 'announcement' ? <Megaphone size={24} /> : <Target size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: post.color, letterSpacing: '1px' }}>{post.category}</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 900 }}>{post.title}</h4>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, marginLeft: '1rem' }}>{post.date}</span>
                </div>
                <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{post.content}</p>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: post.liked ? '#EC4899' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', transition: 'color 0.2s' }}>
                      <Heart size={16} fill={post.liked ? '#EC4899' : 'none'} /> {post.reactions}
                    </button>
                    <button onClick={() => setOpenComments(p => ({ ...p, [post.id]: !p[post.id] }))}
                      style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <MessageCircle size={16} /> {post.comments.length}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${post.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: post.color }}>
                      {post.authorInit}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>{post.author}</div>
                  </div>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {openComments[post.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {post.comments.map(c => (
                          <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#8B5CF6', flexShrink: 0 }}>
                              {c.author[0]}
                            </div>
                            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem 0.9rem', borderRadius: '0.75rem', flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.78rem', marginBottom: '0.2rem' }}>{c.author}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input value={commentInputs[post.id] || ''} onChange={e => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Ajouter un commentaire…"
                          style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontSize: '0.85rem' }} />
                        <button onClick={() => handleAddComment(post.id)}
                          style={{ padding: '0.6rem 0.9rem', borderRadius: '0.75rem', background: '#8B5CF6', color: 'white', border: 'none', cursor: 'pointer' }}>
                          <Send size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sidebar */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Pulse card */}
        <motion.div variants={item} style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>
            <Sparkles size={14} /> Pulsation d'équipe
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>0%</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Engagement ce mois-ci</div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', background: 'white', borderRadius: '2px' }} />
          </div>
        </motion.div>

        {/* Stats card */}
        <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '0.9rem' }}>Activité de l'équipe</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Publications ce mois', value: feed.length, icon: <TrendingUp size={15} color="#8B5CF6" /> },
              { label: 'Réactions totales', value: feed.reduce((s, p) => s + p.reactions, 0), icon: <Heart size={15} color="#EC4899" /> },
              { label: 'Commentaires', value: feed.reduce((s, p) => s + p.comments.length, 0), icon: <MessageCircle size={15} color="#6366F1" /> },
              { label: 'Collaborateurs actifs', value: data?.hr?.employees?.filter(e => e.active)?.length || 0, icon: <HeartHandshake size={15} color="#10B981" /> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick post types */}
        <motion.div variants={item} className="glass" style={{ padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 900, fontSize: '0.85rem' }}>Publier rapidement</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {POST_TYPES.map(t => (
              <button key={t.id} onClick={() => { setForm(p => ({ ...p, type: t.id })); setShowCompose(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: t.color, transition: 'all 0.2s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WallTab;
