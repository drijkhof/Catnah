import Phaser from 'phaser';
import { PARK, TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';

/**
 * The city's park, at night: a bench, a fountain, a lawn and a tree. Drawn
 * dim, the way the houses are, with the lamplight catching the edges.
 */

/** How far a fountain's picture reaches above its row of cells, px: the bowl on its pedestal. */
export const FOUNTAIN_HEADROOM = 22;

/** How far a bench's picture reaches above its row of cells, px: the backrest. */
export const BENCH_HEADROOM = 6;

/** A park tree, px. Planted by the foot of its trunk. */
export const PARK_TREE_SIZE = { width: 44, height: 64 };

const STONE = 0x6f7280;
const STONE_DARK = 0x4a4c58;
const STONE_LIGHT = 0x9a9daa;
const WATER = 0x2f5f86;
const WATER_LIGHT = 0x7fb4d8;
const WOOD = 0x6a4a30;
const WOOD_DARK = 0x46301f;
const WOOD_LIGHT = 0x8c6a48;
const IRON = 0x24262e;

/** A wooden bench on iron legs over a run of cells, the seat at `PARK.benchSeat`. */
export function bakeBench(scene: Phaser.Scene, key: string, cells: number): void {
  const width = cells * TILE;
  const height = TILE + BENCH_HEADROOM;
  const seat = BENCH_HEADROOM + PARK.benchSeat;

  bakeTexture(scene, key, width, height, (g) => {
    // The legs and the arms, iron.
    g.fillStyle(IRON, 1);
    for (const x of [2, width - 4]) {
      g.fillRect(x, seat - 5, 2, height - seat + 5);
      g.fillRect(x - 1, seat - 5, 4, 1);
    }
    g.fillRect(width / 2 - 1, seat + 2, 2, height - seat - 2);

    // The backrest: two slats, behind the seat.
    for (const y of [0, 3]) {
      g.fillStyle(WOOD_DARK, 1);
      g.fillRect(1, y, width - 2, 2);
      g.fillStyle(WOOD, 1);
      g.fillRect(1, y, width - 2, 1);
    }
    g.fillStyle(IRON, 1);
    g.fillRect(4, 0, 1, seat - 0);
    g.fillRect(width - 5, 0, 1, seat - 0);

    // The seat, which is what is stood on: three slats.
    g.fillStyle(WOOD_DARK, 1);
    g.fillRect(0, seat, width, 3);
    g.fillStyle(WOOD, 1);
    g.fillRect(0, seat, width, 2);
    g.fillStyle(WOOD_LIGHT, 1);
    g.fillRect(0, seat, width, 1);
    for (let x = 6; x < width; x += 7) {
      g.fillStyle(WOOD_DARK, 1);
      g.fillRect(x, seat, 1, 2);
    }
  });
}

/** A round stone basin of water over a run of cells, with a bowl on a pedestal in the middle. */
export function bakeFountain(scene: Phaser.Scene, key: string, cells: number): void {
  const width = cells * TILE;
  const height = TILE + FOUNTAIN_HEADROOM;
  const rim = FOUNTAIN_HEADROOM + PARK.fountainRim;
  const middle = width / 2;

  bakeTexture(scene, key, width, height, (g) => {
    // The pedestal and the bowl on it, behind the basin's front wall.
    g.fillStyle(STONE_DARK, 1);
    g.fillRect(middle - 3, 6, 6, rim - 6);
    g.fillStyle(STONE, 1);
    g.fillRect(middle - 2, 6, 3, rim - 6);
    g.fillStyle(STONE_DARK, 1);
    g.fillEllipse(middle, 5, 22, 7);
    g.fillStyle(STONE, 1);
    g.fillEllipse(middle, 4, 20, 5);
    g.fillStyle(WATER_LIGHT, 1);
    g.fillEllipse(middle, 3, 14, 2);
    // A finial at the top, where the jet comes out.
    g.fillStyle(STONE_LIGHT, 1);
    g.fillRect(middle - 1, 0, 2, 3);

    // The water in the basin, seen over its rim.
    g.fillStyle(WATER, 1);
    g.fillRect(3, rim - 1, width - 6, 3);
    g.fillStyle(WATER_LIGHT, 0.7);
    for (let x = 6; x < width - 6; x += 9) {
      g.fillRect(x, rim, 4, 1);
    }

    // The basin's front wall, in blocks of stone, the rim on top.
    g.fillStyle(STONE_DARK, 1);
    g.fillRect(0, rim + 2, width, height - rim - 2);
    g.fillStyle(STONE, 1);
    g.fillRect(1, rim + 3, width - 2, height - rim - 4);
    g.fillStyle(STONE_DARK, 1);
    for (let x = 10; x < width; x += 12) {
      g.fillRect(x, rim + 3, 1, height - rim - 4);
    }
    g.fillStyle(STONE_LIGHT, 1);
    g.fillRect(0, rim, width, 2);
    g.fillStyle(STONE_DARK, 1);
    g.fillRect(0, rim + 2, width, 1);
  });

  // A drop of the jet: white, so it can be tinted.
  if (!scene.textures.exists('fountain-drop')) {
    bakeTexture(scene, 'fountain-drop', 2, 2, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
    });
  }
}

/** A strip of lawn over a run of cells: grass laid over the pavers, with tufts along it. */
export function bakeLawn(scene: Phaser.Scene, key: string, cells: number, seed: number): void {
  const width = cells * TILE;
  const random = createRandom(seed);

  bakeTexture(scene, key, width, 8, (g) => {
    g.fillStyle(0x23432a, 1);
    g.fillRect(0, 3, width, 5);
    g.fillStyle(0x2f5a36, 1);
    g.fillRect(0, 3, width, 2);
    for (let x = 0; x < width; x += 2) {
      const tall = 1 + Math.floor(random() * 3);
      g.fillStyle(random() < 0.5 ? 0x2f5a36 : 0x3c6e42, 1);
      g.fillRect(x, 3 - tall, 1, tall);
    }
    // A flower here and there, closed for the night.
    for (let x = 5; x < width; x += 11 + Math.floor(random() * 9)) {
      g.fillStyle(random() < 0.5 ? 0xb8a85a : 0xa86a7a, 1);
      g.fillRect(x, 1, 1, 1);
    }
  });
}

/** A round park tree on a slim trunk, dark against the night. */
export function generateParkTextures(scene: Phaser.Scene): void {
  const { width, height } = PARK_TREE_SIZE;
  bakeTexture(scene, 'park-tree', width, height, (g) => {
    const random = createRandom(7303);
    g.fillStyle(0x2e2119, 1);
    g.fillRect(width / 2 - 2, height - 30, 4, 30);
    g.fillRect(width / 2 - 6, height - 30, 4, 2);
    g.fillRect(width / 2 + 2, height - 26, 5, 2);
    for (const [colour, grow] of [[0x1a3022, 0], [0x234030, -3], [0x2e5238, -7]] as const) {
      g.fillStyle(colour, 1);
      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2;
        const r = 9 + random() * 3 + grow;
        g.fillCircle(width / 2 + Math.cos(angle) * 9 + grow * 0.3, 22 + Math.sin(angle) * 7 + grow * 0.6, r);
      }
    }
  });
}
