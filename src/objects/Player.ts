import Phaser from 'phaser';
import { CAT } from '../config';
import type { Controls } from '../input/Controls';

/** How far the cat's paws stay below the very top of a trunk, in pixels. */
const CLIMB_TOP_MARGIN = 5;

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

  private isClimbing = false;

  /** Time remaining, in ms, during which a trunk cannot be caught again. */
  private climbCooldownTimer = 0;

  /** Trunks this cat can climb, in world space. */
  private readonly climbZones: Phaser.Geom.Rectangle[];

  /** Top of each trunk, keyed by its column's world x, so a climb can stop. */
  private readonly trunkTops = new Map<number, number>();

  /**
   * Time remaining, in ms, during which horizontal input is ignored because the
   * cat was just shoved off a wall.
   */
  private wallJumpLockTimer = 0;

  /**
   * Which side the last wall jump was taken from, or 0 for none.
   *
   * The same side cannot be used twice in a row, so a lone wall cannot be
   * climbed -- two walls facing each other are needed, alternating between
   * them. Touching down clears it.
   */
  private lastWallJumpSide = 0;

  /** Time remaining, in ms, that a wall just left can still be jumped from. */
  private wallCoyoteTimer = 0;

  /** Which side that remembered wall was on. */
  private wallCoyoteSide = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    climbZones: Phaser.Geom.Rectangle[] = [],
  ) {
    super(scene, x, y, 'cat');

    this.climbZones = climbZones;

    for (const zone of climbZones) {
      const known = this.trunkTops.get(zone.x);
      this.trunkTops.set(zone.x, known === undefined ? zone.y : Math.min(known, zone.y));
    }

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

  /** True while the cat is holding on to a trunk. */
  get climbing(): boolean {
    return this.isClimbing;
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

    this.tickTimers(delta, onGround, controls, wall);

    // Climbing replaces ordinary movement outright -- no gravity, no jumping,
    // no wall logic -- so it is resolved first and short-circuits the rest.
    if (this.updateClimb(controls, onGround)) {
      return;
    }

    // A queued jump beats a held sneak, so a player holding the button is
    // never stuck. Under a low overhang there is no headroom to stand, which is
    // what stops the jump instead.
    const wantsJump = this.coyoteTimer > 0 && this.jumpBufferTimer > 0;
    this.resolvePose(controls.sneak && onGround && !wantsJump);

    // Jumping resolves before movement, so that the shove a wall jump gives is
    // the velocity the frame ends with rather than something input overwrites.
    // Jumping uses the remembered wall rather than the one being touched right
    // now, so pressing away from it and jumping works.
    this.applyJump(
      controls,
      wantsJump && !this.isSneaking,
      this.wallCoyoteTimer > 0 ? this.wallCoyoteSide : 0,
    );
    this.applyHorizontal(controls, dt, onGround);
    this.applyWallSlide(controls, wall, onGround);
    this.updateFacing(controls);
  }

  /** Puts the cat back at a given spot, upright and still. */
  respawnAt(x: number, y: number): void {
    this.releaseTrunk();
    this.climbCooldownTimer = 0;
    this.resolvePose(false);
    this.setVelocity(0, 0);
    this.setPosition(x, y);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wallJumpLockTimer = 0;
    this.lastWallJumpSide = 0;
    this.wallCoyoteTimer = 0;
    this.isJumping = false;
  }

  /**
   * Holds the cat to a trunk and moves it along.
   *
   * @returns true if the cat is climbing, in which case it has moved itself and
   *   nothing else in `step` should run.
   */
  private updateClimb(controls: Controls, onGround: boolean): boolean {
    const trunk = this.findTrunk();

    if (this.isClimbing) {
      // Reaching out sideways is how you let go; there is no release button,
      // for the same reason there is no grab button.
      if (!trunk || controls.left || controls.right) {
        this.releaseTrunk();
        return false;
      }
    } else if (!trunk || !this.wantsToGrab(controls, onGround)) {
      return false;
    } else {
      this.grabTrunk();
    }

    const activeTrunk = trunk as Phaser.Geom.Rectangle;
    const direction = (controls.sneak ? 1 : 0) - (controls.jumpHeld ? 1 : 0);

    // Climbing down onto the floor simply stands the cat up.
    if (onGround && direction >= 0) {
      this.releaseTrunk();
      return false;
    }

    // Stop at the top rather than climbing off the end into thin air, which
    // would drop the cat straight back down past the trunk it just climbed.
    // A few pixels of overlap are kept, or the cat would let go of the trunk by
    // reaching the top of it.
    const topY = this.trunkTops.get(activeTrunk.x) ?? activeTrunk.y;
    const atTop = this.y <= topY + CLIMB_TOP_MARGIN;

    this.setVelocityY(direction < 0 && atTop ? 0 : direction * CAT.climbSpeed);
    // Drawn to the middle of the trunk rather than snapped, so grabbing one
    // off-centre does not look like a teleport.
    this.setVelocityX((activeTrunk.centerX - this.x) * CAT.climbCentringPull);

    return true;
  }

  /**
   * Whether the cat takes hold of a trunk it is overlapping.
   *
   * Falling onto one catches it -- that is the automatic grip, with no button
   * to hold. From the floor, reaching up starts the climb instead of jumping,
   * the way standing at the foot of a ladder does.
   */
  private wantsToGrab(controls: Controls, onGround: boolean): boolean {
    if (this.climbCooldownTimer > 0) {
      return false;
    }

    if (!onGround && this.body.velocity.y > 0) {
      return true;
    }

    return controls.jumpJustPressed;
  }

  private grabTrunk(): void {
    this.isClimbing = true;
    this.body.setAllowGravity(false);
    this.setVelocity(0, 0);

    // A cat cannot climb flattened out.
    if (this.isSneaking) {
      this.applyPose(false);
    }

    this.isJumping = false;
    this.wallJumpLockTimer = 0;
    this.lastWallJumpSide = 0;
    this.wallCoyoteTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  private releaseTrunk(): void {
    if (!this.isClimbing) {
      return;
    }

    this.isClimbing = false;
    this.body.setAllowGravity(true);
    this.climbCooldownTimer = CAT.climbCooldownMs;
  }

  /** The trunk the cat's body is currently over, if any. */
  private findTrunk(): Phaser.Geom.Rectangle | null {
    const body = this.body;

    for (const zone of this.climbZones) {
      if (
        body.right > zone.x &&
        body.x < zone.right &&
        body.bottom > zone.y &&
        body.y < zone.bottom
      ) {
        return zone;
      }
    }

    return null;
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

  private tickTimers(
    delta: number,
    onGround: boolean,
    controls: Controls,
    wall: number,
  ): void {
    this.coyoteTimer = onGround
      ? CAT.coyoteTimeMs
      : Math.max(0, this.coyoteTimer - delta);

    this.jumpBufferTimer = controls.jumpJustPressed
      ? CAT.jumpBufferMs
      : Math.max(0, this.jumpBufferTimer - delta);

    this.wallJumpLockTimer = Math.max(0, this.wallJumpLockTimer - delta);
    this.climbCooldownTimer = Math.max(0, this.climbCooldownTimer - delta);

    if (wall !== 0) {
      this.wallCoyoteTimer = CAT.wallCoyoteMs;
      this.wallCoyoteSide = wall;
    } else {
      this.wallCoyoteTimer = Math.max(0, this.wallCoyoteTimer - delta);
    }

    if (onGround) {
      // Touching down is what earns the next wall jump from either side.
      this.lastWallJumpSide = 0;
      this.wallCoyoteTimer = 0;
    }

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
    // A wall jump asks for three things at once. A fresh press, held in the
    // same buffer a ground jump uses, so holding the button cannot climb a face
    // on its own. The opposite side to the last one: left, right, left. And the
    // cat still rising -- a wall jump carries momentum on rather than
    // manufacturing it, so a chain has to be strung together on the way up and
    // is over the moment it starts to fall.
    if (
      !canJump &&
      wall !== 0 &&
      wall !== this.lastWallJumpSide &&
      this.body.velocity.y < 0 &&
      this.jumpBufferTimer > 0 &&
      !this.isSneaking
    ) {
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
    this.lastWallJumpSide = wall;
    // Spent, so one contact cannot be cashed in twice.
    this.wallCoyoteTimer = 0;
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
