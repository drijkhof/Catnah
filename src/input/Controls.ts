import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../config';

/** A rectangular on-screen touch target, in game-pixel coordinates. */
interface TouchButton {
  key: 'left' | 'right' | 'jump';
  x: number;
  y: number;
  width: number;
  height: number;
  image?: Phaser.GameObjects.Image;
}

const BUTTON_SIZE = 56;
const BUTTON_MARGIN = 12;

/**
 * One input surface for both platforms.
 *
 * Gameplay code never asks "is this a phone?" -- it reads `left`, `right`,
 * `jumpJustPressed` and `jumpHeld`, and this class merges keyboard and touch
 * into those four answers.
 *
 * `update()` must be called once at the top of the scene's update, before
 * anything reads the edge-triggered `jumpJustPressed`.
 */
export class Controls {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly buttons: TouchButton[] = [];

  private jumpHeldNow = false;
  private jumpHeldLastFrame = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Controls requires the keyboard input plugin to be enabled.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,D,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    if (scene.game.device.input.touch) {
      // Two extra pointers so a player can hold a direction and jump at the
      // same time. Phaser tracks only one by default.
      scene.input.addPointer(2);
      this.createTouchUi();
    }
  }

  /** True while the player wants to move left. */
  get left(): boolean {
    return (
      this.cursors.left.isDown || this.keys.A.isDown || this.isButtonDown('left')
    );
  }

  /** True while the player wants to move right. */
  get right(): boolean {
    return (
      this.cursors.right.isDown || this.keys.D.isDown || this.isButtonDown('right')
    );
  }

  /** True on the single frame the jump input goes from released to pressed. */
  get jumpJustPressed(): boolean {
    return this.jumpHeldNow && !this.jumpHeldLastFrame;
  }

  /** True for as long as the jump input is held, used for variable jump height. */
  get jumpHeld(): boolean {
    return this.jumpHeldNow;
  }

  /** Samples edge-triggered state. Call once per frame, before reading. */
  update(): void {
    this.jumpHeldLastFrame = this.jumpHeldNow;
    this.jumpHeldNow =
      this.cursors.up.isDown ||
      this.cursors.space.isDown ||
      this.keys.W.isDown ||
      this.keys.SPACE.isDown ||
      this.isButtonDown('jump');
  }

  /**
   * Hit-tests every active pointer against a button rectangle, rather than
   * relying on per-object pointerdown/pointerup events. Fingers slide around
   * mid-press on a small screen, and a slide off the edge of a d-pad should not
   * silently drop the input.
   */
  private isButtonDown(key: TouchButton['key']): boolean {
    const button = this.buttons.find((candidate) => candidate.key === key);
    if (!button) {
      return false;
    }

    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown) {
        continue;
      }

      // Pointer positions arrive in screen space; the camera scroll is ignored
      // because the touch UI is pinned to the viewport (scroll factor 0).
      const x = pointer.x;
      const y = pointer.y;

      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        return true;
      }
    }

    return false;
  }

  private createTouchUi(): void {
    const bottom = GAME_HEIGHT - BUTTON_SIZE - BUTTON_MARGIN;

    this.buttons.push(
      {
        key: 'left',
        x: BUTTON_MARGIN,
        y: bottom,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      },
      {
        key: 'right',
        x: BUTTON_MARGIN * 2 + BUTTON_SIZE,
        y: bottom,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      },
      {
        key: 'jump',
        x: GAME_WIDTH - BUTTON_SIZE - BUTTON_MARGIN,
        y: bottom,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      },
    );

    for (const button of this.buttons) {
      const image = this.scene.add
        .image(button.x, button.y, `ui-${button.key}`)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(0.35)
        .setTint(COLORS.uiButton);

      button.image = image;
    }
  }
}
