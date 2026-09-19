import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * How long the screen holds before it will take an input, ms.
 *
 * A death is usually a keypress or a tap, and without this the same press that
 * killed you also dismisses the message before it has been read.
 */
const HOLD_MS = 900;

/** How long it waits before going back to the title on its own, ms. */
const LINGER_MS = 6000;

/**
 * The end of a run: black, with one line of red.
 *
 * Deliberately nothing else. No score, no scenery, no cat -- the title screen
 * is where the game starts and this is where it stops, and the only thing that
 * has to land is that it stopped.
 */
export class GameOverScene extends Phaser.Scene {
  private ready = false;

  private leaving = false;

  constructor() {
    super('GameOver');
  }

  create(): void {
    this.ready = false;
    this.leaving = false;

    this.cameras.main.setBackgroundColor('#000000');

    const text = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'YOU UNALIVED', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.075)}px`,
        color: '#e0202a',
      })
      .setOrigin(0.5);

    // Readable from the first frame, and *then* given a slow pulse. Fading it
    // up from nothing was prettier and meant the one thing this screen exists
    // to say depended on a tween having run.
    this.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0.7 },
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

    this.time.delayedCall(LINGER_MS, () => this.leave());
  }

  /** Back to the title, where a new run starts. */
  private leave(): void {
    if (!this.ready || this.leaving) {
      return;
    }

    this.leaving = true;
    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
  }
}
