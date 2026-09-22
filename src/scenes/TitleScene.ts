import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LIVES, TILE } from '../config';
import { Backdrop } from '../world/Backdrop';
import { tileKey } from '../art';
import { sound } from '../audio/Sound';

/** Height of the strip of forest floor along the bottom, in pixels. */
const GROUND_HEIGHT = TILE * 2;

/**
 * The title screen.
 *
 * Not a picture of the game: the game itself, with nobody playing it. The same
 * forest backdrop the first level uses, the same cat, crow, hedgehog and
 * piranha textures, all of them moving. It costs a few tweens and it says more
 * about what this is than any arrangement of static sprites would.
 *
 * Nothing here has a physics body. Everything is on a tween, so the scene has
 * no `update` at all and cannot drift out of step with the game it advertises.
 */
export class TitleScene extends Phaser.Scene {
  /** True once the game has been asked for, so a second key cannot ask again. */
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.starting = false;

    const groundY = GAME_HEIGHT - GROUND_HEIGHT;

    new Backdrop(this, GAME_WIDTH, groundY);
    this.addGround(groundY);
    this.addPool(groundY);
    this.addCast(groundY);
    this.addWords();
    this.waitForAnyInput();
  }

  /** A strip of forest floor for the cast to stand on. */
  private addGround(groundY: number): void {
    for (let x = 0; x < GAME_WIDTH; x += TILE) {
      this.add
        .image(x, groundY, tileKey('forest', 'ground-top'))
        .setOrigin(0, 0)
        .setDepth(-5);

      this.add
        .image(x, groundY + TILE, tileKey('forest', 'ground-fill'))
        .setOrigin(0, 0)
        .setDepth(-5);
    }
  }

  /**
   * A puddle in the floor with something in it.
   *
   * Cut into the left-hand end, well away from the cat, so the piranha's jump
   * reads as a threat rather than as part of the cat's walk.
   */
  private addPool(groundY: number): void {
    const left = TILE * 2;
    const width = TILE * 3;

    for (let x = left; x < left + width; x += TILE) {
      this.add
        .image(x, groundY, tileKey('forest', 'water-bed'))
        .setOrigin(0, 0)
        .setDepth(-5);

      this.add
        .image(x, groundY, tileKey('forest', 'water-surface'))
        .setOrigin(0, 0)
        .setAlpha(0.62)
        .setDepth(6);

      this.add
        .image(x, groundY+TILE, tileKey('forest', 'water-bed'))
        .setOrigin(0, 0)
        .setDepth(-5);

      this.add
        .image(x, groundY+TILE, tileKey('forest', 'water'))
        .setOrigin(0, 0)
        .setAlpha(0.62)
        .setDepth(6);

      this.add
        .image(x, groundY+1.5*TILE, tileKey('forest', 'ground-top'))
        .setOrigin(0, 0)
        .setDepth(-5);

    }

    const fish = this.add
      .image(left + width / 2, groundY + TILE, 'piranha')
      .setDepth(5)
      .setAngle(-70);

    // Out of the water and back, then a long wait. The pause is most of the
    // effect: a fish that leaps constantly is a decoration, one that leaps now
    // and then is a fish.
    this.tweens.add({
      targets: fish,
      y: groundY - TILE,
      angle: { from: -70, to: -110 },
      duration: 520,
      ease: 'Sine.easeOut',
      yoyo: true,
      repeat: -1,
      repeatDelay: 2200,
    });
  }

  /** The cat, a hedgehog it is ignoring, and a crow overhead. */
  private addCast(groundY: number): void {
    const cat = this.add
      .image(GAME_WIDTH * 0.35, groundY + 1, 'cat')
      .setOrigin(0.5, 1)
      .setDepth(10);

    this.tweens.add({
      targets: cat,
      x: GAME_WIDTH * 0.7,
      duration: 4200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      // The cat has to turn round at each end, or it moonwalks back.
      onYoyo: () => cat.setFlipX(true),
      onRepeat: () => cat.setFlipX(false),
    });

    const hedgehog = this.add
      .image(GAME_WIDTH * 0.9, groundY + 1, 'hedgehog')
      .setOrigin(0.5, 1)
      .setFlipX(true)
      .setDepth(9);

    this.tweens.add({
      targets: hedgehog,
      x: GAME_WIDTH * 0.62,
      duration: 5600,
      yoyo: true,
      repeat: -1,
      onYoyo: () => hedgehog.setFlipX(false),
      onRepeat: () => hedgehog.setFlipX(true),
    });

    const crow = this.add
      .image(-TILE, GAME_HEIGHT * 0.3, 'crow')
      .setDepth(11);

    // Two tweens on one bird: a steady crossing and a slower rise and fall.
    // Their periods do not divide into each other, so the path never repeats
    // exactly and the crow looks like it is flying rather than sliding.
    this.tweens.add({
      targets: crow,
      x: GAME_WIDTH + TILE,
      duration: 7000,
      repeat: -1,
      onRepeat: () => crow.setX(-TILE),
    });

    this.tweens.add({
      targets: crow,
      y: GAME_HEIGHT * 0.16,
      duration: 1900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** The name, whose game it is, and how to begin. */
  private addWords(): void {
    // Sized off the viewport rather than fixed, because a phone renders fewer
    // game pixels and a fixed size would fill the screen there.
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.26, 'Catnah', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.09)}px`,
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.26 + Math.round(GAME_WIDTH * 0.08), 'A Hannah Milatovic Rijkhof Game', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.022)}px`,
        color: '#ffffff',
        stroke: '#2a1d14',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0.85);

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
