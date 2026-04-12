import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Hash, 
  MessageSquare, 
  X, 
  Search, 
  User, 
  Users, 
  Briefcase,
  Paperclip,
  Smile
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { db, auth } from '../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp } from 'firebase/firestore';

const TeamChat = ({ isOpen, onClose }) => {
  const { currentUser } = useBusiness();
  const [activeRoom, setActiveRoom] = useState({ id: 'team_it', label: 'Équipe IT', type: 'team' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  const rooms = [
    { id: 'team_it', label: 'Équipe IT', type: 'team' },
    { id: 'team_sales', label: 'Équipe Ventes', type: 'team' },
    { id: 'team_rh', label: 'Équipe RH', type: 'team' },
    { id: 'project_1', label: 'IPC ERP v2.0', type: 'project' },
    { id: 'project_2', label: 'Migration Cloud Partner', type: 'project' },
  ];

  // Listen for messages in the active room
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // In a real app, messages are in a sub-collection or separate collection
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    // Mocking room filtering locally for now, in prod it would be a where('roomId', '==', activeRoom.id)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter(m => m.roomId === activeRoom.id);
      setMessages(msgs);
      
      // Auto scroll
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsubscribe();
  }, [activeRoom.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          style={{ 
            position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', 
            background: 'var(--bg)', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', 
            zIndex: 2000, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {activeRoom.type === 'team' ? <Users size={20} /> : <Briefcase size={20} />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{activeRoom.label}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Connecté en temps réel</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Rooms List (Slim) */}
            <div style={{ width: '80px', borderRight: '1px solid var(--border)', background: 'var(--bg-subtle)', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  title={room.label}
                  style={{ 
                    width: '48px', height: '48px', borderRadius: '14px', border: 'none', 
                    background: activeRoom.id === room.id ? 'var(--accent)' : 'var(--bg)',
                    color: activeRoom.id === room.id ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: activeRoom.id === room.id ? '0 4px 12px var(--accent)40' : 'none',
                    transition: '0.2s'
                  }}
                >
                  {room.type === 'team' ? <Users size={20} /> : <Briefcase size={20} />}
                </button>
              ))}
            </div>

            {/* Chat Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {messages.length === 0 && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
                    <p>Début de la conversation...</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.userId === currentUser.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>{msg.userName}</div>}
                      <div style={{ 
                        padding: '0.75rem 1rem', borderRadius: '1.25rem', maxWidth: '85%',
                        background: isMe ? 'var(--accent)' : 'var(--bg-subtle)',
                        color: isMe ? 'white' : 'var(--text)',
                        borderBottomRightRadius: isMe ? '0.25rem' : '1.25rem',
                        borderBottomLeftRadius: isMe ? '1.25rem' : '0.25rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <form 
                onSubmit={sendMessage}
                style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}
              >
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-subtle)', 
                  padding: '0.75rem 1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)' 
                }}>
                  <Paperclip size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  <input 
                    type="text" 
                    placeholder="Écrire un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }}
                  />
                  <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamChat;
