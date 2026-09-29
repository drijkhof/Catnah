import Phaser from 'phaser';
import { TILE } from '../config';
import { createRandom } from './canvas';
import type { TilePalette } from './tiles';

/** One picture of the rock, covering part of the level. */
export interface RockPiece {
  key: string;
  x: number;
  y: number;
}

/** The side of one piece, px. A power of two, like the scenery chunks. */
const PIECE = 512;

/**
 * How far past a ground cell rock may reach into open air, px: sideways,
 * and up or down. Small, so a tunnel keeps its width and the cat's feet
 * stay on the surface; the outline is the fragments' all the same, because
 * they may also fall short of the cell by up to `BITE`.
 */
const REACH_X = 2;
const REACH_Y = 1;
const BITE = 4;
const REACH = Math.max(REACH_X, REACH_Y, BITE);

/**
 * Bakes a cave's ground as fractured rock.
 *
 * Not stones set in mortar: one mass, broken into fragments. Seeds are
 * scattered through the ground, about one per cell, and every pixel of
 * rock belongs to its nearest seed, so the fragments are Voronoi cells --
 * their edges run at whatever angle the seeds dictate, never along the
 * grid. Where two fragments meet there is a one-pixel fissure. Each
 * fragment has its own tone and is bevelled: lit along the edges that
 * face up and left, dark along the ones that face down and right.
 *
 * At the air the mass has no edge of its own. A pixel within `REACH` of
 * the ground, outside or inside it, is rock if it is close enough to its
 * nearest seed -- each seed has its own reach -- so the outline bulges and
 * falls short fragment by fragment. A dark rim runs round the whole
 * silhouette. Pebbles lie on the walking surface now and then, and there is
 * dust in the inner corners.
 *
 * Rendered pixel by pixel into canvas textures of `PIECE` square, only where
 * there is ground; the scene places them and the scenery bake flattens
 * them. Cells that are solid but not ground (void, rock, a building) count
 * as more ground for the outline: the rock runs into them without an edge.
 */
export function bakeRockMass(
  scene: Phaser.Scene,
  keyPrefix: string,
  columns: number,
  rows: number,
  isGround: (column: number, row: number) => boolean,
  isSolid: (column: number, row: number) => boolean,
  isTop: (column: number, row: number) => boolean,
  palette: TilePalette,
  seedValue: number,
): RockPiece[] {
  const random = createRandom(seedValue);
  const width = columns * TILE;
  const height = rows * TILE;

  // Seeds: flat typed arrays, bucketed by cell (each cell holds at most two).
  const seedX: number[] = [];
  const seedY: number[] = [];
  const seedReach: number[] = [];
  const seedTone: number[] = [];
  const bucket = new Int32Array(columns * rows * 2).fill(-1);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      if (!isGround(c, r)) {
        continue;
      }
      // Mostly one seed per cell, sometimes none (a bigger fragment), sometimes
      // two (a couple of small ones).
      const roll = random();
      const count = roll < 0.18 ? 0 : roll < 0.8 ? 1 : 2;
      for (let i = 0; i < count; i += 1) {
        bucket[(r * columns + c) * 2 + i] = seedX.length;
        seedX.push(c * TILE + random() * TILE);
        seedY.push(r * TILE + random() * TILE);
        seedReach.push(9 + random() * 8);
        seedTone.push(Math.floor(random() * 5));
      }
    }
  }

  // The two nearest seeds to a point, as indices (-1 for none), with their
  // distances. Squared distances while comparing; roots only for the two
  // that matter.
  let n1 = -1;
  let n2 = -1;
  let nd1 = 0;
  let nd2 = 0;
  const nearest = (x: number, y: number): void => {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    let q1 = Number.POSITIVE_INFINITY;
    let q2 = Number.POSITIVE_INFINITY;
    n1 = -1;
    n2 = -1;
    for (let rr = Math.max(0, r - 2); rr <= Math.min(rows - 1, r + 2); rr += 1) {
      for (let cc = Math.max(0, c - 2); cc <= Math.min(columns - 1, c + 2); cc += 1) {
        const b = (rr * columns + cc) * 2;
        for (let k = 0; k < 2; k += 1) {
          const s = bucket[b + k];
          if (s < 0) break;
          const dx = seedX[s] - x;
          const dy = seedY[s] - y;
          const q = dx * dx + dy * dy;
          if (q < q1) {
            q2 = q1;
            n2 = n1;
            q1 = q;
            n1 = s;
          } else if (q < q2) {
            q2 = q;
            n2 = s;
          }
        }
      }
    }
    nd1 = Math.sqrt(q1);
    nd2 = Math.sqrt(q2);
  };

  const rgb = (colour: number): [number, number, number] => {
    const c = Phaser.Display.Color.IntegerToRGB(colour);
    return [c.r, c.g, c.b];
  };
  const base = [
    rgb(shade(palette.rock, 8)),
    rgb(shade(palette.rock, 16)),
    rgb(palette.rock),
    rgb(shade(palette.rock, 12)),
    rgb(lighten(palette.rock, 4)),
  ];
  const litTones = base.map(([r, g, b]) => rgb(lighten(Phaser.Display.Color.GetColor(r, g, b), 10)));
  const darkTones = base.map(([r, g, b]) => rgb(shade(Phaser.Display.Color.GetColor(r, g, b), 18)));
  const fissure = rgb(shade(palette.rockDark, 30));
  const rim = rgb(shade(palette.rockDark, 36));
  // Greys for what lies about: pebbles, dust, and the threads of a web.
  const greys: Array<[number, number, number]> = [
    rgb(palette.rockLight),
    rgb(lighten(palette.rock, 14)),
    rgb(palette.rock),
    rgb(palette.grass),
    rgb(palette.grassDark),
    rgb(lighten(palette.rockLight, 8)),
  ];
  const grey = (): [number, number, number] => greys[Math.floor(random() * greys.length)];
  const web = rgb(lighten(palette.rockLight, 12));

  // Is this pixel rock? Inside ground away from any open cell: yes. Within
  // reach of the boundary between ground and open air: if close enough to
  // its nearest seed. Anywhere else: no.
  const openAt = (c: number, r: number): boolean => c < 0 || r < 0 || c >= columns || r >= rows ? false : !isSolid(c, r);
  // Is this ground pixel within BITE of an open cell? Only there may rock
  // fall short of its cell.
  const nearOpen = (x: number, y: number): boolean => {
    for (let dy = -BITE; dy <= BITE; dy += BITE) {
      for (let dx = -BITE; dx <= BITE; dx += BITE) {
        if (openAt(Math.floor((x + dx) / TILE), Math.floor((y + dy) / TILE))) {
          return true;
        }
      }
    }
    return false;
  };
  // A pixel in a cell that is solid but not ground -- a boulder, void, a
  // building -- is not drawn, but for the outline it is more rock: no rim
  // between the ground and what sits in it.
  const solidPixel = (x: number, y: number): boolean => {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    return c >= 0 && r >= 0 && c < columns && r < rows && isSolid(c, r);
  };
  // Is this air pixel within REACH of a ground cell, straight across or up
  // or down? Diagonally past a corner counts too, near enough.
  const nearGround = (x: number, y: number): boolean => {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    return (
      isGround(Math.floor((x - REACH_X) / TILE), r) ||
      isGround(Math.floor((x + REACH_X) / TILE), r) ||
      isGround(c, Math.floor((y - REACH_Y) / TILE)) ||
      isGround(c, Math.floor((y + REACH_Y) / TILE))
    );
  };

  const rockAt = (x: number, y: number): boolean => {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    const ground = isGround(c, r);
    const solid = c >= 0 && r >= 0 && c < columns && r < rows && isSolid(c, r);
    if (!ground && solid) {
      return false;
    }
    if (!nearOpen(x, y)) {
      return ground;
    }
    if (!ground && !nearGround(x, y)) {
      return false;
    }
    nearest(x, y);
    return n1 >= 0 && nd1 <= seedReach[n1];
  };

  const pieces: RockPiece[] = [];

  // Which cells need any work at all: ground, or touching ground (that is
  // where the rock reaches into the air). A cell of ground with no open
  // cell round it is all rock, and needs only colouring.
  const groundNear = (c: number, r: number): boolean => {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (isGround(c + dc, r + dr)) {
          return true;
        }
      }
    }
    return false;
  };
  const openNear = (c: number, r: number): boolean => {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (openAt(c + dc, r + dr)) {
          return true;
        }
      }
    }
    return false;
  };

  for (let py = 0; py < height; py += PIECE) {
    for (let px = 0; px < width; px += PIECE) {
      const w = Math.min(PIECE, width - px);
      const h = Math.min(PIECE, height - py);
      const c0 = Math.floor(px / TILE);
      const r0 = Math.floor(py / TILE);
      const c1 = Math.ceil((px + w) / TILE);
      const r1 = Math.ceil((py + h) / TILE);

      const cells: Array<[number, number, boolean]> = [];
      for (let r = r0; r < r1; r += 1) {
        for (let c = c0; c < c1; c += 1) {
          if (groundNear(c, r)) {
            cells.push([c, r, isGround(c, r) && !openNear(c, r)]);
          }
        }
      }
      if (cells.length === 0) {
        continue;
      }

      const key = `${keyPrefix}:${px},${py}`;
      // Textures outlive the scene. A level restarted, or reached again,
      // bakes its rock afresh over the old piece.
      if (scene.textures.exists(key)) {
        scene.textures.remove(key);
      }
      const canvas = scene.textures.createCanvas(key, w, h) as Phaser.Textures.CanvasTexture;
      const ctx = canvas.context;
      const image = ctx.createImageData(w, h);
      const data = image.data;
      const mask = new Uint8Array(w * h);
      const near1 = new Int32Array(w * h).fill(-1);
      const near2 = new Int32Array(w * h).fill(-1);
      const dist1 = new Float32Array(w * h);
      const dist2 = new Float32Array(w * h);

      // Pass one: which pixels are rock, and each rock pixel's nearest seeds,
      // found once.
      for (const [c, r, interior] of cells) {
        for (let y = r * TILE - py; y < r * TILE + TILE - py; y += 1) {
          for (let x = c * TILE - px; x < c * TILE + TILE - px; x += 1) {
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            const i = y * w + x;
            let rock: boolean;
            if (interior) {
              rock = true;
            } else {
              const ground = isGround(c, r);
              const solid = isSolid(c, r);
              if (!ground && solid) {
                rock = false;
              } else if (!ground && !nearGround(px + x, py + y)) {
                // Air further than REACH from any ground: never rock. This is
                // the cap on how far the rock may bulge out of its cell.
                rock = false;
              } else if (!nearOpen(px + x, py + y)) {
                rock = ground;
              } else {
                nearest(px + x, py + y);
                rock = n1 >= 0 && nd1 <= seedReach[n1];
              }
            }
            if (rock) {
              nearest(px + x, py + y);
            }
            mask[i] = rock ? 1 : 0;
            near1[i] = rock ? n1 : -1;
            near2[i] = rock ? n2 : -1;
            dist1[i] = nd1;
            dist2[i] = nd2;
          }
        }
      }

      const put = (i: number, c: [number, number, number]): void => {
        data[i * 4] = c[0];
        data[i * 4 + 1] = c[1];
        data[i * 4 + 2] = c[2];
        data[i * 4 + 3] = 255;
      };

      // Pass two: colour.
      for (const [c, r] of cells) {
        for (let y = r * TILE - py; y < r * TILE + TILE - py; y += 1) {
          for (let x = c * TILE - px; x < c * TILE + TILE - px; x += 1) {
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            const i = y * w + x;
            if (!mask[i]) {
              continue;
            }
            // Air beside this pixel? A solid cell that is not ground does
            // not count: the rock runs into it without a rim.
            const airAt = (nx: number, ny: number): boolean => {
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
                return !rockAt(px + nx, py + ny) && !solidPixel(px + nx, py + ny);
              }
              return !mask[ny * w + nx] && !solidPixel(px + nx, py + ny);
            };
            const edge = airAt(x - 1, y) || airAt(x + 1, y) || airAt(x, y - 1) || airAt(x, y + 1);
            if (edge) {
              put(i, rim);
              continue;
            }
            const s1 = near1[i];
            const s2 = near2[i];
            if (s1 < 0) {
              put(i, base[0]);
              continue;
            }
            const gap = dist2[i] - dist1[i];
            if (s2 >= 0 && gap < 1.1) {
              put(i, fissure);
              continue;
            }
            if (s2 >= 0 && gap < 3.2) {
              // Bevel: this edge faces up/left if the neighbour lies down/right.
              const toward = -(seedX[s2] - seedX[s1]) - (seedY[s2] - seedY[s1]);
              put(i, toward > 0 ? darkTones[seedTone[s1]] : litTones[seedTone[s1]]);
              continue;
            }
            put(i, base[seedTone[s1]]);
          }
        }
      }

      // What lies on the rock, drawn straight into the picture.
      const putIf = (x: number, y: number, c: [number, number, number], onRock: boolean): void => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const i = y * w + x;
        if (!!mask[i] === onRock) put(i, c);
      };
      // The first rock pixel down a column, from the top of a cell's reach.
      const surfaceAt = (x: number, r: number): number => {
        for (let y = r * TILE - REACH - py; y < r * TILE + TILE - py; y += 1) {
          if (y >= 0 && y < h && x >= 0 && x < w && mask[y * w + x]) return y;
        }
        return -1;
      };
      const line = (x0: number, y0: number, x1: number, y1: number, c: [number, number, number], every = 1): void => {
        const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let t = 0; t <= steps; t += 1) {
          if (t % every !== 0) continue;
          putIf(Math.round(x0 + ((x1 - x0) * t) / steps), Math.round(y0 + ((y1 - y0) * t) / steps), c, false);
        }
      };

      // Pebbles on the walking surface: one to three per top cell, most
      // cells, in whatever grey, from a speck to a lump.
      for (let r = r0; r < r1; r += 1) {
        for (let c = c0; c < c1; c += 1) {
          if (!isTop(c, r) || random() > 0.7) {
            continue;
          }
          const count = 1 + Math.floor(random() * 3);
          for (let k = 0; k < count; k += 1) {
            const x = c * TILE + Math.floor(random() * (TILE - 3)) - px;
            const top = surfaceAt(x, r);
            if (top < 0) continue;
            const size = random();
            const pw = size < 0.5 ? 1 : size < 0.85 ? 2 : 3;
            const ph = pw === 3 ? 2 : 1;
            const tone = grey();
            for (let dy = 0; dy < ph; dy += 1) {
              for (let dx = 0; dx < pw; dx += 1) {
                putIf(x + dx, top - ph + dy, dy === ph - 1 && ph > 1 ? fissure : tone, false);
              }
            }
          }
        }
      }

      // Inner corners: dust where a floor meets a wall, a web where a ceiling
      // does. An open cell with ground on one side and ground below is a
      // floor corner; with ground above, a ceiling corner.
      for (let r = r0; r < r1; r += 1) {
        for (let c = c0; c < c1; c += 1) {
          if (isGround(c, r)) {
            continue;
          }
          for (const side of [-1, 1] as const) {
            if (!isGround(c + side, r)) continue;
            const cornerX = (side < 0 ? c * TILE : (c + 1) * TILE) - px;

            if (isGround(c, r + 1) && isGround(c + side, r + 1) && random() < 0.8) {
              // Dust: a speckled wedge on the floor against the wall, and a
              // few specks further out along the floor.
              const floorY = (r + 1) * TILE - py;
              const tall = 3 + Math.floor(random() * 4);
              for (let row = 0; row < tall; row += 1) {
                const y = floorY - 1 - row;
                const wide = Math.round(((tall - row) / tall) * (5 + random() * 5));
                for (let k = 0; k < wide; k += 1) {
                  if (random() < 0.25) continue;
                  putIf(side < 0 ? cornerX + k : cornerX - 1 - k, y, grey(), false);
                }
              }
              for (let k = 0; k < 6; k += 1) {
                const d = 6 + Math.floor(random() * 12);
                putIf(side < 0 ? cornerX + d : cornerX - 1 - d, floorY - 1 - Math.floor(random() * 2), grey(), false);
              }
            }

            if (isGround(c, r - 1) && isGround(c + side, r - 1) && random() < 0.45) {
              // A cobweb: threads from the corner, and strands sagging between
              // them, drawn every other pixel so they are gauzy.
              const roofY = r * TILE - py;
              const reach = 8 + Math.floor(random() * 7);
              const dir = side < 0 ? 1 : -1;
              const ends: Array<[number, number]> = [];
              for (const [fx, fy] of [[1, 0.15], [0.85, 0.5], [0.5, 0.85], [0.15, 1]]) {
                const ex = cornerX + dir * Math.round(reach * fx * (0.8 + random() * 0.4));
                const ey = roofY + Math.round(reach * fy * (0.8 + random() * 0.4));
                ends.push([ex, ey]);
                line(cornerX + (dir < 0 ? -1 : 0), roofY, ex, ey, web, 2);
              }
              for (let k = 0; k + 1 < ends.length; k += 1) {
                const [ax, ay] = ends[k];
                const [bx, by] = ends[k + 1];
                // A strand sags: its midpoint pulled toward the corner.
                const mx = Math.round((ax + bx) / 2 - dir * 1);
                const my = Math.round((ay + by) / 2 - 1);
                line(ax, ay, mx, my, web, 2);
                line(mx, my, bx, by, web, 2);
              }
            }
          }
        }
      }

      ctx.putImageData(image, 0, 0);
      canvas.refresh();
      pieces.push({ key, x: px, y: py });
    }
  }

  return pieces;
}

function shade(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).darken(amount).color;
}

function lighten(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).lighten(amount).color;
}
