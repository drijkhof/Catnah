import Phaser from 'phaser';
import { CROCODILE_SIZE } from '../art';
import { CROCODILE } from '../config';

/** How much of the crocodile is back rather than snout and belly, px. */
const BACK_HEIGHT = 8;

/** How far along it the back runs before the head starts, px. */
const BACK_WIDTH = 30;

/** Where the back starts inside the frame, px. */
const BACK_TOP = 2;

/**
 * How far above the waterline the back rides, px.
 *
 * Far more than the bob, for two reasons. A cat standing on a back that dipped
 * below the surface would count as being in the water, switch to swimming and
 * sink off its own platform, so the back is never allowed under while the
 * crocodile is afloat. And a crocodile showing only its scutes, which is what a
 * real one does, is unreadable at this size -- this one has to be something the
 * player can aim a jump at, so it rides high and looks like the stepping stone
 * it is.
 */
const FLOAT_LIFT = 7;

/**
 * A crocodile lying in the swamp.
 *
 * It is a platform that does not want to be one. Step on its back and it takes
 * a moment to notice, then goes under and stays under, and comes back up when
 * it has had enough. That is what turns a stretch of water from a swim into a
 * crossing: you get from one to the next by not stopping.
 *
 * **Its mouth is shut until there is a cat in the water.** Lying there with its
 * jaws open the whole time makes it scenery; opening them the moment you fall
 * in makes it the reason not to. It is the only warning the swamp gives.
 *
 * **Its body is only the back**, and stops short of the head. The jaws are wide
 * open, so walking into one from the bank does not stop the cat dead against a
 * nose and standing in its mouth is not something you can do. The collider is
 * one-way -- exactly like a branch -- so the cat lands on the back coming down
 * and never clips it going up.
 */
export class Crocodile extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** Where the top of its back rests when it is afloat, in world pixels. */
  private readonly floatY: number;

  private phase: 'afloat' | 'sinking' | 'under' | 'rising' = 'afloat';

  /** Counts down the delay before sinking, and then the time spent under, ms. */
  private timer = 0;

  /** Runs on forever, so the idle bob does not restart when one is stepped on. */
  private bobClock = 0;

  /**
   * @param x Centre of the crocodile.
   * @param surfaceY Top of the water it lies in. Its back rests there.
   */
  constructor(scene: Phaser.Scene, x: number, surfaceY: number) {
    super(scene, x, surfaceY - BACK_TOP - FLOAT_LIFT, 'crocodile');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0);

    // Drawn over the water tiles rather than under them: a crocodile afloat is
    // on the water, and the cat has to be able to see what it is aiming at.
    this.setDepth(21);

    this.body.setAllowGravity(false);
    // Immovable, or the cat's weight would push it down the screen instead of
    // standing on it.
    this.body.setImmovable(true);
    // The back only, stopping short of the head. The jaws are wide open and
    // standing in them would be an odd thing to be able to do.
    this.body.setSize(BACK_WIDTH, BACK_HEIGHT, false);
    this.body.setOffset(2, BACK_TOP);

    this.floatY = this.y;
  }

  /** True while its back is a floor. */
  get afloat(): boolean {
    return this.phase === 'afloat';
  }

  /**
   * What it can reach from where it is lying.
   *
   * Landing on the back is safe; being in the water beside one is not. The
   * whole crocodile plus a little margin, rather than the body, because the
   * body is only the back and the part that bites is the end that is in the
   * water. It bites while submerged too -- a crocodile you cannot see is the
   * dangerous one, and it is what makes dawdling on a sinking back cost
   * something.
   */
  get jaws(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - CROCODILE_SIZE.width / 2 - 2,
      this.y,
      CROCODILE_SIZE.width + 4,
      CROCODILE_SIZE.height + 4,
    );
  }

  /**
   * Tells it something landed on it.
   *
   * Only a crocodile that is up can be stepped on, and only the first step
   * counts -- landing on one twice while it is already going down should not
   * send it down faster.
   */
  steppedOn(): void {
    if (this.phase !== 'afloat' || this.timer > 0) {
      return;
    }

    this.timer = CROCODILE.sinkDelayMs;
  }

  /**
   * Advances it by one frame. Called from the scene, like everything else.
   *
   * @param cat Where the cat is, in world space.
   * @param catIsSwimming Whether the cat is in water -- any water. A crocodile
   *   has no way of knowing which pool that is, and does not need one: what it
   *   reacts to is a cat in the water near it.
   */
  step(delta: number, cat: Phaser.Math.Vector2, catIsSwimming: boolean): void {
    const dt = delta / 1000;
    this.bobClock += delta;

    this.setTexture(
      catIsSwimming && Math.abs(cat.x - this.x) < CROCODILE.noticeRange
        ? 'crocodile-open'
        : 'crocodile',
    );

    switch (this.phase) {
      case 'afloat':
        this.driftAfloat(delta);
        break;

      case 'sinking':
        this.sink(dt);
        break;

      case 'under':
        this.waitUnder(delta);
        break;

      case 'rising':
        this.rise(dt);
        break;
    }

    this.body.updateFromGameObject();
  }

  /** Bobs on the water, and counts down any weight it is carrying. */
  private driftAfloat(delta: number): void {
    const phase = (this.bobClock / CROCODILE.bobPeriodMs) * Math.PI * 2;
    this.setY(this.floatY + Math.sin(phase) * CROCODILE.bobHeight);

    if (this.timer <= 0) {
      return;
    }

    this.timer -= delta;

    if (this.timer <= 0) {
      this.timer = 0;
      this.phase = 'sinking';
    }
  }

  private sink(dt: number): void {
    this.setY(this.y + CROCODILE.sinkSpeed * dt);

    if (this.y < this.floatY + CROCODILE.sinkDepth) {
      return;
    }

    this.setY(this.floatY + CROCODILE.sinkDepth);
    this.phase = 'under';
    this.timer = CROCODILE.submergedMs;

    // Under the water it is nothing at all: not a floor, not an obstacle. The
    // collider would otherwise keep catching a cat swimming over the top of it.
    this.body.enable = false;
  }

  private waitUnder(delta: number): void {
    this.timer -= delta;

    if (this.timer > 0) {
      return;
    }

    this.timer = 0;
    this.phase = 'rising';
    this.body.enable = true;
  }

  private rise(dt: number): void {
    this.setY(this.y - CROCODILE.riseSpeed * dt);

    if (this.y > this.floatY) {
      return;
    }

    this.setY(this.floatY);
    this.phase = 'afloat';

    // The bob is picked up wherever the clock happens to be, so a row of them
    // never falls into step with itself.
  }
}
