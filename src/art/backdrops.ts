import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

export const STALACTITE_SIZE = { width: 26, height: 60 };
export const BUILDING_SIZE = { width: 96, height: 230 };
export const MOON_SIZE = 84;
export const DEAD_TREE_SIZE = { width: 80, height: 200 };
export const STALAGMITE_SIZE = { width: 30, height: 46 };

/** Skies and scenery for the places that are not the forest. */
export function generateBackdropTextures(scene: Phaser.Scene): void {
  generateCave(scene);
  generateCity(scene);
  generateSwamp(scene);
}

function generateSwamp(scene: Phaser.Scene): void {
  bakeTexture(scene, 'swamp-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Overcast and sickly, going browner towards the water rather than paler.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x6b7a55, 0x8a8355);
  });

  const { width, height } = DEAD_TREE_SIZE;
  for (const [key, seed, shade] of [
    ['dead-tree-far', 13, 0x67744f],
    ['dead-tree-near', 37, 0x44502f],
  ] as const) {
    const random = createRandom(seed);

    bakeTexture(scene, key, width, height, (g) => {
      const centre = width / 2;

      g.fillStyle(shade, 1);
      g.fillRect(centre - 5, height * 0.25, 10, height * 0.75);

      // Bare limbs, forking upward: no canopy at all, which is what makes a
      // dead tree read as dead.
      for (let i = 0; i < 7; i += 1) {
        const up = height * (0.25 + random() * 0.4);
        const side = (random() < 0.5 ? -1 : 1) * width * (0.15 + random() * 0.3);

        g.fillTriangle(centre, up, centre + side, up - 30 - random() * 30, centre + side * 0.4, up);
      }

      // Moss hanging off them.
      g.fillStyle(0x7d8a4f, 0.75);
      for (let i = 0; i < 5; i += 1) {
        const x = centre + (random() - 0.5) * width * 0.7;
        const y = height * (0.3 + random() * 0.3);
        g.fillRect(x, y, 2, 18 + random() * 22);
      }
    });
  }

  bakeTexture(scene, 'reed', 18, 26, (g) => {
    g.fillStyle(0x5f6b33, 1);
    g.fillTriangle(2, 26, 5, 26, 1, 2);
    g.fillTriangle(12, 26, 15, 26, 17, 4);
    g.fillStyle(0x7d8a45, 1);
    g.fillTriangle(7, 26, 10, 26, 9, 0);
  });

  bakeTexture(scene, 'mist', 240, 40, (g) => {
    g.fillStyle(0xc9d3a8, 0.16);
    g.fillEllipse(120, 20, 240, 34);
    g.fillStyle(0xc9d3a8, 0.12);
    g.fillEllipse(60, 24, 130, 24);
    g.fillEllipse(180, 16, 150, 22);
  });
}

function generateCave(scene: Phaser.Scene): void {
  bakeTexture(scene, 'cave-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Darkest at the roof, with a little light pooling near the floor.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x14121a, 0x2b2733);
  });

  const { width, height } = STALACTITE_SIZE;
  for (const [key, seed] of [['stalactite-a', 7], ['stalactite-b', 23]] as const) {
    const random = createRandom(seed);

    bakeTexture(scene, key, width, height, (g) => {
      g.fillStyle(0x3a3547, 1);
      g.fillTriangle(0, 0, width, 0, width / 2 + (random() - 0.5) * 6, height);

      g.fillStyle(0x4b4459, 1);
      g.fillTriangle(2, 0, width * 0.55, 0, width / 2, height * 0.72);
    });
  }

  // Stalagmites, so the cave has a floor as well as a roof.
  const stal = STALAGMITE_SIZE;
  for (const [key, seed] of [['stalagmite-a', 61], ['stalagmite-b', 89]] as const) {
    const random = createRandom(seed);

    bakeTexture(scene, key, stal.width, stal.height, (g) => {
      g.fillStyle(0x3a3547, 1);
      g.fillTriangle(0, stal.height, stal.width, stal.height,
        stal.width / 2 + (random() - 0.5) * 6, 0);
      g.fillStyle(0x4b4459, 1);
      g.fillTriangle(4, stal.height, stal.width * 0.5, stal.height, stal.width / 2, stal.height * 0.3);
    });
  }

  bakeTexture(scene, 'crystal', 14, 22, (g) => {
    g.fillStyle(0x3f7f86, 1);
    g.fillTriangle(0, 22, 14, 22, 7, 0);
    g.fillStyle(0x7fd4dd, 1);
    g.fillTriangle(4, 22, 9, 22, 7, 4);
  });
}

function generateCity(scene: Phaser.Scene): void {
  bakeTexture(scene, 'city-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Night, with the orange wash a city throws up onto the clouds.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x0e1430, 0x3a2a3c);
  });

  bakeTexture(scene, 'moon', MOON_SIZE, MOON_SIZE, (g) => {
    const r = MOON_SIZE / 2;
    for (let i = 5; i > 0; i -= 1) {
      g.fillStyle(0xe8e6d0, 0.08);
      g.fillCircle(r, r, (r * i) / 5);
    }
    g.fillStyle(0xf4f2de, 1);
    g.fillCircle(r, r, r * 0.42);
  });

  const { width, height } = BUILDING_SIZE;
  for (const [key, seed, shade] of [
    ['building-far', 31, 0x1b2244],
    ['building-near', 59, 0x141a33],
  ] as const) {
    const random = createRandom(seed);

    bakeTexture(scene, key, width, height, (g) => {
      g.fillStyle(shade, 1);
      g.fillRect(0, 0, width, height);

      // Lit windows, sparse and uneven -- a fully lit block reads as a grid.
      for (let row = 0; row < 14; row += 1) {
        for (let col = 0; col < 6; col += 1) {
          if (random() > 0.42) {
            continue;
          }

          g.fillStyle(random() > 0.3 ? 0xf0c96a : 0x8fb6e8, 0.9);
          g.fillRect(8 + col * 14, 12 + row * 15, 7, 9);
        }
      }
    });
  }
}
