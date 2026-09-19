import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';

/** Height of the solid wooden part of a branch, in game pixels. */
export const BRANCH_THICKNESS = 8;

/** Height of the leaves that hang below a branch. Purely decorative. */
export const BRANCH_LEAF_DROP = 11;

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
  generateGroundTiles(scene);
  generateRockTiles(scene);
  generateTrunkTiles(scene);
  generateBranchTiles(scene);
  generateNestTile(scene);
  generateWaterTiles(scene);
  generateBerry(scene);
}

function generateSky(scene: Phaser.Scene): void {
  bakeTexture(scene, 'sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Deep blue overhead fading to a pale haze at the treeline, which is what
    // a bright day looks like from under a canopy.
    g.fillGradientStyle(
      COLORS.skyTop,
      COLORS.skyTop,
      COLORS.skyBottom,
      COLORS.skyBottom,
      1,
    );
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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

function generateGroundTiles(scene: Phaser.Scene): void {
  // The top of the forest floor: grass over dirt.
  bakeTexture(scene, 'ground-top', TILE, TILE, (g) => {
    g.fillStyle(COLORS.dirt, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.grassDark, 1);
    g.fillRect(0, 0, TILE, 6);

    g.fillStyle(COLORS.grass, 1);
    g.fillRect(0, 0, TILE, 3);
    // Blades breaking the straight edge downward into the soil.
    g.fillRect(2, 3, 2, 3);
    g.fillRect(8, 3, 2, 4);
    g.fillRect(13, 3, 2, 2);

    g.fillStyle(COLORS.dirtDark, 1);
    g.fillRect(4, 9, 3, 2);
    g.fillRect(11, 12, 3, 2);
  });

  // Everything below the surface is plain soil, with no grass line -- this is
  // what stops a stack of ground tiles reading as stripes.
  bakeTexture(scene, 'ground-fill', TILE, TILE, (g) => {
    g.fillStyle(COLORS.dirt, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.dirtDark, 1);
    g.fillRect(3, 2, 3, 2);
    g.fillRect(10, 6, 4, 2);
    g.fillRect(5, 11, 3, 2);
  });
}

/** Width of the drawn trunk within its tile. Narrower than the cell, so the cat
 * visibly passes in front of it rather than through a solid-looking block. */
const TRUNK_WIDTH = 12;

function generateTrunkTiles(scene: Phaser.Scene): void {
  const inset = (TILE - TRUNK_WIDTH) / 2;

  const drawBark = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(COLORS.trunk, 1);
    g.fillRect(inset, 0, TRUNK_WIDTH, TILE);

    // Vertical grain, which is what makes a trunk read as climbable rather
    // than as a post.
    g.fillStyle(COLORS.trunkDark, 1);
    g.fillRect(inset + 1, 0, 1, TILE);
    g.fillRect(inset + 7, 0, 2, TILE);

    g.fillStyle(COLORS.trunkLight, 1);
    g.fillRect(inset + 4, 0, 1, TILE);
    g.fillRect(inset + 10, 0, 1, TILE);
  };

  bakeTexture(scene, 'trunk', TILE, TILE, drawBark);

  bakeTexture(scene, 'trunk-top', TILE, TILE, (g) => {
    drawBark(g);

    // A little foliage where the trunk ends, so it does not look sawn off.
    g.fillStyle(COLORS.leaf, 1);
    g.fillCircle(3, 3, 4);
    g.fillCircle(13, 4, 4);
    g.fillStyle(COLORS.leafLight, 1);
    g.fillCircle(8, 1, 3);
  });
}

function generateRockTiles(scene: Phaser.Scene): void {
  // Same top/fill split as the ground: a stack of boulders should read as one
  // mass of rock, not as a pile of identical bricks.
  bakeTexture(scene, 'rock-top', TILE, TILE, (g) => {
    g.fillStyle(COLORS.rock, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.rockLight, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillRect(2, 3, 5, 1);

    // A little moss where the light lands, to tie the rock to the forest.
    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(9, 0, 5, 2);
    g.fillRect(1, 1, 3, 1);

    g.fillStyle(COLORS.rockDark, 1);
    g.fillRect(4, 7, 4, 2);
    g.fillRect(11, 10, 3, 2);
  });

  bakeTexture(scene, 'rock-fill', TILE, TILE, (g) => {
    g.fillStyle(COLORS.rock, 1);
    g.fillRect(0, 0, TILE, TILE);

    // Vertical striations, so a wall face reads as climbable rock in motion
    // rather than as flat grey.
    g.fillStyle(COLORS.rockDark, 1);
    g.fillRect(3, 1, 1, 6);
    g.fillRect(12, 4, 1, 7);
    g.fillRect(7, 9, 3, 2);

    g.fillStyle(COLORS.rockLight, 1);
    g.fillRect(9, 2, 1, 5);
  });
}

function generateBranchTiles(scene: Phaser.Scene): void {
  /**
   * Branch tiles are only as tall as the wood itself, so the collision box is
   * exactly the surface the cat stands on. The leaves below are separate,
   * non-colliding decoration.
   */
  const drawWood = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(COLORS.branchDark, 1);
    g.fillRect(0, 0, TILE, BRANCH_THICKNESS);

    g.fillStyle(COLORS.branch, 1);
    g.fillRect(0, 0, TILE, BRANCH_THICKNESS - 3);

    g.fillStyle(COLORS.branchDark, 1);
    g.fillRect(4, 2, 3, 1);
    g.fillRect(11, 3, 3, 1);
  };

  bakeTexture(scene, 'branch-mid', TILE, BRANCH_THICKNESS, drawWood);

  bakeTexture(scene, 'branch-left', TILE, BRANCH_THICKNESS, (g) => {
    drawWood(g);
    // Round off the outer end so a branch does not look sawn through.
    g.fillStyle(COLORS.leaf, 1);
    g.fillCircle(2, 2, 3);
  });

  bakeTexture(scene, 'branch-right', TILE, BRANCH_THICKNESS, (g) => {
    drawWood(g);
    g.fillStyle(COLORS.leaf, 1);
    g.fillCircle(TILE - 2, 2, 3);
  });

  bakeTexture(scene, 'bough', TILE, TILE, (g) => {
    g.fillStyle(COLORS.branchDark, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.branch, 1);
    g.fillRect(0, 3, TILE, 9);

    // Bark grain, so it reads as a log rather than a brown brick.
    g.fillStyle(COLORS.branchDark, 1);
    g.fillRect(2, 6, 6, 1);
    g.fillRect(10, 9, 5, 1);

    // Moss along the top, catching the light.
    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillStyle(COLORS.leafLight, 1);
    g.fillRect(3, 0, 4, 1);
    g.fillRect(11, 0, 3, 1);
  });

  bakeTexture(scene, 'branch-leaves', TILE, BRANCH_LEAF_DROP, (g) => {
    g.fillStyle(COLORS.leaf, 1);
    g.fillCircle(3, 2, 4);
    g.fillCircle(12, 3, 5);

    g.fillStyle(COLORS.leafLight, 1);
    g.fillCircle(8, 1, 3);
  });
}

function generateNestTile(scene: Phaser.Scene): void {
  bakeTexture(scene, 'nest', TILE, TILE, (g) => {
    g.fillStyle(COLORS.branchDark, 1);
    g.fillRect(0, 6, TILE, 8);

    g.fillStyle(COLORS.branch, 1);
    for (let i = 0; i < 5; i += 1) {
      g.fillRect(i * 3, 7 + (i % 2), TILE - i * 3, 1);
    }

    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(2, 5, 3, 1);
    g.fillRect(10, 4, 4, 1);
  });
}

function generateWaterTiles(scene: Phaser.Scene): void {
  // Drawn solid; the sprites are given their transparency in the scene, so the
  // cat stays visible through the pool it is swimming in.
  bakeTexture(scene, 'water', TILE, TILE, (g) => {
    g.fillStyle(COLORS.water, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.waterDeep, 1);
    g.fillRect(2, 5, 5, 1);
    g.fillRect(9, 11, 4, 1);
  });

  // An opaque bed sits behind the pool. Carving a pool takes the ground away,
  // and without this the backdrop trees show straight through the water.
  bakeTexture(scene, 'water-bed', TILE, TILE, (g) => {
    g.fillStyle(COLORS.waterDeep, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(COLORS.water, 1);
    g.fillRect(4, 3, 3, 2);
    g.fillRect(10, 9, 4, 2);
  });

  bakeTexture(scene, 'water-surface', TILE, TILE, (g) => {
    g.fillStyle(COLORS.water, 1);
    g.fillRect(0, 0, TILE, TILE);

    // A bright line along the top, so the surface is obvious at a glance --
    // it is the line the cat has to get back to.
    g.fillStyle(COLORS.waterFoam, 1);
    g.fillRect(0, 0, TILE, 2);
    g.fillRect(3, 2, 4, 1);
    g.fillRect(11, 2, 3, 1);
  });
}

function generateBerry(scene: Phaser.Scene): void {
  const size = 10;

  bakeTexture(scene, 'berry', size, size, (g) => {
    g.fillStyle(COLORS.berry, 1);
    g.fillCircle(size / 2, size / 2 + 1, 4);

    g.fillStyle(COLORS.berryLight, 1);
    g.fillCircle(size / 2 - 1, size / 2 - 1, 1.6);

    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(size / 2 - 1, 0, 2, 2);
  });
}
