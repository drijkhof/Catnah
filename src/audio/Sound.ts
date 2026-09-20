/**
 * Every sound in the game, synthesised.
 *
 * No audio files, for the same reason there are no image files: the project
 * has no binary assets and runs the moment it is cloned. Each voice below is a
 * few oscillators and an envelope, which is plenty for a bubble, a caw or a
 * cat's feet leaving the ground.
 *
 * **Everything here is quiet on purpose.** These are meant to sit under the
 * game rather than announce themselves -- the master gain is a fifth of full,
 * and no voice runs longer than half a second except the beetle.
 */

/** What can be asked for. */
export type Voice =
  | 'jump'
  | 'wallJump'
  | 'land'
  | 'caw'
  | 'bubble'
  | 'boss'
  | 'scurry'
  | 'nibble'
  | 'collect'
  | 'hurt';

/** Where the mute setting is kept between visits. */
const MUTE_KEY = 'catnah:muted';

/** Overall level. Low: this is background, not a soundtrack. */
const MASTER = 0.2;

class SoundBoard {
  private ctx?: AudioContext;

  private master?: GainNode;

  /** One second of white noise, reused by every voice that needs a hiss. */
  private noise?: AudioBuffer;

  private quiet = SoundBoard.readMuted();

  private static readonly Ctor: typeof AudioContext | undefined =
    typeof window === 'undefined'
      ? undefined
      : window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

  private static readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      // Private windows and blocked storage both throw. Sound on is the better
      // default when we cannot tell.
      return false;
    }
  }

  get muted(): boolean {
    return this.quiet;
  }

  /**
   * Starts the audio, or wakes it up.
   *
   * **Must be called from a user gesture.** Browsers refuse to start an
   * AudioContext any other way, and one created outside a gesture is stuck in
   * `suspended` for ever -- silently, with no error anywhere.
   */
  unlock(): void {
    if (!SoundBoard.Ctor) {
      return;
    }

    if (!this.ctx) {
      this.ctx = new SoundBoard.Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.quiet ? 0 : MASTER;
      this.master.connect(this.ctx.destination);

      const frames = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, frames, frames);
      const data = this.noise.getChannelData(0);

      for (let i = 0; i < frames; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    void this.ctx.resume();
  }

  /** Flips the mute, remembers it, and hands back the new state. */
  toggle(): boolean {
    this.quiet = !this.quiet;

    if (this.master && this.ctx) {
      // Ramped rather than set: a gain that jumps to zero clicks.
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(
        this.quiet ? 0 : MASTER,
        this.ctx.currentTime,
        0.02,
      );
    }

    try {
      localStorage.setItem(MUTE_KEY, this.quiet ? '1' : '0');
    } catch {
      // Not being able to remember it is not a reason to refuse to do it.
    }

    return this.quiet;
  }

  /**
   * Plays one voice.
   *
   * Does nothing at all before `unlock`, and nothing while muted -- muted is
   * checked here as well as on the gain, so a muted game is not quietly
   * building and tearing down dozens of oscillators a second for nothing.
   */
  play(voice: Voice): void {
    if (!this.ctx || !this.master || this.quiet) {
      return;
    }

    const at = this.ctx.currentTime;

    switch (voice) {
      case 'jump':
        this.blip(at, 320, 620, 0.09, 'triangle', 0.5);
        break;

      case 'wallJump':
        this.blip(at, 260, 700, 0.11, 'square', 0.32);
        break;

      case 'land':
        this.thud(at, 0.08, 0.35);
        break;

      case 'collect':
        this.blip(at, 700, 1180, 0.08, 'sine', 0.42);
        break;

      case 'hurt':
        this.blip(at, 420, 90, 0.28, 'sawtooth', 0.5);
        break;

      case 'caw':
        this.caw(at);
        break;

      case 'bubble':
        this.bubble(at);
        break;

      case 'boss':
        this.growl(at);
        break;

      case 'scurry':
        this.hiss(at, 0.05, 2600, 0.16);
        break;

      case 'nibble':
        this.hiss(at, 0.035, 4200, 0.2);
        break;
    }
  }

  /** A tone that slides from one pitch to another. Most voices are one of these. */
  private blip(
    at: number,
    from: number,
    to: number,
    length: number,
    shape: OscillatorType,
    level: number,
  ): void {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = shape;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + length);

    // Straight to level and then down: an attack you can hear the start of.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);

    osc.connect(gain).connect(this.master as GainNode);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }

  /** Filtered noise: feet, teeth, anything dry. */
  private hiss(at: number, length: number, cutoff: number, level: number): void {
    const ctx = this.ctx as AudioContext;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = this.noise as AudioBuffer;
    source.loop = true;
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 1.4;

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);

    source.connect(filter).connect(gain).connect(this.master as GainNode);
    source.start(at, Math.random());
    source.stop(at + length + 0.02);
  }

  /** A soft, low bump. */
  private thud(at: number, length: number, level: number): void {
    this.blip(at, 180, 60, length, 'sine', level);
  }

  /**
   * The crow.
   *
   * Two rasps rather than one, the second lower and shorter, because a caw that
   * is a single burst reads as static and a caw in two parts reads as a bird.
   */
  private caw(at: number): void {
    this.blip(at, 900, 520, 0.12, 'sawtooth', 0.28);
    this.hiss(at, 0.1, 1800, 0.18);
    this.blip(at + 0.14, 700, 380, 0.1, 'sawtooth', 0.22);
    this.hiss(at + 0.14, 0.08, 1500, 0.14);
  }

  /** A lava bubble: down in pitch, fast, and gone. */
  private bubble(at: number): void {
    this.blip(at, 240 + Math.random() * 160, 70, 0.14, 'sine', 0.3);
  }

  /**
   * The beetle.
   *
   * Two saws a few cents apart, which beat against each other and make the
   * sound waver without any modulation. Long and low, and the only voice here
   * that is allowed to be more than a moment.
   */
  private growl(at: number): void {
    const ctx = this.ctx as AudioContext;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, at);
    filter.frequency.exponentialRampToValueAtTime(180, at + 0.5);

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.38, at + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);

    for (const detune of [0, 11]) {
      const osc = ctx.createOscillator();

      osc.type = 'sawtooth';
      osc.frequency.value = 74;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + 0.6);
    }

    filter.connect(gain).connect(this.master as GainNode);
  }
}

/** One board for the whole game. */
export const sound = new SoundBoard();
