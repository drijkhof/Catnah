import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * How long the screen holds before it will take an input, ms.
 *
 * A death is usually a keypress or a tap, and without this the same press that
 * killed you also dismisses the message before it has been read.
 */
const HOLD_MS = 900;

/**
 * The end of a run, laid over the game rather than replacing it.
 *
 * `GameScene` pauses itself and drains the colour out of its own camera, so
 * what is underneath is the exact frame the cat died on, in black and white and
 * perfectly still. This scene adds one word to it, in red, and that red is the
 * only colour left on the screen.
 *
 * It is an overlay and not a picture of its own on purpose: a black screen
 * tells you the game stopped; a frozen, colourless one tells you *where* it
 * stopped and what stopped it.
 */
export class GameOverScene extends Phaser.Scene {
  private ready = false;

  private leaving = false;

  constructor() {
    // Transparent, so the paused game shows through it.
    super({ key: 'GameOver' });
  }

  create(): void {
    this.ready = false;
    this.leaving = false;

    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    const text = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Game Over', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.09)}px`,
        color: '#e0202a',
        stroke: '#1a0507',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2000);

    // Readable from the first frame, and *then* given a slow pulse. Fading it
    // up was prettier and made the one thing this screen exists to say depend
    // on a tween having run.
    this.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0.72 },
      duration: 1100,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(HOLD_MS, () => {
      this.ready = true;

      this.input.keyboard?.once('keydown', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    });
  }

  /** Back to the title, where a new run starts. */
  private leave(): void {
    if (!this.ready || this.leaving) {
      return;
    }

    this.leaving = true;

    // The game underneath is paused, not stopped. It has to be stopped here or
    // it stays paused for ever behind the title screen.
    this.scene.stop('Game');
    this.scene.start('Title');
  }
}
