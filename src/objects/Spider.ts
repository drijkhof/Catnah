import Phaser from 'phaser';
import { SPIDER_SIZE } from '../art';
import { COLORS, SPIDER } from '../config';
import { isSolidTile } from './solid';

/** How far ahead along the ceiling it looks, px. */
const PROBE = 3;

/**
 * A cave spider.
 *
 * It owns the ceiling the way a hedgehog owns the floor: it walks along the
 * underside of the rock, upside down, and turns wherever the rock stops. Pass
 * underneath one and it drops the length of its thread, hangs there a moment,
 * and hauls itself back up.
 *
 * It is the first thing in the game that comes at the cat from above without
 * flying, which is the point of it: a tunnel roof was previously somewhere you
 * never had to look.
 *
 * Nothing about it is physical except being touched. It has no gravity and
 * nothing collides with it -- where it is, is decided entirely here.
 */
export class Spider extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** The ceiling it hangs from, in world pixels. The thread starts here. */
  private readonly ceilingY: number;

  /** The silk, redrawn each frame from the ceiling down to wherever it is. */
  private readonly thread: Phaser.GameObjects.Graphics;

  private phase: 'walking' | 'dropping' | 'hanging' | 'climbing' | 'resting' = 'walking';

  /** 1 walking right, -1 walking left. */
  private direction = -1;

  /** Counts out the hang at the bottom, and then the rest after getting home. */
  private timer = 0;

  /**
   * 1 for an ordinary spider; `SPIDER.giantScale` for the one in the cave.
   *
   * Not called `scale`: a Sprite already has one of those, and shadowing it
   * breaks every place the game treats a creature as a plain sprite.
   */
  private readonly size: number;

  constructor(scene: Phaser.Scene, x: number, ceilingY: number, size = 1) {
    super(scene, x, ceilingY + (SPIDER_SIZE.height * size) / 2, 'spider');

    this.ceilingY = ceilingY;
    this.size = size;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(size);
    this.body.setAllowGravity(false);
    this.body.setSize(SPIDER_SIZE.width - 6, SPIDER_SIZE.height - 2, true);
    this.setDepth(size > 1 ? 13 : 4);

    this.thread = scene.add.graphics().setDepth(size > 1 ? 12 : 3);
  }

  /** How far it lets itself down, in pixels. Everything about it scales. */
  private get reach(): number {
    return SPIDER.dropLength * this.size;
  }

  /** How fast it does anything, as a fraction. A big spider is a slow spider. */
  private get pace(): number {
    return this.size > 1 ? SPIDER.giantSlowness : 1;
  }

  /** Where it rests, hanging under the rock. */
  private get restY(): number {
    return this.ceilingY + (SPIDER_SIZE.height * this.size) / 2;
  }

  /** Advances it by one frame. `cat` is where the cat is, in world space. */
  step(delta: number, cat: Phaser.Math.Vector2): void {
    switch (this.phase) {
      case 'walking':
        this.walk(delta, cat);
        break;

      case 'dropping':
        this.drop(delta);
        break;

      case 'hanging':
        this.wait(delta, 'climbing');
        break;

      case 'climbing':
        this.climb(delta);
        break;

      case 'resting':
        this.wait(delta, 'walking');
        break;
    }

    this.drawThread();
  }

  destroy(fromScene?: boolean): void {
    this.thread.destroy();
    super.destroy(fromScene);
  }

  /**
   * Walks the ceiling, and watches for a cat underneath.
   *
   * It only drops on a cat that is genuinely below it. A cat on a ledge level
   * with the spider is not something a spider on a thread can reach, and
   * dropping at one would read as the spider missing rather than as the player
   * dodging.
   */
  private walk(delta: number, cat: Phaser.Math.Vector2): void {
    if (this.atLevelEdge() || !this.ceilingAhead()) {
      this.direction = -this.direction;
    }

    this.x += this.direction * SPIDER.walkSpeed * this.pace * (delta / 1000);
    this.body.updateFromGameObject();

    const underneath =
      Math.abs(cat.x - this.x) < SPIDER.dropRange * this.size &&
      cat.y > this.y &&
      cat.y < this.y + this.reach + 40 * this.size;

    if (underneath) {
      this.phase = 'dropping';
    }
  }

  private drop(delta: number): void {
    this.y += SPIDER.dropSpeed * this.pace * (delta / 1000);

    if (this.y >= this.ceilingY + this.reach) {
      this.y = this.ceilingY + this.reach;
      this.phase = 'hanging';
      this.timer = SPIDER.hangMs;
    }

    this.body.updateFromGameObject();
  }

  private climb(delta: number): void {
    this.y -= SPIDER.climbSpeed * this.pace * (delta / 1000);

    if (this.y <= this.restY) {
      this.y = this.restY;
      this.phase = 'resting';
      this.timer = SPIDER.cooldownMs;
    }

    this.body.updateFromGameObject();
  }

  private wait(delta: number, next: 'climbing' | 'walking'): void {
    this.timer -= delta;

    if (this.timer <= 0) {
      this.timer = 0;
      this.phase = next;
    }
  }

  /** One line of silk, from the rock down to wherever it has got to. */
  private drawThread(): void {
    this.thread.clear();
    this.thread.lineStyle(Math.max(1, this.size / 3), COLORS.spiderThread, 0.75);
    this.thread.lineBetween(this.x, this.ceilingY, this.x, this.y);
  }

  private atLevelEdge(): boolean {
    const bounds = this.scene.physics.world.bounds;

    return this.direction > 0
      ? this.body.right >= bounds.right - PROBE
      : this.body.x <= bounds.x + PROBE;
  }

  /**
   * Is there still rock over the step it is about to take?
   *
   * The mirror of a hedgehog checking for floor. It probes the underside face,
   * so a one-way ledge -- which has no underside to hang from -- is correctly
   * not a ceiling.
   */
  private ceilingAhead(): boolean {
    const ahead = this.direction > 0 ? this.body.right : this.body.x - PROBE;

    const found = this.scene.physics.overlapRect(
      ahead,
      this.ceilingY - PROBE * 2,
      PROBE,
      PROBE * 2,
      false,
      true,
    ) as Phaser.Physics.Arcade.StaticBody[];

    return found.some((body) => isSolidTile(body) && body.checkCollision.down);
  }
}
