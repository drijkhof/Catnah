import Phaser from 'phaser';
import { PLAYER } from '../config';
import type { Controls } from '../input/Controls';

/**
 * The player character.
 *
 * Movement is deliberately not a straight "set velocity from input": it adds
 * acceleration, coyote time, a jump buffer and a variable-height jump cut.
 * Those four things are what separate a platformer that feels responsive from
 * one that feels slippery or unfair, and they are far cheaper to build in now
 * than to retrofit once levels are designed around the old feel.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** Time remaining, in ms, during which a late jump still counts as grounded. */
  private coyoteTimer = 0;

  /** Time remaining, in ms, that an early jump press stays queued. */
  private jumpBufferTimer = 0;

  /** True while rising from a jump the player has not yet released. */
  private isJumping = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(PLAYER.width, PLAYER.height);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER.speed * 2, PLAYER.maxFallSpeed);
    this.setOrigin(0.5, 0.5);
  }

  /**
   * Advances the player by one frame.
   *
   * Called explicitly from the scene rather than via Phaser's own update list,
   * so that input is guaranteed to have been sampled first.
   *
   * @param delta Frame time in milliseconds, as handed to `Scene.update`.
   */
  step(controls: Controls, delta: number): void {
    const dt = delta / 1000;
    const onGround = this.body.blocked.down || this.body.touching.down;

    this.tickTimers(delta, onGround, controls);
    this.applyHorizontal(controls, dt, onGround);
    this.applyJump(controls);
    this.updateFacing(controls);
  }

  private tickTimers(delta: number, onGround: boolean, controls: Controls): void {
    this.coyoteTimer = onGround
      ? PLAYER.coyoteTimeMs
      : Math.max(0, this.coyoteTimer - delta);

    this.jumpBufferTimer = controls.jumpJustPressed
      ? PLAYER.jumpBufferMs
      : Math.max(0, this.jumpBufferTimer - delta);

    if (onGround && this.body.velocity.y >= 0) {
      this.isJumping = false;
    }
  }

  private applyHorizontal(controls: Controls, dt: number, onGround: boolean): void {
    const direction = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    const accel = onGround ? PLAYER.accel : PLAYER.accel * PLAYER.airControl;

    if (direction !== 0) {
      const target = direction * PLAYER.speed;
      const next = this.body.velocity.x + direction * accel * dt;

      // Clamp towards the target so acceleration never overshoots top speed,
      // while still allowing an existing faster velocity (a launch, a slope) to
      // bleed off naturally instead of being snapped down.
      this.setVelocityX(
        direction > 0 ? Math.min(next, target) : Math.max(next, target),
      );
    } else {
      const friction = PLAYER.friction * dt;
      const speed = Math.abs(this.body.velocity.x);

      this.setVelocityX(
        speed <= friction ? 0 : this.body.velocity.x - Math.sign(this.body.velocity.x) * friction,
      );
    }
  }

  private applyJump(controls: Controls): void {
    const canJump = this.coyoteTimer > 0 && this.jumpBufferTimer > 0;

    if (canJump) {
      this.setVelocityY(PLAYER.jumpVelocity);
      this.isJumping = true;

      // Both windows are spent, otherwise a single press could trigger a second
      // jump on the very next frame while the timers are still warm.
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // Variable jump height: let go early and the rise is cut short.
    if (this.isJumping && !controls.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * PLAYER.jumpCutMultiplier);
      this.isJumping = false;
    }
  }

  private updateFacing(controls: Controls): void {
    if (controls.left && !controls.right) {
      this.setFlipX(true);
    } else if (controls.right && !controls.left) {
      this.setFlipX(false);
    }
  }
}
