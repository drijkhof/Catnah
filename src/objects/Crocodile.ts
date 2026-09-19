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
 * **It hunts.** Its mouth is shut and it lies still until there is a cat in its
 * own water; then every crocodile in the pool opens up, turns round and swims
 * at it. Only the one that gets there bites -- three set off and one arrives,
 * which is a far better thing to be caught by than a rectangle you swam into.
 *
 * It never leaves its own pool, for the same reason the piranhas do not: a
 * crocodile crossing dry land to reach you is not a crocodile.
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

  /** The spot in the water it lies at, and swims back to. */
  private readonly homeX: number;

  /** The tiles of this crocodile's own pool. Nothing else counts as water. */
  private readonly pool: Phaser.Geom.Rectangle[];

  /** The extent of that pool, used to fence it in. */
  private readonly bounds: Phaser.Geom.Rectangle;

  private phase:
    | 'afloat'
    | 'sinking'
    | 'under'
    | 'rising'
    | 'hunting'
    | 'returning' = 'afloat';

  /** Counts down the delay before sinking, and then the time spent under, ms. */
  private timer = 0;

  /** Runs on forever, so the idle bob does not restart when one is stepped on. */
  private bobClock = 0;

  /** Which way it is swimming, in radians. Only used while it is in the water. */
  private heading = 0;

  /**
   * @param x Centre of the crocodile.
   * @param surfaceY Top of the water it lies in. Its back rests there.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    surfaceY: number,
    pool: Phaser.Geom.Rectangle[] = [],
  ) {
    super(scene, x, surfaceY - BACK_TOP - FLOAT_LIFT, 'crocodile');

    this.homeX = x;
    this.pool = pool;
    this.bounds = pool.reduce(
      (box, tile) => Phaser.Geom.Rectangle.Union(box, tile),
      new Phaser.Geom.Rectangle(pool[0]?.x ?? x, pool[0]?.y ?? surfaceY, 0, 0),
    );

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
   * Landing on the back is safe; being reached by one in the water is not. The
   * whole crocodile plus a little margin, rather than the body, because the
   * body is only the back and the part that bites is the head.
   *
   * With the crocodiles swimming at the cat rather than waiting in place, this
   * is what decides which of them gets there: they all set off, and the bite
   * belongs to whichever one arrives.
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

    const hunting = this.wants(cat, catIsSwimming);
    this.setTexture(hunting ? 'crocodile-open' : 'crocodile');

    if (hunting) {
      this.phase = 'hunting';
    } else if (this.phase === 'hunting') {
      this.phase = 'returning';
    }

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

      case 'hunting':
        this.hunt(dt, cat);
        break;

      case 'returning':
        this.goHome(dt);
        break;
    }

    this.body.updateFromGameObject();
  }

  /**
   * Whether there is a cat worth going after.
   *
   * It has to be in the water, in *this* crocodile's pool, and near enough.
   * A cat swimming in the next pond along is somebody else's problem.
   */
  private wants(cat: Phaser.Math.Vector2, catIsSwimming: boolean): boolean {
    return (
      catIsSwimming &&
      Phaser.Math.Distance.Between(cat.x, cat.y, this.x, this.y) <
        CROCODILE.noticeRange &&
      this.pool.some((tile) => tile.contains(cat.x, cat.y))
    );
  }

  /**
   * Swims at the cat.
   *
   * Nothing to stand on while it does: a hunting crocodile is in the water like
   * everything else in there, so its body goes off and the one-way collider
   * with it. It comes back when the crocodile does.
   */
  private hunt(dt: number, cat: Phaser.Math.Vector2): void {
    this.body.enable = false;

    this.swimTowards(cat.x, cat.y, CROCODILE.chaseSpeed, dt);
    this.setFlipX(cat.x < this.x);
  }

  /** Back to its place, and back to being something to stand on. */
  private goHome(dt: number): void {
    this.setFlipX(this.homeX < this.x);
    this.swimTowards(this.homeX, this.floatY, CROCODILE.returnSpeed, dt);

    if (
      Math.abs(this.x - this.homeX) < 2 &&
      Math.abs(this.y - this.floatY) < 2
    ) {
      this.setPosition(this.homeX, this.floatY);
      this.setFlipX(false);
      this.phase = 'afloat';
      this.timer = 0;
      this.body.enable = true;
    }
  }

  /**
   * Moves towards a point, turning rather than snapping round.
   *
   * Turning is what makes it read as swimming: a crocodile that changed
   * direction instantly would look like a cursor.
   */
  private swimTowards(x: number, y: number, speed: number, dt: number): void {
    const wanted = Math.atan2(y - this.y, x - this.x);
    const turn = Phaser.Math.Angle.Wrap(wanted - this.heading);

    this.heading += Phaser.Math.Clamp(
      turn,
      -CROCODILE.turnRate * dt,
      CROCODILE.turnRate * dt,
    );

    this.setPosition(
      this.x + Math.cos(this.heading) * speed * dt,
      this.y + Math.sin(this.heading) * speed * dt,
    );

    this.keepInPool();
  }

  /**
   * Never out of its own water, whatever it is chasing.
   *
   * The ceiling has to allow `floatY`, which is above the waterline. It did
   * not, once: the clamp stopped two pixels short of home, `goHome` waited to
   * be within two pixels of it, and so a crocodile that had chased you never
   * settled again. It circled its pool with its mouth open forever and the
   * crossing was gone for the rest of the run.
   */
  private keepInPool(): void {
    const halfW = CROCODILE_SIZE.width / 2;

    if (this.x - halfW < this.bounds.left) {
      this.setX(this.bounds.left + halfW);
    } else if (this.x + halfW > this.bounds.right) {
      this.setX(this.bounds.right - halfW);
    }

    if (this.y < this.floatY) {
      this.setY(this.floatY);
    } else if (this.y + CROCODILE_SIZE.height > this.bounds.bottom) {
      this.setY(this.bounds.bottom - CROCODILE_SIZE.height);
    }
  }

  /**
   * Puts it straight back where it belongs, afloat and calm.
   *
   * Called when the cat dies. Nothing else resets a crocodile: while the cat
   * is dying it is not stepped, so whatever `swimming` said at the moment of
   * death goes on being true -- and a cat that drowned leaves every crocodile
   * in its pool hunting a thing that is no longer there.
   */
  settle(): void {
    this.setPosition(this.homeX, this.floatY);
    this.setFlipX(false);
    this.setTexture('crocodile');
    this.phase = 'afloat';
    this.timer = 0;
    this.heading = 0;
    this.body.enable = true;
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
