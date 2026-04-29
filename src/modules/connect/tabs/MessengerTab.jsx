import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MessageSquare, Search, User, Users, Paperclip, 
  Smile, Phone, Video, MoreVertical, CheckCheck, Circle, 
  Plus, Settings, ImageIcon, Clock, Hash, Shield, X, Bell, ToggleLeft, ToggleRight, Loader, Mic, MicOff, Square, ChevronLeft, Reply, Share2
} from 'lucide-react';
import { 
  useCurrentUser, useHRData, useSetActiveCall, 
  useShellView, useAddRecord 
} from '../../../store/selectors';
import { FirestoreService, StorageService } from '../../../services/firestore.service';
import logger from '../../../utils/logger';
import { webrtcService } from '../../../utils/WebRTCService';
import { PresenceService } from '../../../services/presence.service';

const MessengerTab = ({ onOpenDetail, navigationIntent }) => {
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <span key={i} style={{ background: '#FDE047', color: 'black', padding: '0 2px', borderRadius: '2px' }}>{part}</span>
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const currentUser = useCurrentUser();
  const { employees } = useHRData();
  const setActiveCall = useSetActiveCall();
  const shellView = useShellView();
  
  const [activeTab, setActiveTab] = useState('chats');
  const [activeRoom, setActiveRoom] = useState(shellView?.mobile ? null : { id: 'team_global', label: 'Espace Général', type: 'team' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, text, userName }
  const [showForwardModal, setShowForwardModal] = useState(null); // { text, type, metadata }
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [roomSettings, setRoomSettings] = useState({ muteNotifs: false, pinned: false });
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState({});
  const [customRooms, setCustomRooms] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ label: '', members: [] });
  const [searchInChat, setSearchInChat] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [rtdbTypingUsers, setRtdbTypingUsers] = useState([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const readReceiptTimerRef = useRef(null);
  const scrollRef = useRef();
  const inputRef = useRef();
  const fileInputRef = useRef();

  const commonEmojis = ['😊', '😂', '👍', '🙏', '🔥', '🚀', '❤️', '👏', '🤔', '😎', '💡', '✅', '⏳', '📌', '📁', '🤝', '⭐', '✨', '💪', '🎯'];
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const groups = [
    { id: 'team_global', label: 'Espace Général', type: 'team', lastMsg: 'Bienvenue sur Connect Plus', time: '', members: 0 }
  ];

  const filteredContacts = useMemo(() => {
    return (employees || [])
      .filter(e => e.id !== currentUser?.id)
      .filter(e => (e.nom || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [employees, currentUser?.id, searchQuery]);

  const getDmRoomId = (userId) => {
    const ids = [currentUser?.id, userId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  };

  useEffect(() => {
    if (navigationIntent?.roomId) {
      setActiveRoom({
        id: navigationIntent.roomId,
        label: navigationIntent.label || 'Discussion',
        type: navigationIntent.roomId.startsWith('dm_') ? 'direct' : 'team'
      });
    }
  }, [navigationIntent]);

  const processedReadReceiptsRef = useRef(new Set());

  // Messages Subscription & Read Receipts
  useEffect(() => {
    if (!currentUser?.id || !activeRoom?.id) return;

    const unsubscribe = FirestoreService.subscribeToCollection('messages', {
      filters: [{ field: 'roomId', operator: '==', value: activeRoom.id }],
      orderByField: '_createdAt',
      descending: false,
      limitTo: 100
    }, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);

      // Read Receipts Logic
      if (readReceiptTimerRef.current) clearTimeout(readReceiptTimerRef.current);
      
      const unreadDocs = msgs.filter(m => 
        m.userId !== currentUser.id && 
        (!Array.isArray(m.readBy) || !m.readBy.includes(currentUser.id)) &&
        !processedReadReceiptsRef.current.has(m.id)
      );

      if (unreadDocs.length > 0) {
        // [AUDIT] Optimisation: Marquer immédiatement pour éviter les déclenchements multiples
        unreadDocs.forEach(m => processedReadReceiptsRef.current.add(m.id));

        readReceiptTimerRef.current = setTimeout(async () => {
          try {
            const operations = unreadDocs.map(m => ({
              op: 'update',
              collection: 'messages',
              id: m.id,
              data: { readBy: [...(Array.isArray(m.readBy) ? m.readBy : []), currentUser.id] }
            }));
            await FirestoreService.batchWrite(operations);
          } catch (err) {
            logger.error('Read Receipt Batch Error', err);
          }
        }, 1500); // Guard delay réduit car sécurisé par le Ref
      }
    });

    return () => {
       unsubscribe();
       if (readReceiptTimerRef.current) clearTimeout(readReceiptTimerRef.current);
    }
  }, [activeRoom?.id, currentUser?.id]);

  // Participants Subscription
  useEffect(() => {
    if (!activeRoom?.id) return;
    const unsub = FirestoreService.subscribeToCollection(`rooms/${activeRoom.id}/participants`, (participants) => {
      const pMap = {};
      participants.forEach(p => { pMap[p.id] = p; });
      setActiveParticipants(pMap);
    });
    return () => unsub();
  }, [activeRoom?.id]);

  useEffect(() => {
    // 0. Ensure Global Room exists in Firestore
    const initGlobalRoom = async () => {
      try {
        const room = await FirestoreService.getDocument('rooms', 'team_global');
        if (!room) {
          await FirestoreService.setDocument('rooms', 'team_global', {
            status: 'active',
            type: 'team',
            label: 'Espace Général',
            createdAt: new Date()
          });
        }
      } catch (err) {
        console.warn("Global Room Init error:", err);
      }
    };
    initGlobalRoom();

    if (!currentUser?.id) return;
    const unsub = FirestoreService.subscribeToCollection('rooms', (rooms) => {
      setCustomRooms(rooms);
    }, [
      { field: 'type', operator: '==', value: 'group' },
      { field: 'members', operator: 'array-contains', value: currentUser.id }
    ]);
    return () => unsub();
  }, [currentUser?.id]);

  // Typing Indicator Logic (RTDB Optimized)
  useEffect(() => {
    if (!activeRoom?.id || !currentUser?.id) return;
    
    const isTyping = newMessage.trim().length > 0;
    PresenceService.setTyping(activeRoom.id, currentUser.id, isTyping);

    // Stop typing indicator if inactive for 3s
    let idleTimer;
    if (isTyping) {
      idleTimer = setTimeout(() => {
        PresenceService.setTyping(activeRoom.id, currentUser.id, false);
      }, 3000);
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [newMessage, activeRoom?.id, currentUser?.id]);

  useEffect(() => {
    if (!activeRoom?.id) return;
    const unsub = PresenceService.subscribeToTyping(activeRoom.id, (uids) => {
      const names = uids
        .filter(uid => uid !== currentUser?.id)
        .map(uid => employees.find(e => e.id === uid)?.nom || 'Quelqu\'un');
      setRtdbTypingUsers(names);
    });
    return () => unsub();
  }, [activeRoom?.id, employees, currentUser?.id]);

  const typingUsersDisplay = useMemo(() => rtdbTypingUsers, [rtdbTypingUsers]);


  // NOTE: La logique de read receipt est gérée dans l'effet d'abonnement aux messages ci-dessus
  // (batch write debounced avec processedReadReceiptsRef). Ce second effet a été supprimé
  // pour éviter la double écriture Firestore et les race conditions.



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
    if (!currentUser?.id) return;
    setIsUploading(true);
    try {
      const path = `messenger/${activeRoom.id}/vocal_${Date.now()}.webm`;
      const url = await StorageService.uploadFile(blob, path);

      await FirestoreService.createDocument('messages', {
        text: `🎤 Mémo vocal`,
        fileUrl: url,
        fileName: 'vocal.webm',
        fileType: 'audio/webm',
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom,
        readBy: [currentUser.id]
      });

      // Notification logic remains but could be centralized later
    } catch (err) {
      logger.error("Audio Upload Error", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.label.trim() || !currentUser?.id) return;
    try {
       const members = Array.from(new Set([...newGroupData.members, currentUser.id]));
       await FirestoreService.createDocument('rooms', {
          label: newGroupData.label,
          type: 'group',
          createdBy: currentUser.id,
          members: members
       });
       setShowCreateGroup(false);
       setNewGroupData({ label: '', members: [] });
    } catch (err) {
       logger.error('Group Creation Error', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;
    try {
      const msgData = {
        text: newMessage,
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom,
        readBy: [currentUser.id],
        replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, userName: replyingTo.userName } : null
      };
      await FirestoreService.createDocument('messages', msgData);
      setReplyingTo(null);
      
      // Update Room Metadata
      if (activeRoom.type !== 'direct') {
        await FirestoreService.updateDocument('rooms', activeRoom.id, {
          lastMsg: newMessage,
          lastMsgUserId: currentUser.id,
          lastMsgUserName: currentUser.nom
        });
      }

      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) { 
      logger.error("Send Message Error", err); 
    }
  };

  const handleForward = async (targetRoomId) => {
    if (!showForwardModal || !currentUser?.id) return;
    try {
      const msgData = {
        text: showForwardModal.text,
        roomId: targetRoomId,
        userId: currentUser.id,
        userName: currentUser.nom,
        readBy: [currentUser.id],
        isForwarded: true,
        fileUrl: showForwardModal.fileUrl || null,
        fileType: showForwardModal.fileType || null,
        fileName: showForwardModal.fileName || null
      };
      await FirestoreService.createDocument('messages', msgData);
      setShowForwardModal(null);
    } catch (err) {
      logger.error("Forward Error", err);
    }
  };

  const handleReaction = async (msgId, emoji) => {
    try {
      const msg = messages.find(m => m.id === msgId);
      const currentReactions = msg.reactions || {};
      const users = currentReactions[emoji] || [];
      
      if (users.includes(currentUser.id)) {
        await FirestoreService.updateDocument('messages', msgId, {
          [`reactions.${emoji}`]: FirestoreService.arrayRemove(currentUser.id)
        });
      } else {
        await FirestoreService.updateDocument('messages', msgId, {
          [`reactions.${emoji}`]: FirestoreService.arrayUnion(currentUser.id)
        });
      }
    } catch (err) {
      logger.error("Reaction Error", err);
    }
  };

  const deleteMessage = async (msgId, global = true) => {
    if (!window.confirm(global ? "Supprimer ce message pour tout le monde ?" : "Supprimer ce message pour moi ?")) return;
    try {
      if (global) {
        // [SOFT-DELETE GLOBAL] Le message disparaîtra de tous les flux car subscribeToCollection filtre _deletedAt
        await FirestoreService.updateDocument('messages', msgId, {
          _deletedAt: new Date().toISOString(),
          isDeleted: true
        });
      } else {
        // [LOCAL DELETE] Optionnel : on pourrait ajouter l'ID de l'utilisateur à une liste 'hiddenFor'
        // Pour l'instant, on se concentre sur le 'Delete for everyone' demandé.
      }
    } catch (err) {
      logger.error("Delete Error", err);
    }
  };


  const createRoom = async () => {
    if (!newGroupData.label || newGroupData.members.length === 0) return;
    try {
      const members = [...newGroupData.members, currentUser.id];
      const res = await FirestoreService.createDocument('rooms', {
        label: newGroupData.label,
        type: 'group',
        members,
        admins: [currentUser.id],
        _createdAt: new Date().toISOString()
      });
      
      // Register all members in participants sub-collection for presence/typing
      const batchPromises = members.map(uid => {
        const user = employees.find(e => e.id === uid) || (uid === currentUser.id ? currentUser : null);
        return FirestoreService.setDocument(`rooms/${res.id}/participants`, uid, {
          id: uid,
          nom: user?.nom || 'Utilisateur',
          joinedAt: new Date().toISOString()
        });
      });
      await Promise.all(batchPromises);

      setShowCreateGroup(false);
      setNewGroupData({ label: '', members: [] });
      setActiveRoom({ id: res.id, label: newGroupData.label, type: 'group', members });
    } catch (err) {
      logger.error("Create Room Error", err);
    }
  };

  const addParticipant = async (userId) => {
    if (!activeRoom || activeRoom.type !== 'group') return;
    try {
      await FirestoreService.updateDocument('rooms', activeRoom.id, {
        members: FirestoreService.arrayUnion(userId)
      });
      const user = employees.find(e => e.id === userId);
      await FirestoreService.setDocument(`rooms/${activeRoom.id}/participants`, userId, {
        id: userId,
        nom: user?.nom || 'Utilisateur',
        joinedAt: new Date().toISOString()
      });
    } catch (err) {
      logger.error("Add participant error", err);
    }
  };

  const removeParticipant = async (userId) => {
    if (!activeRoom || activeRoom.type !== 'group') return;
    if (!window.confirm("Retirer ce membre du groupe ?")) return;
    try {
      await FirestoreService.updateDocument('rooms', activeRoom.id, {
        members: FirestoreService.arrayRemove(userId)
      });
      await FirestoreService.deleteDocument(`rooms/${activeRoom.id}/participants`, userId);
    } catch (err) {
      logger.error("Remove participant error", err);
    }
  };

  const leaveGroup = async () => {
    if (!activeRoom || activeRoom.type !== 'group') return;
    if (!window.confirm("Quitter ce groupe ?")) return;
    try {
      await FirestoreService.updateDocument('rooms', activeRoom.id, {
        members: FirestoreService.arrayRemove(currentUser.id)
      });
      await FirestoreService.deleteDocument(`rooms/${activeRoom.id}/participants`, currentUser.id);
      setActiveRoom(shellView?.mobile ? null : groups[0]);
    } catch (err) {
      logger.error("Leave group error", err);
    }
  };

  const initiateCall = async (type) => {
    if (!currentUser?.id) return;
    let targetUsers = [];
    if (activeRoom.type === 'direct') {
      const parts = activeRoom.id.split('_');
      const receiverId = parts.find(p => p !== 'dm' && p !== currentUser.id);
      targetUsers = [receiverId];
    } else if (activeRoom.type === 'group') {
      targetUsers = (activeRoom.members || []).filter(uid => uid !== currentUser.id);
    } else {
      // Team / Global
      targetUsers = (employees || []).filter(e => e.id !== currentUser.id).map(e => e.id);
    }
    
    try {
      const batchPromises = targetUsers.map(uid => 
        FirestoreService.createDocument('calls', {
          roomId: activeRoom.id,
          roomLabel: activeRoom.label,
          callerId: currentUser.id,
          callerName: currentUser.nom,
          receiverId: uid, 
          type,
          status: 'ringing'
        })
      );
      await Promise.all(batchPromises);
      
      setActiveCall({ 
        id: activeRoom.id, 
        roomId: activeRoom.id,
        role: 'caller', 
        type, 
        contactName: activeRoom.label,
        accepted: true 
      });
    } catch (err) { 
      logger.error("Call Initiation Error", err); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser?.id) return;

    setIsUploading(true);
    try {
      const path = `messenger/${activeRoom.id}/${Date.now()}_${file.name}`;
      const url = await StorageService.uploadFile(file, path);

      await FirestoreService.createDocument('messages', {
        text: `Pièce jointe : ${file.name}`,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        roomId: activeRoom.id,
        userId: currentUser.id,
        userName: currentUser.nom
      });
    } catch (err) {
      logger.error("File Upload Error", err);
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
    <div style={{ display: 'flex', height: '100%', borderRadius: shellView?.mobile ? '1rem' : '2.5rem', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg)' }}>
      {/* Sidebar Area */}
      {(!shellView?.mobile || !activeRoom) && (
      <div style={{ width: shellView?.mobile ? '100%' : '300px', borderRight: shellView?.mobile ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
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
      )}

      {/* Main Chat Area */}
      {(!shellView?.mobile || activeRoom) && (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', width: shellView?.mobile ? '100%' : 'auto' }}>
         {/* Room Header */}
         <div style={{ padding: shellView?.mobile ? '1rem' : '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               {shellView?.mobile && (
                 <button onClick={() => setActiveRoom(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem', color: 'var(--text)' }}>
                   <ChevronLeft size={24} />
                 </button>
               )}
               <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                  {activeRoom.label[0]}
               </div>
               <div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>{activeRoom.label}</h4>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Circle size={8} fill={typingUsersDisplay.length > 0 ? "#8B5CF6" : "#10B981"} color={typingUsersDisplay.length > 0 ? "#8B5CF6" : "#10B981"} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typingUsersDisplay.length > 0 ? "#8B5CF6" : "#10B981" }}>
                        {typingUsersDisplay.length > 0 
                          ? `${typingUsersDisplay.join(', ')} ${typingUsersDisplay.length > 1 ? 'écrivent...' : 'écrit...'}`
                          : (Object.keys(activeParticipants).length > 0 ? `${Object.keys(activeParticipants).length} en appel` : 'Actif')}
                      </span>
                   </div>
               </div>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                 {showSearch ? (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 200, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                       <Search size={14} color="var(--text-muted)" />
                       <input 
                         autoFocus
                         value={searchInChat} 
                         onChange={e => setSearchInChat(e.target.value)}
                         onBlur={() => !searchInChat && setShowSearch(false)}
                         placeholder="Rechercher..." 
                         style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', width: '100%' }} 
                       />
                       <X size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchInChat(''); setShowSearch(false); }} />
                    </motion.div>
                 ) : (
                    <button onClick={() => setShowSearch(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Search size={20} /></button>
                 )}
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

                  {activeRoom.type === 'group' && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Membres du groupe</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {activeRoom.members?.map(uid => {
                          const user = employees.find(e => e.id === uid) || (uid === currentUser.id ? currentUser : null);
                          const isAdmin = activeRoom.admins?.includes(uid);
                          return (
                            <div key={uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>{user?.nom?.[0] || '?'}</div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.nom} {uid === currentUser.id && '(Vous)'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isAdmin && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8B5CF6', background: '#8B5CF615', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                                {activeRoom.admins?.includes(currentUser.id) && uid !== currentUser.id && (
                                  <button onClick={() => removeParticipant(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {activeRoom.admins?.includes(currentUser.id) && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                           <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ajouter un membre</p>
                           <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                             {employees.filter(e => !activeRoom.members?.includes(e.id)).slice(0, 5).map(emp => (
                               <button key={emp.id} onClick={() => addParticipant(emp.id)} style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)', background: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>+ {emp.nom}</button>
                             ))}
                           </div>
                        </div>
                      )}

                      <button onClick={leaveGroup} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '0.9rem', background: '#EF444415', color: '#EF4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Quitter le groupe</button>
                    </div>
                  )}

                  <button onClick={() => setShowRoomSettings(false)}
                    style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', borderRadius: '0.9rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
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
                     {employees.filter(e => e.id !== currentUser?.id).map(emp => (
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
                  <button onClick={createRoom} disabled={!newGroupData.label || newGroupData.members.length === 0}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.9rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: (!newGroupData.label || newGroupData.members.length === 0) ? 0.5 : 1 }}>
                    Créer le Groupe
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

         {/* Chat Messages */}
         <div ref={scrollRef} style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(to bottom, transparent, var(--bg-subtle))' }}>
            {messages.filter(m => !searchInChat || m.text.toLowerCase().includes(searchInChat.toLowerCase())).map((msg, i) => {
              const isMe = msg.userId === currentUser?.id;
              const isHovered = hoveredMessage === msg.id;
              const hasReactions = msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions[k].length > 0);

              return (
                <div 
                  key={msg.id || i} 
                  onMouseEnter={() => setHoveredMessage(msg.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                  style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', position: 'relative', marginBottom: hasReactions ? '1rem' : '0' }}
                >
                   {/* Reaction Bar on Hover */}
                   <AnimatePresence>
                      {isHovered && !msg.isDeleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          style={{ position: 'absolute', bottom: '100%', [isMe ? 'right' : 'left']: '0', marginBottom: '8px', background: 'white', borderRadius: '2rem', padding: '4px 8px', display: 'flex', gap: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid var(--border)' }}
                        >
                           {reactionEmojis.map(emoji => (
                             <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', borderRadius: '50%', transition: '0.2s' }}>{emoji}</button>
                           ))}
                           <button onClick={() => setReplyingTo({ id: msg.id, text: msg.text, userName: msg.userName })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }} title="Répondre"><Reply size={14} /></button><button onClick={() => setShowForwardModal(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }} title="Transférer"><Share2 size={14} /></button>{isMe && <button onClick={() => deleteMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#EF4444' }} title="Supprimer"><X size={14} /></button>}
                        </motion.div>
                      )}
                   </AnimatePresence>

                   <div style={{ padding: '1rem 1.25rem', borderRadius: '1.75rem', background: isMe ? '#8B5CF6' : 'white', color: isMe ? 'white' : 'var(--text)', border: isMe ? 'none' : '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, position: 'relative' }}>
                       {msg.replyTo && (
                         <div style={{ background: isMe ? 'rgba(0,0,0,0.1)' : 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', borderLeft: '3px solid var(--nexus-primary)', marginBottom: '0.75rem', fontSize: '0.8rem', opacity: 0.9 }}>
                            <div style={{ fontWeight: 800, color: isMe ? 'white' : 'var(--nexus-primary)' }}>{msg.replyTo.userName}</div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.replyTo.text}</div>
                         </div>
                       )}
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
                          <div style={{ opacity: 0.9 }}>
                            <HighlightText text={msg.text} highlight={searchInChat} />
                          </div>
                        </div>
                      ) : (
                        <HighlightText text={msg.text} highlight={searchInChat} />
                      )}
                      
                      {/* Reactions Display */}
                      {hasReactions && (
                         <div style={{ position: 'absolute', top: '100%', [isMe ? 'right' : 'left']: '10px', marginTop: '-10px', display: 'flex', gap: '4px', background: 'white', padding: '2px 6px', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            {Object.entries(msg.reactions).filter(([, uids]) => uids.length > 0).map(([emoji, uids]) => (
                               <div key={emoji} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span>{emoji}</span>
                                  {uids.length > 1 && <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>{uids.length}</span>}
                               </div>
                            ))}
                         </div>
                      )}

                      <div style={{ marginTop: '6px', fontSize: '0.65rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                         {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Maintenant'} 
                         {isMe && <CheckCheck size={12} color={msg.readBy?.length > 1 ? '#3B82F6' : 'currentColor'} />}
                      </div>
                   </div>
                </div>
              );
            })}
         </div>

         {/* Typing Indicator */}
         <AnimatePresence>
            {typingUsers.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 5 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: 5 }}
                 style={{ padding: '0.5rem 2rem', fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 700, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}
               >
                  <div className="typing-dots">
                     <span /> <span /> <span />
                  </div>
                  {typingUsers.join(', ')} {typingUsers.length > 1 ? 'sont en train d\'écrire...' : 'est en train d\'écrire...'}
               </motion.div>
            )}
         </AnimatePresence>

         {/* Message Input */}
         <form onSubmit={sendMessage} style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 10, height: 0 }}
                  style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '1rem', borderLeft: '4px solid #8B5CF6', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                   <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>Répondre à {replyingTo.userName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyingTo.text}</div>
                   </div>
                   <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
                </motion.div>
              )}
            </AnimatePresence>
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
      )}

          <AnimatePresence>
            {showForwardModal && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '2rem' }}
              >
                 <motion.div 
                   initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                   style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
                 >
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: 'var(--nexus-primary)' }}>Transférer le message</h3>
                       <button type="button" onClick={() => setShowForwardModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                    
                    <div style={{ padding: '1rem 2rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8B5CF6', marginBottom: '4px' }}>Message à transférer:</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{showForwardModal.text}</div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                       <div style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.6 }}>CHOISIR UNE DESTINATION</div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {customRooms.map(room => (
                             <button 
                               key={room.id}
                               type="button"
                               onClick={() => handleForward(room.id)}
                               style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}
                               onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                               onMouseLeave={e => e.currentTarget.style.background = 'white'}
                             >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--nexus-primary-light)', color: 'var(--nexus-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                   <Users size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                   <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{room.label}</div>
                                   <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{room.members?.length} membres</div>
                                </div>
                             </button>
                          ))}
                          <button 
                             type="button"
                             onClick={() => handleForward('team_global')}
                             style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                             <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#8B5CF622', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Hash size={20} />
                             </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Espace Général</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Tout le monde</div>
                             </div>
                          </button>
                       </div>
                    </div>
                 </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
};

export default MessengerTab;
