import Phaser from 'phaser';
import { BOSS } from '../config';
import { BOSS_SIZE } from '../art';
import { sound } from '../audio/Sound';

/**
 * The evil lord beetle, guarding the end of the volcano.
 *
 * It **stands in the way**. Not a patrol that might happen to be overhead: it
 * plants itself between the cat and the way out and shadows it there, lines up,
 * and drops -- correcting sideways on the way down, because it is trying to
 * land on you.
 *
 * It holds station **low**, with fourteen pixels of daylight under it: a
 * standing cat is 18 tall and does not fit, a sneaking one is 9 and does. So
 * getting past it on the floor means going under it on your belly, which is
 * what the game has been teaching since the fallen bough in level one -- and
 * while you are under there, it drops.
 *
 * There is no health bar and no way to beat it, because nothing in this game
 * can be beaten. What there is, is a **window**: while it is down and hauling
 * itself back up, the gap under it is wide open. Bait the drop, then go. That
 * is the whole fight.
 *
 * It is also **on a clock**. Every dive shortens the next rest, down to a
 * floor, so standing in the arena learning the pattern works for a while and
 * then stops working. That is what makes it a boss rather than a bigger crow:
 * not that the pattern is hard to read, but that you do not get to read it
 * forever.
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

  /** Whether the cat is close enough to be its business. */
  private engaged = false;

  /** How long it is willing to wait between dives right now, ms. */
  private restMs: number = BOSS.restMs;

  /** Which way the way out is from the lair: 1 for right, -1 for left. */
  private readonly wayOut: number;

  /** Where the door is. It will not give ground past this. */
  private readonly exitX: number;

  /** The height it holds station at: low, with a sneaking gap underneath. */
  private readonly guardY: number;

  /**
   * How far either side of the lair it will go, px.
   *
   * Reaches the door. Fenced at a fixed radius it simply stopped short of the
   * exit and a cat that ran at the door went round the outside of it, which is
   * the opposite of standing in the way.
   */
  private readonly reach: number;

  /** Where the cat was last frame, so the beetle can work out where it is going. */
  private lastCatX: number | null = null;

  /** The cat's own speed, smoothed, px/sec. What the aim is led by. */
  private catSpeed = 0;

  /**
   * @param exitX Where the way out is. The beetle keeps itself between the cat
   *   and that, which is what makes it something to get past.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    exitX = x + 1,
    floorY = y + BOSS.diveDepth,
  ) {
    super(scene, x, y, 'boss');

    this.wayOut = Math.sign(exitX - x) || 1;
    this.exitX = exitX;
    this.reach = Math.max(BOSS.sweepRadius, Math.abs(exitX - x) + 48);

    // Measured to the bottom of the body, which sits below the sprite's middle
    // by half its height less the offset.
    this.guardY = floorY - BOSS.guardClearance - (BOSS_SIZE.height / 2 - 4);

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
    this.watchTheCat(delta, cat);

    switch (this.phase) {
      case 'drop':
        this.drop(delta, cat);
        break;

      case 'aim':
        this.lineUp();
        break;

      default: {
        this.guard(delta, cat);

        // It only bothers with a cat it could plausibly reach. One on the far
        // side of the level is not its problem, and going after it dragged the
        // boss out of its own lair and across the rest of the volcano.
        const withinReach = Math.abs(cat.x - this.lair.x) < this.reach + 120;

        if (withinReach !== this.engaged) {
          this.engaged = withinReach;
          // Arriving restarts the count, with a grace period on top, so the
          // first attack is never already half wound up when you walk in. It
          // also cools off: leaving the arena and coming back gets you a fresh
          // start rather than a beetle still at full fury.
          this.timer = withinReach ? -BOSS.approachGraceMs : 0;
          this.restMs = BOSS.restMs;
        }

        if (this.timer >= this.restMs && withinReach) {
          this.timer = 0;
          this.restMs = Math.max(BOSS.minRestMs, this.restMs * BOSS.furyStep);
          this.phase = 'aim';
          // Aimed where the cat is *going*, not where it is. Running away in
          // a straight line used to work forever, because the cat is faster
          // than the sweep.
          this.aimX = Phaser.Math.Clamp(
            cat.x + this.catSpeed * BOSS.leadSeconds,
            this.lair.x - this.reach,
            this.lair.x + this.reach,
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
   * Keeps track of how fast the cat is moving, and which way.
   *
   * Smoothed, because a single frame's difference is noise and a beetle that
   * aimed at noise would be unreadable rather than dangerous.
   */
  private watchTheCat(delta: number, cat: Phaser.Math.Vector2): void {
    if (this.lastCatX !== null && delta > 0) {
      const measured = ((cat.x - this.lastCatX) * 1000) / delta;
      this.catSpeed = Phaser.Math.Linear(this.catSpeed, measured, 0.25);
    }

    this.lastCatX = cat.x;
  }

  /**
   * Hard stop at the ends of its beat.
   *
   * The sweep turns gradually and a dive carries momentum, so both can overrun
   * the edge before the turn takes. Without this the boss wandered hundreds of
   * pixels out of its arena.
   */
  private keepToItsLair(): void {
    const left = this.lair.x - this.reach;
    const right = this.lair.x + this.reach;

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

  /**
   * Holds station between the cat and the way out.
   *
   * Not a beat it walks whatever you do. It picks a spot `guardOffset` past the
   * cat on the exit side and shadows it there, so walking towards the door
   * means walking into it. With nobody in the arena it drifts back to the
   * middle of its lair.
   */
  private guard(delta: number, cat: Phaser.Math.Vector2): void {
    // Where the cat is *going*, plus a body's length past it on the exit side --
    // but **never past the door**. Backing off for ever meant a cat that simply
    // ran was escorted to the exit by a beetle politely keeping its distance.
    // It gives ground until its back is to the door, and then it stands there.
    const ahead =
      cat.x + this.catSpeed * BOSS.guardLeadSeconds + this.wayOut * BOSS.guardOffset;
    const lastStand = this.exitX - this.wayOut * BOSS.guardOffset;
    const station = this.engaged
      ? this.wayOut > 0
        ? Math.min(ahead, lastStand)
        : Math.max(ahead, lastStand)
      : this.lair.x;

    const gap =
      Phaser.Math.Clamp(station, this.lair.x - this.reach, this.lair.x + this.reach) -
      this.x;

    this.direction = Math.sign(gap) || this.direction;

    const turn = Phaser.Math.Clamp(
      ((this.engaged ? BOSS.stalkRate : BOSS.turnRate) * delta) / 1000,
      0,
      1,
    );

    // Eases off as it arrives, so it settles into its station rather than
    // oscillating across it.
    const wanted = Phaser.Math.Clamp(gap * 4, -BOSS.sweepSpeed, BOSS.sweepSpeed);

    this.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, wanted, turn));

    // Down to its guarding height when there is someone in the arena, back up
    // to its lair when there is not. Drifted rather than snapped.
    const height = this.engaged ? this.guardY : this.lair.y;

    this.setVelocityY((height - this.y) * 2);
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
      sound.play('boss');
    }
  }

  /**
   * Down, correcting towards the cat as it comes, then slowly back up.
   *
   * The correction is small: stepping aside at the last instant does not work,
   * moving early does. A dive that tracked perfectly would be a coin toss, and
   * one that did not track at all was dodged by taking a single step.
   *
   * The climb back is the slow part on purpose. While it is down there it is
   * not between you and the door, and that is the only way past it.
   */
  private drop(delta: number, cat: Phaser.Math.Vector2): void {
    const towards = Math.sign(cat.x - this.x);

    this.setVelocityX(
      Phaser.Math.Linear(
        this.body.velocity.x,
        towards * BOSS.diveTrack,
        Phaser.Math.Clamp((4 * delta) / 1000, 0, 1),
      ),
    );

    if (this.y >= this.guardY + BOSS.diveDepth * 0.4) {
      this.phase = 'sweep';
      this.timer = 0;
      this.setVelocityY(-BOSS.riseSpeed);
    }
  }
}
