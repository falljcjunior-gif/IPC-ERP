import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MessageSquare, X, Search, User, Users, Briefcase,
  Paperclip, Smile, Phone, Video, MoreVertical, Check,
  CheckCheck, Circle, Plus, Settings, Image as ImageIcon
} from 'lucide-react';
import { useCurrentUser, useHRData, useActiveCall, useSetActiveCall, useFormatCurrency } from '../store/selectors';
import { FirestoreService } from '../services/firestore.service';
import logger from '../utils/logger';
import { webrtcService } from '../utils/WebRTCService';

const TeamChat = ({ isOpen, onClose, theme, mode = 'overlay' }) => {
  const currentUser = useCurrentUser();
  const { employees } = useHRData();
  const activeCall = useActiveCall();
  const setActiveCall = useSetActiveCall();
  const formatCurrency = useFormatCurrency();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'contacts', 'groups'
  const [activeRoom, setActiveRoom] = useState({ id: 'team_global', label: 'Espace Général', type: 'team' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalling, setIsCalling] = useState(null); // 'audio', 'video'
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const scrollRef = useRef();
  const inputRef = useRef();

  const isMobile = window.innerWidth < 768;

  // Mocked Workgroups (can be expanded to real data later)
  const groups = [
    { id: 'team_it', label: 'Équipe IT', type: 'team', lastMsg: 'Serveur déployé.', time: '10:45' },
    { id: 'team_sales', label: 'Équipe Ventes', type: 'team', lastMsg: 'Nouveau lead entrant.', time: '09:30' },
    { id: 'project_ipc', label: 'Projet I.P.C', type: 'project', lastMsg: 'Tests v2 validés.', time: 'Hier' },
  ];

  // Contacts filtered by search
  const filteredContacts = useMemo(() => {
    return (employees || [])
      .filter(e => e.id !== currentUser?.id)
      .filter(e => (e.nom || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [employees, currentUser?.id, searchQuery]);

  // Handle room switching
  const handleSelectRoom = (room) => {
    setActiveRoom(room);
  };

  // Logic for Private Room IDs (DMs)
  const getDmRoomId = (userId) => {
    const ids = [currentUser?.id, userId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  };

  // Listen for messages in the active room
  useEffect(() => {
    if (!currentUser?.id || !activeRoom.id) return;
    let unsubscribe;
    try {
      unsubscribe = FirestoreService.subscribeToCollection('messages', (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }, [
        { field: 'roomId', operator: '==', value: activeRoom.id }
      ], { field: 'createdAt', direction: 'asc' }, 100);
    } catch (err) {
      console.warn('[TeamChat] Firestore non disponible (mode DEV sans auth):', err.message);
    }
    return () => typeof unsubscribe === 'function' && unsubscribe();
  }, [activeRoom.id, currentUser?.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;

    try {
      await FirestoreService.addDocument('messages', {
        text: newMessage,
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      logger.error("Erreur envoi message", err);
    }
  };

  const initiateCall = async (type) => {
    if (activeRoom.type !== 'direct') return;
    
    // Determine receiverId from dm room ID
    const parts = activeRoom.id.split('_');
    const receiverId = parts.find(p => p !== 'dm' && p !== currentUser?.id);

    try {
      // Create call document and set up PeerConnection
      const callId = await webrtcService.createCall(
        currentUser?.id, 
        currentUser?.nom,
        receiverId, 
        type, 
        null // Stream handling is done in CallInterface
      );
      
      setActiveCall({ 
        id: callId, 
        role: 'caller', 
        type, 
        contactName: activeRoom.label 
      });
    } catch (err) {
      console.error("Initiate Call Error:", err);
    }
  };

  const renderCallOverlay = () => null; // Simulation removed as we use global CallInterface

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          style={{ 
            position: mode === 'module' ? 'relative' : 'fixed', 
            right: 0, top: 0, bottom: 0, 
            width: isMobile ? '100%' : (mode === 'module' ? '100%' : '850px'), 
            height: '100%',
            background: 'var(--bg)', 
            boxShadow: mode === 'module' ? 'none' : '-20px 0 50px rgba(0,0,0,0.15)', 
            zIndex: mode === 'module' ? 1 : 3000, 
            display: 'flex', 
            flexDirection: 'column',
            borderLeft: mode === 'module' ? 'none' : '1px solid var(--border)',
            overflow: 'hidden'
          }}
        >
          {/* Main Layout: Sidebar & Chat Area */}
          <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
            
            {/* LEFT PANELS (Navigation & Lists) */}
            <div style={{ 
              width: '70px', borderRight: '1px solid var(--border)', 
              background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', paddingTop: '1.5rem', gap: '1.5rem', flexShrink: 0 
            }}>
              {[
                { id: 'chats', icon: <MessageSquare size={22} />, label: 'Discussions' },
                { id: 'contacts', icon: <User size={22} />, label: 'Contacts' },
                { id: 'groups', icon: <Users size={22} />, label: 'Groupes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '50px', height: '50px', borderRadius: '16px', border: 'none',
                    background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: activeTab === tab.id ? '0 8px 16px var(--accent)30' : 'none'
                  }}
                  title={tab.label}
                >
                  {tab.icon}
                </button>
              ))}
              <div style={{ marginTop: 'auto', paddingBottom: '1.5rem' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Settings size={22} />
                </button>
              </div>
            </div>

            {/* MIDDLE PANEL (Lists) */}
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>
                  {activeTab === 'chats' ? 'Discussions' : activeTab === 'contacts' ? 'Contacts' : 'Groupes'}
                </h3>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  background: 'var(--bg-subtle)', padding: '0.6rem 0.8rem', 
                  borderRadius: '0.75rem', border: '1px solid var(--border)' 
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..." 
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.8rem', color: 'var(--text)', width: '100%' }} 
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'chats' && (
                  <div>
                    {groups.map(g => (
                      <div key={g.id} onClick={() => setActiveRoom(g)}
                        style={{ padding: '1rem', cursor: 'pointer', background: activeRoom.id === g.id ? 'var(--bg-subtle)' : 'transparent', borderBottom: '1px solid var(--border-subtle)', transition: '0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{g.label}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g.time}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.lastMsg}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'contacts' && (
                  <div>
                    {filteredContacts.map(emp => (
                      <div key={emp.id} 
                        onClick={() => handleSelectRoom({ id: getDmRoomId(emp.id), label: emp.nom, type: 'direct' })}
                        style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: activeRoom.id === getDmRoomId(emp.id) ? 'var(--bg-subtle)' : 'transparent' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                          {emp.avatar || emp.nom[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{emp.nom}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.poste}</div>
                        </div>
                        <Circle size={8} fill={emp.isOnline === true ? '#10B981' : 'transparent'} color={emp.isOnline === true ? '#10B981' : 'var(--border)'} />
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'groups' && (
                  <div style={{ padding: '1rem' }}>
                    <button onClick={() => setShowCreateGroup(true)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.7rem', border: '1px dashed var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Plus size={16} /> Créer un groupe
                    </button>
                    {/* List of existing groups could go here */}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL (Chat Area) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
              
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent)10', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
                    {activeRoom.label[0]}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{activeRoom.label}</h4>
                    <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>Actif maintenant</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => initiateCall('audio')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Phone size={20} /></button>
                  <button onClick={() => initiateCall('video')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Video size={20} /></button>
                  <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>
              </div>

              {/* Messages List */}
              <div 
                ref={scrollRef}
                style={{ 
                  flex: 1, padding: '1.5rem', overflowY: 'auto', 
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  background: theme === 'dark' ? '#0F172A' : '#F8FAFC' 
                }}
              >
                {messages.length === 0 && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>Sécurisé par chiffrement de bout en bout</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.userId === currentUser?.id;
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        padding: '0.75rem 1rem', borderRadius: '1.25rem', maxWidth: '85%',
                        background: isMe ? 'var(--accent)' : 'var(--bg)',
                        color: isMe ? 'white' : 'var(--text)',
                        borderBottomRightRadius: isMe ? '0.2rem' : '1.25rem',
                        borderBottomLeftRadius: isMe ? '1.25rem' : '0.2rem',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        {msg.text}
                        <div style={{ textAlign: 'right', fontSize: '0.65rem', marginTop: '4px', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          12:30 {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Bar */}
              <form 
                onSubmit={sendMessage}
                style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  background: 'var(--bg-subtle)', padding: '0.75rem 1rem', 
                  borderRadius: '1.5rem', border: '1px solid var(--border)' 
                }}>
                  <Smile size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  <Paperclip size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  <input 
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez un message..." 
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }} 
                  />
                  <button type="submit" style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    background: 'var(--accent)', border: 'none', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                  }}>
                    <Send size={18} />
                  </button>
                </div>
              </form>

            </div>
          </div>
          
          <AnimatePresence>
            {isCalling && renderCallOverlay()}
          </AnimatePresence>

          {showCreateGroup && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
              onClick={() => setShowCreateGroup(false)}
            >
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 400 }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Créer un groupe</div>
                <input
                  placeholder="Nom du groupe..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateGroup(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', background: '#F8FAFC' }}>Annuler</button>
                  <button onClick={() => setShowCreateGroup(false)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Créer</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamChat;
