import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TOUCH, TOUCH_PREVIEW } from '../config';
import { BUTTON_SIZE, STICK_SIZE } from '../art';

const BUTTON_MARGIN = 12;

/** What the cat asks of whoever is steering it. */
export interface PlayerInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly up: boolean;
  /** Down: sneaking on the ground, climbing down, swimming down. */
  readonly sneak: boolean;
  /**
   * The jump input: the keyboard's up key (`↑`, `W`) or the touch button.
   * On a keyboard up and jump are therefore one key; the touch stick pushed
   * up is `up` and never a jump, or every diagonal shove would be one.
   */
  readonly jumpJustPressed: boolean;
  readonly jumpHeld: boolean;
}

/**
 * Nobody at the controls. The title screen's cat stands where it was put, and
 * this is how: no keyboard listeners, and no touch buttons on a phone.
 */
export class IdleControls implements PlayerInput {
  readonly left = false;
  readonly right = false;
  readonly up = false;
  readonly sneak = false;
  readonly jumpJustPressed = false;
  readonly jumpHeld = false;

  update(): void {}
}

/**
 * One input surface for both platforms.
 *
 * Gameplay code never asks "is this a phone?" -- it reads `left`, `right`, `up`,
 * `sneak` (down), `jumpJustPressed` and `jumpHeld`, and this class merges
 * keyboard and touch into those answers.
 *
 * **Up and jump are separate.** Keyboard: arrows or WASD steer, Space jumps.
 * Touch: a stick under the left thumb steers in four directions, a jump button
 * sits under the right. That is what lets a climbing cat jump straight up off a
 * rope, and just climb without leaping -- see `input/CLAUDE.md`.
 *
 * `update()` must be called once at the top of the scene's update, before
 * anything reads the edge-triggered `jumpJustPressed`.
 */
export class Controls implements PlayerInput {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;

  private touchUi = false;
  private stickX = 0;
  private stickY = 0;
  private stickCenterX = 0;
  private stickCenterY = 0;
  private stickKnob?: Phaser.GameObjects.Image;
  private jumpTouched = false;

  private jumpHeldNow = false;
  private jumpHeldLastFrame = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Controls requires the keyboard input plugin to be enabled.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    if (scene.game.device.input.touch || TOUCH_PREVIEW) {
      // Four extra pointers so a player can steer and jump at once. Phaser
      // tracks only one by default.
      scene.input.addPointer(4);
      this.touchUi = true;
      this.createTouchUi();
    }
  }

  /** True while the player wants to move backwards. */
  get left(): boolean {
    return this.cursors.left.isDown || this.keys.A.isDown || this.stickX < -TOUCH.stickDeadZone;
  }

  /** True while the player wants to move forwards. */
  get right(): boolean {
    return this.cursors.right.isDown || this.keys.D.isDown || this.stickX > TOUCH.stickDeadZone;
  }

  /** True while the player is pointing upwards: climbing, swimming up. */
  get up(): boolean {
    return (
      this.cursors.up.isDown || this.keys.W.isDown || this.stickY < -TOUCH.stickVerticalDeadZone
    );
  }


  /** True while the player is pointing down: sneaking, climbing down, swimming down. */
  get sneak(): boolean {
    return (
      this.cursors.down.isDown || this.keys.S.isDown || this.stickY > TOUCH.stickVerticalDeadZone
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

  /** Samples touch and edge-triggered state. Call once per frame, before reading. */
  update(): void {
    this.sampleTouch();

    // No Space: the keyboard jumps on up. Edge-triggered, so holding up on
    // the ground is one jump, and up held on a rope is a climb, not a leap.
    this.jumpHeldLastFrame = this.jumpHeldNow;
    this.jumpHeldNow = this.cursors.up.isDown || this.keys.W.isDown || this.jumpTouched;
  }

  /**
   * Hit-tests every active pointer against the stick and jump zones, rather
   * than relying on per-object pointerdown/pointerup handlers.
   *
   * On a small screen fingers slide while pressed. With pointer events, sliding
   * a thumb a few pixels off the stick fires `pointerout` and silently drops
   * the input, so the cat keeps running or stops dead. Testing every frame
   * means the input reflects where the finger actually is, and the zones are
   * far bigger than the drawn controls, so a drifting thumb stays on them.
   */
  private sampleTouch(): void {
    if (!this.touchUi) {
      return;
    }

    const manager = this.scene.input.manager;
    const pointers = manager.mousePointer ? [manager.mousePointer, ...manager.pointers] : manager.pointers;

    const zoneTop = GAME_HEIGHT * TOUCH.zoneTop;
    const stickRight = GAME_WIDTH * TOUCH.stickZoneWidth;
    const jumpLeft = GAME_WIDTH * (1 - TOUCH.stickZoneWidth);

    let stick: Phaser.Input.Pointer | undefined;
    this.jumpTouched = false;

    for (const pointer of pointers) {
      if (!pointer.isDown || pointer.y < zoneTop) {
        continue;
      }

      // The touch UI is pinned to the viewport (scroll factor 0), so pointer
      // positions can be compared directly without the camera scroll.
      if (pointer.x <= stickRight) {
        stick ??= pointer;
      } else if (pointer.x >= jumpLeft) {
        this.jumpTouched = true;
      }
    }

    if (!stick) {
      this.stickX = 0;
      this.stickY = 0;
      this.stickKnob?.setPosition(this.stickCenterX, this.stickCenterY);
      return;
    }

    const radius = TOUCH.stickRadius;
    let dx = stick.x - this.stickCenterX;
    let dy = stick.y - this.stickCenterY;
    const length = Math.hypot(dx, dy);

    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }

    this.stickX = dx / radius;
    this.stickY = dy / radius;
    this.stickKnob?.setPosition(this.stickCenterX + dx, this.stickCenterY + dy);
  }

  private createTouchUi(): void {
    this.stickCenterX = BUTTON_MARGIN + STICK_SIZE / 2 + 8;
    this.stickCenterY = GAME_HEIGHT - BUTTON_MARGIN - STICK_SIZE / 2;

    this.scene.add
      .image(this.stickCenterX, this.stickCenterY, 'ui-stick')
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.35)
      .setTint(COLORS.uiButton);

    this.stickKnob = this.scene.add
      .image(this.stickCenterX, this.stickCenterY, 'ui-stick-knob')
      .setScrollFactor(0)
      .setDepth(1001)
      .setAlpha(0.5)
      .setTint(COLORS.uiButton);

    this.scene.add
      .image(
        GAME_WIDTH - BUTTON_MARGIN - BUTTON_SIZE,
        GAME_HEIGHT - BUTTON_MARGIN - BUTTON_SIZE,
        'ui-jump',
      )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.35)
      .setTint(COLORS.uiButton);
  }
}
