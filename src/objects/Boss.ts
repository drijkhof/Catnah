import Phaser from 'phaser';
import { BOSS } from '../config';
import { BOSS_SIZE, bossKey } from '../art';
import { sound } from '../audio/Sound';

/**
 * The evil lord beetle, guarding the end of the volcano.
 *
 * A hunter. When the cat is near it **stalks**: hangs a little way off to
 * the side and above, wings buzzing, for as long as its patience lasts. Then
 * it **charges**: it locks where the cat is at that instant and accelerates
 * at that point in a straight line -- not tracking, so a cat that moves early
 * is missed and a cat that stands still is hit -- carries on a little past
 * it, **brakes**, picks a new station near the cat, and does it again.
 *
 * It *can* be beaten, and it is the one thing in the game that can: the
 * spots on its back are its lives. Every time it hits the thorns it loses
 * one, thrown back and squealing, and with none left it falls out of the sky.
 * The back is the health bar; there is no other. Charges are what get it
 * onto the thorns: it locks a line at where you are, so stand with thorns
 * behind you and step aside.
 *
 * It is also **on a clock**. Every charge shortens the next rest, down to a
 * floor, so standing in the arena learning its timing works for a while and
 * then stops working. That is what makes it a boss rather than a bigger crow.
 *
 * It flies, but not through rock: the scene gives it a collider against the
 * level's blocks, and a charge that hits a wall ends there.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** The middle of its beat, and where it goes back to with nobody about. */
  private readonly lair: Phaser.Math.Vector2;

  /** The lowest its centre may go: the floor, less the clearance, less half a body. */
  private readonly lowestY: number;

  private timer = 0;

  /** Which side of the cat it last took station on: 1 right, -1 left. */
  private side = -1;

  private phase: 'idle' | 'stalk' | 'charge' | 'recover' | 'dying' = 'idle';

  /** Spots left on its back: its lives. */
  private spots: number = BOSS.spots;

  /** Time since it was last stung, ms. */
  private sinceSting: number = BOSS.stingCooldownMs;

  /** How fast it is falling, px/sec, once it is dying. */
  private fallSpeed = 0;

  /** The charge: where it is going, which way, how fast, and how far it has come. */
  private target = new Phaser.Math.Vector2();
  private heading = new Phaser.Math.Vector2();
  private chargeSpeed = 0;
  private chargeDistance = 0;
  private travelled = 0;

  /** How long it is willing to wait between charges right now, ms. */
  private restMs: number = BOSS.restMs;

  /** Time since the wings were last heard, ms. */
  private wingClock = 0;

  /**
   * @param floorY The floor of the arena it fights in: it never flies lower
   *   than `guardClearance` above that.
   */
  constructor(scene: Phaser.Scene, x: number, y: number, floorY: number) {
    super(scene, x, y, bossKey(BOSS.spots));

    // Measured to the bottom of the body, which sits below the sprite's middle
    // by half its height less the offset.
    this.lowestY = floorY - BOSS.guardClearance - (BOSS_SIZE.height / 2 - 4);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.lair = new Phaser.Math.Vector2(x, y);
    this.body.setSize(BOSS_SIZE.width - 10, BOSS_SIZE.height - 8, false);
    this.body.setOffset(5, 4);
    this.body.setAllowGravity(false);
    this.setDepth(12);
  }

  /** True while it is coming at the cat. */
  get diveInProgress(): boolean {
    return this.phase === 'charge';
  }

  /** True once it has lost its last spot. A dying beetle can hurt nobody. */
  get defeated(): boolean {
    return this.phase === 'dying';
  }

  /**
   * It has hit the thorns. One spot off its back, a squeal, a flash, and
   * thrown back along the line it came in on; the last spot is the end of
   * it. Nothing for `stingCooldownMs` after a sting, so one patch of thorns
   * takes one spot rather than one a frame.
   */
  sting(): void {
    if (this.phase === 'dying' || this.sinceSting < BOSS.stingCooldownMs) {
      return;
    }
    this.sinceSting = 0;
    this.spots -= 1;
    this.setTexture(bossKey(Math.max(0, this.spots)));
    this.setTint(0xff6b6b);
    this.scene.time.delayedCall(220, () => this.clearTint());

    if (this.spots <= 0) {
      this.die();
      return;
    }

    sound.playAt('bossHurt', this.x, this.y);
    // Thrown back the way it came, and up: the charge is over.
    const back = this.phase === 'charge'
      ? this.heading.clone().negate()
      : new Phaser.Math.Vector2(-Math.sign(this.body.velocity.x) || 1, -0.5).normalize();
    this.setVelocity(back.x * BOSS.stingKnockback, back.y * BOSS.stingKnockback - 120);
    this.phase = 'recover';
    this.timer = 0;
  }

  /**
   * Out of spots: it falls, turning over, fading, and is gone.
   *
   * The fall is stepped by hand in `fall`, not tweened: a tween that did not
   * run -- and they do not under the manual stepping the console drives --
   * left a dead beetle hanging in the air for good. Its body is switched off
   * at once, so it can hurt nobody on the way down.
   */
  private die(): void {
    this.phase = 'dying';
    this.timer = 0;
    this.fallSpeed = 0;
    sound.playAt('bossDie', this.x, this.y);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  /** The dying fall: gravity, a slow turn, a fade, and then `destroy`. */
  private fall(delta: number): void {
    const dt = delta / 1000;
    this.fallSpeed += 900 * dt;
    this.setPosition(this.x, this.y + this.fallSpeed * dt);
    this.setAngle(this.angle + (this.flipX ? -1 : 1) * 140 * dt);
    this.setAlpha(Math.max(0, 1 - this.timer / BOSS.deathMs));
    if (this.timer >= BOSS.deathMs) {
      this.destroy();
    }
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

  step(delta: number, cat: Phaser.Math.Vector2): void {
    this.timer += delta;
    if (this.phase === 'dying') {
      this.fall(delta);
      return;
    }
    this.sinceSting += delta;
    this.buzz(delta);

    // It only bothers with a cat it could plausibly reach. One on the far
    // side of the level is not its problem, and going after it dragged the
    // boss out of its own lair and across the rest of the volcano.
    const engaged = Math.abs(cat.x - this.lair.x) < BOSS.engageRange;

    switch (this.phase) {
      case 'idle':
        this.drift(this.lair, 2);
        if (engaged) {
          // Arriving restarts the count, with a grace period on top, so the
          // first charge is never already half wound up when you walk in.
          // Leaving and coming back gets a fresh start rather than a beetle
          // still at full fury.
          this.phase = 'stalk';
          this.timer = -BOSS.approachGraceMs;
          this.restMs = BOSS.restMs;
        }
        break;

      case 'stalk':
        if (!engaged) {
          this.phase = 'idle';
          break;
        }
        this.stalk(delta, cat);
        if (this.timer >= this.restMs) {
          this.beginCharge(cat);
        }
        break;

      case 'charge':
        this.charge(delta);
        break;

      case 'recover':
        this.recover(delta);
        break;
    }

    this.keepToItsLair();

    // It faces the way it is going, head first: the drawing's head is on the
    // right, so it is flipped when it moves left. In a charge the facing is
    // the charge's own line, so it does not flicker at the start, and it
    // tilts its nose into that line; otherwise it rears up as it climbs and
    // noses down as it drops. A flipped sprite's nose is on the left, so the
    // same tilt needs the opposite sign to point the same way.
    const headingX = this.phase === 'charge' ? this.heading.x : this.body.velocity.x;
    const facingRight = headingX >= 0;
    this.setFlipX(!facingRight);
    if (this.phase === 'charge') {
      const nose = Phaser.Math.RadToDeg(Math.atan2(this.heading.y, Math.abs(this.heading.x)));
      this.setAngle(Phaser.Math.Clamp(facingRight ? nose : -nose, -28, 28));
    } else {
      const nose = Phaser.Math.Clamp(this.body.velocity.y * 0.04, -18, 18);
      this.setAngle(facingRight ? nose : -nose);
    }
  }

  /**
   * The wings. A low buzz every `wingBuzzMs` while it has someone to fly at,
   * from where it is, so you hear it coming round before you see it.
   */
  private buzz(delta: number): void {
    this.wingClock += delta;
    if (this.phase !== 'idle' && this.wingClock >= BOSS.wingBuzzMs) {
      this.wingClock = 0;
      sound.playAt('wings', this.x, this.y);
    }
  }

  /** Eases towards a point: velocity proportional to the gap. */
  private drift(point: Phaser.Math.Vector2, rate: number): void {
    this.setVelocity((point.x - this.x) * rate, (point.y - this.y) * rate);
  }

  /**
   * Takes station near the cat: `standoff` to the side it is already on,
   * `hoverAbove` over the cat's head, never lower than it is allowed, never
   * outside its beat. Eased, so it settles rather than oscillates.
   */
  private stalk(delta: number, cat: Phaser.Math.Vector2): void {
    this.side = Math.sign(this.x - cat.x) || this.side;
    const station = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(cat.x + this.side * BOSS.standoff, this.lair.x - BOSS.reach, this.lair.x + BOSS.reach),
      Math.min(cat.y - BOSS.hoverAbove, this.lowestY),
    );

    const wanted = new Phaser.Math.Vector2(station.x - this.x, station.y - this.y).scale(3);
    if (wanted.length() > BOSS.stalkSpeed) {
      wanted.normalize().scale(BOSS.stalkSpeed);
    }
    const turn = Phaser.Math.Clamp((BOSS.stalkRate * delta) / 1000, 0, 1);
    this.setVelocity(
      Phaser.Math.Linear(this.body.velocity.x, wanted.x, turn),
      Phaser.Math.Linear(this.body.velocity.y, wanted.y, turn),
    );
  }

  /**
   * Locks where the cat is *now* and goes. The line is fixed from this
   * moment: a cat that moves early is missed, one that stands still is hit.
   */
  private beginCharge(cat: Phaser.Math.Vector2): void {
    this.target.set(cat.x, Math.min(cat.y, this.lowestY + BOSS.guardClearance));
    this.heading.set(this.target.x - this.x, this.target.y - this.y);
    this.chargeDistance = this.heading.length();
    this.heading.normalize();
    this.chargeSpeed = BOSS.chargeStartSpeed;
    this.travelled = 0;
    this.timer = 0;
    this.phase = 'charge';
    this.restMs = Math.max(BOSS.minRestMs, this.restMs * BOSS.furyStep);
    sound.playAt('boss', this.x, this.y);
  }

  /**
   * Accelerates along the locked line until it is past the point, hits
   * something, or has been at it too long. Then it brakes.
   */
  private charge(delta: number): void {
    const dt = delta / 1000;
    this.chargeSpeed = Math.min(BOSS.chargeSpeed, this.chargeSpeed + BOSS.chargeAccel * dt);
    this.travelled += this.chargeSpeed * dt;
    this.setVelocity(this.heading.x * this.chargeSpeed, this.heading.y * this.chargeSpeed);

    const { blocked } = this.body;
    const hitSomething = blocked.left || blocked.right || blocked.up || blocked.down;
    if (this.travelled >= this.chargeDistance + BOSS.overshoot || hitSomething || this.timer > BOSS.chargeTimeoutMs) {
      this.phase = 'recover';
      this.timer = 0;
    }
  }

  /** Sheds the charge's speed, lifting a little as it does, then stalks again. */
  private recover(delta: number): void {
    const t = Phaser.Math.Clamp(this.timer / BOSS.recoverMs, 0, 1);
    const ease = Phaser.Math.Clamp((6 * delta) / 1000, 0, 1);
    this.setVelocity(
      Phaser.Math.Linear(this.body.velocity.x, 0, ease),
      Phaser.Math.Linear(this.body.velocity.y, -40, ease),
    );
    if (t >= 1) {
      this.phase = 'stalk';
      this.timer = 0;
    }
  }

  /**
   * Hard stop at the ends of its beat and at its lowest height.
   *
   * A charge carries momentum, so it can overrun the edge before anything
   * turns it. Without this the boss wandered hundreds of pixels out of its
   * arena, and with the floor close under it, scraped along the ground.
   */
  private keepToItsLair(): void {
    const left = this.lair.x - BOSS.reach;
    const right = this.lair.x + BOSS.reach;

    if (this.x < left) {
      this.setX(left);
      this.setVelocityX(Math.max(0, this.body.velocity.x));
    } else if (this.x > right) {
      this.setX(right);
      this.setVelocityX(Math.min(0, this.body.velocity.x));
    }

    if (this.y > this.lowestY && this.phase !== 'charge') {
      this.setY(this.lowestY);
      this.setVelocityY(Math.min(0, this.body.velocity.y));
    }
  }
}
