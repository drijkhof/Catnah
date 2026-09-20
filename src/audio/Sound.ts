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
  | 'hurt'
  | 'gameOver'
  | 'ratLeap'
  | 'chirp'
  | 'drip';

/**
 * The bed a level sits on: one continuous, almost-inaudible layer.
 *
 * Not music, and not a loop of a recording either -- filtered noise with a slow
 * swell on it, which is what wind and rain actually are. The swell is what makes
 * it feel like it has a pulse without ever being a rhythm you could tap to.
 */
export type Ambience = 'none' | 'wind' | 'rain' | 'rumble' | 'hush';

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

  /** The level's bed, and what it currently is. */
  private bed?: { source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode };

  private bedKind: Ambience = 'none';

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

      case 'gameOver':
        this.gameOver(at);
        break;

      case 'ratLeap':
        this.shriek(at);
        break;

      case 'chirp':
        this.chirp(at);
        break;

      case 'drip':
        this.blip(at, 1400, 420, 0.13, 'sine', 0.16);
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
        // Barely there. It was four times this and sounded like a machine.
        this.hiss(at, 0.028, 3400, 0.04);
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
   * The end of a run: three notes falling away.
   *
   * A minor triad downwards, each one quieter than the last. It is the only
   * thing in the game that is allowed to sound like a tune, because it is the
   * only moment that is allowed to be an ending.
   */
  private gameOver(at: number): void {
    const notes = [392, 311, 233];

    notes.forEach((hz, i) => {
      this.blip(at + i * 0.22, hz, hz * 0.99, 0.5, 'triangle', 0.34 - i * 0.07);
    });
  }

  /**
   * A rat leaping at your face.
   *
   * Sharp, up rather than down, and the loudest thing in the game by some way.
   * That is the whole point of it: everything else here is meant to sit under
   * the game, and this is meant to come out of it.
   */
  private shriek(at: number): void {
    this.blip(at, 900, 2100, 0.1, 'sawtooth', 0.55);
    this.hiss(at, 0.12, 3000, 0.4);
    this.blip(at + 0.03, 1500, 700, 0.14, 'square', 0.25);
  }

  /** A bird, two or three notes, never quite the same twice. */
  private chirp(at: number): void {
    const root = 1500 + Math.random() * 900;
    const notes = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < notes; i += 1) {
      const step = 1 + (Math.random() * 0.5 - 0.15);

      this.blip(at + i * 0.075, root * step, root * step * 1.35, 0.05, 'sine', 0.12);
    }
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

  /**
   * Puts a level's bed underneath everything, or takes it away.
   *
   * One noise source through one filter, with a slow oscillator on the gain so
   * it swells and falls. Cheap enough to leave running for ever and quiet
   * enough that you notice it only when it stops.
   *
   * Changing to the same bed does nothing, so calling this on every level start
   * is safe and does not restart the wind between two swamp levels.
   */
  setAmbience(kind: Ambience): void {
    if (!this.ctx || !this.master || kind === this.bedKind) {
      return;
    }

    this.stopAmbience();
    this.bedKind = kind;

    if (kind === 'none') {
      return;
    }

    const shape = {
      // Mid, wandering: leaves in it.
      wind: { type: 'bandpass' as BiquadFilterType, hz: 620, q: 0.7, level: 0.085, breath: 0.09 },
      // High and even: water on stone, and no pitch to speak of.
      rain: { type: 'highpass' as BiquadFilterType, hz: 1900, q: 0.4, level: 0.075, breath: 0.22 },
      // Under everything, felt more than heard.
      rumble: { type: 'lowpass' as BiquadFilterType, hz: 150, q: 0.9, level: 0.16, breath: 0.13 },
      // Almost nothing: the sound of a big room with nobody in it.
      hush: { type: 'lowpass' as BiquadFilterType, hz: 420, q: 0.8, level: 0.05, breath: 0.05 },
    }[kind];

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const depth = this.ctx.createGain();

    source.buffer = this.noise as AudioBuffer;
    source.loop = true;

    filter.type = shape.type;
    filter.frequency.value = shape.hz;
    filter.Q.value = shape.q;

    // Fades in rather than starting: a bed that appears is a bed you hear.
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(shape.level, this.ctx.currentTime + 2.5);

    // The swell. Slow, and different per bed, so rain patters and wind breathes.
    lfo.type = 'sine';
    lfo.frequency.value = kind === 'rain' ? 0.9 : 0.16;
    depth.gain.value = shape.breath;
    lfo.connect(depth).connect(gain.gain);

    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    lfo.start();

    this.bed = { source, gain, lfo };
  }

  /** Takes the bed away, fading it rather than cutting it. */
  stopAmbience(): void {
    if (!this.bed || !this.ctx) {
      this.bedKind = 'none';
      return;
    }

    const { source, gain, lfo } = this.bed;
    const at = this.ctx.currentTime;

    gain.gain.cancelScheduledValues(at);
    gain.gain.setTargetAtTime(0.0001, at, 0.3);
    source.stop(at + 1.5);
    lfo.stop(at + 1.5);

    this.bed = undefined;
    this.bedKind = 'none';
  }
}

/** One board for the whole game. */
export const sound = new SoundBoard();
