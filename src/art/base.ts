import Phaser from 'phaser';
import { BRANCH_THICKNESS } from './tiles';
import { TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';

/** Room above a moon base's roof for its radar dish and antenna, px. */
export const BASE_HEADROOM = 26;

/** The planted flag, pole and all, px. */
export const FLAG_SIZE = { width: 30, height: 44 };

/**
 * The flag of the United States on a pole, as planted on the moon: held out
 * stiff by a rod along its top, since there is no wind to fly it. Thirteen
 * stripes, red and white, a pixel each, and the blue canton with its stars
 * as white dots in staggered rows. The pole's foot is the picture's bottom
 * centre-left; the scene plants it with origin (0, 1).
 */
export function generateFlagTexture(scene: Phaser.Scene): void {
  const { width, height } = FLAG_SIZE;
  bakeTexture(scene, 'us-flag', width, height, (g) => {
    // The pole, with a lit edge.
    g.fillStyle(0x8a8e98, 1);
    g.fillRect(1, 0, 2, height);
    g.fillStyle(0xd8dce4, 1);
    g.fillRect(1, 0, 1, height);
    // The rod along the top.
    g.fillStyle(0xb0b4bc, 1);
    g.fillRect(3, 1, width - 3, 1);
    // Stripes: thirteen, red first.
    const left = 3;
    const top = 2;
    const w = width - left;
    for (let i = 0; i < 13; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0xc8283a : 0xf4f4f0, 1);
      g.fillRect(left, top + i, w, 1);
    }
    // The canton: seven stripes deep, two fifths of the width.
    const cw = Math.round(w * 0.42);
    g.fillStyle(0x2a3a7a, 1);
    g.fillRect(left, top, cw, 7);
    g.fillStyle(0xffffff, 1);
    for (let row = 0; row < 3; row += 1) {
      for (let x = left + 1 + (row % 2); x < left + cw - 1; x += 2) {
        g.fillRect(x, top + 1 + row * 2, 1, 1);
      }
    }
    // A fold of shadow, so it reads as cloth on a rod rather than a board.
    g.fillStyle(0x000000, 0.12);
    g.fillRect(left + Math.round(w * 0.55), top, 2, 13);
    // The foot: a little mound of dust where it was pushed in.
    g.fillStyle(0xa8a8a4, 1);
    g.fillRect(0, height - 2, 5, 2);
  });
}

/** The alien at work in the lab, px. */
export const ALIEN_SIZE = { width: 16, height: 24 };

/** The specimen tank: its left edge, px in from the inside of the right wall, and its width. */
export const LAB_TANK = { fromRight: 44, width: 16, maxHeight: 52 } as const;

/** Where the lab's computer stands, px in from the inside of its left wall. */
export const LAB_CONSOLE_X = 28;

/**
 * The alien who works in the moon base's laboratory: green, a big head with
 * two black eyes, two antennae with lights on, and a white lab coat. It
 * faces right, at a keyboard; two frames, its hands up and down, are the
 * typing. A third has its eyes shut, for a blink.
 */
export function generateAlienTextures(scene: Phaser.Scene): void {
  const { width, height } = ALIEN_SIZE;
  const draw = (g: Phaser.GameObjects.Graphics, hands: 'up' | 'down', blink: boolean): void => {
    const skin = 0x7ad06a;
    const skinDark = 0x4f9a48;
    // Legs.
    g.fillStyle(skinDark, 1);
    g.fillRect(5, height - 5, 2, 5);
    g.fillRect(9, height - 5, 2, 5);
    // The lab coat.
    g.fillStyle(0xf4f6f8, 1);
    g.fillRect(3, 12, 10, height - 16);
    g.fillStyle(0xc8ccd4, 1);
    g.fillRect(8, 12, 1, height - 16);
    g.fillRect(3, height - 5, 10, 1);
    // A pocket with a pen in it.
    g.fillRect(4, 15, 3, 1);
    g.fillStyle(0x3a5aa8, 1);
    g.fillRect(5, 13, 1, 2);
    // The arm reaching to the keyboard, out in front.
    g.fillStyle(0xf4f6f8, 1);
    g.fillRect(11, 14, 3, 2);
    g.fillStyle(skin, 1);
    g.fillRect(14, hands === 'up' ? 13 : 15, 2, 2);
    // Neck and head.
    g.fillStyle(skin, 1);
    g.fillRect(7, 10, 3, 2);
    g.fillEllipse(8, 6, 12, 10);
    g.fillStyle(skinDark, 1);
    g.fillRect(5, 10, 6, 1);
    // Eyes: big, black, a glint each -- or shut.
    if (blink) {
      g.fillStyle(0x1a2a14, 1);
      g.fillRect(6, 6, 3, 1);
      g.fillRect(10, 6, 3, 1);
    } else {
      g.fillStyle(0x10140e, 1);
      g.fillEllipse(7, 6, 4, 5);
      g.fillEllipse(11, 6, 4, 5);
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, 5, 1, 1);
      g.fillRect(11, 5, 1, 1);
    }
    // Antennae, with lights.
    g.fillStyle(skinDark, 1);
    g.fillRect(5, 0, 1, 2);
    g.fillRect(11, 0, 1, 2);
    g.fillStyle(0xf2e64a, 1);
    g.fillRect(4, 0, 2, 1);
    g.fillRect(11, 0, 2, 1);
  };
  bakeTexture(scene, 'alien-a', width, height, (g) => draw(g, 'up', false));
  bakeTexture(scene, 'alien-b', width, height, (g) => draw(g, 'down', false));
  bakeTexture(scene, 'alien-blink', width, height, (g) => draw(g, 'down', true));
  scene.anims.create({
    key: 'alien-work',
    frames: [
      { key: 'alien-a' },
      { key: 'alien-b' },
      { key: 'alien-a' },
      { key: 'alien-b' },
      { key: 'alien-a' },
      { key: 'alien-b' },
      { key: 'alien-blink', duration: 120 },
      { key: 'alien-b' },
    ],
    frameRate: 6,
    repeat: -1,
  });
}

/** Where the inside of a base is, in its cells: found the same way by the bake and the scene. */
export function baseInside(walls: BaseCell[], wide: number, high: number): { inLeft: number; inRight: number; ceiling: number } {
  const isWall = new Set(walls.map((cell) => `${cell.column},${cell.row}`));
  const wall = (c: number, r: number): boolean => isWall.has(`${c},${r}`);
  const roofRow = Math.min(...walls.map((cell) => cell.row));
  const probe = Math.min(high - 3, roofRow + 3);
  let inLeft = 0;
  while (inLeft < wide && wall(inLeft, probe)) {
    inLeft += 1;
  }
  let inRight = wide;
  while (inRight > inLeft && wall(inRight - 1, probe)) {
    inRight -= 1;
  }
  let ceiling = roofRow;
  while (ceiling < high && wall(inLeft, ceiling)) {
    ceiling += 1;
  }
  return { inLeft, inRight, ceiling };
}

/** One cell of a base, from the base's top-left corner. */
export interface BaseCell {
  column: number;
  row: number;
}

const HULL = 0xdfe3ea;
const HULL_SHADE = 0xa9b0bc;
const HULL_DARK = 0x6e7684;
const STRIPE = 0x3a5aa8;
const STRIPE_RED = 0xc8283a;
const HAZARD = 0xf2c230;
const WALL = 0xc8d0da;
const WALL_SEAM = 0x9aa4b2;
const FLOOR = 0x4e5460;
const LIGHT = 0xf6fbff;
const SCREEN = 0x0e2a24;
const SCREEN_LINE = 0x5ef0b0;
const STEEL = 0x7a828e;

/**
 * A moon base, baked as one picture, with the laboratory inside it.
 *
 * `walls` are the `M` cells: the hull, white panels with seams and rivets
 * and a blue and red stripe along it, and on the roof a radar dish and an
 * antenna (in `BASE_HEADROOM` above the top row). Every other cell in the
 * bounding box is inside: in a wall column it is a **door** -- an open
 * airlock, framed in hazard stripes -- and anywhere else it is the
 * **laboratory**: a panelled back wall with lights along the ceiling, a
 * round window full of stars with the Earth in it, computer consoles with
 * lines on their screens, a shelf of flasks, a tall specimen tank with
 * something green bubbling in it. `benches` are the `=` cells inside, which
 * the cat stands on: drawn here as white lab benches on legs, not as the
 * moon's rock shelves.
 */
export function bakeMoonBase(
  scene: Phaser.Scene,
  key: string,
  walls: BaseCell[],
  benches: BaseCell[],
  wide: number,
  high: number,
  seed: number,
): void {
  const width = wide * TILE;
  const height = high * TILE + BASE_HEADROOM;
  const top = BASE_HEADROOM;
  const random = createRandom(seed);
  const isWall = new Set(walls.map((cell) => `${cell.column},${cell.row}`));
  const wall = (c: number, r: number): boolean => isWall.has(`${c},${r}`);
  const wallColumn = new Set(walls.map((cell) => cell.column));
  const roofRow = Math.min(...walls.map((cell) => cell.row));

  bakeTexture(scene, key, width, height, (g) => {
    // --- inside: the laboratory -------------------------------------------
    // The interior: below the roof, between the side walls. The side walls
    // are found on a row in the middle of the inside, the roof down the
    // first inside column.
    const { inLeft, inRight, ceiling } = baseInside(walls, wide, high);
    const x0 = inLeft * TILE;
    const x1 = inRight * TILE;
    const y0 = top + ceiling * TILE;
    const y1 = top + high * TILE;

    // The back wall: panels, seams, a rail.
    g.fillStyle(WALL, 1);
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle(WALL_SEAM, 1);
    for (let x = x0 + 32; x < x1; x += 32) {
      g.fillRect(x, y0, 1, y1 - y0);
    }
    g.fillRect(x0, y0 + Math.round((y1 - y0) * 0.55), x1 - x0, 1);
    g.fillStyle(0xffffff, 0.35);
    for (let x = x0; x < x1; x += 32) {
      g.fillRect(x + 1, y0, 1, y1 - y0);
    }

    // Lights along the ceiling, and their glow on the wall.
    for (let x = x0 + 20; x < x1 - 20; x += 64) {
      g.fillStyle(LIGHT, 0.18);
      g.fillTriangle(x, y0 + 3, x + 24, y0 + 3, x + 12, y0 + 40);
      g.fillStyle(LIGHT, 1);
      g.fillRect(x, y0, 24, 3);
    }

    // The floor plate.
    g.fillStyle(FLOOR, 1);
    g.fillRect(x0, y1 - 3, x1 - x0, 3);
    g.fillStyle(0x7a808c, 1);
    g.fillRect(x0, y1 - 3, x1 - x0, 1);

    const mid = (x0 + x1) / 2;
    const floor = y1 - 3;

    // A round window in the middle, with space and the Earth in it.
    {
      const wy = y0 + 30;
      const r = 17;
      g.fillStyle(HULL_DARK, 1);
      g.fillCircle(mid, wy, r + 3);
      g.fillStyle(0x060a18, 1);
      g.fillCircle(mid, wy, r);
      for (let i = 0; i < 14; i += 1) {
        const a = random() * Math.PI * 2;
        const d = random() * (r - 2);
        g.fillStyle(0xffffff, 0.5 + random() * 0.5);
        g.fillRect(Math.round(mid + Math.cos(a) * d), Math.round(wy + Math.sin(a) * d), 1, 1);
      }
      g.fillStyle(0x2f74c8, 1);
      g.fillCircle(mid + 6, wy + 5, 6);
      g.fillStyle(0x4f9a48, 1);
      g.fillCircle(mid + 4, wy + 3, 2);
      g.fillCircle(mid + 8, wy + 7, 2);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(mid - 6, wy - 6, 6);
      // Bolts round the rim.
      g.fillStyle(0xc8ccd4, 1);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        g.fillRect(Math.round(mid + Math.cos(a) * (r + 2)), Math.round(wy + Math.sin(a) * (r + 2)), 1, 1);
      }
    }

    // Computer consoles on desks, along the left of the back wall.
    const consoleAt = (cx: number): void => {
      g.fillStyle(STEEL, 1);
      g.fillRect(cx - 14, floor - 14, 28, 3);
      g.fillRect(cx - 12, floor - 11, 2, 11);
      g.fillRect(cx + 10, floor - 11, 2, 11);
      g.fillStyle(0x3a404a, 1);
      g.fillRect(cx - 11, floor - 32, 22, 17);
      g.fillStyle(SCREEN, 1);
      g.fillRect(cx - 9, floor - 30, 18, 13);
      g.fillStyle(SCREEN_LINE, 1);
      for (let i = 0; i < 4; i += 1) {
        g.fillRect(cx - 7, floor - 28 + i * 3, 4 + Math.floor(random() * 10), 1);
      }
      // A blinking light, and a keyboard.
      g.fillStyle(0xff4a3a, 1);
      g.fillRect(cx + 7, floor - 19, 1, 1);
      g.fillStyle(0x5a606c, 1);
      g.fillRect(cx - 8, floor - 15, 16, 1);
    };
    consoleAt(x0 + LAB_CONSOLE_X);
    // A second one only where there is room for it before the window.
    if (x0 + 60 + 14 < mid - 22) {
      consoleAt(x0 + 60);
    }

    // A shelf of flasks and test tubes, right of the window.
    {
      const sx = mid + 26;
      const sy = y0 + 30;
      // As many flasks as fit before the tank.
      const room = x1 - 50 - sx;
      const flasks = Math.max(2, Math.min(6, Math.floor(room / 7)));
      g.fillStyle(STEEL, 1);
      g.fillRect(sx, sy, flasks * 7 + 2, 2);
      g.fillRect(sx, sy + 16, flasks * 7 + 2, 2);
      const colours = [0x5ef05e, 0xe84ad8, 0x4ad8f0, 0xf0c84a, 0xf06a4a];
      for (let i = 0; i < flasks; i += 1) {
        const fx = sx + 3 + i * 7;
        const colour = colours[Math.floor(random() * colours.length)];
        // A round-bottomed flask, or a tall tube.
        if (i % 2 === 0) {
          g.fillStyle(0xe8f0f4, 0.7);
          g.fillCircle(fx + 2, sy - 4, 3);
          g.fillRect(fx + 1, sy - 10, 2, 5);
          g.fillStyle(colour, 1);
          g.fillCircle(fx + 2, sy - 3, 2);
        } else {
          g.fillStyle(0xe8f0f4, 0.7);
          g.fillRect(fx + 1, sy - 9, 3, 9);
          g.fillStyle(colour, 1);
          g.fillRect(fx + 1, sy - 5, 3, 5);
        }
        // And the row below: beakers.
        g.fillStyle(0xe8f0f4, 0.7);
        g.fillRect(fx, sy + 9, 5, 7);
        g.fillStyle(colours[(i + 2) % colours.length], 1);
        g.fillRect(fx, sy + 12, 5, 4);
      }
    }

    // The specimen tank, tall, near the right: glass, green liquid and
    // bubbles. The little robot growing in it is the scene's, live.
    {
      const tx = x1 - LAB_TANK.fromRight;
      const th = Math.min(LAB_TANK.maxHeight, y1 - y0 - 12);
      const ty = floor - th;
      g.fillStyle(STEEL, 1);
      g.fillRect(tx - 2, floor - 4, 20, 4);
      g.fillRect(tx - 2, ty - 3, 20, 4);
      g.fillStyle(0x7af07a, 0.55);
      g.fillRect(tx, ty + 6, 16, th - 10);
      g.fillStyle(0xd8f8f0, 0.35);
      g.fillRect(tx, ty + 1, 16, th - 5);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(tx + 2, ty + 2, 1, th - 8);
      g.fillStyle(0xffffff, 0.8);
      for (let i = 0; i < 6; i += 1) {
        g.fillRect(tx + 3 + Math.floor(random() * 10), ty + 8 + Math.floor(random() * (th - 16)), 1, 1);
      }
    }

    // Lab benches, where the level has `=` inside: a white top -- what the
    // cat stands on -- with a steel edge and legs to the floor, and a
    // flask at one end.
    const benchRows = new Map<number, number[]>();
    for (const cell of benches) {
      benchRows.set(cell.row, [...(benchRows.get(cell.row) ?? []), cell.column]);
    }
    for (const [row, columns] of benchRows) {
      columns.sort((a, b) => a - b);
      let i = 0;
      while (i < columns.length) {
        let j = i;
        while (j + 1 < columns.length && columns[j + 1] === columns[j] + 1) {
          j += 1;
        }
        const bx = columns[i] * TILE;
        const bw = (j - i + 1) * TILE;
        const by = top + row * TILE;
        g.fillStyle(STEEL, 1);
        g.fillRect(bx + 2, by + BRANCH_THICKNESS, 2, floor - by - BRANCH_THICKNESS);
        g.fillRect(bx + bw - 4, by + BRANCH_THICKNESS, 2, floor - by - BRANCH_THICKNESS);
        g.fillStyle(0xf4f6f8, 1);
        g.fillRect(bx, by, bw, BRANCH_THICKNESS - 2);
        g.fillStyle(HULL_SHADE, 1);
        g.fillRect(bx, by + BRANCH_THICKNESS - 2, bw, 2);
        // A round flask at the right end, something pink in it.
        const fx = bx + bw - 8;
        g.fillStyle(0xe8f0f4, 0.8);
        g.fillCircle(fx, by - 4, 4);
        g.fillRect(fx - 1, by - 11, 3, 5);
        g.fillStyle(0xe84ad8, 1);
        g.fillCircle(fx, by - 3, 3);
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(fx - 2, by - 6, 1, 1);
        i = j + 1;
      }
    }

    // --- the hull -----------------------------------------------------------
    for (const cell of walls) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(HULL, 1);
      g.fillRect(x, y, TILE, TILE);
      // Panel seams and rivets.
      g.fillStyle(HULL_SHADE, 1);
      g.fillRect(x, y + TILE - 1, TILE, 1);
      g.fillRect(x + TILE - 1, y, 1, TILE);
      g.fillStyle(HULL_DARK, 1);
      g.fillRect(x + 2, y + 2, 1, 1);
      g.fillRect(x + TILE - 3, y + TILE - 3, 1, 1);
    }
    // Outline only where the hull meets air or the inside.
    for (const cell of walls) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(0xffffff, 1);
      if (!wall(cell.column, cell.row - 1)) {
        g.fillRect(x, y, TILE, 2);
      }
      if (!wall(cell.column - 1, cell.row)) {
        g.fillRect(x, y, 1, TILE);
      }
      g.fillStyle(HULL_DARK, 1);
      if (!wall(cell.column + 1, cell.row)) {
        g.fillRect(x + TILE - 2, y, 2, TILE);
      }
      if (!wall(cell.column, cell.row + 1)) {
        g.fillRect(x, y + TILE - 2, TILE, 2);
      }
    }
    // The stripe along the roof: blue over red, on the bottom row of the
    // roof however thick it is.
    for (const cell of walls) {
      if (cell.row !== ceiling - 1) {
        continue;
      }
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(STRIPE, 1);
      g.fillRect(x, y + 5, TILE, 3);
      g.fillStyle(STRIPE_RED, 1);
      g.fillRect(x, y + 9, TILE, 2);
    }

    // Doors: open cells in a side wall's columns, framed in hazard stripes.
    const sideColumns = [...wallColumn].filter((column) => column < inLeft || column >= inRight);
    for (const column of sideColumns) {
      for (let row = 0; row < high; row += 1) {
        if (wall(column, row) || row <= roofRow) {
          continue;
        }
        const x = column * TILE;
        const y = top + row * TILE;
        g.fillStyle(0x2a2e36, 0.35);
        g.fillRect(x, y, TILE, TILE);
        for (let k = 0; k < TILE; k += 4) {
          g.fillStyle(k % 8 === 0 ? HAZARD : 0x1a1c20, 1);
          g.fillRect(x, y + k, 2, 4);
          g.fillRect(x + TILE - 2, y + k, 2, 4);
        }
        if (wall(column, row - 1)) {
          for (let k = 0; k < TILE; k += 4) {
            g.fillStyle(k % 8 === 0 ? HAZARD : 0x1a1c20, 1);
            g.fillRect(x + k, y, 4, 2);
          }
        }
      }
    }

    // On the roof: a radar dish and an antenna with a red light.
    const roofLeft = Math.min(...walls.filter((cell) => cell.row === roofRow).map((cell) => cell.column)) * TILE;
    const roofRight = (Math.max(...walls.filter((cell) => cell.row === roofRow).map((cell) => cell.column)) + 1) * TILE;
    {
      const dx = roofLeft + 40;
      const dy = top + roofRow * TILE;
      g.fillStyle(HULL_DARK, 1);
      g.fillRect(dx - 1, dy - 10, 3, 10);
      g.fillStyle(HULL, 1);
      g.fillEllipse(dx, dy - 14, 22, 10);
      g.fillStyle(HULL_SHADE, 1);
      g.fillEllipse(dx + 1, dy - 13, 16, 6);
      g.fillStyle(HULL_DARK, 1);
      g.fillRect(dx, dy - 22, 1, 8);
      g.fillRect(dx - 1, dy - 23, 3, 2);
    }
    {
      const ax = roofRight - 30;
      const ay = top + roofRow * TILE;
      g.fillStyle(HULL_DARK, 1);
      g.fillRect(ax, ay - 22, 1, 22);
      g.fillRect(ax - 4, ay - 14, 9, 1);
      g.fillRect(ax - 3, ay - 8, 7, 1);
      g.fillStyle(0xff4a3a, 1);
      g.fillRect(ax - 1, ay - 25, 3, 3);
    }
  });
}
