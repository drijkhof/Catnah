import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../config';
import { BUTTON_SIZE } from '../art';

type ControlName = 'left' | 'right' | 'jump' | 'sneak';

/** A rectangular on-screen touch target, in game-pixel coordinates. */
interface TouchButton {
  name: ControlName;
  x: number;
  y: number;
  width: number;
  height: number;
}

const BUTTON_MARGIN = 12;

/**
 * One input surface for both platforms.
 *
 * Gameplay code never asks "is this a phone?" -- it reads `left`, `right`, `up`,
 * `sneak`, `jumpJustPressed` and `jumpHeld`, and this class merges keyboard and
 * touch into those answers.
 *
 * **Up and jump are one input.** Space, the up arrow and W all do the same
 * thing, and there is one button for it on a phone. They were split once so
 * that a climbing cat could jump off what it was holding, and that cost more
 * than it bought: two buttons for one intention is not something a hand does
 * well, least of all a thumb. What "up" means is decided by where the cat is --
 * on the ground it jumps, on a rope it climbs, in water it swims up -- and
 * `Player` is what decides it.
 *
 * `update()` must be called once at the top of the scene's update, before
 * anything reads the edge-triggered `jumpJustPressed` or `directionJustPressed`.
 */
export class Controls {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly buttons: TouchButton[] = [];

  private jumpHeldNow = false;
  private jumpHeldLastFrame = false;

  private directionHeldNow = 0;
  private directionHeldLastFrame = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Controls requires the keyboard input plugin to be enabled.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    if (scene.game.device.input.touch) {
      // Four extra pointers so a player can hold a direction, sneak and jump at
      // once. Phaser tracks only one by default.
      scene.input.addPointer(4);
      this.createTouchUi();
    }
  }

  /** True while the player wants to move backwards. */
  get left(): boolean {
    return this.cursors.left.isDown || this.keys.A.isDown || this.isButtonDown('left');
  }

  /** True while the player wants to move forwards. */
  get right(): boolean {
    return this.cursors.right.isDown || this.keys.D.isDown || this.isButtonDown('right');
  }

  /**
   * True while the player is asking to go up.
   *
   * The same input as `jumpHeld`, deliberately -- read it by this name where
   * what is meant is "upwards" (climbing a rope, swimming) rather than "jump".
   */
  get up(): boolean {
    return this.jumpHeldNow;
  }

  /** True while the player wants to sneak: low, flat and slow. */
  get sneak(): boolean {
    return this.cursors.down.isDown || this.keys.S.isDown || this.isButtonDown('sneak');
  }

  /** True on the single frame the jump input goes from released to pressed. */
  get jumpJustPressed(): boolean {
    return this.jumpHeldNow && !this.jumpHeldLastFrame;
  }

  /** True for as long as the jump input is held, used for variable jump height. */
  get jumpHeld(): boolean {
    return this.jumpHeldNow;
  }

  /**
   * True on the single frame a horizontal direction goes from none to pressed,
   * or from one side straight to the other.
   *
   * Only climbing needs this: leaping off a rope is "up plus a direction", and
   * that has to fire whichever of the two the hand happens to press second.
   */
  get directionJustPressed(): boolean {
    return this.directionHeldNow !== 0 && this.directionHeldNow !== this.directionHeldLastFrame;
  }

  /** Samples edge-triggered state. Call once per frame, before reading. */
  update(): void {
    this.jumpHeldLastFrame = this.jumpHeldNow;
    this.jumpHeldNow =
      this.cursors.space.isDown ||
      this.keys.SPACE.isDown ||
      this.cursors.up.isDown ||
      this.keys.W.isDown ||
      this.isButtonDown('jump');

    this.directionHeldLastFrame = this.directionHeldNow;
    this.directionHeldNow = (this.right ? 1 : 0) - (this.left ? 1 : 0);
  }

  /**
   * Hit-tests every active pointer against a button rectangle, rather than
   * relying on per-object pointerdown/pointerup handlers.
   *
   * On a small screen fingers slide while pressed. With pointer events, sliding
   * a thumb a few pixels off the button fires `pointerout` and silently drops
   * the input, so the cat keeps running or stops dead. Testing every frame
   * means the input reflects where the finger actually is.
   */
  private isButtonDown(name: ControlName): boolean {
    const button = this.buttons.find((candidate) => candidate.name === name);
    if (!button) {
      return false;
    }

    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown) {
        continue;
      }

      // The touch UI is pinned to the viewport (scroll factor 0), so pointer
      // positions can be compared directly without the camera scroll.
      if (
        pointer.x >= button.x &&
        pointer.x <= button.x + button.width &&
        pointer.y >= button.y &&
        pointer.y <= button.y + button.height
      ) {
        return true;
      }
    }

    return false;
  }

  private createTouchUi(): void {
    const bottom = GAME_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN;

    // Movement under the left thumb, actions under the right. Three buttons,
    // not four: jump and climb share one, which is the whole point of them
    // being one input.
    const layout: Array<{ name: ControlName; x: number; y: number }> = [
      { name: 'left', x: BUTTON_MARGIN, y: bottom },
      { name: 'right', x: BUTTON_MARGIN * 2 + BUTTON_SIZE, y: bottom },
      { name: 'sneak', x: GAME_WIDTH - BUTTON_MARGIN * 2 - BUTTON_SIZE * 2, y: bottom },
      { name: 'jump', x: GAME_WIDTH - BUTTON_MARGIN - BUTTON_SIZE, y: bottom },
    ];

    for (const { name, x, y } of layout) {
      this.buttons.push({
        name,
        x,
        y,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      });

      this.scene.add
        .image(x, y, `ui-${name}`)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(0.35)
        .setTint(COLORS.uiButton);
    }
  }
}
