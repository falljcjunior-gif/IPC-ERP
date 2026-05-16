import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Minimize2, User
} from 'lucide-react';
import { FirestoreService } from '../services/firestore.service';
import logger from '../utils/logger';
import { webrtcService } from '../utils/WebRTCService';
import { useCurrentUser } from '../store/selectors';

const CallInterface = ({ 
  isOpen, 
  onClose, 
  callId, // RoomId in group calls
  role, 
  callType, 
  contactName,
  onHangup
}) => {
  const currentUser = useCurrentUser();
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');

  const [remoteParticipants, setRemoteParticipants] = useState({}); // { id: MediaStream }
  
  // Local speaker detection
  const [localSpeaking, setLocalSpeaking] = useState(false);

  // Global hangup listener
  const onHangupRef = useRef(onHangup);
  useEffect(() => {
    onHangupRef.current = onHangup;
  }, [onHangup]);

  useEffect(() => {
    if (!isOpen || !callId) return;
    
    // Listen for room ending from any side
    let unsub;
    try {
      unsub = FirestoreService.subscribeToDocument('rooms', callId, (docData) => {
        if (docData?.status === 'ended') {
          webrtcService.hangup(callId, currentUser?.id);
          if (onClose) onClose();
        }
      });
    } catch (err) {
      console.warn('[CallInterface] Firestore non disponible (mode DEV sans auth):', err.message);
    }

    return () => typeof unsub === 'function' && unsub();
  }, [isOpen, callId, currentUser?.id]);

  useEffect(() => {
    if (!isOpen || !callId) return;

    let isMounted = true;
    let audioCtx = null;
    let animationFrameId = null;

    const setupCall = async () => {
      try {
        logger.info(`CallInterface: Setting up WebRTC for room ${callId}`);
        const stream = await webrtcService.startLocalStream(callType);
        if (!isMounted) return;
        setLocalStream(stream);

        // Local Speech Detection
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser); 
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const checkVolume = () => {
          if (!isMounted) return;
          if (!stream.getAudioTracks()[0]?.enabled) {
             setLocalSpeaking(false);
             animationFrameId = requestAnimationFrame(checkVolume);
             return;
          }
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
          const average = sum / bufferLength;
          setLocalSpeaking(average > 15);
          animationFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();

        await webrtcService.joinRoom(callId, currentUser?.id, currentUser?.nom, (streams) => {
          if (isMounted) setRemoteParticipants({ ...streams });
        });
      } catch (err) {
        logger.error("Group Call Setup Error:", err);
      }
    };

    setupCall();

    return () => {
      logger.info(`CallInterface: Cleaning up WebRTC for room ${callId}`);
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      // On ne raccroche ici QUE si on ferme vraiment l'interface
      // webrtcService.hangup est géré par handleHangup ou le listener global
    };
  }, [isOpen, callId, currentUser?.id, currentUser?.nom, callType]);

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
    // Instant UI feedback: close the overlay first
    if (onClose) onClose();
    
    // Background the heavy cleanup
    webrtcService.hangup(callId, currentUser?.id).catch(err => {
      logger.error("Hangup background error:", err);
    });
  };



  if (!isOpen) return null;

  const participantsCount = Object.keys(remoteParticipants).length + 1; // +1 for local

  // Grid logic
  let gridCols = '1fr';
  if (participantsCount === 2) gridCols = '1fr 1fr';
  else if (participantsCount > 2) gridCols = 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))';

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

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', padding: '1rem', overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols,
            placeContent: 'center',
            gap: '1rem', height: '100%', width: '100%'
          }}>
            {/* Local Video */}
            <div style={{ position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', background: '#1E293B', border: localSpeaking ? '3px solid #10B981' : '3px solid rgba(255,255,255,0.1)', transition: 'border 0.2s ease-in-out', boxShadow: localSpeaking ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none' }}>
              <video ref={el => { if (el && el.srcObject !== localStream) el.srcObject = localStream; }} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', fontSize: '0.8rem', fontWeight: 600 }}>Vous</div>
              {!isVideoOn && <div style={{ position: 'absolute', inset: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={64} opacity={0.3} /></div>}
              {localSpeaking && <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '4px', borderRadius: '50%', background: '#10B981' }}><Mic size={14} color="white" /></div>}
            </div>

            {/* Remote Participants */}
            {Object.entries(remoteParticipants).map(([id, stream]) => (
              <RemoteVideo key={id} id={id} stream={stream} />
            ))}
          </div>
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
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(e => {
          logger.warn(`[CallInterface] Autoplay prevented for ${id}`, e);
          // Fallback: Show a "Click to unmute" button if needed, 
          // but usually user interaction happened already.
        });
      };
      
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
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Hidden audio element to ensure audio plays even if video is broken/invisible */}
      <audio ref={el => { if (el && el.srcObject !== stream) { el.srcObject = stream; el.play().catch(() => {}); } }} autoPlay style={{ display: 'none' }} />
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
