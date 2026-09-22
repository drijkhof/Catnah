import Phaser from 'phaser';
import { GROUND_ENEMY_SIZES } from '../art';
import { GRAZING, GROUND_ENEMIES, RAT, type GroundEnemyKind } from '../config';
import { sound } from '../audio/Sound';
import { isSolidTile } from './solid';

/** How far ahead it looks for a wall or the end of the floor, px. */
const PROBE = 3;

/**
 * Something that paces the floor: a hedgehog in the wild, a rat in the city.
 *
 * They differ in what they look like and how fast they scurry, and in nothing
 * else, so they are one class rather than two nearly identical ones.
 *
 * It never walks off an edge and turns at anything solid in its way. Both are
 * decided by looking ahead rather than by waiting for a collision: a collision
 * comes one frame too late to stop a fall, and a hedgehog that tumbles off its
 * ledge looks broken rather than dangerous.
 *
 * **A hedgehog stops to eat**, every few seconds and never on a fixed beat: a
 * creature that pauses exactly every four seconds is a metronome, one that
 * pauses about every four seconds is an animal. It is also the only thing that
 * makes a hedgehog readable -- while it is eating it is not coming towards you.
 *
 * **A rat is afraid of you.** It paces like anything else until the cat comes
 * close, then turns and runs -- and when it runs out of floor or meets a wall,
 * it stops running and leaps at you. It is the only attack in the game that
 * comes from something trying to get away, and the only sound in the game that
 * is meant to make you jump.
 */
export class GroundEnemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** 1 walking right, -1 walking left. */
  private direction: number;

  private readonly kind: GroundEnemyKind;

  /** Counts down to the next pause, and then through the pause itself. */
  private grazeTimer = Phaser.Math.Between(600, GRAZING.everyMaxMs);

  private eating = false;

  private biteTimer = 0;

  /** How far a rat has walked since its last footfall, px. */
  private stepDistance = 0;

  /** How long a rat has been cornered, ms, and how long until it may leap again. */
  private corneredFor = 0;

  private leapCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: GroundEnemyKind = 'hedgehog',
    direction = -1,
  ) {
    super(scene, x, y, kind);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = kind;
    this.direction = direction;
    this.setOrigin(0.5, 1);

    const size = GROUND_ENEMY_SIZES[kind];
    this.body.setSize(size.width, size.height, false);
    this.body.setOffset(0, 0);
    this.body.setCollideWorldBounds(true);
    this.setDepth(-1);
  }

  /**
   * Stops dead, and stays stopped.
   *
   * Called by the scene instead of `step` once the cat is far enough away.
   * Skipping `step` on its own is not enough: Arcade goes on integrating
   * whatever velocity was last set, so something left mid-stride walks away
   * with nothing deciding where it is going.
   */
  doze(): void {
    this.setVelocityX(0);
  }

  /**
   * Called from the scene once a frame, after the physics of the last one.
   *
   * @param cat Where the cat is. Only the rats care.
   */
  step(delta = 16.667, cat?: Phaser.Math.Vector2): void {
    if (!this.active) {
      return;
    }

    if (this.kind === 'hedgehog') {
      if (this.graze(delta)) {
        this.setVelocityX(0);
        this.bite(delta);
        return;
      }

      this.pace();
      return;
    }

    this.ratStep(delta, cat);
  }

  /** Turn at a wall, at an edge, or at the end of the world. Walk otherwise. */
  private pace(speed = GROUND_ENEMIES[this.kind].speed): void {
    if (this.atLevelEdge() || this.blockedAhead() || !this.groundAhead()) {
      this.direction = -this.direction;
    }

    this.setVelocityX(this.direction * speed);
    this.setFlipX(this.direction < 0);
  }

  /**
   * A rat: pacing, fleeing, or cornered and about to jump.
   *
   * The three states are one `if`, because they are one decision -- how close
   * is the cat, and is there anywhere left to go.
   */
  private ratStep(delta: number, cat?: Phaser.Math.Vector2): void {
    this.leapCooldown = Math.max(0, this.leapCooldown - delta);

    // Mid-leap: leave it alone. Every other branch here sets a velocity, and
    // one of them ran on the frame after the jump and wiped out the sideways
    // half of it -- the rat went straight up and straight back down.
    if (!this.body.blocked.down && !this.body.touching.down) {
      return;
    }

    const scared =
      cat !== undefined &&
      Math.abs(cat.x - this.x) < RAT.fleeRange &&
      Math.abs(cat.y - this.y) < RAT.fleeRange;

    if (!scared) {
      this.corneredFor = 0;
      this.pace();
      this.scurry(delta, GROUND_ENEMIES.rat.speed);
      return;
    }

    // Away from the cat, whatever it was doing before. The direction is set
    // first, because the probes that decide whether there is anywhere left to
    // go all look the way it is facing.
    this.direction = this.x < (cat as Phaser.Math.Vector2).x ? -1 : 1;
    this.setFlipX(this.direction < 0);

    const away = this.direction;
    const stuck = this.atLevelEdge() || this.blockedAhead() || !this.groundAhead();

    if (!stuck) {
      this.corneredFor = 0;

      const speed = GROUND_ENEMIES.rat.speed * RAT.fleeSpeedMultiplier;

      this.setVelocityX(away * speed);
      this.scurry(delta, speed);
      return;
    }

    // Nowhere left to run. It holds for a moment -- long enough to read as a
    // decision rather than a reflex -- and then it comes at you.
    this.setVelocityX(0);
    this.corneredFor += delta;

    if (this.corneredFor >= RAT.cornerPatienceMs && this.leapCooldown === 0) {
      this.corneredFor = 0;
      this.leapCooldown = RAT.leapCooldownMs;
      this.setVelocity(-away * RAT.leapSpeed, RAT.leapVelocity);
      this.setFlipX(-away < 0);
      sound.playAt('ratLeap', this.x, this.y);
    }
  }

  /**
   * Stops to eat now and then.
   *
   * @returns true while it is eating, in which case it does not move.
   */
  private graze(delta: number): boolean {
    this.grazeTimer -= delta;

    if (this.grazeTimer > 0) {
      return this.eating;
    }

    if (this.eating) {
      this.eating = false;
      this.grazeTimer = Phaser.Math.Between(GRAZING.everyMinMs, GRAZING.everyMaxMs);
      return false;
    }

    this.eating = true;
    this.grazeTimer = Phaser.Math.Between(GRAZING.forMinMs, GRAZING.forMaxMs);
    this.biteTimer = 0;

    return true;
  }

  /** The nibbling, while it is down there. */
  private bite(delta: number): void {
    this.biteTimer -= delta;

    if (this.biteTimer <= 0) {
      this.biteTimer = GRAZING.biteEveryMs;
      sound.playAt('nibble', this.x, this.y);
    }
  }

  /**
   * The sound of a rat's feet.
   *
   * Tied to distance covered rather than to a timer, so it keeps step with the
   * thing it is coming from instead of ticking along beside it.
   */
  private scurry(delta: number, speed: number): void {
    // Only while it is actually moving: a rat pinned against a wall was still
    // ticking away at nothing.
    if (Math.abs(this.body.velocity.x) < 4) {
      return;
    }

    this.stepDistance += speed * (delta / 1000);

    if (this.stepDistance >= 11) {
      this.stepDistance = 0;
      sound.playAt('scurry', this.x, this.y);
    }
  }

  /** Has it reached the end of the world? */
  private atLevelEdge(): boolean {
    const bounds = this.scene.physics.world.bounds;

    return this.direction > 0
      ? this.body.right >= bounds.right - PROBE
      : this.body.x <= bounds.x + PROBE;
  }

  /**
   * Is something solid directly in front of it?
   *
   * Only faces that would actually stop it count. A branch has its sides
   * switched off, so a hedgehog walking along one does not turn round at the
   * next branch tile it meets.
   */
  private blockedAhead(): boolean {
    const body = this.body;
    const ahead = this.direction > 0 ? body.right : body.x - PROBE;
    const face = this.direction > 0 ? 'left' : 'right';

    return this.solidIn(ahead, body.y + 2, PROBE, body.height - 4, face);
  }

  /** Is there still floor under the step it is about to take? */
  private groundAhead(): boolean {
    const body = this.body;
    const ahead = this.direction > 0 ? body.right : body.x - PROBE;

    return this.solidIn(ahead, body.bottom, PROBE, PROBE * 2, 'up');
  }

  private solidIn(
    x: number,
    y: number,
    width: number,
    height: number,
    face: 'up' | 'left' | 'right',
  ): boolean {
    const found = this.scene.physics.overlapRect(
      x,
      y,
      width,
      height,
      false,
      true,
    ) as Phaser.Physics.Arcade.StaticBody[];

    return found.some((body) => isSolidTile(body) && body.checkCollision[face]);
  }
}
