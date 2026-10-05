import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import type { WaterZone } from '../level/Level';
import { KEEP_LIVE } from './BakeScenery';
import { BUSH_SIZE, CANOPY_SIZE, SUN_SIZE, TREE_SIZES, createRandom } from '../art';

/**
 * Draw order. Everything the player interacts with sits at the default depth of
 * 0, so scenery is pushed behind with negative depths and the few foreground
 * touches sit just in front.
 */
const DEPTH = {
  sky: -100,
  sun: -95,
  rays: -92,
  treesFar: -80,
  fogFar: -76,
  treesMid: -70,
  fogNear: -66,
  canopy: -60,
  // In front of the hedgehogs (-0.4) and of the cat (0), so either can hide
  // behind a bush -- the cat walks behind them, and a sneaking cat behind one
  // is hidden from the crow. Behind the hearts (7). Not baked: see `KEEP_LIVE`.
  bushes: 0.5,
  foreground: 50,
} as const;

/** Where the sun sits on screen, as a fraction of the viewport. */
const SUN_POSITION = { x: 0.8, y: 0.16 };

/**
 * The forest behind the level: sky, sun, shafts of light, two ranks of trees,
 * and bushes along the floor.
 *
 * All of it is decoration with no physics. Parallax comes from scroll factors:
 * distant ranks move less than the camera, which is what reads as depth. Things
 * that actually touch the forest floor stay at scroll factor 1, otherwise they
 * would visibly slide across the ground the cat is standing on.
 */
export class Backdrop {
  private readonly scene: Phaser.Scene;
  private readonly levelWidth: number;
  private readonly groundLine: number;
  /** The pools at the ground line, which no bush is put on. */
  private readonly pools: WaterZone[];

  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number, water: WaterZone[] = []) {
    this.scene = scene;
    this.levelWidth = levelWidth;
    this.groundLine = groundLine;
    this.pools = water.filter((zone) => Math.abs(zone.y - groundLine) <= TILE);

    this.addSky();
    this.addSun();
    this.addLightRays();
    this.addTreeRank('far');
    this.addFog(DEPTH.fogFar, 0.85);
    this.addTreeRank('mid');
    this.addFog(DEPTH.fogNear, 0.4);
    this.addCanopy();
    this.addBushes();
  }

  /**
   * Haze along the floor. Featureless, so it is pinned sideways and only its
   * height follows the ground line; a band behind the mid trees pushes the far
   * rank back, and a thinner one in front sets the mid rank into the air too.
   */
  private addFog(depth: number, alpha: number): void {
    this.scene.add
      .image(0, this.groundLine + 6, 'fog')
      .setOrigin(0, 1)
      .setScrollFactor(0, 1)
      .setDepth(depth)
      .setAlpha(alpha);
  }

  /**
   * Leaves hanging over the top of the screen, between the trees and the
   * cat. Pinned to the top of the viewport and parallaxing sideways, so the
   * forest is closed in from above wherever the cat goes, with gaps for the
   * sun to come through.
   */
  private addCanopy(): void {
    // Wide enough to cover the level at its scroll factor, plus a screen.
    // One seamless texture repeated, so there is no join anywhere.
    const span = this.levelWidth * 0.35 + GAME_WIDTH;

    this.scene.add
      .tileSprite(0, 0, span, CANOPY_SIZE.height, 'canopy')
      .setOrigin(0, 0)
      .setScrollFactor(0.35, 0)
      .setDepth(DEPTH.canopy);
  }

  private addSky(): void {
    this.scene.add
      .image(0, 0, 'sky')
      .setOrigin(0, 0)
      // Scroll factor 0 pins the sky to the viewport, so it never runs out no
      // matter how wide the level gets.
      .setScrollFactor(0)
      .setDepth(DEPTH.sky);
  }

  private addSun(): void {
    const sun = this.scene.add
      .image(GAME_WIDTH * SUN_POSITION.x, GAME_HEIGHT * SUN_POSITION.y, 'sun')
      .setScrollFactor(0.04)
      .setDepth(DEPTH.sun)
      .setBlendMode(Phaser.BlendModes.ADD);

    // A slow breath in the glow, so the light does not feel like a sticker.
    this.scene.tweens.add({
      targets: sun,
      scale: { from: 1, to: 1.06 },
      alpha: { from: 0.95, to: 1 },
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private addLightRays(): void {
    const origin = new Phaser.Math.Vector2(
      GAME_WIDTH * SUN_POSITION.x,
      GAME_HEIGHT * SUN_POSITION.y,
    );

    const rays = this.scene.add
      .graphics()
      .setScrollFactor(0.04)
      .setDepth(DEPTH.rays)
      .setBlendMode(Phaser.BlendModes.ADD);

    rays.fillStyle(COLORS.lightRay, 0.085);

    // Shafts fanning down and to the left, away from the sun.
    for (const degrees of [98, 113, 129, 147]) {
      const direction = new Phaser.Math.Vector2(1, 0).setAngle(
        Phaser.Math.DegToRad(degrees),
      );
      // Perpendicular, used to give the shaft its width.
      const across = new Phaser.Math.Vector2(-direction.y, direction.x);

      const length = 460;
      const nearHalfWidth = 7;
      const farHalfWidth = 30;
      const tip = origin.clone().add(direction.clone().scale(length));

      rays.fillPoints(
        [
          origin.clone().add(across.clone().scale(nearHalfWidth)),
          tip.clone().add(across.clone().scale(farHalfWidth)),
          tip.clone().subtract(across.clone().scale(farHalfWidth)),
          origin.clone().subtract(across.clone().scale(nearHalfWidth)),
        ],
        true,
      );
    }

    this.scene.tweens.add({
      targets: rays,
      alpha: { from: 0.75, to: 1 },
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private addTreeRank(rank: 'far' | 'mid'): void {
    const isFar = rank === 'far';
    const size = TREE_SIZES[rank];
    const random = createRandom(isFar ? 1337 : 4242);

    const spacing = isFar ? 96 : 138;
    const scrollFactor = isFar ? 0.25 : 0.5;
    const depth = isFar ? DEPTH.treesFar : DEPTH.treesMid;

    // Trees are rooted a little below the ground line so the forest floor,
    // which is drawn in front of them, hides their trunks.
    const baseY = this.groundLine + (isFar ? 26 : 14);

    for (let x = -spacing; x < this.levelWidth + spacing; x += spacing) {
      const key = `tree-${rank}-${random() < 0.5 ? 'a' : 'b'}`;
      const jitterX = (random() - 0.5) * spacing * 0.5;
      const scale = 0.85 + random() * 0.3;

      this.scene.add
        .image(x + jitterX, baseY + (random() - 0.5) * 12, key)
        .setOrigin(0.5, 1)
        .setDisplaySize(size.width * scale, size.height * scale)
        // Depth parallax only sideways. A scroll factor below 1 on the
        // vertical axis too was what actually broke tall levels: as the
        // camera climbed, the ground itself (scroll factor 1) pulled away
        // from these (scroll factor <1) faster than they could follow, and
        // the trees drifted off their own roots -- more rows just multiplied
        // that drift instead of fixing it. Locking the vertical factor to 1
        // keeps a tree's foot exactly on `groundLine` on screen no matter how
        // high the camera goes; only its left-right position still parallaxes
        // to read as distance.
        .setScrollFactor(scrollFactor, 1)
        .setDepth(depth);
    }
  }

  private addBushes(): void {
    const random = createRandom(909);
    const spacing = 74;

    for (let x = 0; x < this.levelWidth; x += spacing) {
      const jitterX = (random() - 0.5) * spacing * 0.6;
      const scale = 0.8 + random() * 0.5;
      const bushX = x + jitterX;
      const halfWidth = (BUSH_SIZE.width * scale) / 2;

      // Not on water. The random draws above happen regardless, so skipping
      // a bush does not move every bush after it.
      const onWater = this.pools.some((pool) => bushX + halfWidth > pool.x && bushX - halfWidth < pool.x + pool.width);

      // Bushes sit on the floor the cat walks on, so they scroll with it.
      // Parallaxing them would make them slide across the ground. The foot
      // sits six pixels into the turf, down at the seam under the grass: a
      // bush drawn in front of the grass with its foot at the top of the
      // turf lay *on* the lawn, with the blades beside it standing higher
      // than its base. Settled by eye against +1, +4 and +8.
      if (!onWater) {
        this.scene.add
          .image(bushX, this.groundLine + 6, 'bush')
          .setOrigin(0.5, 1)
          .setDisplaySize(BUSH_SIZE.width * scale, BUSH_SIZE.height * scale)
          .setDepth(DEPTH.bushes)
          .setData(KEEP_LIVE, true);
      }

      // A few tufts right at the camera edge, in front of everything, to give
      // the floor some thickness.
      if (random() < 0.45) {
        this.scene.add
          .image(x + jitterX * 2, this.groundLine + 10, 'grass-tuft')
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.foreground);
      }
    }
  }
}

/** Exposed so the scene can keep the sun's glow out of the gameplay depth range. */
export { DEPTH as BACKDROP_DEPTH, SUN_SIZE };
