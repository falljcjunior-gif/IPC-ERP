import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MessageSquare, Search, User, Users, Paperclip, 
  Smile, Phone, Video, MoreVertical, CheckCheck, Circle, 
  Plus, Settings, ImageIcon, Clock, Hash, Shield, X, Bell, ToggleLeft, ToggleRight, Loader, Mic, MicOff, Square
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';
import { db, auth, storage } from '../../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp, where, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { webrtcService } from '../../../utils/WebRTCService';

const MessengerTab = ({ onOpenDetail, navigationIntent }) => {
  const { currentUser, data, setActiveCall, sendNotification } = useBusiness();
  const [activeTab, setActiveTab] = useState('chats');
  const [activeRoom, setActiveRoom] = useState({ id: 'team_global', label: 'Espace Général', type: 'team' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [roomSettings, setRoomSettings] = useState({ muteNotifs: false, pinned: false });
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState({});
  const [customRooms, setCustomRooms] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ label: '', members: [] });
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const scrollRef = useRef();
  const inputRef = useRef();
  const fileInputRef = useRef();

  const commonEmojis = ['😊', '😂', '👍', '🙏', '🔥', '🚀', '❤️', '👏', '🤔', '😎', '💡', '✅', '⏳', '📌', '📁', '🤝', '⭐', '✨', '💪', '🎯'];

  const groups = [
    { id: 'team_global', label: 'Espace Général', type: 'team', lastMsg: 'Bienvenue sur Connect Plus', time: '', members: 0 }
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

      // Read Receipts Logic
      if (auth.currentUser) {
         setTimeout(() => {
             const unreadDocs = snapshot.docs.filter(d => {
                const mData = d.data();
                return mData.userId !== currentUser.id && (!mData.readBy || !mData.readBy.includes(currentUser.id));
             });

             if (unreadDocs.length > 0) {
                const batch = writeBatch(db);
                unreadDocs.forEach(d => {
                   batch.update(doc(db, 'messages', d.id), {
                      readBy: [...(d.data().readBy || []), currentUser.id]
                   });
                });
                batch.commit().catch(()=>{});
             }
         }, 1500); // 1.5s delay to prevent Firebase snapshot loop crashes (INTERNAL ASSERTION FAILED: ca9)
      }
    });
    return () => unsubscribe();
  }, [activeRoom.id]);

  useEffect(() => {
    if (!activeRoom.id) return;
    const unsub = onSnapshot(collection(db, 'rooms', activeRoom.id, 'participants'), (snap) => {
        const p = {};
        snap.forEach(d => { p[d.id] = d.data() });
        setActiveParticipants(p);
    });
    return () => unsub();
  }, [activeRoom.id]);

  // Load dynamic groups
  useEffect(() => {
    if (!auth.currentUser) return;
    const roomsQ = query(
      collection(db, 'rooms'),
      where('type', '==', 'group'),
      where('members', 'array-contains', currentUser.id)
    );
    const unsub = onSnapshot(roomsQ, (snap) => {
       const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id }));
       setCustomRooms(fetched);
    });
    return () => unsub();
  }, [currentUser.id]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0 && !isUploading) {
            uploadAudio(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Audio err", err);
      alert("Accès micro refusé.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const uploadAudio = async (blob) => {
    if (!auth.currentUser) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `messenger/${activeRoom.id}/vocal_${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'messages'), {
        text: `🎤 Mémo vocal`,
        fileUrl: url,
        fileName: 'vocal.webm',
        fileType: 'audio/webm',
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom,
        createdAt: serverTimestamp()
      });

      if (activeRoom.type === 'direct' && sendNotification) {
         const parts = activeRoom.id.split('_');
         const receiverId = parts.find(p => p !== 'dm' && p !== currentUser.id);
         if (receiverId) sendNotification('ALL', `Vocal de ${currentUser.nom}`, '▶ Mémo vocal', 'chat', 'connect', receiverId);
      }
    } catch (err) {
      console.error("Audio Upload Error", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.label.trim()) return;
    try {
       const members = Array.from(new Set([...newGroupData.members, currentUser.id]));
       await addDoc(collection(db, 'rooms'), {
          label: newGroupData.label,
          type: 'group',
          createdBy: currentUser.id,
          members: members,
          createdAt: serverTimestamp()
       });
       setShowCreateGroup(false);
       setNewGroupData({ label: '', members: [] });
    } catch (err) {
       console.error(err);
    }
  };

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

      // Send Global Notification
      if (activeRoom.type === 'direct' && sendNotification) {
         const parts = activeRoom.id.split('_');
         const receiverId = parts.find(p => p !== 'dm' && p !== currentUser.id);
         if (receiverId) {
             sendNotification('ALL', `Message de ${currentUser.nom}`, newMessage, 'chat', 'connect', receiverId);
         }
      } else if (activeRoom.type === 'team' && sendNotification) {
         // Optionally notify team members, skipping for now to avoid spam
      }

      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) { console.error("Send Error:", err); }
  };

  const initiateCall = async (type) => {
    let targetUsers = [];
    if (activeRoom.type === 'direct') {
      const parts = activeRoom.id.split('_');
      const receiverId = parts.find(p => p !== 'dm' && p !== currentUser.id);
      targetUsers = [receiverId];
    } else {
      targetUsers = employees.filter(e => e.id !== currentUser.id).map(e => e.id);
    }
    
    try {
      const batchPromises = targetUsers.map(uid => 
        addDoc(collection(db, 'calls'), {
          roomId: activeRoom.id,
          roomLabel: activeRoom.label,
          callerId: currentUser.id,
          callerName: currentUser.nom,
          receiverId: uid, 
          type,
          status: 'ringing',
          startedAt: serverTimestamp()
        })
      );
      await Promise.all(batchPromises);
      
      setActiveCall({ 
        id: activeRoom.id, 
        callDocId: activeRoom.id, // For caller, call doc doesn't really matter to hangup the same way
        roomId: activeRoom.id,
        role: 'caller', 
        type, 
        contactName: activeRoom.label,
        accepted: true 
      });
    } catch (err) { 
      console.error("Call Error:", err); 
      alert("Impossible de démarrer l'appel.");
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
              {activeTab === 'chats' && [...groups, ...customRooms].map(g => (
                <div key={g.id} onClick={() => setActiveRoom(g)} style={{ padding: '1rem', borderRadius: '1.25rem', cursor: 'pointer', background: activeRoom.id === g.id ? 'white' : 'transparent', boxShadow: activeRoom.id === g.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{g.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{g.type === 'group' ? 'Groupe' : g.time}</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{g.lastMsg || `${g.members?.length} membres`}</div>
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

            {activeTab === 'groups' && (
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  style={{ margin: '1rem 0', width: '100%', padding: '0.8rem', borderRadius: '1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px dashed var(--border)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                   <Plus size={16} /> Nouveau Groupe
                </button>
            )}
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
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                       {Object.keys(activeParticipants).length > 0 
                         ? `${Object.keys(activeParticipants).length} en appel` 
                         : 'Actif'}
                     </span>
                  </div>
               </div>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                 <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-subtle)', padding: '6px', borderRadius: '12px' }}>
                    <button 
                      onClick={() => initiateCall('audio')} 
                      title="Appel Audio"
                      style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#8B5CF6' }}
                    >
                      <Phone size={20} />
                    </button>
                    <button 
                      onClick={() => initiateCall('video')} 
                      title="Appel Vidéo"
                      style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#8B5CF6' }}
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

          {/* Create Group Modal */}
          <AnimatePresence>
            {showCreateGroup && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => e.target === e.currentTarget && setShowCreateGroup(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2rem', width: '420px', maxWidth: '95vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Créer un Groupe</h3>
                    <button onClick={() => setShowCreateGroup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                  </div>
                  <input 
                    placeholder="Nom du groupe..." 
                    value={newGroupData.label} 
                    onChange={e => setNewGroupData(p => ({ ...p, label: e.target.value }))}
                    style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', marginBottom: '1rem', fontSize: '0.9rem' }}
                  />
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.5rem' }}>
                     {employees.filter(e => e.id !== currentUser.id).map(emp => (
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
                           <input type="checkbox" checked={newGroupData.members.includes(emp.id)} onChange={(e) => {
                               setNewGroupData(p => ({
                                   ...p, members: e.target.checked ? [...p.members, emp.id] : p.members.filter(id => id !== emp.id)
                               }))
                           }} />
                           <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.nom}</span>
                        </label>
                     ))}
                  </div>
                  <button onClick={handleCreateGroup} disabled={!newGroupData.label || newGroupData.members.length === 0}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.9rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: (!newGroupData.label || newGroupData.members.length === 0) ? 0.5 : 1 }}>
                    Créer le Groupe
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
                          {msg.fileType?.startsWith('audio/') ? (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <audio controls src={msg.fileUrl} style={{ height: '36px', outline: 'none' }} />
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{msg.text}</div>
                             </div>
                          ) : msg.fileType?.startsWith('image/') ? (
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
                         {isMe && <CheckCheck size={12} color={msg.readBy?.length > 0 ? '#3B82F6' : 'currentColor'} />}
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
               {isRecording ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', color: '#EF4444' }}>
                     <div className="pulse" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                     <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Enregistrement ({recordingTime}s)</span>
                  </div>
               ) : (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <Smile size={20} color={showEmojis ? '#8B5CF6' : "var(--text-muted)"} style={{ cursor: 'pointer' }} onClick={() => setShowEmojis(!showEmojis)} />
                    <Paperclip size={20} color={isUploading ? '#8B5CF6' : "var(--text-muted)"} style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} />
                    <input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isUploading ? "Envoi du fichier..." : "Écrivez votre message..."} disabled={isUploading} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--text)', fontWeight: 500 }} />
                  </>
               )}
               {newMessage.trim() || isUploading ? (
                   <button type="submit" disabled={isUploading} style={{ width: '42px', height: '42px', borderRadius: '50%', background: isUploading ? 'var(--text-muted)' : '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', flexShrink: 0 }}>
                      {isUploading ? <Loader size={20} className="spin" /> : <Send size={20} />}
                   </button>
               ) : (
                   <button type="button" 
                     onMouseDown={startRecording} 
                     onMouseUp={stopRecording} 
                     onMouseLeave={stopRecording}
                     onTouchStart={startRecording}
                     onTouchEnd={stopRecording}
                     style={{ width: '42px', height: '42px', borderRadius: '50%', background: isRecording ? '#EF4444' : '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: isRecording ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 4px 12px rgba(139, 92, 246, 0.3)', flexShrink: 0, transition: '0.2s' }}>
                      <Mic size={20} />
                   </button>
               )}
            </div>
         </form>
      </div>
    </div>
  );
};

export default MessengerTab;
