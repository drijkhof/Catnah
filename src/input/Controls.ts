import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../config';
import { BUTTON_SIZE } from '../art';

type ControlName = 'left' | 'right' | 'jump' | 'duck';

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
 * Gameplay code never asks "is this a phone?" -- it reads `left`, `right`,
 * `down`, `jumpJustPressed` and `jumpHeld`, and this class merges keyboard and
 * touch into those answers.
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
    this.keys = keyboard.addKeys('W,A,S,D,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    if (scene.game.device.input.touch) {
      // Three extra pointers so a player can hold a direction, crouch and jump
      // at the same time. Phaser tracks only one by default.
      scene.input.addPointer(3);
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

  /** True while the player wants to crouch. */
  get down(): boolean {
    return this.cursors.down.isDown || this.keys.S.isDown || this.isButtonDown('duck');
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

    // Movement under the left thumb, actions under the right.
    const layout: Array<{ name: ControlName; x: number }> = [
      { name: 'left', x: BUTTON_MARGIN },
      { name: 'right', x: BUTTON_MARGIN * 2 + BUTTON_SIZE },
      { name: 'duck', x: GAME_WIDTH - BUTTON_MARGIN * 2 - BUTTON_SIZE * 2 },
      { name: 'jump', x: GAME_WIDTH - BUTTON_MARGIN - BUTTON_SIZE },
    ];

    for (const { name, x } of layout) {
      this.buttons.push({
        name,
        x,
        y: bottom,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      });

      this.scene.add
        .image(x, bottom, `ui-${name}`)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(0.35)
        .setTint(COLORS.uiButton);
    }
  }
}
