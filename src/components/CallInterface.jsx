import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Maximize2, 
  Minimize2,
  User
} from 'lucide-react';
import { webrtcService } from '../utils/WebRTCService';

const CallInterface = ({ 
  isOpen, 
  onClose, 
  callId, 
  role, // 'caller' | 'receiver'
  callType, // 'video' | 'audio'
  contactName,
  onHangup
}) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [status, setStatus] = useState('connecting');
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const setupCall = async () => {
      try {
        const stream = await webrtcService.startLocalStream(callType);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const onRemote = (rStream) => {
          setRemoteStream(rStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          setStatus('connected');
        };

        if (role === 'caller') {
          // If we are the caller, createCall has already been called
          // We attach to the existing remote stream in the singleton
          if (webrtcService.remoteStream) {
            setRemoteStream(webrtcService.remoteStream);
            // We listen for tracks if they haven't arrived yet
            webrtcService.pc.ontrack = (event) => {
              event.streams[0].getTracks().forEach((track) => {
                webrtcService.remoteStream.addTrack(track);
              });
              onRemote(webrtcService.remoteStream);
            };
            // If already has tracks, set status
            if (webrtcService.remoteStream.getTracks().length > 0) {
              onRemote(webrtcService.remoteStream);
            }
          }
        } else {
          await webrtcService.answerCall(callId, onRemote);
        }
      } catch (err) {
        console.error("Call Setup Error:", err);
        setStatus('error');
      }
    };

    setupCall();

    return () => {
      webrtcService.hangup(callId);
    };
  }, [isOpen, callId, role, callType]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    webrtcService.hangup(callId);
    onHangup();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0F172A', zIndex: 4000,
        display: 'flex', flexDirection: 'column',
        color: 'white', fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Remote Video (Full Screen) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {callType === 'video' ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px var(--accent)40' }}>
               <User size={80} />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{contactName}</h2>
            <p style={{ opacity: 0.6, letterSpacing: '2px' }}>{status === 'connected' ? 'APPEL EN COURS' : 'RECHERCHE...'}</p>
          </div>
        )}

        {/* Local Video Preview (Picture in Picture) */}
        {callType === 'video' && (
          <motion.div 
            drag
            dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 220, bottom: window.innerHeight - 170 }}
            style={{ 
              position: 'absolute', top: '2rem', right: '2rem', 
              width: '200px', height: '150px', borderRadius: '1rem', 
              overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10,
              background: '#1E293B'
            }}
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {!isVideoOn && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoOff size={32} opacity={0.5} />
              </div>
            )}
          </motion.div>
        )}

        {/* Overlay Info */}
        {status === 'connecting' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div className="pulse-button" style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600, opacity: 0.8 }}>Établissement de la connexion sécurisée...</p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{ 
        height: '120px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem',
        paddingBottom: '1rem'
      }}>
        <button 
          onClick={toggleMic}
          style={{ 
            width: '56px', height: '56px', borderRadius: '50%', 
            background: isMicOn ? 'rgba(255,255,255,0.1)' : '#EF4444', 
            border: 'none', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.2s'
          }}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {callType === 'video' && (
          <button 
            onClick={toggleVideo}
            style={{ 
              width: '56px', height: '56px', borderRadius: '50%', 
              background: isVideoOn ? 'rgba(255,255,255,0.1)' : '#EF4444', 
              border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: '0.2s'
            }}
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}

        <button 
          onClick={handleHangup}
          style={{ 
            width: '72px', height: '72px', borderRadius: '24px', 
            background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)',
            transition: '0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PhoneOff size={32} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .pulse-button { animation: pulse 2s infinite; }
      `}</style>
    </motion.div>
  );
};

export default CallInterface;
