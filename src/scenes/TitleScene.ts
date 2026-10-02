import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LIVES, TILE } from '../config';
import { sound } from '../audio/Sound';

/**
 * The title screen's words, over a level of the game.
 *
 * Not a picture of the game: the game itself, with nobody playing it. The scene
 * under these words is `GameScene` in title mode, running `TITLE` -- a cut from
 * level 1 with the cat standing on a branch, the real hedgehog and piranhas,
 * and a crow that flies by. This scene owns only the name, the prompt and what
 * happens when a key is pressed.
 *
 * It has no `update` and nothing in it moves except the title bobbing and the
 * prompt pulsing, both on tweens.
 */
export class TitleScene extends Phaser.Scene {
  /** True once the game has been asked for, so a second key cannot ask again. */
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.starting = false;

    // The picture is the real forest, played by `GameScene` with nobody at the
    // controls. It is launched alongside rather than drawn here, so the
    // hedgehog, the piranhas and the crow are the game's own and cannot drift
    // from it. Launched scenes draw above the one that launched them, so this
    // one is lifted back on top.
    this.scene.launch('Game', { title: true });
    this.scene.bringToTop();

    this.addWords();
    this.waitForAnyInput();
  }

  /** The name, whose game it is, and how to begin. */
  private addWords(): void {
    // The cat stands 8 tiles over the ground, which shows two tiles of itself,
    // and is 18 tall: that leaves `room` above its head. A phone has little of
    // it, so the name is sized to fit there instead of landing on the cat.
    const room = GAME_HEIGHT - TILE * 10 - 18 - 8;
    const titleSize = Math.round(Math.min(GAME_WIDTH * 0.09, room * 0.45));
    const titleY = Math.round(titleSize * 0.7 + 6);

    const title = this.add
      .text(GAME_WIDTH / 2, titleY, 'Catnah', {
        fontFamily: 'monospace',
        fontSize: `${titleSize}px`,
        color: '#ffffff',
        stroke: '#2a1d14',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 2400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(GAME_WIDTH / 2, titleY + Math.round(titleSize * 0.5) + 8, 'A Hannah Milatovic Rijkhof Game', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.022)}px`,
        color: '#ffffff',
        stroke: '#2a1d14',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0.85);

    // Bottom right, small and quiet: there for telling one build from another
    // when something is reported, not for reading.
    this.add
      .text(GAME_WIDTH - 4, GAME_HEIGHT - 3, __APP_VERSION__, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.018)}px`,
        color: '#ffffff',
        stroke: '#2a1d14',
        strokeThickness: 2,
      })
      .setOrigin(1, 1)
      .setDepth(1000)
      .setAlpha(0.7);

    // A phone has no keys to press, so it is told what it does have.
    const prompt = this.game.device.input.touch ? 'Tap to start' : 'Press any key to start';

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, prompt, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.026)}px`,
        color: '#ffffff',
        stroke: '#2a1d14',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.25 },
      duration: 900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** Any key, or a tap anywhere. */
  private waitForAnyInput(): void {
    this.input.keyboard?.once('keydown', () => this.begin());
    this.input.once('pointerdown', () => this.begin());
  }

  /**
   * Goes fullscreen, and asks for landscape while it is there.
   *
   * **This has to happen inside the input handler.** A browser only grants
   * fullscreen from a genuine user gesture, so it cannot wait for the camera
   * fade to finish -- by then the gesture is over and the request is refused
   * without a word.
   *
   * On Android Chrome this is the difference between a game and a game with
   * the address bar over it. Everything here is best-effort: a desktop browser
   * may simply not allow the orientation lock, and nothing about the game
   * depends on any of it working.
   */
  private goFullscreen(): void {
    if (!this.scale.fullscreen.available || this.scale.isFullscreen) {
      return;
    }

    try {
      this.scale.startFullscreen();

      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (to: string) => Promise<void>;
      };

      // Refused on desktop and on anything that will not rotate. Caught and
      // dropped: it is a nicety, not a requirement.
      void orientation.lock?.('landscape').catch(() => undefined);
    } catch {
      // Fullscreen refused. The game plays perfectly well in a tab.
    }
  }

  private begin(): void {
    if (this.starting) {
      return;
    }

    this.goFullscreen();

    // The same gesture that grants fullscreen is the one that starts the
    // audio. A context created any other way is stuck suspended for ever, and
    // silently -- no error anywhere.
    sound.unlock();

    this.starting = true;
    this.cameras.main.fade(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', { levelIndex: 0, lives: LIVES });
    });
  }
}
