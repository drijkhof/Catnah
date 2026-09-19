import Phaser from 'phaser';
import { PIRANHA } from '../config';

/**
 * A piranha, patrolling the pool it lives in.
 *
 * It swims its own water rather than hovering at one spot, comes for the cat if
 * the cat gets in with it, and leaps clear of the surface now and then. The
 * leap is on a fixed rhythm: a hazard whose timing cannot be learnt is just bad
 * luck.
 *
 * It keeps itself in the water by looking ahead rather than by being fenced in,
 * which means it needs no idea of which pool is "its" -- it simply never swims
 * at anything that is not water.
 */
export class Piranha extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly water: Phaser.Geom.Rectangle[];
  private readonly surfaceY: number;

  /** 1 swimming right, -1 swimming left. */
  private direction = 1;

  private timer = 0;

  /** True between leaving the water and falling back into it. */
  private leaping = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    surfaceY: number,
    water: Phaser.Geom.Rectangle[],
    delayMs = 0,
  ) {
    super(scene, x, surfaceY + PIRANHA.lurkDepth, 'piranha');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.water = water;
    this.surfaceY = surfaceY;
    this.timer = -delayMs;

    this.body.setAllowGravity(false);
    this.setDepth(10);
  }

  /**
   * @param cat Where the cat is.
   * @param catSwimming Whether the cat is in water; it only chases if so.
   */
  step(delta: number, cat: Phaser.Math.Vector2, catSwimming: boolean): void {
    this.timer += delta;

    if (this.leaping) {
      this.continueLeap();
      return;
    }

    const chasing =
      catSwimming && Phaser.Math.Distance.BetweenPoints(this, cat) < PIRANHA.chaseRange;

    if (chasing) {
      this.swimTowards(cat.x, cat.y, PIRANHA.chaseSpeed, delta);
    } else {
      this.patrol(delta);
    }

    if (this.timer >= PIRANHA.intervalMs) {
      this.beginLeap();
    }

    this.setFlipX(this.body.velocity.x < 0);
    this.setAngle(Phaser.Math.Clamp(this.body.velocity.y * 0.15, -35, 35));
  }

  /** Up and down its pool, at its preferred depth. */
  private patrol(delta: number): void {
    const ahead = this.x + this.direction * (this.width / 2 + 6);

    if (!this.inWater(ahead, this.y)) {
      this.direction = -this.direction;
    }

    // Turning on the nose alone lets the body carry on a few pixels past the
    // bank. Reversing again the moment the middle of the fish leaves the water
    // bounds that overshoot to a single frame's worth.
    if (!this.inWater(this.x, this.y)) {
      this.direction = this.inWater(this.x + 8, this.y) ? 1 : -1;
    }

    this.swimTowards(
      this.x + this.direction * 40,
      this.surfaceY + PIRANHA.lurkDepth,
      PIRANHA.swimSpeed,
      delta,
    );
  }

  /** Turns towards a point rather than snapping at it, so it banks. */
  private swimTowards(x: number, y: number, speed: number, delta: number): void {
    const desired = new Phaser.Math.Vector2(x - this.x, y - this.y)
      .normalize()
      .scale(speed);
    const turn = Phaser.Math.Clamp((PIRANHA.turnRate * delta) / 1000, 0, 1);

    this.setVelocity(
      Phaser.Math.Linear(this.body.velocity.x, desired.x, turn),
      Phaser.Math.Linear(this.body.velocity.y, desired.y, turn),
    );
  }

  private beginLeap(): void {
    this.timer = 0;
    this.leaping = true;
    this.body.setAllowGravity(true);

    // Straight up. Keeping the swimming speed would carry the fish clean out of
    // its own pool during the second or so it is airborne, and it would come
    // down on the bank.
    this.setVelocity(0, PIRANHA.leapVelocity);
  }

  private continueLeap(): void {
    this.setAngle(this.body.velocity.y < 0 ? -70 : 70);

    // Back under: stop falling and go back to swimming.
    if (this.body.velocity.y > 0 && this.inWater(this.x, this.y)) {
      this.leaping = false;
      this.body.setAllowGravity(false);
      this.setVelocityY(0);
    }
  }

  private inWater(x: number, y: number): boolean {
    return this.water.some((zone) => zone.contains(x, y));
  }
}
