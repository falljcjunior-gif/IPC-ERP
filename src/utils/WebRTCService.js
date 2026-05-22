import { FirestoreService } from '../services/firestore.service';
import logger from './logger';

// ── ICE Servers Configuration ─────────────────────────────────────────────────
// STUN : gratuit, fonctionne pour ~70% des réseaux
// TURN : requis pour NAT strict, réseaux d'entreprise, VPN
// Configurez VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL dans .env
// Pour la production → https://www.metered.ca/ ou Coturn auto-hébergé
const buildIceServers = () => {
  const iceServers = [
    // STUN Google (haute disponibilité)
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    // STUN Metered en secours
    { urls: 'stun:stun.relay.metered.ca:80' },
  ];

  const turnUrl  = import.meta.env.VITE_TURN_URL;
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUser && turnCred) {
    iceServers.push(
      { urls: [turnUrl],                         username: turnUser, credential: turnCred },
      { urls: [turnUrl.replace(/:\d+$/, ':443')], username: turnUser, credential: turnCred },
    );
    logger.info('[WebRTC] TURN server configuré depuis .env');
  } else {
    // ── Fallback TURN public (bande passante limitée — usage dev/test uniquement) ──
    // Pour la production, déployez votre propre Coturn ou utilisez Metered.ca
    logger.warn('[WebRTC] TURN dédié absent → fallback public (OpenRelay). Configurer VITE_TURN_* pour la prod.');
    iceServers.push(
      { urls: 'turn:openrelay.metered.ca:80',              username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443',             username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    );
  }

  return iceServers;
};

// servers est construit à l'initialisation — les env vars sont disponibles via Vite au build time
const servers = {
  iceServers: buildIceServers(),
  iceCandidatePoolSize: 10,
};

export class WebRTCService {
  constructor() {
    this.pcs = new Map(); // { participantId: RTCPeerConnection }
    this.localStream = null;
    this.remoteStreams = new Map(); // { participantId: MediaStream }
    this.candidateQueues = {}; // { participantId: RTCIceCandidateInit[] }
    this.unsubscribeParticipants = null;
    this.unsubscribeSignals = null;
    this.processedSignals = new Set();
  }

  async startLocalStream(type = 'video') {
    if (this.localStream) {
      logger.info('[WebRTC] Local stream already active, réutilisation.');
      return this.localStream;
    }

    const constraints = {
      video: type === 'video'
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        : false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    logger.info(`[WebRTC] Demande getUserMedia — type: ${type}`, constraints);

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      const tracks = this.localStream.getTracks().map(t => `${t.kind}:${t.label}`);
      logger.info(`[WebRTC] ✅ Local stream obtenu. Tracks: ${tracks.join(', ')}`);
      return this.localStream;
    } catch (err) {
      // Diagnostic précis selon le type d'erreur
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        logger.error('[WebRTC] ❌ Accès caméra/micro refusé par l\'utilisateur ou le navigateur.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        logger.error('[WebRTC] ❌ Aucun périphérique audio/vidéo trouvé.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        logger.error('[WebRTC] ❌ Périphérique déjà utilisé par une autre application.');
      } else if (err.name === 'OverconstrainedError') {
        logger.warn('[WebRTC] Contraintes non supportées — tentative avec contraintes réduites...');
        // Retry with minimal constraints
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        });
        return this.localStream;
      } else {
        logger.error('[WebRTC] ❌ getUserMedia erreur:', err);
      }
      throw err;
    }
  }

  // Multi-party Room Joining (Mesh Architecture)
  async joinRoom(roomId, userId, userName, onParticipantsUpdate) {
    logger.info(`[WebRTC] Joining room: ${roomId} as ${userName}`);
    
    // 1. Ensure room exists (Defensive)
    const room = await FirestoreService.getDocument('rooms', roomId);
    if (!room) {
      await FirestoreService.setDocument('rooms', roomId, {
        status: 'active',
        createdAt: new Date(),
        type: 'call'
      });
    } else if (room.status === 'ended') {
      // Re-activate room if it was ended
      await FirestoreService.updateDocument('rooms', roomId, { status: 'active' });
    }

    // 2. Register self defensively
    await FirestoreService.setDocument(`rooms/${roomId}/participants`, userId, {
      userId,
      userName,
      joinedAt: new Date()
    });

    // 3. Listen for other participants
    this.unsubscribeParticipants = FirestoreService.subscribeToCollection(
      `rooms/${roomId}/participants`,
      {},
      (participants) => {
        // Setup peer connections for newcomers
        participants.forEach(participant => {
          if (participant.userId !== userId && !this.pcs.has(participant.userId)) {
            // Deterministic offerer selection (lowest ID initiates)
            if (userId < participant.userId) {
              this.setupPeerConnection(roomId, userId, participant.userId, onParticipantsUpdate);
            }
          }
        });
        
        // Cleanup disconnected peers
        this.pcs.forEach((pc, pid) => {
          if (!participants.find(p => p.userId === pid)) {
            this.closePeerConnection(pid);
          }
        });

        if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
      }
    );

    // 4. Listen for incoming signals
    this.unsubscribeSignals = FirestoreService.subscribeToCollection(
      `rooms/${roomId}/signals`,
      { filters: [['to', '==', userId]] },
      async (signals) => {
        for (const signal of signals) {
          if (this.processedSignals.has(signal.id)) continue;
          this.processedSignals.add(signal.id);
          
          try {
            await this.handleSignal(roomId, userId, signal, onParticipantsUpdate);
          } catch (err) {
            logger.error(`[WebRTC] Error handling signal: ${err.message}`);
          } finally {
            FirestoreService.deleteDocument(`rooms/${roomId}/signals`, signal.id).catch(() => {});
          }
        }
      }
    );
  }

  async handleSignal(roomId, myId, signal, onParticipantsUpdate) {
    const data = JSON.parse(signal.signal);
    const senderId = signal.from;

    if (data.type === 'offer') {
      await this.handleOffer(roomId, myId, senderId, data, onParticipantsUpdate);
    } else if (data.type === 'answer') {
      await this.handleAnswer(senderId, data);
    } else if (data.type === 'candidate') {
      await this.handleCandidate(senderId, data);
    }
  }

  async sendSignal(roomId, from, to, signal) {
    await FirestoreService.addDocument(`rooms/${roomId}/signals`, {
      from,
      to,
      signal: JSON.stringify(signal),
      timestamp: new Date()
    });
  }

  async setupPeerConnection(roomId, myId, targetId, onParticipantsUpdate) {
    const pc = new RTCPeerConnection(servers);
    this.pcs.set(targetId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.info(`[WebRTC] ICE candidate → ${targetId}: ${event.candidate.type} ${event.candidate.protocol}`);
        this.sendSignal(roomId, myId, targetId, { type: 'candidate', candidate: event.candidate.toJSON() });
      } else {
        logger.info(`[WebRTC] ICE gathering complete for ${targetId}`);
      }
    };

    pc.onicegatheringstatechange = () => {
      logger.info(`[WebRTC] ICE gathering state with ${targetId}: ${pc.iceGatheringState}`);
    };

    pc.oniceconnectionstatechange = () => {
      logger.info(`[WebRTC] ICE connection state with ${targetId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        logger.warn(`[WebRTC] ICE failed with ${targetId} — tentative de restart ICE...`);
        // ICE restart: renegotiate with new ICE credentials
        pc.restartIce();
        // Create a new offer with iceRestart
        pc.createOffer({ iceRestart: true }).then(offer => {
          pc.setLocalDescription(offer);
          this.sendSignal(roomId, myId, targetId, { type: 'offer', sdp: offer.sdp, iceRestart: true });
        }).catch(err => logger.error('[WebRTC] ICE restart offer failed:', err));
      } else if (pc.iceConnectionState === 'disconnected') {
        // 'disconnected' can be transient (e.g. brief network hiccup) — wait before closing
        logger.warn(`[WebRTC] ICE disconnected with ${targetId} — attente de reconnexion...`);
        // If it stays disconnected for 5s, close
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            logger.warn(`[WebRTC] Connection with ${targetId} definitivement perdue — fermeture.`);
            this.closePeerConnection(targetId);
            if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
          }
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      logger.info(`[WebRTC] Connection state with ${targetId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        logger.info(`[WebRTC] ✅ Connexion établie avec ${targetId}`);
      } else if (pc.connectionState === 'failed') {
        logger.error(`[WebRTC] ❌ Connexion définitivement échouée avec ${targetId}`);
        this.closePeerConnection(targetId);
        if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
      }
    };

    pc.ontrack = (event) => {
      logger.info(`[WebRTC] Received track from ${targetId}: ${event.track.kind} (readyState: ${event.track.readyState})`);
      
      let remoteStream;
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
      } else {
        remoteStream = this.remoteStreams.get(targetId) || new MediaStream();
        remoteStream.addTrack(event.track);
      }
      
      this.remoteStreams.set(targetId, remoteStream);
      if (onParticipantsUpdate) onParticipantsUpdate({ ...Object.fromEntries(this.remoteStreams) });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.sendSignal(roomId, myId, targetId, { type: 'offer', sdp: offer.sdp });
  }

  async handleOffer(roomId, myId, senderId, signal, onParticipantsUpdate) {
    const pc = new RTCPeerConnection(servers);
    this.pcs.set(senderId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.info(`[WebRTC] ICE candidate → ${senderId}: ${event.candidate.type} ${event.candidate.protocol}`);
        this.sendSignal(roomId, myId, senderId, { type: 'candidate', candidate: event.candidate.toJSON() });
      } else {
        logger.info(`[WebRTC] ICE gathering complete for ${senderId}`);
      }
    };

    pc.onicegatheringstatechange = () => {
      logger.info(`[WebRTC] ICE gathering state with ${senderId}: ${pc.iceGatheringState}`);
    };

    pc.oniceconnectionstatechange = () => {
      logger.info(`[WebRTC] ICE connection state with ${senderId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        logger.warn(`[WebRTC] ICE failed with ${senderId} (answerer) — fermeture.`);
        this.closePeerConnection(senderId);
        if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
      } else if (pc.iceConnectionState === 'disconnected') {
        logger.warn(`[WebRTC] ICE disconnected with ${senderId} — attente de reconnexion...`);
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            this.closePeerConnection(senderId);
            if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
          }
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      logger.info(`[WebRTC] Connection state with ${senderId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        logger.info(`[WebRTC] ✅ Connexion établie avec ${senderId}`);
      } else if (pc.connectionState === 'failed') {
        logger.error(`[WebRTC] ❌ Connexion définitivement échouée avec ${senderId}`);
        this.closePeerConnection(senderId);
        if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
      }
    };

    pc.ontrack = (event) => {
      logger.info(`[WebRTC] Received track from ${senderId}: ${event.track.kind} (readyState: ${event.track.readyState})`);
      
      let remoteStream;
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
      } else {
        remoteStream = this.remoteStreams.get(senderId) || new MediaStream();
        remoteStream.addTrack(event.track);
      }

      this.remoteStreams.set(senderId, remoteStream);
      if (onParticipantsUpdate) onParticipantsUpdate({ ...Object.fromEntries(this.remoteStreams) });
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
    
    // Process queued candidates
    const queue = this.candidateQueues[senderId] || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    delete this.candidateQueues[senderId];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this.sendSignal(roomId, myId, senderId, { type: 'answer', sdp: answer.sdp });
  }

  async handleAnswer(senderId, signal) {
    const pc = this.pcs.get(senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      
      const queue = this.candidateQueues[senderId] || [];
      while (queue.length > 0) {
        const candidate = queue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      delete this.candidateQueues[senderId];
    }
  }

  async handleCandidate(senderId, signal) {
    const pc = this.pcs.get(senderId);
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } else {
      if (!this.candidateQueues[senderId]) this.candidateQueues[senderId] = [];
      this.candidateQueues[senderId].push(signal.candidate);
    }
  }

  closePeerConnection(participantId) {
    logger.info(`[WebRTC] Closing peer connection with ${participantId}`);
    const pc = this.pcs.get(participantId);
    if (pc) {
      pc.close();
      this.pcs.delete(participantId);
    }
    this.remoteStreams.delete(participantId);
  }

  async leaveRoom(roomId, userId) {
    logger.info(`[WebRTC] leavingRoom called for room: ${roomId}, user: ${userId}`);
    if (this.unsubscribeParticipants) {
      logger.info("[WebRTC] Unsubscribing from participants");
      this.unsubscribeParticipants();
      this.unsubscribeParticipants = null;
    }
    if (this.unsubscribeSignals) {
      logger.info("[WebRTC] Unsubscribing from signals");
      this.unsubscribeSignals();
      this.unsubscribeSignals = null;
    }
    
    if (roomId && userId) {
      await FirestoreService.deleteDocument(`rooms/${roomId}/participants`, userId);
    }
    
    this.pcs.forEach((pc, id) => {
      logger.info(`[WebRTC] Closing peer ${id} during leaveRoom`);
      pc.close();
    });
    this.pcs.clear();
    this.remoteStreams.clear();
    
    if (this.localStream) {
      logger.info("[WebRTC] Stopping local stream tracks");
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  async hangup(roomId, userId) {
    logger.info(`[WebRTC] Hangup called for room: ${roomId}`);
    await this.leaveRoom(roomId, userId);
  }
}

export const webrtcService = new WebRTCService();
