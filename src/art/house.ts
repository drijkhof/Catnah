import Phaser from 'phaser';
import { BRANCH_THICKNESS } from './tiles';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

/** Room above a house's top row for the ornament on its gable, px. */
export const HOUSE_HEADROOM = 8;

/** How far an awning's picture reaches past its cells: sideways, up, and the valance below. */
export const AWNING_BULGE = { side: 2, top: 1, valance: 6 };

/** One cell of a house, in cells from the house's top-left corner. */
export interface HouseCell {
  column: number;
  row: number;
}

interface Facade {
  base: number;
  dark: number;
  light: number;
  /** Brick shows its courses; plaster is smooth. */
  brick: boolean;
}

/** What a house can be built of. Picked per house, seeded by where it stands. */
const FACADES: Facade[] = [
  { base: 0xa2523c, dark: 0x7a3a2a, light: 0xc06a50, brick: true },
  { base: 0x7d4a33, dark: 0x5a3324, light: 0x9a6346, brick: true },
  { base: 0x8e3f3a, dark: 0x682c29, light: 0xae5a52, brick: true },
  { base: 0xe6d7b4, dark: 0xbfae88, light: 0xf5ead0, brick: false },
  { base: 0xa9bccb, dark: 0x7f93a3, light: 0xc8d6e0, brick: false },
  { base: 0x9db08f, dark: 0x74876a, light: 0xbccbb0, brick: false },
  { base: 0xd9a86a, dark: 0xb0824a, light: 0xeec48e, brick: false },
];

const TRIM = 0xf2efe6;
const TRIM_SHADE = 0xc9c4b6;
const GLASS = 0x2f4a5e;
const GLASS_DEEP = 0x223646;
const GLINT = 0x8fb3c8;
const PLINTH = 0x4f4844;
const PLINTH_LIGHT = 0x6e6660;
const DOORS = [0x2f5a3f, 0x2c4a6e, 0x8a2f2a, 0x2a3a34, 0x5a3a6a];
const FLOWERS = [0xd8423a, 0xe887a8, 0xf2c84a, 0xf2f0e8];
const LEAVES = 0x4f8a3c;
const LEAVES_LIGHT = 0x74b05a;
const BOX = 0x6b4a2a;
const PASSAGE = 0x2a2420;
/** What everything is pulled towards at night. */
const NIGHT = 0x12162a;
const LAMPLIGHT = 0xf2c46a;
const LAMPLIGHT_DEEP = 0xd89a44;
const CURTAIN_LIT = 0xe0a050;
const GLASS_NIGHT = 0x1a2434;
const GLASS_NIGHT_DEEP = 0x111824;
const GLINT_NIGHT = 0x3c4c66;

/** `from` moved a fraction `t` of the way to `to`, channel by channel. */
function mix(from: number, to: number, t: number): number {
  const channel = (shift: number): number => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * t) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}
const PASSAGE_DEEP = 0x1a1614;

/**
 * A town house, baked as one picture.
 *
 * The cells are one cluster of one letter from the map, any shape; a house
 * is usually a block with a stepped gable on top, which in cells is simply
 * each row a little narrower than the one under it -- the steps are where
 * the cat climbs. A cell's edge is drawn only where no cell of the same
 * house is beside it, so the inside is one wall and the outline is the
 * house's own silhouette; every step of the gable gets a coping of white
 * stone.
 *
 * Storeys are two rows, counted up from the street. Each column of a storey
 * that is wall top to bottom gets a sash window -- white frame, glazing
 * bars, a sill and a lintel -- and some get a flower box or shutters. The
 * bottom storey has the front door, with a fanlight over it and a step. A
 * row of the gable that only has room for half a storey gets a small attic
 * window, and the very top a hoist beam.
 *
 * `passages` are the open cells under the house, down to the street: the
 * upper storeys carried over it on arches. They are drawn as the dark of a
 * passage under white arches, and stay as open as the map says they are.
 */
export function bakeHouse(
  scene: Phaser.Scene,
  key: string,
  cells: HouseCell[],
  passages: HouseCell[],
  wide: number,
  high: number,
  seed: number,
  facadeIndex: number,
  night = false,
): void {
  const width = wide * TILE;
  const height = high * TILE + HOUSE_HEADROOM;
  const top = HOUSE_HEADROOM;
  const random = createRandom(seed);
  // At night every colour is pulled down towards the dark, and the only
  // bright things are the windows somebody is home behind.
  const n = (colour: number): number => (night ? mix(colour, NIGHT, 0.55) : colour);
  const chosen = FACADES[facadeIndex % FACADES.length];
  const facade: Facade = { base: n(chosen.base), dark: n(chosen.dark), light: n(chosen.light), brick: chosen.brick };
  const door = n(DOORS[Math.floor(random() * DOORS.length)]);
  const shutters = !facade.brick && random() < 0.7;
  const has = new Set(cells.map((cell) => `${cell.column},${cell.row}`));
  const at = (column: number, row: number): boolean => has.has(`${column},${row}`);
  const open = new Set(passages.map((cell) => `${cell.column},${cell.row}`));
  const isPassage = (column: number, row: number): boolean => open.has(`${column},${row}`);
  // The lowest row of wall: the street floor, or the floor over the arches.
  const bottom = Math.max(...cells.map((cell) => cell.row));
  const arcaded = passages.length > 0;

  bakeTexture(scene, key, width, height, (g) => {
    // The wall.
    g.fillStyle(facade.base, 1);
    for (const cell of cells) {
      g.fillRect(cell.column * TILE, top + cell.row * TILE, TILE, TILE);
    }

    // Brick: courses every four pixels, the joints staggered a half-brick.
    // Faint, so the house reads as brick without turning into a grid.
    if (facade.brick) {
      for (const cell of cells) {
        const x = cell.column * TILE;
        const y = top + cell.row * TILE;
        for (let course = 0; course < 4; course += 1) {
          g.fillStyle(facade.dark, 0.45);
          g.fillRect(x, y + course * 4 + 3, TILE, 1);
          const offset = (cell.row * 4 + course) % 2 === 0 ? 0 : 4;
          for (let jx = offset; jx < TILE; jx += 8) {
            g.fillRect(x + jx, y + course * 4, 1, 3);
          }
        }
        // A brick here and there a shade lighter or darker.
        for (let i = 0; i < 3; i += 1) {
          g.fillStyle(random() < 0.5 ? facade.light : facade.dark, 0.5);
          const bx = x + Math.floor(random() * 2) * 8 + (random() < 0.5 ? 0 : 4);
          g.fillRect(Math.min(bx + 1, x + TILE - 7), y + Math.floor(random() * 4) * 4, 6, 3);
        }
      }
    } else {
      // Plaster: a few soft blotches of weathering.
      for (const cell of cells) {
        if (random() < 0.4) {
          g.fillStyle(facade.dark, 0.25);
          g.fillRect(cell.column * TILE + Math.floor(random() * 10), top + cell.row * TILE + Math.floor(random() * 12), 4 + Math.floor(random() * 4), 2);
        }
      }
    }

    // Edges: light where the sun is (top and left), dark on the shade side.
    for (const cell of cells) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      if (!at(cell.column - 1, cell.row)) {
        g.fillStyle(facade.light, 1);
        g.fillRect(x, y, 1, TILE);
      }
      if (!at(cell.column + 1, cell.row)) {
        g.fillStyle(facade.dark, 1);
        g.fillRect(x + TILE - 2, y, 2, TILE);
      }
    }

    // The coping: white stone along every step of the gable, the step's
    // sides capped too, and a line of shadow under it.
    for (const cell of cells) {
      if (at(cell.column, cell.row - 1)) {
        continue;
      }
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      const leftOpen = !at(cell.column - 1, cell.row);
      const rightOpen = !at(cell.column + 1, cell.row);
      g.fillStyle(n(TRIM), 1);
      g.fillRect(x - (leftOpen ? 1 : 0), y, TILE + (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0), 3);
      g.fillStyle(n(TRIM_SHADE), 1);
      g.fillRect(x - (leftOpen ? 1 : 0), y + 2, TILE + (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0), 1);
      g.fillStyle(facade.dark, 0.6);
      g.fillRect(x, y + 3, TILE, 1);
    }

    // The ornament on the very top: a stone ball on a little plinth over
    // each topmost cell of the gable.
    const highest = Math.min(...cells.map((cell) => cell.row));
    const summit = cells.filter((cell) => cell.row === highest);
    const summitLeft = Math.min(...summit.map((cell) => cell.column));
    const summitRight = Math.max(...summit.map((cell) => cell.column)) + 1;
    const ornamentX = Math.round(((summitLeft + summitRight) / 2) * TILE);
    g.fillStyle(n(TRIM_SHADE), 1);
    g.fillRect(ornamentX - 3, top - 2, 6, 2);
    g.fillStyle(n(TRIM), 1);
    g.fillCircle(ornamentX, top - 5, 3);
    g.fillStyle(n(TRIM_SHADE), 1);
    g.fillRect(ornamentX, top - 4, 2, 2);

    // Storeys, two rows each, from the street up.
    const windowAt = (column: number, row: number, tall: boolean): void => {
      const x = column * TILE + 3;
      const w = 10;
      const h = tall ? 18 : 9;
      const y = top + row * TILE + (tall ? 8 : 4);
      // Lintel: an arch of darker brick, or a white stone over plaster.
      g.fillStyle(facade.brick ? facade.dark : n(TRIM), 1);
      g.fillRect(x - 1, y - 3, w + 2, 2);
      // Shutters either side, hinged open.
      if (shutters && tall) {
        g.fillStyle(door, 1);
        g.fillRect(x - 3, y, 3, h);
        g.fillRect(x + w, y, 3, h);
        g.fillStyle(0x000000, 0.25);
        g.fillRect(x - 3, y + Math.floor(h / 3), 3, 1);
        g.fillRect(x + w, y + Math.floor(h / 3), 3, 1);
        g.fillRect(x - 3, y + Math.floor((h * 2) / 3), 3, 1);
        g.fillRect(x + w, y + Math.floor((h * 2) / 3), 3, 1);
      }
      // Frame and glass. At night a window is lit or it is dark; by day
      // it is glass with the sky in it.
      const lit = night && random() < 0.55;
      g.fillStyle(n(TRIM), 1);
      g.fillRect(x, y, w, h);
      g.fillStyle(lit ? LAMPLIGHT : night ? GLASS_NIGHT : GLASS, 1);
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle(lit ? LAMPLIGHT_DEEP : night ? GLASS_NIGHT_DEEP : GLASS_DEEP, 1);
      g.fillRect(x + 1, y + h - 4, w - 2, 3);
      // A curtain, sometimes.
      if (random() < 0.35) {
        g.fillStyle(lit ? CURTAIN_LIT : n(TRIM_SHADE), 1);
        g.fillRect(x + 1, y + 1, 2, h - 2);
      }
      // The glint: a diagonal of sky in the upper pane. A lit window has
      // none; the light is coming out of it.
      if (!lit) {
        g.fillStyle(night ? GLINT_NIGHT : GLINT, 1);
        g.fillRect(x + w - 4, y + 2, 2, 1);
        g.fillRect(x + w - 5, y + 3, 2, 1);
      }
      // Glazing bars: one down the middle and one across, for a sash.
      g.fillStyle(n(TRIM), 1);
      g.fillRect(x + Math.floor(w / 2) - 0, y, 1, h);
      if (tall) {
        g.fillRect(x, y + Math.floor(h / 2), w, 1);
      }
      // The sill.
      g.fillStyle(n(TRIM), 1);
      g.fillRect(x - 1, y + h, w + 2, 2);
      g.fillStyle(n(TRIM_SHADE), 1);
      g.fillRect(x - 1, y + h + 1, w + 2, 1);
      // A flower box under some.
      if (tall && random() < 0.35) {
        g.fillStyle(n(BOX), 1);
        g.fillRect(x - 1, y + h - 2, w + 2, 4);
        for (let fx = x - 1; fx < x + w + 1; fx += 2) {
          g.fillStyle(random() < 0.5 ? n(LEAVES) : n(LEAVES_LIGHT), 1);
          g.fillRect(fx, y + h - 4, 2, 2);
          if (random() < 0.6) {
            g.fillStyle(n(FLOWERS[Math.floor(random() * FLOWERS.length)]), 1);
            g.fillRect(fx, y + h - 5, 2, 2);
          }
        }
      }
    };

    // The door goes in a ground-floor column with wall both sides of it if
    // there is one.
    const groundColumns: number[] = [];
    for (let column = 0; column < wide && !arcaded; column += 1) {
      if (at(column, bottom) && at(column, bottom - 1)) {
        groundColumns.push(column);
      }
    }
    const inner = groundColumns.filter((column) => column > 0 && column < wide - 1);
    const doorColumn = (inner.length > 0 ? inner : groundColumns)[Math.floor(random() * Math.max(1, (inner.length > 0 ? inner : groundColumns).length))];

    for (let column = 0; column < wide; column += 1) {
      for (let row = bottom; row >= 0; row -= 2) {
        const lower = at(column, row);
        const upper = at(column, row - 1);
        if (!lower) {
          continue;
        }
        if (row === bottom && upper && !arcaded) {
          if (column === doorColumn) {
            continue;
          }
          windowAt(column, row - 1, true);
          continue;
        }
        if (upper) {
          // A whole storey: a tall window, unless it is the top of the
          // gable, where a little attic window sits higher up.
          windowAt(column, row - 1, true);
        } else if (row !== highest || summit.length > 1) {
          windowAt(column, row, false);
        }
      }
    }

    // The front door: panelled, rounded at the top, with a fanlight of
    // glass over it and a stone step at its foot.
    if (doorColumn !== undefined) {
      const x = doorColumn * TILE + 3;
      const y = top + (bottom - 1) * TILE + 7;
      const w = 10;
      const h = TILE * 2 - 7;
      g.fillStyle(n(TRIM), 1);
      g.fillRoundedRect(x - 1, y - 1, w + 2, h + 1, { tl: 5, tr: 5, bl: 0, br: 0 });
      // The fanlight: lit at night, the hall light on.
      g.fillStyle(night ? LAMPLIGHT : GLASS, 1);
      g.fillRoundedRect(x, y, w, 7, { tl: 4, tr: 4, bl: 0, br: 0 });
      if (!night) {
        g.fillStyle(GLINT, 1);
        g.fillRect(x + 6, y + 2, 2, 1);
      }
      g.fillStyle(n(TRIM), 1);
      g.fillRect(x, y + 7, w, 1);
      g.fillRect(x + 4, y, 1, 7);
      g.fillStyle(door, 1);
      g.fillRect(x, y + 8, w, h - 10);
      g.fillStyle(0x000000, 0.25);
      g.fillRect(x + 1, y + 10, 3, 6);
      g.fillRect(x + 6, y + 10, 3, 6);
      g.fillRect(x + 1, y + 18, 3, 3);
      g.fillRect(x + 6, y + 18, 3, 3);
      // The knob, brass.
      g.fillStyle(0xe0b84a, 1);
      g.fillRect(x + w - 3, y + 16, 1, 2);
      // The step.
      g.fillStyle(n(PLINTH_LIGHT), 1);
      g.fillRect(x - 2, y + h - 2, w + 4, 2);
    }

    // The plinth: a band of dark stone the house stands on.
    for (const cell of cells) {
      if (cell.row !== bottom || arcaded) {
        continue;
      }
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(n(PLINTH), 1);
      g.fillRect(x, y + TILE - 3, TILE, 3);
      g.fillStyle(n(PLINTH_LIGHT), 1);
      g.fillRect(x, y + TILE - 3, TILE, 1);
    }

    // Archways: the dark of the passage under the house, cut into arches
    // two cells wide with a pier between each and a white rim round each
    // arch. The piers are only a picture; the passage is as open as the
    // map says.
    const passageRows = new Map<number, number[]>();
    for (const cell of passages) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(n(PASSAGE), 1);
      g.fillRect(x, y, TILE, TILE);
      if (!isPassage(cell.column, cell.row + 1)) {
        g.fillStyle(n(PASSAGE_DEEP), 1);
        g.fillRect(x, y + TILE - 4, TILE, 4);
      }
      if (!isPassage(cell.column, cell.row - 1)) {
        passageRows.set(cell.row, [...(passageRows.get(cell.row) ?? []), cell.column]);
      }
    }
    for (const [row, columns] of passageRows) {
      columns.sort((a, b) => a - b);
      // Runs of touching columns, each cut into arches.
      let i = 0;
      while (i < columns.length) {
        let j = i;
        while (j + 1 < columns.length && columns[j + 1] === columns[j] + 1) {
          j += 1;
        }
        const runLeft = columns[i];
        const runCells = j - i + 1;
        const depth = Math.max(...passages.filter((cell) => cell.column === runLeft).map((cell) => cell.row)) - row + 1;
        const arches = Math.max(1, Math.round(runCells / 2));
        const y = top + row * TILE;
        const h = depth * TILE;
        for (let a = 0; a < arches; a += 1) {
          const x0 = runLeft * TILE + Math.round((a * runCells * TILE) / arches);
          const x1 = runLeft * TILE + Math.round(((a + 1) * runCells * TILE) / arches);
          const pier = 2;
          const w = x1 - x0 - pier * 2;
          const radius = Math.min(Math.floor(w / 2), h > TILE ? 10 : 5);
          // The wall over the arch, then the rim, then the opening.
          g.fillStyle(facade.base, 1);
          g.fillRect(x0, y, x1 - x0, h);
          g.fillStyle(n(TRIM), 1);
          g.fillRoundedRect(x0 + pier - 1, y + 1, w + 2, h - 1, { tl: radius + 1, tr: radius + 1, bl: 0, br: 0 });
          g.fillStyle(n(PASSAGE), 1);
          g.fillRoundedRect(x0 + pier, y + 2, w, h - 2, { tl: radius, tr: radius, bl: 0, br: 0 });
          g.fillStyle(n(PASSAGE_DEEP), 1);
          g.fillRect(x0 + pier, y + h - 4, w, 4);
          // The piers' feet.
          g.fillStyle(n(PLINTH), 1);
          g.fillRect(x0, y + h - 3, pier, 3);
          g.fillRect(x1 - pier, y + h - 3, pier, 3);
        }
        i = j + 1;
      }
    }
  });
}

/** Stripe colours for awnings: one colour and cream, picked per awning. */
const AWNING_COLOURS = [0x3f7a52, 0xb8402f, 0x2f5a8a, 0xd9822b, 0x7a3f6a];
const CANVAS = 0xf1e9d2;

/**
 * A shop awning over a run of `=` cells, as one picture: a rod along the
 * top -- the edge the cat lands on -- canvas striped in a colour and cream,
 * shaded deeper towards the wall, and a scalloped valance hanging under the
 * front edge.
 */
export function bakeAwning(scene: Phaser.Scene, key: string, cells: number, seed: number, night = false): void {
  const random = createRandom(seed);
  const pick = AWNING_COLOURS[Math.floor(random() * AWNING_COLOURS.length)];
  const colour = night ? mix(pick, NIGHT, 0.45) : pick;
  const canvas = night ? mix(CANVAS, NIGHT, 0.45) : CANVAS;
  const width = cells * TILE + AWNING_BULGE.side * 2;
  const height = AWNING_BULGE.top + BRANCH_THICKNESS + AWNING_BULGE.valance;
  const top = AWNING_BULGE.top;
  const stripe = 4;

  bakeTexture(scene, key, width, height, (g) => {
    // The canvas: stripes across, darker at the back where it meets the wall.
    for (let x = 0; x < width; x += stripe) {
      g.fillStyle((x / stripe) % 2 === 0 ? colour : canvas, 1);
      g.fillRect(x, top, Math.min(stripe, width - x), BRANCH_THICKNESS);
    }
    g.fillStyle(0x000000, 0.18);
    g.fillRect(0, top, width, 2);
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(0, top + BRANCH_THICKNESS - 3, width, 1);

    // The valance: a scallop per stripe pair.
    for (let x = 0; x < width; x += stripe * 2) {
      g.fillStyle(colour, 1);
      g.fillRect(x, top + BRANCH_THICKNESS, Math.min(stripe * 2, width - x), 3);
      g.fillCircle(x + stripe, top + BRANCH_THICKNESS + 3, stripe - 1);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(x + stripe - 1, top + BRANCH_THICKNESS + 5, 2, 1);
    }

    // The rod on top, which is what is stood on.
    g.fillStyle(0x3a3a3e, 1);
    g.fillRect(0, 0, width, 2);
    g.fillStyle(0x8a8a90, 1);
    g.fillRect(1, 0, width - 2, 1);
  });
}

/** One baked stretch of distant town, px. */
export const SKYLINE_SIZES = {
  far: { width: 288, height: 110 },
  near: { width: 320, height: 130 },
} as const;

/** The moon's glow, px across. */
export const MOON_SIZE = 84;

/**
 * The town behind the town, at night: a row of gables against the sky in
 * two ranks, with a lit window here and there. The far rank is the bluer
 * and has a church tower with a lit clock face; the near one is the darker,
 * because at night distance is where the light is and the thing close to
 * you is the thing in front of it. Each rank is baked in two variants so
 * the row does not repeat in step. Plus the sky, full of stars, and the moon.
 */
export function generateCityTextures(scene: Phaser.Scene): void {
  bakeTexture(scene, 'city-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Night, with the orange wash a town throws up into low cloud.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x0b1030, 0x35283e);
    // Lots of stars, thick high up and thinning toward the rooftops, a few
    // of them bigger and brighter than the rest.
    const random = createRandom(4441);
    for (let i = 0; i < 220; i += 1) {
      const y = random() * GAME_HEIGHT * 0.7;
      const fade = 1 - y / (GAME_HEIGHT * 0.7);
      g.fillStyle(random() < 0.15 ? 0xfff2c8 : 0xe8ecff, 0.3 + random() * 0.65 * fade);
      const x = Math.floor(random() * GAME_WIDTH);
      if (random() < 0.08) {
        g.fillRect(x - 1, Math.floor(y), 3, 1);
        g.fillRect(x, Math.floor(y) - 1, 1, 3);
      } else {
        g.fillRect(x, Math.floor(y), 1, 1);
      }
    }
  });

  bakeTexture(scene, 'moon', MOON_SIZE, MOON_SIZE, (g) => {
    const r = MOON_SIZE / 2;
    for (let i = 5; i > 0; i -= 1) {
      g.fillStyle(0xe8e6d0, 0.07);
      g.fillCircle(r, r, (r * i) / 5);
    }
    g.fillStyle(0xf4f2de, 1);
    g.fillCircle(r, r, r * 0.36);
    // Seas on its face.
    g.fillStyle(0xd6d2b8, 1);
    g.fillCircle(r - 4, r - 3, 4);
    g.fillCircle(r + 5, r + 4, 3);
  });

  for (const rank of ['far', 'near'] as const) {
    const { width, height } = SKYLINE_SIZES[rank];
    for (const variant of ['a', 'b'] as const) {
      const random = createRandom((rank === 'far' ? 3109 : 4127) + (variant === 'a' ? 0 : 57));
      bakeTexture(scene, `skyline-${rank}-${variant}`, width, height, (g) => {
        const tones = rank === 'far' ? [0x252a4a, 0x22284a, 0x2a2c4e] : [0x161828, 0x1a1a2c, 0x181a26];
        let x = 0;
        // A church tower in the far rank, once per stretch.
        const towerAt = rank === 'far' ? 60 + Math.floor(random() * (width - 140)) : -1000;
        while (x < width) {
          const w = (rank === 'far' ? 24 : 32) + Math.floor(random() * 3) * 8;
          const body = (rank === 'far' ? 40 : 50) + Math.floor(random() * 4) * 10;
          const tone = tones[Math.floor(random() * tones.length)];
          const y = height - body;
          const right = Math.min(width, x + w);
          g.fillStyle(tone, 1);
          g.fillRect(x, y, right - x, body);
          // The gable: stepped, or a bell shape, or a plain point.
          const kind = Math.floor(random() * 3);
          const mid = x + w / 2;
          if (kind === 0) {
            const step = w / 6;
            for (let s = 1; s <= 3; s += 1) {
              g.fillRect(x + step * s, y - s * 6, w - step * s * 2, 6);
            }
          } else if (kind === 1) {
            g.fillEllipse(mid, y, w * 0.8, 22);
            g.fillRect(mid - w * 0.2, y - 14, w * 0.4, 8);
          } else {
            g.fillTriangle(x, y, x + w, y, mid, y - w * 0.55);
          }
          // Windows: most dark, some lit, never a grid of light.
          for (let wy = y + 8; wy < height - 14; wy += 14) {
            for (let wx = x + 5; wx < right - 6; wx += 9) {
              if (random() < 0.3) {
                g.fillStyle(random() < 0.8 ? 0xf0c96a : 0x8fb6e8, rank === 'far' ? 0.55 : 0.85);
                g.fillRect(wx, wy, rank === 'far' ? 3 : 4, rank === 'far' ? 5 : 7);
              }
            }
          }
          if (towerAt >= x && towerAt < x + w) {
            const tw = 18;
            const tx = towerAt;
            g.fillStyle(0x2c3256, 1);
            g.fillRect(tx, height - 96, tw, 96);
            g.fillRect(tx + 3, height - 104, tw - 6, 8);
            g.fillTriangle(tx + 2, height - 104, tx + tw - 2, height - 104, tx + tw / 2, 0);
            // The clock, lit.
            g.fillStyle(0xf2dc9a, 0.9);
            g.fillCircle(tx + tw / 2, height - 82, 4);
            g.fillStyle(0x2c3256, 1);
            g.fillRect(tx + tw / 2, height - 85, 1, 3);
            g.fillStyle(0xf0c96a, 0.7);
            g.fillRect(tx + 7, height - 64, 4, 8);
          }
          x += w;
        }
      });
    }
  }

  // A street lamp: a black iron post with a lantern on top, and the glow
  // round the lantern as its own picture, added on top so it can be lit.
  bakeTexture(scene, 'street-lamp', LAMP_SIZE.width, LAMP_SIZE.height, (g) => {
    const cx = LAMP_SIZE.width / 2;
    const h = LAMP_SIZE.height;
    g.fillStyle(0x1c1c22, 1);
    g.fillRect(cx - 1, 10, 3, h - 10);
    g.fillRect(cx - 3, h - 4, 7, 4);
    g.fillRect(cx - 2, h - 10, 5, 2);
    // The lantern: a cap, glass, a base.
    g.fillRect(cx - 4, 0, 9, 2);
    g.fillRect(cx - 3, 2, 7, 1);
    g.fillStyle(0xffe6a0, 1);
    g.fillRect(cx - 3, 3, 7, 6);
    g.fillStyle(0xfff4d0, 1);
    g.fillRect(cx - 1, 4, 3, 4);
    g.fillStyle(0x1c1c22, 1);
    g.fillRect(cx, 3, 1, 6);
    g.fillRect(cx - 4, 9, 9, 2);
  });
  bakeTexture(scene, 'lamp-glow', LAMP_GLOW, LAMP_GLOW, (g) => {
    const r = LAMP_GLOW / 2;
    for (let i = 6; i > 0; i -= 1) {
      g.fillStyle(0xffc060, 0.06);
      g.fillCircle(r, r, (r * i) / 6);
    }
  });
}

/** A street lamp, post and lantern, px. */
export const LAMP_SIZE = { width: 11, height: 44 };
/** The glow round a lamp's lantern, px across. */
export const LAMP_GLOW = 72;
