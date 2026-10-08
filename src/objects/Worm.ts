import Phaser from 'phaser';
import { COLORS, TILE, WORM } from '../config';
import { MOUND_SIZE, WORM_SIZE } from '../art';
import { sound } from '../audio/Sound';
import type { Mound } from '../level/Level';
import { KEEP_LIVE } from '../world';

/** How far above its feet the cat's middle is, px: what a worm aims at. */
const CAT_MIDDLE = 9;

/**
 * A worm under the sand.
 *
 * Now and then, on its own clock, it comes up out of its hole to **look
 * about** -- without warning, that is the point -- and goes back down. A
 * cat on the sand within `huntRange` when it looks is **spotted**: the worm
 * leans a little toward it and watches it while it is up. Then it **hunts**:
 * the worm crawls under the
 * sand toward the cat, hole and all -- the mound moves with it as the
 * ripple, sand kicking up behind -- as far as the sand goes (`Mound.from`
 * to `Mound.to`; a rock, a wall, a cactus or a drop ends it). Close enough,
 * the ground **churns** for a moment -- the warning -- and then it
 * **lunges**: out of the sand fast and further than it stands for the look,
 * leaning toward the cat and following it while it rises, snaps, and sinks
 * back in wherever it is. Then it needs a moment under the sand before the
 * next lunge, which is the gap to run through. It is slower under the sand
 * than the cat is on it, so it can be outrun; it closes on a cat that
 * stops. With no prey about it drifts back to its hole and, home again,
 * forgets -- the next cat gets the look again.
 *
 * Only the part that is out can hurt you, and `touches` says whether a body
 * is on it this frame -- the scene asks every frame, like the lava's
 * rectangles. The worm is a *segment* from the sand, not a column: it
 * leans, so the deadly part is tested as a thick line.
 *
 * Drawn by cropping: the worm texture is the whole animal, head at the top,
 * and the picture shows its top `out` pixels with the origin at the bottom of
 * the shown part, placed on the sand and rotated to the lean. The mound is
 * drawn in front, so the worm comes out of it rather than standing on it. No
 * physics body: nothing may ever stand on a worm, and a body nothing
 * collides with is work for nothing.
 */
export class Worm {
  private readonly sprite: Phaser.GameObjects.Image;

  private readonly mound: Phaser.GameObjects.Image;

  private readonly moundY: number;

  /** The sand thrown up: the ruffle before a lunge, the trail of a sneak. */
  private readonly grains: Phaser.GameObjects.Graphics;

  /** Where the worm is under the sand: the centre of its ripple. */
  private x: number;

  /** Where its mound was placed; where it goes back to with nothing about. */
  private readonly home: number;

  /** How far the sand goes, px: the worm's centre stays within these. */
  private readonly from: number;

  private readonly to: number;

  /** The top of the sand: where the worm comes out. */
  private readonly top: number;

  private phase: 'hidden' | 'shivering' | 'rising' | 'standing' | 'sinking' = 'hidden';

  private timer: number;

  /** Whether it has seen the cat: it looks first, and hunts only after. */
  private spotted = false;

  /** Whether this appearance is the look rather than a lunge. */
  private looking = false;

  /** How much of the worm is out, px along its own length. */
  private out = 0;

  /** How far this appearance reaches: the peek's height or the lunge's. */
  private reach: number = WORM.height;

  /** Lean from upright, radians; positive leans right. Zero for a peek. */
  private lean = 0;

  private lunging = false;

  /** Time left before it may lunge again, ms. */
  private cooldown = 0;

  constructor(scene: Phaser.Scene, mound: Mound, seed: number) {
    this.x = mound.x + TILE / 2;
    this.home = this.x;
    this.from = mound.from + TILE / 2;
    this.to = mound.to - TILE / 2;
    this.top = mound.y + TILE - 2;

    this.sprite = scene.add
      .image(this.x, this.top, 'worm')
      .setOrigin(0.5, 1)
      .setDepth(-0.35)
      .setVisible(false);

    // The mound moves, so it must not be baked: the scenery bake flattens
    // every still image at this depth into the static textures and destroys
    // the original, which left a mound painted at home for ever while the
    // worm came up somewhere else.
    this.moundY = mound.y + TILE - MOUND_SIZE.height;
    this.mound = scene.add
      .image(this.x, this.moundY, 'mound')
      .setOrigin(0.5, 0)
      .setDepth(-0.3)
      .setData(KEEP_LIVE, true);

    // Redrawn every frame, so it is live too: a Graphics at this depth is
    // otherwise baked (empty) and destroyed with the rest of the scenery.
    this.grains = scene.add.graphics().setDepth(-0.29).setData(KEEP_LIVE, true);

    // Each worm starts somewhere in its own wait, so a row of mounds does
    // not look about like a chorus line.
    this.timer = WORM.hiddenMinMs + ((seed * 7919) % (WORM.hiddenMaxMs - WORM.hiddenMinMs));
  }

  /** Whether a body is on the part of the worm that is out of the sand. */
  touches(body: { x: number; right: number; y: number; bottom: number }): boolean {
    if (this.out < 4) {
      return false;
    }
    // A thick segment against a rectangle: the rectangle grown by the worm's
    // half-width, then the segment walked in short steps.
    const half = WORM_SIZE.width / 2;
    const left = body.x - half;
    const right = body.right + half;
    const above = body.y - half;
    const below = body.bottom + half;
    const dx = Math.sin(this.lean);
    const dy = -Math.cos(this.lean);
    for (let along = 0; along <= this.out; along += 2) {
      const px = this.x + dx * along;
      const py = this.top + dy * along;
      if (px > left && px < right && py > above && py < below) {
        return true;
      }
    }
    return false;
  }

  /**
   * Points the worm at the cat, within what its body can bend to. At the
   * cat's middle, not its feet: `cat.y` is the feet, and feet on the sand
   * are *below* the top of it, which aimed a worm right under the cat
   * sideways at the ground.
   */
  private aimAt(cat: { x: number; y: number }, maxLeanDegrees: number): void {
    const toward = Math.atan2(cat.x - this.x, Math.max(4, this.top - (cat.y - CAT_MIDDLE)));
    const limit = Phaser.Math.DegToRad(maxLeanDegrees);
    this.lean = Phaser.Math.Clamp(toward, -limit, limit);
  }

  /** Whether it moved under the sand this frame: the ripple is drawn then. */
  private moving = false;

  /** Moves under the sand toward `target`, as far as the sand goes. */
  private travel(target: number, delta: number): void {
    const step = (WORM.travelSpeed * delta) / 1000;
    const next = Math.abs(target - this.x) <= step ? target : this.x + Math.sign(target - this.x) * step;
    const was = this.x;
    this.x = Phaser.Math.Clamp(next, this.from, this.to);
    this.moving = this.x !== was;
  }

  private lunge(cat: { x: number; y: number }): void {
    this.phase = 'rising';
    this.lunging = true;
    this.looking = false;
    this.spotted = true;
    this.reach = WORM.lungeHeight;
    this.timer = WORM.lungeMs * (1 - this.out / WORM.lungeHeight);
    this.aimAt(cat, WORM.maxLean);
    sound.playAt('scurry', this.x, this.top);
  }

  /**
   * Up out of the hole, without warning, to look about. With a cat near it
   * is the look *at* it; with nobody there it is straight up, a peek.
   */
  private look(cat: { x: number; y: number }, hunted: boolean): void {
    this.phase = 'rising';
    this.looking = hunted;
    this.lunging = false;
    this.reach = WORM.height;
    this.timer = WORM.riseMs;
    this.lean = 0;
    if (hunted) {
      this.aimAt(cat, WORM.lookLean);
    }
    sound.playAt('scurry', this.x, this.top);
  }

  /**
   * @param cat Where the cat is: prey, when it comes within reach of the sand.
   * @param camelsAt Where the camels are. A worm is afraid of them: with
   *   one within `WORM.fearRange` of it, it stays under, and one that is up
   *   goes down at once.
   */
  step(delta: number, cat: { x: number; y: number }, camelsAt: ReadonlyArray<{ x: number }> = []): void {
    this.timer -= delta;
    this.cooldown -= delta;
    this.moving = false;

    const scared = camelsAt.some((camel) => Math.abs(camel.x - this.x) < WORM.fearRange);
    // On the sand, or in the air just above it: a cat on a shelf overhead is
    // out of reach and not worth coming up for.
    const onTheSand = cat.y < this.top + TILE && cat.y > this.top - WORM.lungeHeight - TILE;
    const prey = !scared && onTheSand && Math.abs(cat.x - this.x) < WORM.senseRange;
    const hunted = !scared && onTheSand && Math.abs(cat.x - this.x) < WORM.huntRange;

    if (scared && (this.phase === 'rising' || this.phase === 'standing' || this.phase === 'shivering')) {
      this.phase = 'sinking';
      this.timer = WORM.sinkMs * (this.out / this.reach);
    }

    switch (this.phase) {
      case 'hidden':
        if (prey && this.cooldown <= 0) {
          // Close already -- a cat that dropped in beside the hole gets no
          // look, only the warning.
          this.phase = 'shivering';
          this.spotted = true;
          this.timer = WORM.shiverMs;
          sound.playAt('scurry', this.x, this.top);
        } else if (hunted && this.spotted) {
          this.travel(cat.x, delta);
        } else if (this.timer <= 0 && !scared) {
          // Its own clock, not the cat's: the look comes when it comes.
          this.look(cat, hunted);
        } else if (!hunted && !scared) {
          this.travel(this.home, delta);
          if (this.x === this.home) {
            this.spotted = false;
          }
        }
        break;
      case 'shivering':
        // The cat that steps away before the worm comes is let go -- and a
        // worm that shivered for nothing is half the point of the shiver.
        if (!prey) {
          this.phase = 'hidden';
        } else if (this.timer <= 0) {
          this.lunge(cat);
        }
        break;
      case 'rising': {
        const riseMs = this.lunging ? WORM.lungeMs : WORM.riseMs;
        // It watches the cat all the while: the lunge follows it, the look
        // turns with it.
        if (this.lunging || this.looking) {
          this.aimAt(cat, this.lunging ? WORM.maxLean : WORM.lookLean);
        }
        this.out = this.reach * (1 - Math.max(0, this.timer) / riseMs);
        if (this.timer <= 0) {
          this.phase = 'standing';
          this.timer = this.lunging ? WORM.snapMs : WORM.lookMs;
        }
        break;
      }
      case 'standing':
        this.out = this.reach;
        if (this.looking) {
          this.aimAt(cat, WORM.lookLean);
        }
        // A worm that is up when the cat walks right up to it does not wait.
        if (!this.lunging && prey && this.cooldown <= 0) {
          this.lunge(cat);
        } else if (this.timer <= 0) {
          this.phase = 'sinking';
          this.timer = WORM.sinkMs;
        }
        break;
      case 'sinking':
        this.out = this.reach * (Math.max(0, this.timer) / WORM.sinkMs);
        if (this.timer <= 0) {
          this.phase = 'hidden';
          this.out = 0;
          this.lean = 0;
          if (this.lunging) {
            this.cooldown = WORM.lungeCooldownMs;
          }
          if (this.looking) {
            this.spotted = true;
          }
          this.lunging = false;
          this.looking = false;
          this.timer = Phaser.Math.Between(WORM.hiddenMinMs, WORM.hiddenMaxMs);
        }
        break;
    }

    this.draw();
  }

  /**
   * Draws `count` grains of sand about the surfacing point: within `spread`
   * px either side, up to `height` px above the sand, shifted by `behind`.
   */
  private throwGrains(tick: number, count: number, spread: number, height: number, behind: number): void {
    for (let i = 0; i < count; i += 1) {
      const h = ((tick * 7919 + i * 104729) % 1000) / 1000;
      const v = ((tick * 31 + i * 7877) % 1000) / 1000;
      const x = this.x + behind + (h * 2 - 1) * spread;
      const y = this.top - v * height;
      this.grains.fillStyle(i % 3 === 0 ? COLORS.sandMoundDark : COLORS.sandMound, 1);
      this.grains.fillRect(Math.round(x), Math.round(y), i % 2 ? 2 : 1, 1);
    }
  }

  private draw(): void {
    // The mound goes where the worm goes, and the sand says what it is
    // doing. Before a lunge the ground **churns**: the mound jolts, and
    // grains are thrown up around the spot the worm will come out of, more
    // of them the nearer it is -- that is the warning, and it marks *where*.
    // Sneaking along, a few grains kick up behind it, so the sand reads as
    // something moving under it. The grains are placed by a hash of the
    // tick, so they jump about rather than drift, and nothing is random.
    const tick = Math.floor(this.timer / 40);
    const flip = tick % 2;
    this.grains.clear();
    if (this.phase === 'shivering') {
      this.mound.setPosition(this.x + (flip ? 2 : -2), this.moundY + (flip ? -1 : 0));
      const urgency = 1 - Math.max(0, this.timer) / WORM.shiverMs;
      const count = 6 + Math.round(urgency * 8);
      this.throwGrains(tick, count, 12 + urgency * 4, 3 + urgency * 7, 0);
    } else if (this.moving) {
      this.mound.setPosition(this.x, this.moundY + (flip ? -1 : 0));
      this.throwGrains(tick, 4, 8, 3, -Math.sign(this.x - this.home) * 6);
    } else {
      this.mound.setPosition(this.x, this.moundY);
    }

    const shown = Math.min(WORM_SIZE.height, Math.round(this.out));
    if (shown <= 0) {
      this.sprite.setVisible(false);
      return;
    }
    // The origin sits at the bottom of the shown part, so the crop grows
    // out of the sand and the lean turns about it. A lunge reaches further
    // than the picture is tall: the shown part is stretched to it.
    this.sprite
      .setVisible(true)
      .setCrop(0, 0, WORM_SIZE.width, shown)
      .setOrigin(0.5, shown / WORM_SIZE.height)
      .setPosition(this.x, this.top)
      .setRotation(this.lean)
      .setScale(1, Math.max(1, this.out / shown));
  }
}
