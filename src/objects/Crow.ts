import Phaser from 'phaser';
import { CROW } from '../config';
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
  private angle2 = 0;
  private attacking = false;

  constructor(scene: Phaser.Scene, nestX: number, nestY: number) {
    super(scene, nestX, nestY, 'crow');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.nest = new Phaser.Math.Vector2(nestX, nestY);
    this.body.setAllowGravity(false);
    this.setDepth(10);
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
      sound.play('caw');
    }

    const aim = this.attacking ? target : this.circlingPoint(dt);
    this.steerTowards(aim, dt);

    this.setFlipX(this.body.velocity.x < 0);
  }

  /** The point on its patrol circle it is currently heading for. */
  private circlingPoint(dt: number): Phaser.Math.Vector2 {
    this.angle2 += CROW.circleSpeed * dt;

    return new Phaser.Math.Vector2(
      this.nest.x + Math.cos(this.angle2) * CROW.circleRadius,
      this.nest.y + Math.sin(this.angle2) * CROW.circleRadius * 0.5,
    );
  }

  /**
   * Turns the current velocity towards a point instead of pointing straight at
   * it, which is what gives the flight its curve.
   */
  private steerTowards(point: Phaser.Math.Vector2, dt: number): void {
    const speed = this.attacking ? CROW.attackSpeed : CROW.circleSpeed * CROW.circleRadius;
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
