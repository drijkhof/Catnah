import Phaser from 'phaser';
import { BOSS } from '../config';
import { BOSS_SIZE } from '../art';

/**
 * The evil lord beetle, guarding the end of the volcano.
 *
 * It sweeps back and forth above its lair and drops on the cat at a fixed
 * interval, then climbs back to its line. That is the whole of it: there is no
 * health bar and no way to beat it, because nothing in this game can be beaten.
 *
 * What makes it a boss rather than a bigger crow is that its pattern is slow
 * and legible. The crow chases and is dodged by reacting; this is read, waited
 * out, and slipped past — which is the skill the six levels before it teach.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** The middle of its patrol, and the height it returns to. */
  private readonly lair: Phaser.Math.Vector2;

  private timer = 0;

  /** 1 sweeping right, -1 sweeping left. */
  private direction = -1;

  /** What it is doing: sweeping, lining up over the cat, or dropping. */
  private phase: 'sweep' | 'aim' | 'drop' = 'sweep';

  /** The column it commits to once it has lined up. */
  private aimX = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.lair = new Phaser.Math.Vector2(x, y);
    this.body.setSize(BOSS_SIZE.width - 10, BOSS_SIZE.height - 8, false);
    this.body.setOffset(5, 4);
    this.body.setAllowGravity(false);
    this.setDepth(12);
  }

  /** True while it is coming down. */
  get diveInProgress(): boolean {
    return this.phase === 'drop';
  }

  step(delta: number, cat: Phaser.Math.Vector2): void {
    this.timer += delta;

    switch (this.phase) {
      case 'drop':
        this.drop();
        break;

      case 'aim':
        this.lineUp();
        break;

      default: {
        this.sweep(delta);

        // It only bothers with a cat it could plausibly reach. One on the far
        // side of the level is not its problem, and going after it dragged the
        // boss out of its own lair and across the rest of the volcano.
        const withinReach = Math.abs(cat.x - this.lair.x) < BOSS.sweepRadius * 1.6;

        if (this.timer >= BOSS.restMs && withinReach) {
          this.timer = 0;
          this.phase = 'aim';
          this.aimX = Phaser.Math.Clamp(
            cat.x,
            this.lair.x - BOSS.sweepRadius,
            this.lair.x + BOSS.sweepRadius,
          );
        }
      }
    }

    this.keepToItsLair();

    // It faces the way it is going, and rears up as it climbs back out.
    this.setFlipX(this.body.velocity.x > 0);
    this.setAngle(Phaser.Math.Clamp(this.body.velocity.y * 0.04, -18, 18));
  }

  /**
   * Hard stop at the ends of its beat.
   *
   * The sweep turns gradually and a dive carries momentum, so both can overrun
   * the edge before the turn takes. Without this the boss wandered hundreds of
   * pixels out of its arena.
   */
  private keepToItsLair(): void {
    const left = this.lair.x - BOSS.sweepRadius;
    const right = this.lair.x + BOSS.sweepRadius;

    if (this.x < left) {
      this.setX(left);
      this.setVelocityX(Math.max(0, this.body.velocity.x));
      this.direction = 1;
    } else if (this.x > right) {
      this.setX(right);
      this.setVelocityX(Math.min(0, this.body.velocity.x));
      this.direction = -1;
    }
  }

  /** Back and forth above the lair, turning at the ends of its beat. */
  private sweep(delta: number): void {
    if (Math.abs(this.x - this.lair.x) > BOSS.sweepRadius) {
      this.direction = this.x > this.lair.x ? -1 : 1;
    }

    const turn = Phaser.Math.Clamp((BOSS.turnRate * delta) / 1000, 0, 1);

    this.setVelocityX(
      Phaser.Math.Linear(this.body.velocity.x, this.direction * BOSS.sweepSpeed, turn),
    );
    // Drift back to its own height rather than snapping to it.
    this.setVelocityY((this.lair.y - this.y) * 2);
  }

  /**
   * Slides along its line until it is directly over the column it picked.
   *
   * This is the telegraph. A diagonal dive was both unreadable and, in
   * practice, harmless: it reached its depth before it reached the cat, so a
   * cat that simply stood still was never hit. Lining up first makes the attack
   * something you can see coming *and* something that actually arrives.
   */
  private lineUp(): void {
    const gap = this.aimX - this.x;

    this.setVelocityX(Phaser.Math.Clamp(gap * 6, -BOSS.aimSpeed, BOSS.aimSpeed));
    this.setVelocityY((this.lair.y - this.y) * 3);

    if (Math.abs(gap) < 4) {
      this.phase = 'drop';
      this.setVelocity(0, BOSS.diveSpeed);
    }
  }

  /** Straight down, then straight back up. It does not follow on the way. */
  private drop(): void {
    if (this.y >= this.lair.y + BOSS.diveDepth) {
      this.phase = 'sweep';
      this.timer = 0;
      this.setVelocityY(-BOSS.diveSpeed * 0.7);
    }
  }
}
