/**
 * Web Audio API synthesizer for tactile, zero-dependency sound effects.
 * No external MP3/WAV assets required — guaranteed to work 100% reliably in any browser.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      const saved = localStorage.getItem('uno_sound_enabled');
      if (saved !== null) this.enabled = saved === 'true';
    } catch (_) {}
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('uno_sound_enabled', String(this.enabled));
    } catch (_) {}
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  // ─── Sound Effects ──────────────────────────────────────────────────────────

  /** Tactile click when a card is selected or played */
  playCard() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Slick card slide when drawing from deck */
  drawCard() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** Riffle card shuffle sound effect */
  shuffleDeck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const start = this.ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const t = start + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(260 + Math.random() * 220, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  /** Dramatic woosh when the game flips between Light & Dark */
  flipWoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pitch sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  /** Resonant triumphant fanfare chime when UNO button is pressed */
  unoShout() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Stage 1: Explosive major triad chord (C5, E5, G5, C6)
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 3 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.04 + 0.15);

      gain.gain.setValueAtTime(0.3, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + idx * 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + 0.75 + idx * 0.04);
    });

    // Stage 2: Shimmer resonance
    const shim = this.ctx.createOscillator();
    const shimGain = this.ctx.createGain();
    shim.type = 'sine';
    shim.frequency.setValueAtTime(1046.5, now + 0.15);
    shim.frequency.exponentialRampToValueAtTime(1318.5, now + 0.5);
    shimGain.gain.setValueAtTime(0.2, now + 0.15);
    shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    shim.connect(shimGain);
    shimGain.connect(this.ctx.destination);
    shim.start(now + 0.15);
    shim.stop(now + 0.85);
  }

  /** Dramatic emergency siren & buzzer when Caught is called */
  caughtAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Multi-pulse emergency siren siren: High -> Low -> High -> Low
    const pulses = [
      { start: 0, freq1: 960, freq2: 580, dur: 0.18 },
      { start: 0.2, freq1: 1040, freq2: 520, dur: 0.25 },
      { start: 0.46, freq1: 880, freq2: 440, dur: 0.3 },
    ];

    pulses.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.freq1, now + p.start);
      osc.frequency.exponentialRampToValueAtTime(p.freq2, now + p.start + p.dur);

      gain.gain.setValueAtTime(0.35, now + p.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.start + p.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + p.start);
      osc.stop(now + p.start + p.dur + 0.01);
    });
  }

  /** Soft alert when it's your turn */
  turnNotice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /** Victorious fanfare when match is won */
  victoryFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.3, d: 0.15 },
      { f: 1046.50, t: 0.45, d: 0.6 },
    ];

    const start = this.ctx.currentTime;
    notes.forEach(({ f, t, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start + t);

      gain.gain.setValueAtTime(0.25, start + t);
      gain.gain.exponentialRampToValueAtTime(0.001, start + t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start + t);
      osc.stop(start + t + d + 0.05);
    });
  }

  /** General UI micro-click */
  buttonClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Playful pop sound for speech bubbles and emoji reactions */
  chatPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.07);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Ascending celebratory chime for XP gain or level progression */
  levelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.28);
    });
  }

  /** Tactile vibration on mobile devices (no-op on desktop) */
  vibrate(pattern = 25) {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(pattern);
      }
    } catch (_) {}
  }
}

export const sound = new SoundEngine();
export default sound;
