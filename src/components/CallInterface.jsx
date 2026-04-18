import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Minimize2, User, LayoutGrid, UserSquare
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { webrtcService } from '../utils/WebRTCService';
import { useBusiness } from '../BusinessContext';

const CallInterface = ({ 
  isOpen, 
  onClose, 
  callId, // RoomId in group calls
  role, 
  callType, 
  contactName,
  onHangup
}) => {
  const { currentUser } = useBusiness();
  const localVideoRef = useRef();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'speaker'
  const [activeSpeaker, setActiveSpeaker] = useState('local');
  const [remoteParticipants, setRemoteParticipants] = useState({}); // { id: MediaStream }
  
  // Local speaker detection
  const [localSpeaking, setLocalSpeaking] = useState(false);

  // Global hangup listener
  useEffect(() => {
    if (!isOpen || !callId) return;
    const roomRef = doc(db, 'rooms', callId);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === 'ended') {
         webrtcService.hangup(callId, currentUser.id);
         if (onHangup) onHangup();
      }
    });
    return () => unsub();
  }, [isOpen, callId, currentUser.id, onHangup]);

  useEffect(() => {
    if (!isOpen || !callId) return;

    const setupCall = async () => {
      try {
        const stream = await webrtcService.startLocalStream(callType);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Local Speech Detection
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser); // We don't connect to destination to avoid hearing ourselves
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let animationFrameId;
        const checkVolume = () => {
          if (!stream.getAudioTracks()[0]?.enabled) {
             setLocalSpeaking(false);
             animationFrameId = requestAnimationFrame(checkVolume);
             return;
          }
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
          const average = sum / bufferLength;
          if (average > 15) { // Threshold
             setLocalSpeaking(true);
          } else {
             setLocalSpeaking(false);
          }
          animationFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();

        await webrtcService.joinRoom(callId, currentUser.id, currentUser.nom, (streams) => {
          setRemoteParticipants({ ...streams });
        });

        // Cleanup
        return () => {
           if (animationFrameId) cancelAnimationFrame(animationFrameId);
           if (audioCtx.state !== 'closed') audioCtx.close();
        };
      } catch (err) {
        console.error("Group Call Setup Error:", err);
      }
    };

    const cleanup = setupCall();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
         cleanup.then(clean => clean && clean());
      }
      webrtcService.hangup(callId, currentUser.id);
    };
  }, [isOpen, callId, currentUser.id, currentUser.nom, callType]);

  const toggleMic = () => {
    if (webrtcService.localStream) {
      const audioTrack = webrtcService.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (webrtcService.localStream) {
      const videoTrack = webrtcService.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const handleHangup = () => {
    webrtcService.hangup(callId, currentUser.id);
    onHangup();
  };

  const handleRemoteSpeak = (id, isSpeakingStatus) => {
     if (isSpeakingStatus && viewMode === 'speaker') {
        setActiveSpeaker(id);
     }
  };

  if (!isOpen) return null;

  const participantsCount = Object.keys(remoteParticipants).length + 1; // +1 for local

  // Grid logic
  let gridCols = '1fr';
  if (participantsCount === 2) gridCols = '1fr 1fr';
  else if (participantsCount > 2) gridCols = 'repeat(auto-fit, minmax(320px, 1fr))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0F172A', zIndex: 4000,
        display: 'flex', flexDirection: 'column',
        color: 'white'
      }}
    >
      {/* Top Bar / Controls */}
      <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', zIndex: 10 }}>
        <div>
           <h4 style={{ margin: 0, fontWeight: 800 }}>{contactName}</h4>
           <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>{participantsCount} participant{participantsCount > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMode === 'grid' ? <UserSquare size={18} /> : <LayoutGrid size={18} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{viewMode === 'grid' ? 'Mode Orateur' : 'Mode Grille'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', padding: '1rem', overflow: 'hidden' }}>
        {viewMode === 'grid' ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols,
            placeContent: 'center',
            gap: '1rem', height: '100%', width: '100%'
          }}>
            {/* Local Video */}
            <div style={{ position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', background: '#1E293B', border: localSpeaking ? '3px solid #10B981' : '3px solid rgba(255,255,255,0.1)', transition: 'border 0.2s ease-in-out', boxShadow: localSpeaking ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none' }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', fontSize: '0.8rem', fontWeight: 600 }}>Vous</div>
              {!isVideoOn && <div style={{ position: 'absolute', inset: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={64} opacity={0.3} /></div>}
              {localSpeaking && <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '4px', borderRadius: '50%', background: '#10B981' }}><Mic size={14} color="white" /></div>}
            </div>

            {/* Remote Participants */}
            {Object.entries(remoteParticipants).map(([id, stream]) => (
              <RemoteVideo key={id} id={id} stream={stream} onSpeak={(status) => handleRemoteSpeak(id, status)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
             {/* Speaker View - Large Screen */}
             <div style={{ flex: 1, position: 'relative', borderRadius: '2rem', overflow: 'hidden', background: '#1E293B' }}>
                {activeSpeaker === 'local' ? (
                   <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                     <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                     <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Vous</div>
                   </div>
                ) : (
                   remoteParticipants[activeSpeaker] && <RemoteVideo id={activeSpeaker} stream={remoteParticipants[activeSpeaker]} full />
                )}
             </div>

             {/* Bottom Strip of Participants */}
             <div style={{ height: '160px', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <div onClick={() => setActiveSpeaker('local')} style={{ minWidth: '220px', borderRadius: '1rem', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: activeSpeaker === 'local' ? '3px solid #8B5CF6' : (localSpeaking ? '3px solid #10B981' : '3px solid transparent'), transition: '0.2s', boxShadow: localSpeaking && activeSpeaker !== 'local' ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none' }}>
                   <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                   <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>Vous</div>
                </div>
                {Object.entries(remoteParticipants).map(([id, stream]) => (
                  <div key={id} onClick={() => setActiveSpeaker(id)} style={{ minWidth: '220px', borderRadius: '1rem', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: activeSpeaker === id ? '3px solid #8B5CF6' : '3px solid transparent', transition: '0.2s' }}>
                     <RemoteVideo id={id} stream={stream} strip onSpeak={(status) => handleRemoteSpeak(id, status)} isSelected={activeSpeaker === id} />
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <button onClick={toggleMic} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isMicOn ? 'rgba(255,255,255,0.1)' : '#EF4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        {callType === 'video' && (
          <button onClick={toggleVideo} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isVideoOn ? 'rgba(255,255,255,0.1)' : '#EF4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}
        <button onClick={handleHangup} style={{ width: '72px', height: '72px', borderRadius: '24px', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <PhoneOff size={32} />
        </button>
      </div>
    </motion.div>
  );
};

// Helper component for remote video to manage source assignment and AudioContext correctly
const RemoteVideo = ({ id, stream, strip, full, onSpeak, isSelected }) => {
  const videoRef = useRef();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let animationFrameId;
    let audioCtx;
    
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Analyze remote audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && window.AudioContext) {
         try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser); 
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const checkVolume = () => {
              if (videoRef.current?.paused) return; // Cleanup or stopped
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
              const average = sum / bufferLength;
              if (average > 15) {
                 setIsSpeaking(true);
                 if (onSpeak) onSpeak(true);
              } else {
                 setIsSpeaking(false);
                 if (onSpeak) onSpeak(false);
              }
              animationFrameId = requestAnimationFrame(checkVolume);
            };
            checkVolume();
         } catch (e) {
            console.warn("Failed to create AudioContext for remote track", e);
         }
      }
    }
    
    return () => {
       if (animationFrameId) cancelAnimationFrame(animationFrameId);
       if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [stream, onSpeak]);

  const borderColor = isSelected 
     ? 'transparent' 
     : (isSpeaking ? '#10B981' : 'rgba(255,255,255,0.1)');

  return (
    <div style={{ 
      position: 'relative', height: '100%', width: '100%', 
      borderRadius: strip ? 0 : (full ? '2rem' : '1.5rem'), 
      overflow: 'hidden', background: '#1E293B',
      border: (!strip && !full) ? `3px solid ${borderColor}` : 'none',
      boxShadow: (isSpeaking && !strip && !full) ? '0 0 15px rgba(16, 185, 129, 0.4)' : (strip && isSpeaking ? 'inset 0 0 0 3px #10B981' : 'none'),
      transition: 'all 0.2s ease-in-out'
    }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {!strip && (
        <div style={{ position: 'absolute', bottom: full ? '1.5rem' : '1rem', left: full ? '1.5rem' : '1rem', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', fontSize: full ? '0.9rem' : '0.8rem', fontWeight: 600 }}>
          {id.startsWith('dm_') ? 'Contact' : 'Participant'}
        </div>
      )}
      {strip && (
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>
          {id.startsWith('dm_') ? 'Contact' : 'Partic.'}
        </div>
      )}
      {isSpeaking && !strip && <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '4px', borderRadius: '50%', background: '#10B981' }}><Mic size={14} color="white" /></div>}
    </div>
  );
};

export default CallInterface;
