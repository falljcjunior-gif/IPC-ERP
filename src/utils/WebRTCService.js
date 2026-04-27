import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collectionGroup, 
  query, 
  where,
  getDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export class WebRTCService {
  constructor() {
    this.pcs = new Map(); // { participantId: RTCPeerConnection }
    this.localStream = null;
    this.remoteStreams = new Map(); // { participantId: MediaStream }
    this.roomUnsubscribe = null;
    this.signalUnsubscribes = {};
    this.candidateQueues = {}; // { participantId: [candidates] }
  }

  async startLocalStream(type = 'video') {
    if (this.localStream) return this.localStream;
    const constraints = {
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
      audio: true,
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.localStream;
  }

  // Multi-party Room Joing (Mesh)
  async joinRoom(roomId, userId, userName, onParticipantsUpdate) {
    const roomRef = doc(db, 'rooms', roomId);
    const participantRef = doc(collection(roomRef, 'participants'), userId);

    // 1. Register self
    await setDoc(participantRef, {
      userId,
      userName,
      joinedAt: serverTimestamp()
    });

    // 2. Listen for other participants
    this.roomUnsubscribe = onSnapshot(collection(roomRef, 'participants'), async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const participant = change.doc.data();
        if (participant.userId === userId) return; // Skip self

        if (change.type === 'added') {
          // New participant joined. 
          // Compare strings to deterministically decide who initiates the offer
          if (userId < participant.userId) {
            this.initiatePeerConnection(roomId, userId, participant.userId, onParticipantsUpdate);
          }
        } else if (change.type === 'removed') {
          this.closePeerConnection(participant.userId);
          if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
        }
      });
    });

    // 3. Listen for incoming signals (Offers/Answers/Candidates targeted to ME)
    const signalsRef = collection(roomRef, 'signals');
    const signalsQuery = query(signalsRef, where('targetId', '==', userId));
    
    this.signalUnsubscribes[userId] = onSnapshot(signalsQuery, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          if (signal.type === 'offer') {
            await this.handleOffer(roomId, userId, signal, onParticipantsUpdate);
          } else if (signal.type === 'answer') {
            await this.handleAnswer(signal);
          } else if (signal.type === 'candidate') {
            await this.handleCandidate(signal);
          }
          // Remove signal document after processing to keep it clean
          await deleteDoc(doc(signalsRef, change.doc.id));
        }
      });
    });
  }

  async initiatePeerConnection(roomId, myId, targetId, onParticipantsUpdate) {
    const pc = new RTCPeerConnection(servers);
    this.pcs.set(targetId, pc);

    pc.oniceconnectionstatechange = () => {
      logger.info(`ICE Connection State (${targetId}): ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Optionnel: Tenter une renégociation ou informer l'UI
      }
    };

    pc.onconnectionstatechange = () => {
      logger.info(`Peer Connection State (${targetId}): ${pc.connectionState}`);
    };

    pc.ontrack = (event) => {
      if (!this.remoteStreams.has(targetId)) {
        this.remoteStreams.set(targetId, new MediaStream());
      }
      event.streams[0].getTracks().forEach(track => this.remoteStreams.get(targetId).addTrack(track));
      if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(roomId, myId, targetId, { type: 'candidate', candidate: event.candidate.toJSON() });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.sendSignal(roomId, myId, targetId, { type: 'offer', sdp: offer.sdp });
  }

  async handleOffer(roomId, myId, signal, onParticipantsUpdate) {
    const targetId = signal.senderId;
    const pc = new RTCPeerConnection(servers);
    this.pcs.set(targetId, pc);

    pc.oniceconnectionstatechange = () => {
      logger.info(`ICE Connection State (${targetId}): ${pc.iceConnectionState}`);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    }

    pc.ontrack = (event) => {
      if (!this.remoteStreams.has(targetId)) {
        this.remoteStreams.set(targetId, new MediaStream());
      }
      event.streams[0].getTracks().forEach(track => this.remoteStreams.get(targetId).addTrack(track));
      if (onParticipantsUpdate) onParticipantsUpdate(Object.fromEntries(this.remoteStreams));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(roomId, myId, targetId, { type: 'candidate', candidate: event.candidate.toJSON() });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
    
    // Process queued candidates if any
    const queue = this.candidateQueues[targetId] || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    delete this.candidateQueues[targetId];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.sendSignal(roomId, myId, targetId, { type: 'answer', sdp: answer.sdp });
  }

  async handleAnswer(signal) {
    const pc = this.pcs.get(signal.senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      
      // Process queued candidates
      const queue = this.candidateQueues[signal.senderId] || [];
      while (queue.length > 0) {
        const candidate = queue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      delete this.candidateQueues[signal.senderId];
    }
  }

  async handleCandidate(signal) {
    const pc = this.pcs.get(signal.senderId);
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } else {
      // Queue candidate if remote description not set yet
      if (!this.candidateQueues[signal.senderId]) {
        this.candidateQueues[signal.senderId] = [];
      }
      this.candidateQueues[signal.senderId].push(signal.candidate);
    }
  }

  async sendSignal(roomId, senderId, targetId, data) {
    const signalsRef = collection(db, 'rooms', roomId, 'signals');
    await addDoc(signalsRef, { ...data, senderId, targetId, createdAt: serverTimestamp() });
  }

  closePeerConnection(participantId) {
    const pc = this.pcs.get(participantId);
    if (pc) {
      pc.close();
      this.pcs.delete(participantId);
    }
    if (this.remoteStreams.has(participantId)) {
      this.remoteStreams.delete(participantId);
    }
  }

  async leaveRoom(roomId, userId) {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    if (this.signalUnsubscribes[userId]) {
      this.signalUnsubscribes[userId]();
      delete this.signalUnsubscribes[userId];
    }
    
    // Close all connections
    this.pcs.forEach((pc, id) => this.closePeerConnection(id));
    
    // Delete participant from Firestore room
    if (roomId && userId) {
      const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
      try {
        await deleteDoc(participantRef);
      } catch (e) {
        console.error("Error deleting participant from room", e);
      }
    }
  }

  async hangup(roomId, userId) {
    await this.leaveRoom(roomId, userId);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

export const webrtcService = new WebRTCService();
