/**
 * SoundEngine - Synthetic sound generator to avoid external asset failures.
 * Provides reliable UX feedback even in restricted network environments.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.ringtoneInterval = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playNote(freq, startTime, duration, volume = 0.3) {
    this.init();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  startRingtone() {
    this.stopRingtone();
    this.init();
    
    const playPattern = () => {
      const now = this.audioCtx.currentTime;
      // Modern "soft" ringtone pattern
      this.playNote(660, now, 0.2);
      this.playNote(880, now + 0.3, 0.4);
    };

    playPattern();
    this.ringtoneInterval = setInterval(playPattern, 2000);
  }

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  playNotification() {
    this.init();
    const now = this.audioCtx.currentTime;
    this.playNote(880, now, 0.1, 0.1);
    this.playNote(1100, now + 0.1, 0.2, 0.1);
  }
}

export const soundEngine = new SoundEngine();
