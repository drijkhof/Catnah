import Phaser from 'phaser';
import { CAT } from '../config';
import type { Controls } from '../input/Controls';

/**
 * The cat.
 *
 * Movement is deliberately not a straight "set velocity from input": it adds
 * acceleration, coyote time, a jump buffer and a variable-height jump cut.
 * Those are what separate a platformer that feels responsive from one that
 * feels slippery or unfair, and they are far cheaper to build in now than to
 * retrofit once levels are designed around the old feel.
 *
 * The sprite origin is at the paws (0.5, 1) and each pose is drawn at exactly
 * its body size, so swapping between standing and sneaking changes the
 * collision box without the cat sinking into the floor or popping off it.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** Time remaining, in ms, during which a late jump still counts as grounded. */
  private coyoteTimer = 0;

  /** Time remaining, in ms, that an early jump press stays queued. */
  private jumpBufferTimer = 0;

  /** True while rising from a jump the player has not yet released. */
  private isJumping = false;

  private isSneaking = false;

  /**
   * Time remaining, in ms, during which horizontal input is ignored because the
   * cat was just shoved off a wall.
   */
  private wallJumpLockTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cat');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.applyPose(false);

    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(CAT.speed * 2, CAT.maxFallSpeed);
  }

  /** True while the cat is sneaking, so the scene can react (dust, sound). */
  get sneaking(): boolean {
    return this.isSneaking;
  }

  /**
   * Advances the cat by one frame.
   *
   * Called explicitly from the scene rather than via Phaser's own update list,
   * so that input is guaranteed to have been sampled first.
   *
   * @param delta Frame time in milliseconds, as handed to `Scene.update`.
   */
  step(controls: Controls, delta: number): void {
    const dt = delta / 1000;
    const onGround = this.body.blocked.down || this.body.touching.down;
    const wall = this.findWall(onGround);

    this.tickTimers(delta, onGround, controls);

    // A queued jump beats a held sneak, so a player holding the button is
    // never stuck. Under a low overhang there is no headroom to stand, which is
    // what stops the jump instead.
    const wantsJump = this.coyoteTimer > 0 && this.jumpBufferTimer > 0;
    this.resolvePose(controls.sneak && onGround && !wantsJump);

    // Jumping resolves before movement, so that the shove a wall jump gives is
    // the velocity the frame ends with rather than something input overwrites.
    this.applyJump(controls, wantsJump && !this.isSneaking, wall);
    this.applyHorizontal(controls, dt, onGround);
    this.applyWallSlide(controls, wall, onGround);
    this.updateFacing(controls);
  }

  /** Puts the cat back at a given spot, upright and still. */
  respawnAt(x: number, y: number): void {
    this.resolvePose(false);
    this.setVelocity(0, 0);
    this.setPosition(x, y);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wallJumpLockTimer = 0;
    this.isJumping = false;
  }

  /**
   * Which side a wall is on: 1 for a wall to the right, -1 to the left, 0 for
   * none. Only meaningful in mid-air -- standing on the floor beside a rock is
   * not clinging to it.
   */
  private findWall(onGround: boolean): number {
    if (onGround) {
      return 0;
    }

    if (this.body.blocked.right || this.body.touching.right) {
      return 1;
    }

    if (this.body.blocked.left || this.body.touching.left) {
      return -1;
    }

    return 0;
  }

  private tickTimers(delta: number, onGround: boolean, controls: Controls): void {
    this.coyoteTimer = onGround
      ? CAT.coyoteTimeMs
      : Math.max(0, this.coyoteTimer - delta);

    this.jumpBufferTimer = controls.jumpJustPressed
      ? CAT.jumpBufferMs
      : Math.max(0, this.jumpBufferTimer - delta);

    this.wallJumpLockTimer = Math.max(0, this.wallJumpLockTimer - delta);

    if (onGround && this.body.velocity.y >= 0) {
      this.isJumping = false;
    }
  }

  private resolvePose(wantsSneak: boolean): void {
    if (wantsSneak) {
      if (!this.isSneaking) {
        this.applyPose(true);
      }
      return;
    }

    // Only stand back up if there is room, otherwise the cat would be shoved
    // through the ceiling it is sneaking under.
    if (this.isSneaking && this.hasHeadroom()) {
      this.applyPose(false);
    }
  }

  private applyPose(sneaking: boolean): void {
    this.isSneaking = sneaking;
    this.setTexture(sneaking ? 'cat-sneak' : 'cat');

    const width = sneaking ? CAT.sneakWidth : CAT.width;
    const height = sneaking ? CAT.sneakHeight : CAT.height;

    // Each pose texture is exactly its body size, so no offset is needed: with
    // a bottom-centre origin the body's feet land on the sprite's y either way.
    this.body.setSize(width, height, false);
    this.body.setOffset(0, 0);
  }

  /** Is the space a standing cat would occupy currently clear? */
  private hasHeadroom(): boolean {
    const clearance = CAT.height - CAT.sneakHeight;
    const bodies = this.scene.physics.overlapRect(
      // Inset horizontally so brushing a wall does not read as a blocked
      // ceiling.
      this.x - CAT.width / 2 + 1,
      this.y - CAT.height,
      CAT.width - 2,
      clearance,
      false,
      true,
    );

    return bodies.length === 0;
  }

  private applyHorizontal(controls: Controls, dt: number, onGround: boolean): void {
    // Straight after a wall jump the player is still holding the direction that
    // had them clinging to the wall. Honouring it would cancel the shove and
    // drop them back down the same face, so input waits a moment.
    if (this.wallJumpLockTimer > 0) {
      return;
    }

    const direction = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    const topSpeed = this.isSneaking
      ? CAT.speed * CAT.sneakSpeedMultiplier
      : CAT.speed;
    const accel = onGround ? CAT.accel : CAT.accel * CAT.airControl;

    if (direction !== 0) {
      const target = direction * topSpeed;
      const next = this.body.velocity.x + direction * accel * dt;

      // Clamp towards the target so acceleration never overshoots top speed,
      // while still letting an existing faster velocity bleed off naturally
      // rather than being snapped down.
      this.setVelocityX(
        direction > 0 ? Math.min(next, target) : Math.max(next, target),
      );
      return;
    }

    const friction = CAT.friction * dt;
    const speed = Math.abs(this.body.velocity.x);

    this.setVelocityX(
      speed <= friction
        ? 0
        : this.body.velocity.x - Math.sign(this.body.velocity.x) * friction,
    );
  }

  private applyJump(controls: Controls, canJump: boolean, wall: number): void {
    // A wall jump needs a fresh press, held in the same buffer a ground jump
    // uses, so holding the button cannot climb a face on its own.
    if (!canJump && wall !== 0 && this.jumpBufferTimer > 0 && !this.isSneaking) {
      this.applyWallJump(wall);
      return;
    }

    if (canJump) {
      this.setVelocityY(CAT.jumpVelocity);
      this.isJumping = true;

      // Both windows are spent, otherwise a single press could trigger a second
      // jump on the very next frame while the timers are still warm.
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // Variable jump height: let go early and the hop is cut short.
    if (this.isJumping && !controls.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * CAT.jumpCutMultiplier);
      this.isJumping = false;
    }
  }

  /**
   * Launches the cat up and away from a wall.
   *
   * @param wall 1 if the wall is on the right, -1 if on the left.
   */
  private applyWallJump(wall: number): void {
    this.setVelocity(-wall * CAT.wallJumpPushX, CAT.wallJumpVelocityY);

    this.wallJumpLockTimer = CAT.wallJumpLockMs;
    this.isJumping = true;

    // Spent, for the same reason a ground jump spends them: one press, one jump.
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Face the way it is travelling, not the wall it just left.
    this.setFlipX(wall > 0);
  }

  /**
   * Slows a fall to a scrape while the cat presses into a wall.
   *
   * Pressing towards the wall is required rather than merely touching it, so
   * brushing past a rock in mid-air does not silently brake the cat.
   */
  private applyWallSlide(controls: Controls, wall: number, onGround: boolean): void {
    if (onGround || wall === 0 || this.wallJumpLockTimer > 0) {
      return;
    }

    const pressingIn = wall > 0 ? controls.right : controls.left;

    if (pressingIn && this.body.velocity.y > CAT.wallSlideSpeed) {
      this.setVelocityY(CAT.wallSlideSpeed);
    }
  }

  private updateFacing(controls: Controls): void {
    // Keep facing away from the wall for the length of the shove.
    if (this.wallJumpLockTimer > 0) {
      return;
    }

    if (controls.left && !controls.right) {
      this.setFlipX(true);
    } else if (controls.right && !controls.left) {
      this.setFlipX(false);
    }
  }
}
