import Phaser from 'phaser';
import { CROW } from '../config';
import { createRandom } from '../art';
import { sound } from '../audio/Sound';

/**
 * The crow that lives in the great tree.
 *
 * It circles its nest until the cat comes near, then breaks off and comes at
 * it, returning once the cat is far enough away again. It steers rather than
 * points: the velocity is turned gradually towards wherever it is heading, so
 * it banks into curves and overshoots on an attack run instead of tracking the
 * cat like a homing missile -- which is what makes it dodgeable.
 */
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

  constructor(scene: Phaser.Scene, nestX: number, nestY: number) {
    super(scene, nestX, nestY, 'crow');

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
    return this.attacking;
  }

  step(target: Phaser.Math.Vector2, delta: number): void {
    const dt = delta / 1000;
    const toCat = target.distance(this.nest);

    // Hysteresis: it commits to an attack and gives up further out than it
    // started, so a cat hovering on the edge of the range does not make it
    // flicker in and out.
    const wasAttacking = this.attacking;

    this.attacking = this.attacking
      ? toCat < CROW.releaseRange
      : toCat < CROW.attackRange;

    // It calls once, as it breaks off the circle. Calling the whole way in
    // would be a car alarm rather than a bird.
    if (this.attacking && !wasAttacking) {
      sound.playAt('caw', this.x, this.y);
    }

    const aim = this.attacking ? target : this.circlingPoint(dt);
    this.steerTowards(aim, dt);

    this.setFlipX(this.body.velocity.x < 0);
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
