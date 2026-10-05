import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

export const STALACTITE_SIZE = { width: 26, height: 60 };
export const DEAD_TREE_SIZE = { width: 80, height: 200 };
export const STALAGMITE_SIZE = { width: 30, height: 46 };
/**
 * The volcano's three ranks of mountains, px. Far ones are wide and low and
 * hazy; near ones tall, dark, and the only ones with lava running down them.
 */
export const MOUNTAIN_SIZES = {
  far: { width: 420, height: 170 },
  mid: { width: 340, height: 190 },
  near: { width: 300, height: 200 },
} as const;

/** The smoke puff over a crater, and the ash that falls through the level. */
export const SMOKE_SIZE = { width: 64, height: 44 };

/** Skies and scenery for the places that are not the forest. */
export function generateBackdropTextures(scene: Phaser.Scene): void {
  generateCave(scene);
  generateSwamp(scene);
  generateVolcano(scene);
}

function generateVolcano(scene: Phaser.Scene): void {
  bakeTexture(scene, 'volcano-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Black overhead, deep red lower down, and a hot band where the sky meets
    // the mountains: lit from below by what is on the ground.
    const split = Math.round(GAME_HEIGHT * 0.55);
    fillVerticalGradient(g, GAME_WIDTH, split, 0x0b0608, 0x2c0d10, 24);
    g.translateCanvas(0, split);
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT - split, 0x2c0d10, 0x7a2614, 24);
    g.translateCanvas(0, -split);
  });

  // The glow along the horizon, laid over the far mountains' feet.
  bakeTexture(scene, 'horizon-glow', GAME_WIDTH, 90, (g) => {
    for (let i = 0; i < 9; i += 1) {
      g.fillStyle(0xe8622a, 0.03 + i * 0.012);
      g.fillRect(0, 10 * i, GAME_WIDTH, 90 - 10 * i);
    }
  });

  for (const [rank, seed, body, under, streams] of [
    ['far', 17, 0x4a1f22, 0.18, 0],
    ['mid', 53, 0x31161a, 0.26, 1],
    ['near', 91, 0x1c0f12, 0.34, 2],
  ] as const) {
    const size = MOUNTAIN_SIZES[rank];
    for (const variant of ['a', 'b'] as const) {
      bakeTexture(scene, `mountain-${rank}-${variant}`, size.width, size.height, (g) => {
        drawMountain(g, size.width, size.height, createRandom(seed + (variant === 'a' ? 0 : 1000)), body, under, streams);
      });
    }
  }

  bakeTexture(scene, 'smoke', SMOKE_SIZE.width, SMOKE_SIZE.height, (g) => {
    const { width, height } = SMOKE_SIZE;
    g.fillStyle(0x6a5a5c, 0.18);
    g.fillEllipse(width * 0.5, height * 0.55, width * 0.9, height * 0.8);
    g.fillStyle(0x8a7a7c, 0.16);
    g.fillEllipse(width * 0.35, height * 0.5, width * 0.5, height * 0.6);
    g.fillEllipse(width * 0.68, height * 0.42, width * 0.45, height * 0.55);
  });

  bakeTexture(scene, 'ash', 3, 3, (g) => {
    g.fillStyle(0x9a8f8c, 0.9);
    g.fillRect(0, 0, 2, 2);
    g.fillStyle(0x5a5052, 0.9);
    g.fillRect(1, 1, 2, 2);
  });

  bakeTexture(scene, 'ember', 6, 6, (g) => {
    g.fillStyle(0xffc44d, 1);
    g.fillCircle(3, 3, 2);
    g.fillStyle(0xe8622a, 0.6);
    g.fillCircle(3, 3, 3);
  });
}

/**
 * One mountain: a jagged ridge over a single peak, lit red from below, with a
 * cratered summit that glows and, on the near ranks, lava running down the
 * slopes.
 *
 * The ridge is a function of x, so everything else can ask "how wide is the
 * mountain at this height": the underlight is horizontal bands trimmed to
 * that width, and a stream is kept on the slope by the same question.
 */
function drawMountain(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  random: () => number,
  body: number,
  underlight: number,
  streams: number,
): void {
  const peakX = width * (0.38 + random() * 0.24);
  const peakY = 14 + random() * 10;
  const step = 8;

  // The ridge: a cone with a shoulder or two, roughened.
  const ridge: number[] = [];
  const columns = Math.floor(width / step) + 1;
  let shoulderL = 0.25 + random() * 0.3;
  let shoulderR = 0.25 + random() * 0.3;
  for (let i = 0; i < columns; i += 1) {
    const x = i * step;
    const side = x < peakX ? (peakX - x) / peakX : (x - peakX) / (width - peakX);
    const shoulder = x < peakX ? shoulderL : shoulderR;
    // Concave near the top, flattening into a foot; a bump where the shoulder is.
    let t = 1 - Math.pow(side, 1.35);
    t += Math.exp(-Math.pow((side - shoulder) / 0.12, 2)) * 0.08;
    const y = peakY + (height - peakY) * (1 - t) + (random() - 0.5) * 7;
    ridge.push(Math.min(height - 1, Math.max(peakY, y)));
  }
  ridge[Math.round(peakX / step)] = peakY;
  shoulderL = shoulderR = 0;

  const ridgeAt = (x: number): number => {
    const i = Math.max(0, Math.min(columns - 1, x / step));
    const a = Math.floor(i);
    const b = Math.min(columns - 1, a + 1);
    return ridge[a] + (ridge[b] - ridge[a]) * (i - a);
  };
  const extentAt = (y: number): [number, number] | null => {
    let left = -1;
    let right = -1;
    for (let i = 0; i < columns; i += 1) {
      if (ridge[i] <= y) {
        if (left < 0) left = i;
        right = i;
      }
    }
    return left < 0 ? null : [left * step, Math.min(width, right * step + step)];
  };

  const points = ridge.map((y, i) => new Phaser.Math.Vector2(Math.min(width, i * step), y));
  points.push(new Phaser.Math.Vector2(width, height), new Phaser.Math.Vector2(0, height));
  g.fillStyle(body, 1);
  g.fillPoints(points, true);

  // Lit from below: red climbing up the slopes from the foot, strongest at
  // the bottom and gone by halfway. Two-pixel bands, each trimmed to the
  // mountain's width at that height; coarser bands stair-stepped visibly
  // along the slopes.
  const bandHeight = 2;
  const litHeight = height * 0.55;
  for (let y = height - bandHeight; y > height - litHeight; y -= bandHeight) {
    const extent = extentAt(y);
    if (!extent) continue;
    const t = (height - y) / litHeight;
    g.fillStyle(0xe8622a, underlight * (1 - t) * 0.5);
    g.fillRect(extent[0], y, extent[1] - extent[0], bandHeight);
  }

  // The crater: a notch out of the summit, glowing, with a halo.
  const craterW = 10 + random() * 8;
  g.fillStyle(0x0b0608, 1);
  g.fillTriangle(peakX - craterW / 2, peakY - 1, peakX + craterW / 2, peakY - 1, peakX, peakY + 7);
  for (let i = 3; i >= 0; i -= 1) {
    g.fillStyle(0xe8622a, 0.07 + (3 - i) * 0.05);
    g.fillEllipse(peakX, peakY + 3, craterW + i * 14, 8 + i * 8);
  }
  g.fillStyle(0xffc44d, 0.95);
  g.fillEllipse(peakX, peakY + 3, craterW - 2, 4);

  // Lava running down the slopes: a thread of brighter lava inside a faint
  // glow, on a smooth line -- a steady slant with a slow wobble -- dimming
  // as it goes. Anything random per pixel read as a scratch on the picture,
  // not as something flowing down a mountain.
  for (let n = 0; n < streams; n += 1) {
    const side = n % 2 === 0 ? 1 : -1;
    const x0 = peakX + side * craterW * 0.2;
    const slant = side * (0.25 + random() * 0.35);
    const wobble = 2 + random() * 3;
    const period = 18 + random() * 14;
    const phase = random() * Math.PI * 2;
    const length = height * (0.35 + random() * 0.3);
    for (let dy = 4; dy < length; dy += 1) {
      const y = peakY + dy;
      if (y >= height - 2) break;
      let x = x0 + slant * dy + Math.sin(dy / period + phase) * wobble;
      const extent = extentAt(y);
      if (extent) x = Math.max(extent[0] + 2, Math.min(extent[1] - 2, x));
      // Lava only shows where there is mountain under it.
      if (ridgeAt(x) > y) continue;
      const fade = 1 - dy / length;
      g.fillStyle(0xe8622a, 0.08 * fade);
      g.fillRect(x - 2, y, 5, 1);
      g.fillStyle(0xe8622a, 0.3 + 0.4 * fade);
      g.fillRect(x - 0.5, y, 1.5, 1);
      if (dy % 5 === 0 && random() < 0.5) {
        g.fillStyle(0xffc44d, 0.7 * fade);
        g.fillRect(x, y, 1, 2);
      }
    }
    // A pool at the foot of it, where the stream rests.
    const footY = Math.min(height - 3, peakY + length);
    const footX = Math.max(2, Math.min(width - 2, x0 + slant * length));
    if (ridgeAt(footX) <= footY) {
      g.fillStyle(0xe8622a, 0.55);
      g.fillEllipse(footX, footY, 6 + random() * 5, 2.5);
    }
  }
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

/** The tile of the cave's back wall. Seamless; repeated behind the tunnels. */
export const CAVE_WALL_SIZE = 192;

/**
 * The inside of a cave: the rock wall behind the tunnels. Drawn seamless --
 * every lump also drawn a full size to either side and above and below --
 * and a little lighter than the void the tunnels are cut from, so a tunnel
 * reads as carved in front of a wall rather than as a hole in nothing.
 * Rounded lumps of stone in three close tones, cracks between them, and a
 * few pale flecks.
 */
export function generateCaveWall(scene: Phaser.Scene): void {
  const size = CAVE_WALL_SIZE;
  const random = createRandom(3137);
  // Blue-grey, not black-and-grey: a cave lit by its crystals.
  const base = 0x232a3c;
  const lumps = [0x283047, 0x1f2536, 0x2d3650];
  const crack = 0x161b29;
  const fleck = 0x3f4b6b;

  bakeTexture(scene, 'cave-wall', size, size, (g) => {
    g.fillStyle(base, 1);
    g.fillRect(0, 0, size, size);

    const wrap = (draw: (dx: number, dy: number) => void): void => {
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          draw(dx, dy);
        }
      }
    };

    for (let i = 0; i < 70; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const w = 10 + random() * 24;
      const h = 7 + random() * 14;
      const tone = lumps[Math.floor(random() * lumps.length)];
      wrap((dx, dy) => {
        g.fillStyle(crack, 1);
        g.fillEllipse(x + dx, y + dy, w + 3, h + 3);
        g.fillStyle(tone, 1);
        g.fillEllipse(x + dx, y + dy, w, h);
      });
    }

    for (let i = 0; i < 40; i += 1) {
      const x = Math.floor(random() * size);
      const y = Math.floor(random() * size);
      wrap((dx, dy) => {
        g.fillStyle(fleck, 1);
        g.fillRect(x + dx, y + dy, 1 + Math.floor(random() * 2), 1);
      });
    }
  });
}

