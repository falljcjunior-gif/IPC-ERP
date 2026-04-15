import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MessageSquare, Search, User, Users, Paperclip, 
  Smile, Phone, Video, MoreVertical, CheckCheck, Circle, 
  Plus, Settings, ImageIcon, Clock, Hash, Shield, X, Bell, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';
import { db, auth, storage } from '../../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { webrtcService } from '../../../utils/WebRTCService';

const MessengerTab = ({ onOpenDetail, navigationIntent }) => {
  const { currentUser, data, setActiveCall } = useBusiness();
  const [activeTab, setActiveTab] = useState('chats');
  const [activeRoom, setActiveRoom] = useState({ id: 'team_global', label: 'Espace Général', type: 'team' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [roomSettings, setRoomSettings] = useState({ muteNotifs: false, pinned: false });
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef();
  const inputRef = useRef();
  const fileInputRef = useRef();

  const commonEmojis = ['😊', '😂', '👍', '🙏', '🔥', '🚀', '❤️', '👏', '🤔', '😎', '💡', '✅', '⏳', '📌', '📁', '🤝', '⭐', '✨', '💪', '🎯'];

  // Mocked Workgroups (upgraded for high-fidelity)
  const groups = [
    { id: 'team_it', label: 'Équipe IT', type: 'team', lastMsg: 'Serveur déployé.', time: '10:45', members: 12 },
    { id: 'team_sales', label: 'Équipe Ventes', type: 'team', lastMsg: 'Nouveau lead entrant.', time: '09:30', members: 8 },
    { id: 'project_ipc', label: 'Projet IPC ERP', type: 'project', lastMsg: 'Tests v2 validés.', time: 'Hier', members: 5 },
  ];

  const employees = data.hr?.employees || [];
  const filteredContacts = useMemo(() => {
    return employees
      .filter(e => e.id !== currentUser.id)
      .filter(e => e.nom.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [employees, currentUser.id, searchQuery]);

  const getDmRoomId = (userId) => {
    const ids = [currentUser.id, userId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  };

  useEffect(() => {
    if (navigationIntent?.roomId) {
      setActiveRoom({
        id: navigationIntent.roomId,
        label: navigationIntent.label || 'Discussion',
        type: navigationIntent.roomId.startsWith('dm_') ? 'direct' : 'team'
      });
      // Clear intent ? It's better not to mutate context here unless we have setter, 
      // but the intent has done its job. We just react to it.
    }
  }, [navigationIntent]);

  useEffect(() => {
    if (!auth.currentUser || !activeRoom.id) return;
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', activeRoom.id),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setMessages(msgs);
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
      inputRef.current?.focus();
    } catch (err) { console.error("Send Error:", err); }
  };

  const initiateCall = async (type) => {
    if (activeRoom.type !== 'direct') {
      alert("Les appels groupés ne sont pas encore supportés. Passez par un chat direct pour appeler un collaborateur.");
      return;
    }
    const parts = activeRoom.id.split('_');
    const receiverId = parts.find(p => p !== 'dm' && p !== currentUser.id);
    
    try {
      // 1. Démarrer le flux local (caméra/micro) avant de créer l'offre WebRTC
      await webrtcService.startLocalStream(type);
      
      // 2. Créer l'appel au niveau de la couche WebRTC et Firestore
      const callId = await webrtcService.createCall(currentUser.id, currentUser.nom, receiverId, type);
      
      // 3. Activer l'interface d'appel (PlatformShell réagira via BusinessContext)
      setActiveCall({ id: callId, role: 'caller', type, contactName: activeRoom.label });
    } catch (err) { 
      console.error("Call Error:", err); 
      alert("Impossible de démarrer l'appel. Veuillez vérifier vos permissions caméra/micro.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `messenger/${activeRoom.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'messages'), {
        text: `Pièce jointe : ${file.name}`,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: 'flex', height: '100%', borderRadius: '2.5rem', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg)' }}>
      {/* Sidebar Area */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '1.25rem' }}>Messenger</h3>
          <div style={{ display: 'flex', gap: '0.6rem', background: 'var(--bg)', padding: '0.6rem 1rem', borderRadius: '1rem', border: '1px solid var(--border)', alignItems: 'center' }}>
            <Search size={16} color="var(--text-muted)" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', width: '100%' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
           <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'chats', icon: <MessageSquare size={16} /> },
                { id: 'contacts', icon: <User size={16} /> },
                { id: 'groups', icon: <Users size={16} /> }
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: activeTab === t.id ? '#8B5CF6' : 'white', color: activeTab === t.id ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: '0.2s' }}>
                   {t.icon}
                </button>
              ))}
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activeTab === 'chats' && groups.map(g => (
                <div key={g.id} onClick={() => setActiveRoom(g)} style={{ padding: '1rem', borderRadius: '1.25rem', cursor: 'pointer', background: activeRoom.id === g.id ? 'white' : 'transparent', boxShadow: activeRoom.id === g.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{g.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{g.time}</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{g.lastMsg}</div>
                </div>
              ))}

              {activeTab === 'contacts' && filteredContacts.map(emp => (
                <div key={emp.id} onClick={() => setActiveRoom({ id: getDmRoomId(emp.id), label: emp.nom, type: 'direct' })} style={{ padding: '0.75rem 1rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: activeRoom.id === getDmRoomId(emp.id) ? 'white' : 'transparent', borderBottom: '1px solid var(--border-subtle)' }}>
                   <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>{emp.nom[0]}</div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{emp.nom}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.poste}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
         {/* Room Header */}
         <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                  {activeRoom.label[0]}
               </div>
               <div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>{activeRoom.label}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <Circle size={8} fill="#10B981" color="#10B981" />
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>Actif</span>
                  </div>
               </div>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                 <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-subtle)', padding: '6px', borderRadius: '12px' }}>
                    <button 
                      onClick={() => initiateCall('audio')} 
                      title={activeRoom.type !== 'direct' ? "Appels directs uniquement" : "Appel Audio"}
                      style={{ background: 'none', border: 'none', padding: '8px', cursor: activeRoom.type === 'direct' ? 'pointer' : 'not-allowed', color: activeRoom.type === 'direct' ? '#8B5CF6' : 'var(--text-muted)', opacity: activeRoom.type === 'direct' ? 1 : 0.5 }}
                    >
                      <Phone size={20} />
                    </button>
                    <button 
                      onClick={() => initiateCall('video')} 
                      title={activeRoom.type !== 'direct' ? "Appels directs uniquement" : "Appel Vidéo"}
                      style={{ background: 'none', border: 'none', padding: '8px', cursor: activeRoom.type === 'direct' ? 'pointer' : 'not-allowed', color: activeRoom.type === 'direct' ? '#8B5CF6' : 'var(--text-muted)', opacity: activeRoom.type === 'direct' ? 1 : 0.5 }}
                    >
                      <Video size={20} />
                    </button>
                 </div>
                 <button onClick={() => setShowRoomSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Settings size={20} /></button>
              </div>
          </div>

          {/* Room Settings Modal */}
          <AnimatePresence>
            {showRoomSettings && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => e.target === e.currentTarget && setShowRoomSettings(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2rem', width: '420px', maxWidth: '95vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Paramètres — {activeRoom.label}</h3>
                    <button onClick={() => setShowRoomSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                  </div>
                  {[
                    { key: 'muteNotifs', label: 'Couper les notifications', icon: <Bell size={16} /> },
                    { key: 'pinned', label: 'Conversation épinglée', icon: <Shield size={16} /> },
                  ].map(s => (
                    <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', borderRadius: '0.9rem', background: 'var(--bg-subtle)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>{s.icon} {s.label}</div>
                      <button onClick={() => setRoomSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: roomSettings[s.key] ? '#8B5CF6' : 'var(--text-muted)' }}>
                        {roomSettings[s.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setShowRoomSettings(false)}
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', borderRadius: '0.9rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                    Fermer
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

         {/* Chat Messages */}
         <div ref={scrollRef} style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(to bottom, transparent, var(--bg-subtle))' }}>
            {messages.map((msg, i) => {
              const isMe = msg.userId === currentUser.id;
              return (
                <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                   <div style={{ padding: '1rem 1.25rem', borderRadius: '1.75rem', background: isMe ? '#8B5CF6' : 'white', color: isMe ? 'white' : 'var(--text)', border: isMe ? 'none' : '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, position: 'relative' }}>
                      {msg.fileUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {msg.fileType?.startsWith('image/') ? (
                            <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--bg-subtle)', padding: '10px', borderRadius: '12px' }}>
                              <Paperclip size={18} />
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>{msg.fileName}</a>
                            </div>
                          )}
                          <div style={{ opacity: 0.9 }}>{msg.text}</div>
                        </div>
                      ) : (
                        msg.text
                      )}
                      <div style={{ marginTop: '6px', fontSize: '0.65rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                         {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Maintenant'} 
                         {isMe && <CheckCheck size={12} />}
                      </div>
                   </div>
                </div>
              );
            })}
         </div>

         {/* Message Input */}
         <form onSubmit={sendMessage} style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
            <AnimatePresence>
              {showEmojis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', bottom: '100%', left: '2rem', background: 'white', border: '1px solid var(--border)', borderRadius: '1.5rem', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', zIndex: 100 }}
                >
                  {commonEmojis.map(emoji => (
                    <button key={emoji} type="button" onClick={() => addEmoji(emoji)} style={{ fontSize: '1.5rem', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: '0.2s' }} onMouseEnter={e => e.target.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.target.style.background = 'none'}>
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-subtle)', padding: '0.8rem 1.5rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 style={{ display: 'none' }} 
               />
               <Smile 
                 size={20} 
                 color={showEmojis ? '#8B5CF6' : "var(--text-muted)"} 
                 style={{ cursor: 'pointer' }} 
                 onClick={() => setShowEmojis(!showEmojis)} 
               />
               <Paperclip 
                 size={20} 
                 color={isUploading ? '#8B5CF6' : "var(--text-muted)"} 
                 style={{ cursor: 'pointer' }} 
                 onClick={() => fileInputRef.current?.click()} 
               />
               <input 
                 ref={inputRef} 
                 value={newMessage} 
                 onChange={(e) => setNewMessage(e.target.value)} 
                 placeholder={isUploading ? "Envoi du fichier..." : "Écrivez votre message..."} 
                 disabled={isUploading}
                 style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--text)', fontWeight: 500 }} 
               />
               <button type="submit" disabled={isUploading} style={{ width: '42px', height: '42px', borderRadius: '50%', background: isUploading ? 'var(--text-muted)' : '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
                  {isUploading ? <Loader size={20} className="spin" /> : <Send size={20} />}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
};

export default MessengerTab;
