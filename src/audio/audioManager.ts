// Web Audio sound design: everything is synthesised (no audio files), off until the visitor enables it.

export type UiSound = 'change' | 'enter' | 'benefits' | 'click' | 'open' | 'growl' | 'add' | 'whoosh';

type Tone = { type: OscillatorType; from: number; to: number; duration: number; gain: number; delay?: number };

/** Short tonal cues: quiet, metallic, tuned to sit together (A major). */
const TONES: Partial<Record<UiSound, Tone[]>> = {
  click: [{ type: 'triangle', from: 1400, to: 900, duration: 0.05, gain: 0.12 }],
  change: [
    { type: 'sine', from: 660, to: 880, duration: 0.18, gain: 0.08 },
    { type: 'triangle', from: 1760, to: 2200, duration: 0.12, gain: 0.025, delay: 0.03 },
  ],
  enter: [
    { type: 'sine', from: 880, to: 870, duration: 0.14, gain: 0.1 },
    { type: 'sine', from: 1320, to: 1310, duration: 0.16, gain: 0.06, delay: 0.07 },
  ],
  benefits: [
    { type: 'sine', from: 330, to: 660, duration: 0.42, gain: 0.08 },
    { type: 'triangle', from: 990, to: 1980, duration: 0.3, gain: 0.02, delay: 0.05 },
  ],
  add: [
    { type: 'sine', from: 880, to: 880, duration: 0.12, gain: 0.09 },
    { type: 'sine', from: 1108, to: 1108, duration: 0.14, gain: 0.08, delay: 0.06 },
    { type: 'sine', from: 1320, to: 1320, duration: 0.3, gain: 0.07, delay: 0.12 },
  ],
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = true; // off until explicitly enabled
  private unlocked = false;
  private navLock = false;
  private navLockTimer: ReturnType<typeof setTimeout> | null = null;
  private masterGain: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambient: { gain: GainNode; nodes: AudioScheduledSourceNode[] } | null = null;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.attachGestureUnlock();
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend().catch(() => {});
        else if (!this.muted) this.ctx.resume().catch(() => {});
      });
    }
  }

  /** master -> compressor -> out, plus a short generated room reverb on a send bus. */
  private initContext() {
    if (this.ctx || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    this.ctx = ctx;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    compressor.connect(ctx.destination);
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(compressor);

    const reverb = ctx.createConvolver();
    const length = Math.floor(ctx.sampleRate * 1.6);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.2;
    }
    reverb.buffer = impulse;
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.22;
    this.reverbSend.connect(reverb);
    reverb.connect(this.masterGain);

    const noiseLength = ctx.sampleRate * 2;
    this.noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
    const noise = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) noise[i] = Math.random() * 2 - 1;
  }

  private attachGestureUnlock() {
    const events = ['click', 'pointerdown', 'touchstart', 'keydown', 'wheel'] as const;
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended' && !this.muted) this.ctx.resume().catch(() => {});
      this.unlocked = true;
      events.forEach((name) => window.removeEventListener(name, unlock));
    };
    events.forEach((name) => window.addEventListener(name, unlock, { passive: true }));
  }

  /** Sends a node to the dry bus and (a little) to the reverb bus. */
  private route(node: AudioNode, wet = 1) {
    if (!this.masterGain) return;
    node.connect(this.masterGain);
    if (this.reverbSend && wet > 0) {
      const send = this.ctx!.createGain();
      send.gain.value = wet;
      node.connect(send);
      send.connect(this.reverbSend);
    }
  }

  private ready(): AudioContext | null {
    if (this.muted || this.navLock) return null;
    this.initContext();
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Filtered noise burst: the building block for whoosh, crack, fizz and breath. */
  private noise(at: number, duration: number, filter: BiquadFilterType, from: number, to: number, gain: number, q = 1, wet = 1) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = 0.9 + Math.random() * 0.2;
    const biquad = ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.Q.value = q;
    biquad.frequency.setValueAtTime(from, at);
    biquad.frequency.exponentialRampToValueAtTime(to, at + duration);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.05, duration * 0.3));
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(biquad);
    biquad.connect(amp);
    this.route(amp, wet);
    source.start(at, Math.random() * 1.5);
    source.stop(at + duration + 0.05);
  }

  private tones(at: number, voices: Tone[], volume: number) {
    const ctx = this.ctx!;
    for (const voice of voices) {
      const start = at + (voice.delay ?? 0);
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.from, start);
      oscillator.frequency.exponentialRampToValueAtTime(voice.to, start + voice.duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(voice.gain * volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
      oscillator.connect(gain);
      this.route(gain, 0.8);
      oscillator.start(start);
      oscillator.stop(start + voice.duration + 0.02);
    }
  }

  public play(name: UiSound, volume = 1.0) {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    try {
      switch (name) {
        case 'whoosh':
          this.noise(t, 0.42, 'bandpass', 380, 2600, 0.16 * volume, 1.4, 0.6);
          break;
        case 'change':
          // air moves as the ring turns, then the new can rings
          this.noise(t, 0.38, 'bandpass', 420, 2400, 0.12 * volume, 1.2, 0.5);
          this.tones(t + 0.12, TONES.change!, volume);
          break;
        case 'open':
          // tab crack, the hiss of gas, then fizz with random bead pops
          this.noise(t, 0.05, 'highpass', 2500, 1800, 0.5 * volume, 0.7, 0.4);
          this.noise(t + 0.02, 0.5, 'highpass', 5200, 2800, 0.12 * volume, 0.5, 0.3);
          this.noise(t + 0.1, 1.5, 'bandpass', 6500, 4200, 0.05 * volume, 0.6, 0.6);
          for (let i = 0; i < 14; i += 1) {
            this.noise(t + 0.15 + Math.random() * 1.2, 0.012, 'bandpass', 3000 + Math.random() * 5000, 4000, 0.06 * volume, 6, 0.3);
          }
          break;
        case 'growl': {
          // low rumble with a breathy edge: the bear, felt more than heard
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(62, t);
          osc.frequency.linearRampToValueAtTime(78, t + 0.35);
          osc.frequency.linearRampToValueAtTime(48, t + 1.1);
          const wobble = ctx.createOscillator();
          wobble.frequency.value = 23;
          const wobbleGain = ctx.createGain();
          wobbleGain.gain.value = 9;
          wobble.connect(wobbleGain);
          wobbleGain.connect(osc.frequency);
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(240, t);
          lowpass.frequency.linearRampToValueAtTime(520, t + 0.3);
          lowpass.frequency.linearRampToValueAtTime(160, t + 1.1);
          const amp = ctx.createGain();
          amp.gain.setValueAtTime(0.0001, t);
          amp.gain.exponentialRampToValueAtTime(0.28 * volume, t + 0.12);
          amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          osc.connect(lowpass);
          lowpass.connect(amp);
          this.route(amp, 0.7);
          osc.start(t);
          wobble.start(t);
          osc.stop(t + 1.25);
          wobble.stop(t + 1.25);
          this.noise(t, 1.0, 'bandpass', 700, 300, 0.06 * volume, 0.8, 0.6);
          break;
        }
        default:
          this.tones(t, TONES[name] ?? [], volume);
      }
    } catch {
      // Audio is decorative: a failure must never interrupt the page.
    }
  }

  /** Metallic strike for hovering a can: fundamental plus a 2.76× overtone. */
  public playCanHover(frequency = 360, volume = 0.2) {
    const ctx = this.ready();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      this.tones(t, [
        { type: 'sine', from: frequency, to: frequency * 0.97, duration: 0.22, gain: volume * 0.5 },
        { type: 'triangle', from: frequency * 2.76, to: frequency * 2.65, duration: 0.14, gain: volume * 0.16 },
      ], 1);
    } catch {
      // Ignored
    }
  }

  /** Quiet low pad under the page while sound is on: two detuned voices, slow filter drift. */
  private startAmbient() {
    if (this.ambient || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 3);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 420;
    lowpass.Q.value = 0.7;
    const nodes: AudioScheduledSourceNode[] = [];
    [55, 82.4, 110.3].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      osc.detune.value = (i - 1) * 7;
      osc.connect(lowpass);
      osc.start(t);
      nodes.push(osc);
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start(t);
    nodes.push(lfo);
    lowpass.connect(gain);
    this.route(gain, 0.5);
    this.ambient = { gain, nodes };
  }

  private stopAmbient() {
    if (!this.ambient || !this.ctx) return;
    const { gain, nodes } = this.ambient;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    nodes.forEach((node) => node.stop(t + 0.7));
    this.ambient = null;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.unlocked = true;
      this.startAmbient();
      this.play('enter');
    } else {
      this.stopAmbient();
    }
    this.notify();
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public lockNav(durationMs = 1800) {
    this.navLock = true;
    if (this.navLockTimer) clearTimeout(this.navLockTimer);
    this.navLockTimer = setTimeout(() => {
      this.navLock = false;
    }, durationMs);
  }

  public subscribe(callback: (muted: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.muted);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.muted));
  }
}

export const audioManager = new AudioManager();
