import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../config';
import { BUTTON_SIZE } from '../art';

type ControlName = 'left' | 'right' | 'jump' | 'sneak' | 'up';

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
 * **Up and jump are separate**, and have to be: climbing and jumping are both
 * things you do going upwards, and sharing a button means you cannot jump off
 * the thing you are climbing.
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
      // Four extra pointers so a player can hold a direction, climb, sneak and
      // jump at once. Phaser tracks only one by default.
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

  /** True while the player wants to go up: climbing, or taking hold of a rope. */
  get up(): boolean {
    return this.cursors.up.isDown || this.keys.W.isDown || this.isButtonDown('up');
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

  /** Samples edge-triggered state. Call once per frame, before reading. */
  update(): void {
    this.jumpHeldLastFrame = this.jumpHeldNow;
    // Space alone on a keyboard. The arrow and W are climbing now.
    this.jumpHeldNow =
      this.cursors.space.isDown ||
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

    // Movement under the left thumb, actions under the right. Climb sits above
    // sneak, so up and down are stacked the way they are on a keyboard.
    const layout: Array<{ name: ControlName; x: number; y: number }> = [
      { name: 'left', x: BUTTON_MARGIN, y: bottom },
      { name: 'right', x: BUTTON_MARGIN * 2 + BUTTON_SIZE, y: bottom },
      {
        name: 'up',
        x: GAME_WIDTH - BUTTON_MARGIN * 2 - BUTTON_SIZE * 2,
        y: bottom - BUTTON_SIZE - BUTTON_MARGIN,
      },
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
