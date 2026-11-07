import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture } from './canvas';

/**
 * The aliens' bar on Pluto: a little round-roofed hut of ice blocks with a
 * neon sign, a counter with stools, bottles on a shelf behind it, a
 * barkeeper behind the counter and guests on the stools in summer
 * T-shirts -- it is cold on Pluto, and they do not care.
 */

/** The bar's picture, px. Planted by its bottom-left corner on the floor. */
export const BAR_SIZE = { width: 9 * TILE, height: 84 };

/** Where the barkeeper stands, px in from the bar's left edge. */
export const BAR_KEEPER_X = 92;

/** Where the guests sit, px in from the bar's left edge, on the stools. */
export const BAR_STOOLS = [30, 52, 116] as const;

/** The summer colours of the guests' T-shirts. */
export const SHIRT_COLOURS = [0xff7a59, 0x2fd3c4, 0xffd23c, 0xff6fb5, 0x8be04e] as const;

/** An alien, px: the guest and the keeper are the same size. */
export const BAR_ALIEN_SIZE = { width: 14, height: 22 };

const SKIN = 0x7ee07a;
const SKIN_DARK = 0x4fae4c;

export function generateBarTextures(scene: Phaser.Scene): void {
  const { width, height } = BAR_SIZE;
  bakeTexture(scene, 'pluto-bar', width, height, (g) => {
    const wall = height - 62;
    // The hut: pale ice blocks, a rounded roof.
    g.fillStyle(0xbfd8ec, 1);
    g.fillRoundedRect(0, wall - 6, width, height - wall + 6, { tl: 22, tr: 22, bl: 0, br: 0 });
    g.fillStyle(0x9fbcd6, 1);
    for (let y = wall + 6; y < height; y += 10) {
      g.fillRect(2, y, width - 4, 1);
      for (let x = ((y / 10) % 2) * 9 + 4; x < width - 4; x += 18) {
        g.fillRect(x, y - 9, 1, 9);
      }
    }
    // The inside, warm, through the open front.
    g.fillStyle(0x3a2440, 1);
    g.fillRect(8, wall + 4, width - 16, height - wall - 4);
    g.fillStyle(0x5a3460, 1);
    g.fillRect(8, wall + 4, width - 16, 3);
    // Shelf of bottles behind the counter.
    g.fillStyle(0x6a4430, 1);
    g.fillRect(14, wall + 18, width - 28, 2);
    const bottles = [0x39ff6a, 0xff6fb5, 0xffd23c, 0x8ad8ff, 0xff7a59, 0xffffff, 0x39ff6a, 0xffd23c, 0xff6fb5];
    bottles.forEach((colour, i) => {
      const x = 18 + i * 13;
      g.fillStyle(colour, 0.85);
      g.fillRect(x, wall + 10, 4, 8);
      g.fillRect(x + 1, wall + 7, 2, 3);
    });
  });

  // The counter and the stools, in front of the keeper and behind the guests.
  bakeTexture(scene, 'pluto-bar-front', width, height, (g) => {
    // The counter, wood, with its top lit.
    g.fillStyle(0x7a4a2a, 1);
    g.fillRect(10, height - 22, width - 20, 22);
    g.fillStyle(0xa06a3a, 1);
    g.fillRect(8, height - 24, width - 16, 4);
    g.fillStyle(0x5a3420, 1);
    for (let x = 22; x < width - 12; x += 16) {
      g.fillRect(x, height - 19, 1, 19);
    }
    // A glass of milk and a fizzy drink on the counter.
    g.fillStyle(0xffffff, 1);
    g.fillRect(70, height - 30, 4, 6);
    g.fillStyle(0xff6fb5, 0.9);
    g.fillRect(106, height - 31, 4, 7);
    // The neon sign over the door: BAR, pink, glowing.
    g.fillStyle(0x1a1020, 1);
    g.fillRoundedRect(width / 2 - 22, 0, 44, 16, 4);
    g.fillStyle(0xff6fb5, 0.35);
    g.fillRoundedRect(width / 2 - 21, 1, 42, 14, 4);
    g.fillStyle(0xff9ad0, 1);
    const letters: Record<string, number[][]> = {
      B: [[0, 0, 1, 5], [1, 0, 2, 1], [1, 2, 2, 1], [1, 4, 2, 1], [3, 1, 1, 1], [3, 3, 1, 1]],
      A: [[0, 1, 1, 4], [3, 1, 1, 4], [1, 0, 2, 1], [1, 2, 2, 1]],
      R: [[0, 0, 1, 5], [1, 0, 2, 1], [1, 2, 2, 1], [3, 1, 1, 1], [2, 3, 1, 1], [3, 4, 1, 1]],
    };
    ['B', 'A', 'R'].forEach((letter, i) => {
      for (const [x, y, w, h] of letters[letter]) {
        g.fillRect(width / 2 - 15 + i * 11 + x * 2, 3 + y * 2, w * 2, h * 2);
      }
    });
    // Stools in front of the counter.
    for (const x of BAR_STOOLS) {
      g.fillStyle(0x2a2a30, 1);
      g.fillRect(x - 1, height - 12, 2, 12);
      g.fillStyle(0xd02040, 1);
      g.fillRect(x - 5, height - 14, 10, 3);
    }
  });

  SHIRT_COLOURS.forEach((shirt, i) => {
    bakeTexture(scene, `bar-alien-${i}`, BAR_ALIEN_SIZE.width, BAR_ALIEN_SIZE.height, (g) => drawAlien(g, shirt, false));
  });
  bakeTexture(scene, 'bar-keeper', BAR_ALIEN_SIZE.width, BAR_ALIEN_SIZE.height, (g) => drawAlien(g, 0xffffff, true));
}

/** A small green alien with a big head and antennae, in a T-shirt; the keeper wears a bow tie on his white shirt. */
function drawAlien(g: Phaser.GameObjects.Graphics, shirt: number, keeper: boolean): void {
  const { width, height } = BAR_ALIEN_SIZE;
  // Legs.
  g.fillStyle(0x2a3a6a, 1);
  g.fillRect(4, height - 5, 2, 5);
  g.fillRect(8, height - 5, 2, 5);
  // The T-shirt, sleeves and all.
  g.fillStyle(shirt, 1);
  g.fillRect(3, 11, 8, height - 16);
  g.fillRect(1, 11, 2, 3);
  g.fillRect(11, 11, 2, 3);
  g.fillStyle(0x000000, 0.15);
  g.fillRect(3, height - 7, 8, 2);
  if (keeper) {
    g.fillStyle(0x1a1a20, 1);
    g.fillTriangle(5, 11, 7, 12, 5, 13);
    g.fillTriangle(9, 11, 7, 12, 9, 13);
  } else {
    // A flower on the shirt: summer.
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(5, 13, 1, 1);
    g.fillRect(4, 14, 3, 1);
    g.fillRect(5, 15, 1, 1);
  }
  // Arms.
  g.fillStyle(SKIN, 1);
  g.fillRect(0, 14, 1, 3);
  g.fillRect(13, 14, 1, 3);
  // The head: big, with two black eyes.
  g.fillStyle(SKIN, 1);
  g.fillEllipse(width / 2, 6, 12, 10);
  g.fillStyle(SKIN_DARK, 1);
  g.fillRect(4, 10, 6, 1);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(4.5, 6, 3, 4);
  g.fillEllipse(9.5, 6, 3, 4);
  g.fillStyle(0xffffff, 1);
  g.fillRect(4, 5, 1, 1);
  g.fillRect(9, 5, 1, 1);
  // Antennae.
  g.fillStyle(SKIN_DARK, 1);
  g.fillRect(4, 0, 1, 2);
  g.fillRect(9, 0, 1, 2);
}
