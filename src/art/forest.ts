import Phaser from 'phaser';
import { CHECKPOINT, COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

/** Footprints of the background trees, so the backdrop can place them. */
export const TREE_SIZES = {
  far: { width: 70, height: 150 },
  mid: { width: 92, height: 190 },
} as const;

export const SUN_SIZE = 120;
export const BUSH_SIZE = { width: 44, height: 26 };
export const TUFT_SIZE = { width: 16, height: 11 };
export const CHECKPOINT_SIZE = CHECKPOINT.size * 2;

export function generateForestTextures(scene: Phaser.Scene): void {
  generateSky(scene);
  generateSun(scene);
  generateTrees(scene);
  generateFog(scene);
  generateCanopy(scene);
  generateBush(scene);
  generateGrassTuft(scene);
  generateLife(scene);
  generateCharm(scene);
  generateCheckpoint(scene);
}

function generateSky(scene: Phaser.Scene): void {
  bakeTexture(scene, 'sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Deep blue overhead fading to a pale haze at the treeline, which is what
    // a bright day looks like from under a canopy.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, COLORS.skyTop, COLORS.skyBottom);
  });
}

function generateSun(scene: Phaser.Scene): void {
  const radius = SUN_SIZE / 2;

  bakeTexture(scene, 'sun', SUN_SIZE, SUN_SIZE, (g) => {
    // Stacked translucent discs fake a radial gradient: each ring adds a little
    // more light, so the glow falls off smoothly towards the edge.
    const rings = 7;

    for (let i = rings; i > 0; i -= 1) {
      g.fillStyle(COLORS.sunGlow, 0.1);
      g.fillCircle(radius, radius, (radius * i) / rings);
    }

    g.fillStyle(COLORS.sun, 0.95);
    g.fillCircle(radius, radius, radius * 0.3);
  });
}

function generateTrees(scene: Phaser.Scene): void {
  const variants = [
    { key: 'tree-far-a', size: TREE_SIZES.far, leaf: COLORS.treeFar, trunk: COLORS.treeFarTrunk, seed: 11, modelled: false },
    { key: 'tree-far-b', size: TREE_SIZES.far, leaf: COLORS.treeFar, trunk: COLORS.treeFarTrunk, seed: 29, modelled: false },
    { key: 'tree-mid-a', size: TREE_SIZES.mid, leaf: COLORS.treeMid, trunk: COLORS.treeMidTrunk, seed: 47, modelled: true },
    { key: 'tree-mid-b', size: TREE_SIZES.mid, leaf: COLORS.treeMid, trunk: COLORS.treeMidTrunk, seed: 83, modelled: true },
  ];

  for (const variant of variants) {
    const { width, height } = variant.size;

    bakeTexture(scene, variant.key, width, height, (g) => {
      drawTree(g, width, height, variant.leaf, variant.trunk, createRandom(variant.seed), variant.modelled);
    });
  }
}

/**
 * A tree seen through the air between it and the cat.
 *
 * Drawn as a silhouette in one tonal family: the trunk is only a little darker
 * than the crown, never a different material, because haze flattens distance
 * into tone. That is what stops a background tree looking pasted on. The far
 * rank is flat; the mid rank gets a shadowed underside and a lit top, which
 * is all the modelling distance allows.
 */
function drawTree(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  leaf: number,
  trunk: number,
  random: () => number,
  modelled: boolean,
): void {
  const centre = width / 2;
  const trunkWidth = width * 0.15;
  const crownY = height * 0.3;

  // Trunk: tapering up into the crown, flaring out into roots at the foot.
  g.fillStyle(trunk, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(centre - trunkWidth * 0.5, crownY),
      new Phaser.Math.Vector2(centre + trunkWidth * 0.5, crownY),
      new Phaser.Math.Vector2(centre + trunkWidth * 0.7, height * 0.88),
      new Phaser.Math.Vector2(centre + trunkWidth * 1.8, height),
      new Phaser.Math.Vector2(centre - trunkWidth * 1.8, height),
      new Phaser.Math.Vector2(centre - trunkWidth * 0.7, height * 0.88),
    ],
    true,
  );

  // Two limbs reaching up into the crown, tapering as they go.
  const limb = (toX: number, toY: number, fromY: number, thickness: number): void => {
    g.fillPoints(
      [
        new Phaser.Math.Vector2(centre - thickness, fromY),
        new Phaser.Math.Vector2(centre + thickness, fromY - thickness),
        new Phaser.Math.Vector2(toX + thickness * 0.3, toY),
        new Phaser.Math.Vector2(toX - thickness * 0.3, toY),
      ],
      true,
    );
  };

  limb(centre - width * 0.3, height * 0.22, height * 0.58, trunkWidth * 0.55);
  limb(centre + width * 0.3, height * 0.2, height * 0.52, trunkWidth * 0.5);

  // Crown: one mass with lumps round its edge, rather than a scatter of
  // circles -- a tree has a shape, a cloud of blobs does not.
  const lump = (colour: number, cx: number, cy: number, radius: number): void => {
    g.fillStyle(colour, 1);
    g.fillCircle(cx, cy, radius);
  };

  g.fillStyle(leaf, 1);
  g.fillEllipse(centre, crownY, width * 0.84, height * 0.4);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + random() * 0.5;
    lump(
      leaf,
      centre + Math.cos(angle) * width * 0.34,
      crownY + Math.sin(angle) * height * 0.15,
      width * (0.11 + random() * 0.09),
    );
  }

  if (!modelled) {
    return;
  }

  // Shadow under the crown, and light on top of it.
  const under = shadeOf(leaf, 14);
  const lit = lightOf(leaf, 9);

  for (let i = 0; i < 4; i += 1) {
    lump(under, centre + (i - 1.5) * width * 0.2 + (random() - 0.5) * 8, crownY + height * 0.12 + random() * 6, width * (0.12 + random() * 0.06));
  }

  for (let i = 0; i < 3; i += 1) {
    lump(lit, centre + (i - 1) * width * 0.22 + (random() - 0.5) * 10, crownY - height * 0.11 - random() * 6, width * (0.1 + random() * 0.05));
  }
}

function shadeOf(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).darken(amount).color;
}

function lightOf(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).lighten(amount).color;
}

/** How tall the floor haze is, and how far the canopy hangs into the screen. */
export const FOG_HEIGHT = 120;
export const CANOPY_SIZE = { width: 512, height: 72 };

function generateFog(scene: Phaser.Scene): void {
  // Transparent at the top, solid haze at the floor. Baked as bands of
  // rising alpha; a plain alpha fill bakes correctly where a gradient style
  // does not (see `fillVerticalGradient`).
  const bands = 24;

  bakeTexture(scene, 'fog', GAME_WIDTH, FOG_HEIGHT, (g) => {
    for (let i = 0; i < bands; i += 1) {
      const t = i / (bands - 1);
      g.fillStyle(COLORS.fog, t * t);
      g.fillRect(0, Math.floor((i * FOG_HEIGHT) / bands), GAME_WIDTH, Math.ceil(FOG_HEIGHT / bands) + 1);
    }
  });
}

function generateCanopy(scene: Phaser.Scene): void {
  const { width, height } = CANOPY_SIZE;
  const random = createRandom(5);

  // One texture, seamless: every lump is drawn three times, at its place and
  // a full width to either side, so whatever spills off one edge comes back
  // in at the other. Repeated across the level as a tiling sprite, it has no
  // joins. Built in tiers: big masses hanging from above the top edge, a
  // darker tier over them, a fringe of small lumps along the underside so
  // the edge is leaves rather than scallops, and one gap for the sun.
  bakeTexture(scene, 'canopy', width, height, (g) => {
    const gapAt = width * 0.55;
    const gapHalf = width * 0.07;

    const tier = (colour: number, count: number, minR: number, maxR: number, yBase: number, ySpread: number, gapScale: number): void => {
      for (let i = 0; i < count; i += 1) {
        const x = (i / count) * width + random() * (width / count);
        if (Math.abs(x - gapAt) < gapHalf * gapScale) {
          continue;
        }
        const radius = minR + random() * (maxR - minR);
        const y = yBase + random() * ySpread;
        g.fillStyle(colour, 1);
        for (const dx of [-width, 0, width]) {
          g.fillCircle(x + dx, y, radius);
        }
      }
    };

    // The dark top tier runs through the gap unbroken: the gap is thinner
    // leaves the sun gets through, not a hole in the roof.
    tier(COLORS.canopy, 24, 18, 30, 8, 14, 1);
    tier(COLORS.canopyDark, 24, 14, 24, -10, 10, 0);
    tier(COLORS.canopy, 60, 4, 9, 30, 18, 0.8);
    tier(COLORS.canopyDark, 48, 3, 7, 24, 16, 1);
  });
}

function generateBush(scene: Phaser.Scene): void {
  const { width, height } = BUSH_SIZE;

  bakeTexture(scene, 'bush', width, height, (g) => {
    g.fillStyle(COLORS.bushDark, 1);
    g.fillCircle(width * 0.28, height * 0.62, height * 0.42);
    g.fillCircle(width * 0.72, height * 0.6, height * 0.46);
    g.fillCircle(width * 0.5, height * 0.72, height * 0.5);

    g.fillStyle(COLORS.bush, 1);
    g.fillCircle(width * 0.36, height * 0.52, height * 0.36);
    g.fillCircle(width * 0.64, height * 0.5, height * 0.34);

    // A highlight on the side the sun is on.
    g.fillStyle(COLORS.bushLight, 1);
    g.fillCircle(width * 0.68, height * 0.4, height * 0.16);
    g.fillCircle(width * 0.4, height * 0.36, height * 0.1);

    // Single leaves round the edge, and shadow at the foot where it meets
    // the ground.
    g.fillStyle(COLORS.bushDark, 1);
    for (let i = 0; i < 7; i += 1) {
      const angle = Math.PI + (i / 6) * Math.PI;
      g.fillRect(
        Math.round(width * 0.5 + Math.cos(angle) * width * 0.44) - 1,
        Math.round(height * 0.66 + Math.sin(angle) * height * 0.5),
        2,
        2,
      );
    }
    g.fillStyle(shadeOf(COLORS.bushDark, 22), 1);
    g.fillRect(width * 0.14, height - 3, width * 0.72, 3);
  });
}

function generateGrassTuft(scene: Phaser.Scene): void {
  const { width, height } = TUFT_SIZE;

  bakeTexture(scene, 'grass-tuft', width, height, (g) => {
    g.fillStyle(COLORS.grassDark, 1);
    g.fillTriangle(1, height, 4, height, 2, 1);
    g.fillTriangle(11, height, 14, height, 13, 2);

    g.fillStyle(COLORS.grass, 1);
    g.fillTriangle(5, height, 8, height, 7, 0);
    g.fillTriangle(8, height, 11, height, 9, 3);
  });
}





function generateLife(scene: Phaser.Scene): void {
  const size = 13;

  bakeTexture(scene, 'life', size, size, (g) => {
    g.fillStyle(COLORS.heart, 1);
    g.fillCircle(4, 4, 3.4);
    g.fillCircle(9, 4, 3.4);
    g.fillTriangle(0.5, 5, 12.5, 5, 6.5, 12.5);

    g.fillStyle(COLORS.heartLight, 1);
    g.fillCircle(3, 3, 1.3);
  });
}

/**
 * A charm: the little fish the cat is collecting.
 *
 * A cat does not pick fruit, which is what the berry this replaced always
 * looked like. It is drawn facing left and bobbing, so a row of them reads as
 * a shoal rather than as a row of dots.
 *
 * Deliberately nothing like the piranha: pale, round-nosed and finger-sized,
 * where that one is dark, angular and all teeth.
 */
/**
 * The little heart the cat collects. A hundred of them is a life.
 *
 * Smaller, pinker and brighter than the hearts in the corner, because those
 * are lives and these are what buys one -- at a glance the two have to be
 * different things.
 */
function generateCharm(scene: Phaser.Scene): void {
  const size = 11;
  const mid = size / 2;

  bakeTexture(scene, 'charm', size, size, (g) => {
    g.fillStyle(COLORS.charm, 1);

    // Two lobes and a point: the whole shape, and nothing else fits at 11px.
    g.fillCircle(mid - 2.2, mid - 1.6, 2.9);
    g.fillCircle(mid + 2.2, mid - 1.6, 2.9);
    g.fillTriangle(mid - 5, mid - 0.6, mid + 5, mid - 0.6, mid, size);

    // A soft inner light, so it reads as round rather than as a stamp.
    g.fillStyle(COLORS.charmLight, 0.85);
    g.fillCircle(mid - 1.8, mid - 1.8, 1.5);
    g.fillCircle(mid + 1.8, mid - 1.8, 1.2);

    // One pixel of highlight, which is what makes it look wet.
    g.fillStyle(COLORS.charmShine, 0.9);
    g.fillRect(mid - 3, mid - 3, 1, 1);
  });
}

/**
 * A five-pointed star, drawn near-white so `setTint` -- which multiplies a
 * texture's own colour rather than replacing it -- can dye it gold or blue at
 * runtime. The two shades baked in (a dim body, a bright core) are what give
 * the tint a bit of shape instead of coming out as one flat colour.
 *
 * Two textures, not one: `GameScene` shows one atop the other and crossfades
 * between them, which is the shimmer. A single tinted star animated by
 * colour alone was tried first and never looked like more than a slow strobe.
 */
function drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, body: number, core: number): void {
  const outer = CHECKPOINT.size / 2 - 1;
  const inner = outer * 0.42;

  const shape: Phaser.Math.Vector2[] = [];

  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;

    shape.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }

  g.fillStyle(body, 1);
  g.fillPoints(shape, true);

  g.fillStyle(core, 1);
  g.fillCircle(cx, cy, inner * 0.9);
}

function generateCheckpoint(scene: Phaser.Scene): void {
  const size = CHECKPOINT_SIZE;
  const mid = size / 2;

  bakeTexture(scene, 'checkpoint-gold', size, size, (g) => {
    drawStar(g, mid, mid, 0xd8d0b0, 0xffffff);
  });

  bakeTexture(scene, 'checkpoint-blue', size, size, (g) => {
    drawStar(g, mid, mid, 0xc8dcec, 0xffffff);
  });
}
