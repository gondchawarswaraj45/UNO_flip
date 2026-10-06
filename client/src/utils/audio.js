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

  // ─── Hilarious Meme Sound Effects ──────────────────────────────────────────

  /** The infamous Vine Boom — Deep resonant sub-bass 808 shockwave */
  memeVineBoom() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Secondary sub-click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(140, now);
    click.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    clickGain.gain.setValueAtTime(0.5, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(now);
    click.stop(now + 0.07);
  }

  /** Emotional Damage dramatic discord sting */
  memeEmotionalDamage() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [415.3, 440, 622.25].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.92, now + 0.4);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  /** Classic Sad Trombone (Wah-wah-wah-waaaah) failure slide */
  memeSadTrombone() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 293.66, t: 0.00, d: 0.22 }, // D4
      { f: 277.18, t: 0.25, d: 0.22 }, // C#4
      { f: 261.63, t: 0.50, d: 0.22 }, // C4
      { f: 246.94, t: 0.75, d: 0.60, slide: 185 }, // B3 slide down
    ];

    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (n.slide) {
        osc.frequency.exponentialRampToValueAtTime(n.slide, now + n.t + n.d);
      }

      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }

  /** Reggae MLG Triple Airhorn Blast */
  memeAirhorn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const blasts = [0.0, 0.12, 0.24];
    blasts.forEach((offset) => {
      [466.16, 698.46, 932.33].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    });
  }

  /** Dramatic Dun Dun Dun! (3 suspense brass stabs) */
  memeDunDunDun() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const stabs = [
      { f: 196.00, t: 0.0,  d: 0.18 }, // G3
      { f: 207.65, t: 0.22, d: 0.18 }, // G#3
      { f: 220.00, t: 0.44, d: 0.55 }, // A3 dramatic hold
    ];

    stabs.forEach((s) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(s.f, now + s.t);

      gain.gain.setValueAtTime(0.3, now + s.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + s.t + s.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + s.t);
      osc.stop(now + s.t + s.d + 0.02);
    });
  }

  /** Comedic Bruh downward vocal sweep */
  memeBruh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.28);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  }

  /** Punchy comedic Roblox OOF pitch drop */
  memeRobloxOof() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** GigaChad power brass cadence */
  memeGigaChad() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 174.61, t: 0.00, d: 0.14 },
      { f: 207.65, t: 0.14, d: 0.14 },
      { f: 261.63, t: 0.28, d: 0.14 },
      { f: 311.13, t: 0.42, d: 0.45 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.2, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
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
