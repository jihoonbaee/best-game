// Thornwatch — all sound is synthesized with WebAudio oscillators.
// No audio files are shipped; every effect is a few lines of synthesis.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastPlay = {};
  }

  // Must be called from a user gesture at least once (browser autoplay rule).
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.25;
    return this.muted;
  }

  // One short tone. `type` is an oscillator shape, `slide` bends the pitch.
  tone(freq, dur, type = 'sine', volume = 1, slide = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  // Rate-limited so a volley of towers does not stack into noise.
  throttle(name, ms) {
    const now = performance.now();
    if (this.lastPlay[name] && now - this.lastPlay[name] < ms) return false;
    this.lastPlay[name] = now;
    return true;
  }

  click() { this.tone(660, 0.06, 'triangle', 0.5); }
  place() {
    this.tone(320, 0.09, 'triangle', 0.7);
    this.tone(480, 0.12, 'triangle', 0.6, 0, 0.05);
  }
  error() { this.tone(160, 0.12, 'square', 0.35, -60); }
  shoot(kind) {
    if (!this.throttle('shoot', 70)) return;
    if (kind === 'thorn') this.tone(880, 0.05, 'square', 0.22, -220);
    else if (kind === 'frost') this.tone(1180, 0.09, 'sine', 0.3, 240);
    else if (kind === 'root') this.tone(220, 0.12, 'sawtooth', 0.3, -90);
    else this.tone(300, 0.14, 'triangle', 0.4, -140);
  }
  pop() {
    if (!this.throttle('pop', 60)) return;
    this.tone(520, 0.07, 'sine', 0.4, -260);
  }
  coin() {
    if (!this.throttle('coin', 90)) return;
    this.tone(990, 0.07, 'sine', 0.35);
    this.tone(1320, 0.1, 'sine', 0.3, 0, 0.06);
  }
  leak() {
    this.tone(140, 0.3, 'sawtooth', 0.5, -70);
    this.tone(98, 0.35, 'square', 0.35, -30, 0.08);
  }
  waveStart() {
    this.tone(392, 0.12, 'triangle', 0.5);
    this.tone(523, 0.12, 'triangle', 0.5, 0, 0.1);
    this.tone(659, 0.18, 'triangle', 0.5, 0, 0.2);
  }
  sunburst() {
    this.tone(523, 0.4, 'sine', 0.5, 520);
    this.tone(784, 0.4, 'sine', 0.4, 390, 0.05);
  }
  victory() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.5, 0, i * 0.14));
  }
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.45, 0, i * 0.18));
  }
}
