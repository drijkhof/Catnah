import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

/** Footprints of the background trees, so the backdrop can place them. */
export const TREE_SIZES = {
  far: { width: 70, height: 150 },
  mid: { width: 92, height: 190 },
} as const;

export const SUN_SIZE = 120;
export const BUSH_SIZE = { width: 44, height: 26 };
export const TUFT_SIZE = { width: 16, height: 11 };

export function generateForestTextures(scene: Phaser.Scene): void {
  generateSky(scene);
  generateSun(scene);
  generateTrees(scene);
  generateBush(scene);
  generateGrassTuft(scene);
  generateLife(scene);
  generateMinnow(scene);
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
    { key: 'tree-far-a', size: TREE_SIZES.far, leaf: COLORS.treeFar, trunk: COLORS.treeFarTrunk, seed: 11 },
    { key: 'tree-far-b', size: TREE_SIZES.far, leaf: COLORS.treeFar, trunk: COLORS.treeFarTrunk, seed: 29 },
    { key: 'tree-mid-a', size: TREE_SIZES.mid, leaf: COLORS.treeMid, trunk: COLORS.treeMidTrunk, seed: 47 },
    { key: 'tree-mid-b', size: TREE_SIZES.mid, leaf: COLORS.treeMid, trunk: COLORS.treeMidTrunk, seed: 83 },
  ];

  for (const variant of variants) {
    const { width, height } = variant.size;
    const random = createRandom(variant.seed);

    bakeTexture(scene, variant.key, width, height, (g) => {
      const trunkWidth = Math.round(width * 0.14);
      const centre = width / 2;

      g.fillStyle(variant.trunk, 1);
      g.fillRect(centre - trunkWidth / 2, height * 0.4, trunkWidth, height * 0.6);

      // A root flare at the base and two limbs angled up into the canopy.
      // Drawn as triangles rather than bars: horizontal rectangles read as
      // crossbars on a telephone pole, not as branches.
      g.fillTriangle(
        centre - trunkWidth * 1.6, height,
        centre + trunkWidth * 1.6, height,
        centre, height * 0.82,
      );
      g.fillTriangle(
        centre - trunkWidth * 0.4, height * 0.62,
        centre - trunkWidth * 2.2, height * 0.4,
        centre - trunkWidth * 0.4, height * 0.5,
      );
      g.fillTriangle(
        centre + trunkWidth * 0.4, height * 0.68,
        centre + trunkWidth * 2.4, height * 0.46,
        centre + trunkWidth * 0.4, height * 0.56,
      );

      // Canopy: overlapping blobs read as foliage at this size, and scatter
      // deterministically so the tree looks the same on every run.
      g.fillStyle(variant.leaf, 1);

      for (let i = 0; i < 9; i += 1) {
        const bx = centre + (random() - 0.5) * width * 0.78;
        const by = height * 0.3 + (random() - 0.5) * height * 0.42;
        const radius = width * (0.15 + random() * 0.14);

        g.fillCircle(bx, by, radius);
      }
    });
  }
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
 * A minnow: the little fish the cat is collecting.
 *
 * A cat does not pick fruit, which is what the berry this replaced always
 * looked like. It is drawn facing left and bobbing, so a row of them reads as
 * a shoal rather than as a row of dots.
 *
 * Deliberately nothing like the piranha: pale, round-nosed and finger-sized,
 * where that one is dark, angular and all teeth.
 */
function generateMinnow(scene: Phaser.Scene): void {
  const width = 12;
  const height = 8;

  bakeTexture(scene, 'minnow', width, height, (g) => {
    // Tail first, as a notched fork rather than a solid wedge: at this size a
    // triangle reads as an arrow and a fork reads as a fish.
    g.fillStyle(COLORS.minnowFin, 1);
    g.fillRect(0, 1, 1, 2);
    g.fillRect(0, 5, 1, 2);
    g.fillRect(1, 2, 1, 4);
    g.fillRect(2, 3, 1, 2);

    // Fins, one up one down, two pixels each. Any more and the silhouette
    // turns to fluff.
    g.fillRect(6, 1, 2, 1);
    g.fillRect(6, 6, 2, 1);

    // Body: a lens, widest in the middle, with a blunt nose.
    g.fillStyle(COLORS.minnow, 1);
    g.fillRect(4, 2, 6, 1);
    g.fillRect(3, 3, 9, 2);
    g.fillRect(4, 5, 6, 1);

    // A lit back and a pale belly, which is most of what makes it look wet.
    g.fillStyle(COLORS.minnowLight, 1);
    g.fillRect(5, 2, 4, 1);
    g.fillRect(5, 5, 3, 1);

    // One pixel of eye. Two was a face.
    g.fillStyle(0x16323d, 1);
    g.fillRect(10, 3, 1, 1);
  });
}
