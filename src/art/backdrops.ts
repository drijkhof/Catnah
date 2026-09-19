import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

export const STALACTITE_SIZE = { width: 26, height: 60 };
export const BUILDING_SIZE = { width: 96, height: 230 };
export const MOON_SIZE = 84;

/** Skies and scenery for the places that are not the forest. */
export function generateBackdropTextures(scene: Phaser.Scene): void {
  generateCave(scene);
  generateCity(scene);
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
