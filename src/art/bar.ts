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

/** The bar from outside: the hut, and where its doorway is across it, px. */
export const HUT_SIZE = { width: 96, height: 74 };
export const HUT_DOOR = { x: 20, width: 18, height: 30 };

/** The wall inside the bar, px: as tall as the room, its string of lights this far down. */
export const BAR_WALL = { width: 64, height: 192, lights: 40 };

/** The door out, inside the bar, px. */
export const INSIDE_DOOR_SIZE = { width: 20, height: 32 };

/** A coin, Bob's money and the bar's, px. */
export const COIN_SIZE = 10;

/** The fuel can by the fuel meter, px. */
export const FUEL_CAN_SIZE = { width: 9, height: 11 };

export function generateBarTextures(scene: Phaser.Scene): void {
  bakeTexture(scene, 'pluto-hut', HUT_SIZE.width, HUT_SIZE.height, drawHut);
  // A gold coin, lit from the top left, with a stamped ring.
  bakeTexture(scene, 'coin', COIN_SIZE, COIN_SIZE, (g) => {
    g.fillStyle(0x8a5a10, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xffc830, 1);
    g.fillCircle(5, 5, 4);
    g.lineStyle(1, 0xd89a18, 1);
    g.strokeCircle(5, 5, 2.5);
    g.fillStyle(0xfff0a0, 1);
    g.fillRect(3, 2, 2, 1);
  });
  bakeTexture(scene, 'bar-door', INSIDE_DOOR_SIZE.width, INSIDE_DOOR_SIZE.height, drawInsideDoor);
  bakeTexture(scene, 'bar-wall', BAR_WALL.width, BAR_WALL.height, drawBarWall);
  // A red jerrycan with a spout, for the rocket fuel meter.
  bakeTexture(scene, 'fuel-can', FUEL_CAN_SIZE.width, FUEL_CAN_SIZE.height, (g) => {
    g.fillStyle(0x5a0f0f, 1);
    g.fillRect(0, 2, 9, 9);
    g.fillStyle(0xd8342c, 1);
    g.fillRect(1, 3, 7, 7);
    g.fillStyle(0xff7a6a, 1);
    g.fillRect(2, 4, 2, 2);
    g.fillStyle(0x3a3a3a, 1);
    g.fillRect(5, 0, 3, 3);
  });
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
    drawNeonSign(g, width / 2, 0);
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

/** The neon sign, BAR in pink, 44 by 16, its top middle at `x`, `top`. */
function drawNeonSign(g: Phaser.GameObjects.Graphics, x: number, top: number): void {
  g.fillStyle(0x1a1020, 1);
  g.fillRoundedRect(x - 22, top, 44, 16, 4);
  g.fillStyle(0xff6fb5, 0.35);
  g.fillRoundedRect(x - 21, top + 1, 42, 14, 4);
  g.fillStyle(0xff9ad0, 1);
  const letters: Record<string, number[][]> = {
    B: [[0, 0, 1, 5], [1, 0, 2, 1], [1, 2, 2, 1], [1, 4, 2, 1], [3, 1, 1, 1], [3, 3, 1, 1]],
    A: [[0, 1, 1, 4], [3, 1, 1, 4], [1, 0, 2, 1], [1, 2, 2, 1]],
    R: [[0, 0, 1, 5], [1, 0, 2, 1], [1, 2, 2, 1], [3, 1, 1, 1], [2, 3, 1, 1], [3, 4, 1, 1]],
  };
  ['B', 'A', 'R'].forEach((letter, i) => {
    for (const [lx, ly, w, h] of letters[letter]) {
      g.fillRect(x - 15 + i * 11 + lx * 2, top + 3 + ly * 2, w * 2, h * 2);
    }
  });
}

/**
 * The bar from outside, on Pluto: a little round-topped hut of ice blocks
 * with the neon sign on its roof and a lit doorway, `door` across from its
 * left edge. Walking into the doorway goes inside.
 */
function drawHut(g: Phaser.GameObjects.Graphics): void {
  const { width, height } = HUT_SIZE;
  const top = 18;
  // The ice-block walls under a domed roof.
  g.fillStyle(0x6a7a9a, 1);
  g.fillRoundedRect(2, top, width - 4, height - top, { tl: 26, tr: 26, bl: 0, br: 0 });
  g.fillStyle(0xc8d8f0, 1);
  g.fillRoundedRect(4, top + 2, width - 8, height - top - 2, { tl: 24, tr: 24, bl: 0, br: 0 });
  g.fillStyle(0x9aaccc, 1);
  for (let y = top + 12; y < height; y += 9) {
    g.fillRect(4, y, width - 8, 1);
    const shift = ((y - top) / 9) % 2 === 0 ? 0 : 7;
    for (let x = 10 + shift; x < width - 6; x += 14) {
      g.fillRect(x, y + 1, 1, 8);
    }
  }
  // A round window, warm, with an alien's head in it.
  g.fillStyle(0x3a2a40, 1);
  g.fillCircle(width - 24, top + 30, 9);
  g.fillStyle(0xffc070, 1);
  g.fillCircle(width - 24, top + 30, 7);
  g.fillStyle(SKIN, 1);
  g.fillCircle(width - 24, top + 32, 4);
  g.fillStyle(0x10202a, 1);
  g.fillRect(width - 26, top + 31, 1, 2);
  g.fillRect(width - 23, top + 31, 1, 2);
  // The doorway: a frame, and warm light inside.
  const { x: door, width: doorWidth, height: doorHeight } = HUT_DOOR;
  g.fillStyle(0x5a3a28, 1);
  g.fillRect(door - 2, height - doorHeight - 2, doorWidth + 4, doorHeight + 2);
  g.fillStyle(0xffb060, 1);
  g.fillRect(door, height - doorHeight, doorWidth, doorHeight);
  g.fillStyle(0xffd890, 1);
  g.fillRect(door + 2, height - doorHeight + 2, doorWidth - 4, doorHeight - 2);
  // The sign on the roof.
  drawNeonSign(g, width / 2, 0);
  g.fillStyle(0x3a3a44, 1);
  g.fillRect(width / 2 - 14, 16, 2, top - 14);
  g.fillRect(width / 2 + 12, 16, 2, top - 14);
}

/** The door out, inside the bar: wood in a frame, ajar, Pluto's dark showing. */
function drawInsideDoor(g: Phaser.GameObjects.Graphics): void {
  const { width, height } = INSIDE_DOOR_SIZE;
  g.fillStyle(0x3a2418, 1);
  g.fillRect(0, 0, width, height);
  g.fillStyle(0x0a0c18, 1);
  g.fillRect(3, 3, width - 6, height - 3);
  g.fillStyle(0xd8e4f8, 0.8);
  g.fillRect(5, 8, 1, 1);
  g.fillRect(9, 14, 1, 1);
  // The door itself, swung open towards the room.
  g.fillStyle(0x8a5a32, 1);
  g.fillRect(width - 9, 3, 6, height - 3);
  g.fillStyle(0xa8743e, 1);
  g.fillRect(width - 8, 5, 1, height - 7);
  g.fillStyle(0xffd23c, 1);
  g.fillRect(width - 8, height / 2, 2, 2);
}

/**
 * The inside of the bar: the wall behind it, warm planks with one string of
 * coloured lights hanging `BAR_WALL.lights` down from its top. Seamless
 * sideways, for a tiling sprite; as tall as the room, so the lights go round
 * once.
 */
function drawBarWall(g: Phaser.GameObjects.Graphics): void {
  const { width, height, lights: lightsAt } = BAR_WALL;
  g.fillStyle(0x4a2c22, 1);
  g.fillRect(0, 0, width, height);
  g.fillStyle(0x5a3628, 1);
  for (let y = 0; y < height; y += 8) {
    g.fillRect(0, y + 1, width, 6);
  }
  g.fillStyle(0x3a2018, 1);
  for (let y = 0; y < height; y += 8) {
    const shift = (y / 8) % 2 === 0 ? 0 : 32;
    g.fillRect((20 + shift) % width, y, 1, 8);
    g.fillRect((52 + shift) % width, y, 1, 8);
  }
  // The wire sags between hooks, and a bulb hangs off it every 16 px.
  g.fillStyle(0x1a1010, 1);
  for (let x = 0; x < width; x += 1) {
    g.fillRect(x, lightsAt + Math.round(Math.sin((x / width) * Math.PI) * 3), 1, 1);
  }
  const lights = [0xff6fb5, 0xffd23c, 0x39ff6a, 0x8ad8ff];
  lights.forEach((colour, i) => {
    const x = 8 + i * 16;
    const y = lightsAt + 2 + Math.round(Math.sin((x / width) * Math.PI) * 3);
    g.fillStyle(colour, 0.25);
    g.fillCircle(x + 1, y + 1, 4);
    g.fillStyle(colour, 1);
    g.fillRect(x, y, 3, 3);
  });
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
