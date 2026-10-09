import Phaser from 'phaser';
import { CROW, GULL } from '../config';
import { createRandom } from '../art';
import { sound } from '../audio/Sound';
import type { CrowBehaviour } from '../level/Level';

/**
 * The crow that lives in the great tree.
 *
 * It circles its nest until the cat comes near, then breaks off and comes at
 * it, returning once the cat is far enough away again. It steers rather than
 * points: the velocity is turned gradually towards wherever it is heading, so
 * it banks into curves and overshoots on an attack run instead of tracking the
 * cat like a homing missile -- which is what makes it dodgeable.
 *
 * What it does is the level's choice (`CrowBehaviour`). A `flyby` crow ignores
 * the cat altogether: it sweeps across the level and back, rising and falling
 * a little on the way, and never attacks. The title screen uses it.
 *
 * A `swoop` crow is the beach's **gull**, drawn as one: it glides along the
 * shore like a flyby bird, and when the cat is ahead of it and near enough
 * it dives -- down to just above the cat's chest, along a line it commits to
 * when it breaks off, skims past where the cat was, and climbs out ahead to
 * glide again. It does not follow the cat down the line: the dodge is to
 * duck, since a sneaking cat is under the skim, or to not be where it was.
 */
/** What a crow can tell about the cat, worked out by the scene. */
export interface CatCover {
  sneaking: boolean;
  /** Sneaking *and* behind something: a bush, a reed, the leaves on a branch. */
  hidden: boolean;
}

const IN_THE_OPEN: CatCover = { sneaking: false, hidden: false };

export class Crow extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly nest: Phaser.Math.Vector2;

  /**
   * Where on its circle it is, how fast it goes round, how wide, and which way.
   *
   * **All four are different for every bird.** With one starting angle and one
   * speed, eight crows fly in perfect formation -- and a phase offset alone is
   * not enough either, because birds evenly spaced on identical circles read as
   * a fairground ride rather than as birds. Different speeds are what make them
   * drift apart and never line up again.
   */
  private angle2: number;

  private readonly turnsPerSecond: number;

  private readonly radius: number;

  private readonly clockwise: number;

  private attacking = false;

  private readonly behaviour: CrowBehaviour;

  /** A `flyby` crow's sweep: the x it turns round at on each side. */
  private readonly sweepLeft: number;
  private readonly sweepRight: number;

  /** 1 sweeping right, -1 sweeping left. */
  private sweepDirection = 1;

  /** Where in its rise and fall it is, ms. */
  private bobClock = 0;

  /** A `swoop` bird: gliding, diving at the cat, skimming past it, or climbing out. */
  private swoop: 'glide' | 'dive' | 'skim' | 'climb' = 'glide';

  /** Where the dive skims: just above where the cat's chest was. */
  private readonly skim = new Phaser.Math.Vector2();

  /** Time until it may swoop again, ms. */
  private swoopCooldown = 0;

  /**
   * @param sweep Where a `flyby` crow turns round, left and right. Ignored by
   *   an attacking one.
   */
  constructor(
    scene: Phaser.Scene,
    nestX: number,
    nestY: number,
    behaviour: CrowBehaviour = 'attack',
    sweep: { left: number; right: number } = { left: nestX, right: nestX },
  ) {
    super(scene, nestX, nestY, behaviour === 'swoop' ? 'gull' : 'crow');

    this.behaviour = behaviour;
    this.sweepLeft = sweep.left - CROW.flybyOvershoot;
    this.sweepRight = sweep.right + CROW.flybyOvershoot;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.nest = new Phaser.Math.Vector2(nestX, nestY);

    // Seeded from where it lives, not from `Math.random`: two players, two
    // devices and two hot reloads all get the same eight birds, the same way
    // every other scatter in this game does.
    const random = createRandom(Math.round(nestX) * 73_856_093 + Math.round(nestY) * 19_349_663);

    this.angle2 = random() * Math.PI * 2;
    this.turnsPerSecond = CROW.circleSpeed * (0.7 + random() * 0.6);
    this.radius = CROW.circleRadius * (0.8 + random() * 0.45);
    this.clockwise = random() < 0.5 ? -1 : 1;

    this.body.setAllowGravity(false);
    this.setDepth(10);
  }

  /**
   * Stops dead, and stays stopped.
   *
   * Called by the scene instead of `step` once the cat is far enough away.
   * Skipping `step` on its own is not enough: Arcade goes on integrating
   * whatever velocity was last set, so something left mid-stride drifts away
   * with nothing deciding where it is going.
   */
  doze(): void {
    this.setVelocity(0, 0);
  }

  /** True while it has broken off to come at the cat. */
  get hunting(): boolean {
    return this.attacking || this.swoop !== 'glide';
  }

  /**
   * @param cat How the cat is carrying itself. A *sneaking* cat is never
   *   attacked -- a crow does not go for something low and slow in the
   *   grass -- but one already being dived at is not let off just by
   *   dropping flat. A *hidden* cat (sneaking behind a bush or in the
   *   leaves, the scene's call) is lost sight of: the crow breaks off and
   *   goes back to its circle.
   */
  step(target: Phaser.Math.Vector2, delta: number, cat: CatCover = IN_THE_OPEN): void {
    if (this.behaviour === 'flyby') {
      this.flyBy(delta);
      return;
    }

    if (this.behaviour === 'swoop') {
      this.gullStep(target, delta, cat);
      return;
    }

    const dt = delta / 1000;
    const toCat = target.distance(this.nest);

    // Hysteresis: it commits to an attack and gives up further out than it
    // started, so a cat hovering on the edge of the range does not make it
    // flicker in and out.
    const wasAttacking = this.attacking;

    if (cat.hidden) {
      this.attacking = false;
    } else if (this.attacking) {
      this.attacking = toCat < CROW.releaseRange;
    } else {
      this.attacking = toCat < CROW.attackRange && !cat.sneaking;
    }

    // It calls once, as it breaks off the circle. Calling the whole way in
    // would be an alarm rather than a bird.
    if (this.attacking && !wasAttacking) {
      sound.playAt('caw', this.x, this.y);
    }

    const aim = this.attacking ? target : this.circlingPoint(dt);
    this.steerTowards(aim, dt);

    this.setFlipX(this.body.velocity.x < 0);
  }

  /**
   * Across and back, forever. The bob is a sine on the height, driven by
   * velocity (the slope of that sine) rather than by writing the position, so
   * `doze` still stops it dead like any other crow.
   *
   * It turns round beyond each end of the sweep, which the level makes wider
   * than any screen, so the turn happens out of sight.
   */
  private flyBy(
    delta: number,
    speed: number = CROW.flybySpeed,
    bob: number = CROW.flybyBob,
    periodMs: number = CROW.flybyBobPeriodMs,
  ): void {
    this.bobClock += delta;

    if (this.x >= this.sweepRight) {
      this.sweepDirection = -1;
    } else if (this.x <= this.sweepLeft) {
      this.sweepDirection = 1;
    }

    const angular = (Math.PI * 2) / periodMs;
    const rise = bob * angular * 1000 * Math.cos(this.bobClock * angular);

    this.setVelocity(this.sweepDirection * speed, rise);
    this.setFlipX(this.sweepDirection < 0);
  }

  /**
   * The gull: gliding along the shore, and the swoop.
   *
   * The dive is aimed once, when it breaks off, at a point `GULL.skimHeight`
   * above the cat's feet, *at* the cat; from there it skims level for
   * `GULL.skimPast` in the direction of flight, and climbs to a point
   * `GULL.climbRun` further on at gliding height. Each leg is flown by
   * turning the velocity toward its point, and the glide that follows picks
   * up from wherever the climb ends -- the sweep keeps its own height, so a
   * gull that climbed a little short or long simply bobs from there.
   */
  private gullStep(target: Phaser.Math.Vector2, delta: number, cat: CatCover): void {
    const dt = delta / 1000;
    this.swoopCooldown = Math.max(0, this.swoopCooldown - delta);

    if (this.swoop === 'glide') {
      this.flyBy(delta, GULL.glideSpeed, GULL.bob, GULL.bobPeriodMs);

      const ahead = (target.x - this.x) * this.sweepDirection > 0;
      const near = Math.abs(target.x - this.x) < GULL.attackRange && target.y > this.y;
      if (ahead && near && !cat.sneaking && !cat.hidden && this.swoopCooldown === 0) {
        this.swoop = 'dive';
        this.skim.set(target.x, target.y - GULL.skimHeight);
        // Straight onto the line: the glide's sideways velocity would
        // otherwise carry it past the cat before it was low.
        const line = new Phaser.Math.Vector2(this.skim.x - this.x, this.skim.y - this.y).normalize().scale(GULL.swoopSpeed);
        this.setVelocity(line.x, line.y);
        sound.playAt('caw', this.x, this.y);
      }
      return;
    }

    const point =
      this.swoop === 'dive'
        ? this.skim
        : this.swoop === 'skim'
          ? new Phaser.Math.Vector2(this.skim.x + this.sweepDirection * GULL.skimPast, this.skim.y)
          : new Phaser.Math.Vector2(this.skim.x + this.sweepDirection * (GULL.skimPast + GULL.climbRun), this.nest.y);

    const desired = new Phaser.Math.Vector2(point.x - this.x, point.y - this.y).normalize().scale(GULL.swoopSpeed);
    const turn = Phaser.Math.Clamp(GULL.turnRate * dt, 0, 1);
    this.setVelocity(
      Phaser.Math.Linear(this.body.velocity.x, desired.x, turn),
      Phaser.Math.Linear(this.body.velocity.y, desired.y, turn),
    );
    this.setFlipX(this.body.velocity.x < 0);

    // Past the point, or on it: the next leg. Passing is judged along the
    // direction of flight, so a dive that curved wide does not circle back.
    const passed = (point.x - this.x) * this.sweepDirection <= 0;
    if (this.swoop === 'dive' && (passed || this.y >= point.y - GULL.levelOff)) {
      this.swoop = 'skim';
    } else if (this.swoop === 'skim' && passed) {
      this.swoop = 'climb';
    } else if (this.swoop === 'climb' && (passed || this.y <= point.y)) {
      this.swoop = 'glide';
      this.swoopCooldown = GULL.cooldownMs;
    }
  }

  /** The point on its patrol circle it is currently heading for. */
  private circlingPoint(dt: number): Phaser.Math.Vector2 {
    this.angle2 += this.turnsPerSecond * this.clockwise * dt;

    return new Phaser.Math.Vector2(
      this.nest.x + Math.cos(this.angle2) * this.radius,
      // Flattened, so the circle reads as one seen at an angle rather than as
      // a bird going round a hoop.
      this.nest.y + Math.sin(this.angle2) * this.radius * 0.5,
    );
  }

  /**
   * Turns the current velocity towards a point instead of pointing straight at
   * it, which is what gives the flight its curve.
   */
  private steerTowards(point: Phaser.Math.Vector2, dt: number): void {
    // Circling speed follows its own circle, so a bird on a wide slow loop
    // does not have to sprint to keep up with the point it is chasing.
    const speed = this.attacking
      ? CROW.attackSpeed
      : this.turnsPerSecond * this.radius;
    const desired = new Phaser.Math.Vector2(point.x - this.x, point.y - this.y)
      .normalize()
      .scale(speed);

    const turn = Phaser.Math.Clamp(CROW.turnRate * dt, 0, 1);

    this.setVelocity(
      Phaser.Math.Linear(this.body.velocity.x, desired.x, turn),
      Phaser.Math.Linear(this.body.velocity.y, desired.y, turn),
    );
  }
}
