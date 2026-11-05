import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';
import { GROUND_ENEMY_SIZES } from './creatures';

/** A seamless tile of stars, px; repeated to fill space. */
export const STARFIELD_SIZE = 256;

/** How big each planet is baked, px across (Saturn's rings reach further). */
export const PLANET_SIZES = {
  earth: 160,
  moon: 70,
  mars: 64,
  saturn: 90,
  jupiter: 120,
  ice: 48,
  violet: 56,
} as const;

export type PlanetName = keyof typeof PLANET_SIZES;

/** Saturn's picture is wider than the planet, for its rings. */
export const SATURN_RING_SPREAD = 2.1;

/** One baked stretch of the moon's grey hills, px. */
export const MOON_HILLS_SIZE = { width: 320, height: 70 };

/**
 * Space: the stars, the planets, the moon's horizon, and the moon's robots
 * and the grey blocks they climb out of.
 */
export function generateSpaceTextures(scene: Phaser.Scene): void {
  generateStarfields(scene);
  generatePlanets(scene);
  generateMoonScenery(scene);
  generateRobot(scene);
  generateHatch(scene);
}

/**
 * Three layers of stars, each seamless: far and faint and many, nearer and
 * brighter and fewer, and a few big ones with a cross of light. Moved at
 * different speeds against each other they are the depth of space.
 */
function generateStarfields(scene: Phaser.Scene): void {
  const size = STARFIELD_SIZE;
  const layers = [
    { key: 'stars-far', count: 140, seed: 71, big: 0 },
    { key: 'stars-mid', count: 50, seed: 113, big: 0 },
    { key: 'stars-near', count: 14, seed: 157, big: 5 },
  ];
  for (const layer of layers) {
    const random = createRandom(layer.seed);
    bakeTexture(scene, layer.key, size, size, (g) => {
      for (let i = 0; i < layer.count; i += 1) {
        const x = Math.floor(random() * size);
        const y = Math.floor(random() * size);
        const tint = random();
        const colour = tint < 0.15 ? 0xffd9a0 : tint < 0.3 ? 0xa8c8ff : 0xffffff;
        g.fillStyle(colour, layer.key === 'stars-far' ? 0.35 + random() * 0.4 : 0.7 + random() * 0.3);
        g.fillRect(x, y, layer.key === 'stars-near' ? 2 : 1, layer.key === 'stars-near' ? 2 : 1);
      }
      for (let i = 0; i < layer.big; i += 1) {
        const x = 6 + Math.floor(random() * (size - 12));
        const y = 6 + Math.floor(random() * (size - 12));
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(x - 4, y, 9, 1);
        g.fillRect(x, y - 4, 1, 9);
        g.fillStyle(0xffffff, 1);
        g.fillRect(x - 1, y - 1, 3, 3);
      }
    });
  }

  // Deep space behind the stars: near black at the top, a little blue below.
  bakeTexture(scene, 'space-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x04050c, 0x101a36);
  });

  // A spark of the trail behind the flying cat: white, tinted at runtime.
  bakeTexture(scene, 'spark', 4, 4, (g) => {
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(0, 0, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 1, 2, 2);
  });

  // A cloud of glowing gas, soft-edged, tinted at runtime.
  bakeTexture(scene, 'nebula', 160, 160, (g) => {
    for (let i = 8; i > 0; i -= 1) {
      g.fillStyle(0xffffff, 0.035);
      g.fillCircle(80, 80, i * 10);
    }
    g.fillStyle(0xffffff, 0.03);
    g.fillCircle(55, 70, 40);
    g.fillCircle(105, 95, 35);
  });
}

/** A lit sphere: a base disc, shading on the right, a highlight on the left. */
function sphere(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, base: number, dark: number, light: number): void {
  g.fillStyle(dark, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(base, 1);
  g.fillCircle(cx - r * 0.12, cy - r * 0.08, r * 0.9);
  g.fillStyle(light, 0.6);
  g.fillCircle(cx - r * 0.4, cy - r * 0.38, r * 0.35);
}

/** Erases nothing, but paints the night side: a crescent of shadow to the right. */
function nightSide(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
  g.fillStyle(0x000010, 0.28);
  g.fillEllipse(cx + r * 0.55, cy + r * 0.1, r * 1.0, r * 1.9);
}

function generatePlanets(scene: Phaser.Scene): void {
  // The Earth: oceans, continents, cloud, and a thin blue glow.
  {
    const d = PLANET_SIZES.earth;
    const r = d / 2 - 4;
    const random = createRandom(9001);
    bakeTexture(scene, 'planet-earth', d, d, (g) => {
      g.fillStyle(0x6fb6ff, 0.18);
      g.fillCircle(d / 2, d / 2, r + 4);
      sphere(g, d / 2, d / 2, r, 0x2f74c8, 0x1c4a8a, 0x6fb0ee);
      // Continents: clusters of green and sand blobs, kept inside the disc.
      for (const [cx, cy, n] of [[-0.3, -0.2, 9], [0.25, 0.15, 11], [0.0, 0.5, 5], [-0.35, 0.35, 4]] as const) {
        for (let i = 0; i < n; i += 1) {
          const x = d / 2 + (cx + (random() - 0.5) * 0.35) * r;
          const y = d / 2 + (cy + (random() - 0.5) * 0.3) * r;
          if (Math.hypot(x - d / 2, y - d / 2) < r - 8) {
            g.fillStyle(random() < 0.75 ? 0x4f9a48 : 0xc9b47a, 1);
            g.fillEllipse(x, y, 10 + random() * 14, 7 + random() * 10);
          }
        }
      }
      // Ice caps.
      g.fillStyle(0xf2f6fa, 1);
      g.fillEllipse(d / 2, d / 2 - r + 6, r * 0.7, 9);
      g.fillEllipse(d / 2, d / 2 + r - 5, r * 0.55, 7);
      // Clouds.
      for (let i = 0; i < 9; i += 1) {
        const x = d / 2 + (random() - 0.5) * r * 1.4;
        const y = d / 2 + (random() - 0.5) * r * 1.4;
        if (Math.hypot(x - d / 2, y - d / 2) < r - 10) {
          g.fillStyle(0xffffff, 0.7);
          g.fillEllipse(x, y, 18 + random() * 16, 4 + random() * 3);
        }
      }
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // The Moon: grey, with craters.
  {
    const d = PLANET_SIZES.moon;
    const r = d / 2 - 1;
    const random = createRandom(9011);
    bakeTexture(scene, 'planet-moon', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0xc9c9c4, 0x8a8a86, 0xeeeee8);
      for (let i = 0; i < 10; i += 1) {
        const x = d / 2 + (random() - 0.5) * r * 1.3;
        const y = d / 2 + (random() - 0.5) * r * 1.3;
        const cr = 2 + random() * 6;
        if (Math.hypot(x - d / 2, y - d / 2) < r - cr - 1) {
          g.fillStyle(0x9a9a95, 1);
          g.fillCircle(x, y, cr);
          g.fillStyle(0xdeded8, 1);
          g.fillCircle(x - 1, y - 1, cr * 0.6);
          g.fillStyle(0xa8a8a2, 1);
          g.fillCircle(x, y, cr * 0.55);
        }
      }
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // Mars: rust red, a darker band, a white cap.
  {
    const d = PLANET_SIZES.mars;
    const r = d / 2 - 1;
    const random = createRandom(9021);
    bakeTexture(scene, 'planet-mars', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0xc8573a, 0x8a3420, 0xe8835a);
      for (let i = 0; i < 7; i += 1) {
        const x = d / 2 + (random() - 0.5) * r * 1.2;
        const y = d / 2 + (random() - 0.3) * r * 0.9;
        g.fillStyle(0x9a3e26, 0.8);
        g.fillEllipse(x, y, 8 + random() * 10, 4 + random() * 4);
      }
      g.fillStyle(0xf4eee8, 1);
      g.fillEllipse(d / 2 - 2, d / 2 - r + 4, r * 0.6, 6);
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // Saturn: a banded globe in a tilted ring, the far half of the ring
  // behind the planet and the near half in front.
  {
    const d = PLANET_SIZES.saturn;
    const w = Math.round(d * SATURN_RING_SPREAD);
    const h = d;
    const r = d / 2 - 12;
    const cx = w / 2;
    const cy = h / 2;
    const ring = (g: Phaser.GameObjects.Graphics, front: boolean): void => {
      for (const [rx, ry, colour, alpha] of [
        [w / 2 - 2, 16, 0xd8c08a, 0.9],
        [w / 2 - 10, 13, 0xb89a62, 0.9],
        [w / 2 - 18, 10, 0xe8d6a8, 0.8],
      ] as const) {
        g.lineStyle(3, colour, alpha);
        // The near half of the ring is the half below the centre: 0..180 degrees.
        const points: Phaser.Math.Vector2[] = [];
        for (let a = front ? 0 : 180; a <= (front ? 180 : 360); a += 6) {
          const t = Phaser.Math.DegToRad(a);
          points.push(new Phaser.Math.Vector2(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry));
        }
        g.strokePoints(points, false);
      }
    };
    bakeTexture(scene, 'planet-saturn', w, h, (g) => {
      ring(g, false);
      sphere(g, cx, cy, r, 0xe0c48a, 0xa88a52, 0xf4e2b4);
      g.fillStyle(0xc8a468, 0.8);
      g.fillRect(cx - r + 4, cy - 8, r * 2 - 8, 4);
      g.fillRect(cx - r + 2, cy + 6, r * 2 - 4, 3);
      g.fillStyle(0xf0dcae, 0.7);
      g.fillRect(cx - r + 6, cy - 2, r * 2 - 12, 3);
      nightSide(g, cx, cy, r);
      ring(g, true);
    });
  }

  // Jupiter, and two little ones of no name, for the flight.
  {
    const d = PLANET_SIZES.jupiter;
    const r = d / 2 - 1;
    bakeTexture(scene, 'planet-jupiter', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0xd8b48a, 0x9a7650, 0xf0d6b4);
      const bands = [[-0.55, 0xb88a5a], [-0.25, 0xf0e0c8], [0.05, 0xa8764a], [0.35, 0xe8d0b0], [0.6, 0xb88a5a]] as const;
      for (const [at, colour] of bands) {
        const y = d / 2 + at * r;
        const half = Math.sqrt(Math.max(0, r * r - (y - d / 2) ** 2)) - 3;
        g.fillStyle(colour, 0.85);
        g.fillRect(d / 2 - half, y - 4, half * 2, 8);
      }
      g.fillStyle(0xc0553a, 1);
      g.fillEllipse(d / 2 + r * 0.25, d / 2 + r * 0.2, 18, 10);
      nightSide(g, d / 2, d / 2, r);
    });
  }
  for (const [name, base, dark, light] of [
    ['ice', 0x9ad8e8, 0x5a98b0, 0xd8f4fa],
    ['violet', 0x9a6ac8, 0x5e3a8a, 0xc8a0ee],
  ] as const) {
    const d = PLANET_SIZES[name];
    const r = d / 2 - 1;
    bakeTexture(scene, `planet-${name}`, d, d, (g) => {
      sphere(g, d / 2, d / 2, r, base, dark, light);
      g.fillStyle(dark, 0.5);
      g.fillRect(d / 2 - r + 6, d / 2 + 2, r * 2 - 12, 3);
      nightSide(g, d / 2, d / 2, r);
    });
  }
}

/** The moon's horizon: low grey hills with craters in their faces. */
function generateMoonScenery(scene: Phaser.Scene): void {
  const { width, height } = MOON_HILLS_SIZE;
  for (const [key, tone, seed] of [
    ['moon-hills-far', 0x5a5a62, 501],
    ['moon-hills-near', 0x7a7a80, 503],
  ] as const) {
    const random = createRandom(seed);
    bakeTexture(scene, key, width, height, (g) => {
      g.fillStyle(tone, 1);
      // A run of overlapping humps whose ends meet at the same height, so
      // the strip repeats without a seam.
      g.fillRect(0, height - 20, width, 20);
      for (let x = -20; x < width + 20; x += 30 + random() * 40) {
        const w = 70 + random() * 90;
        const h = 20 + random() * (height - 26);
        g.fillEllipse(x, height - 16, w, h * 2);
      }
      for (let i = 0; i < 10; i += 1) {
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(random() * width, height - 6 - random() * 18, 8 + random() * 10, 3 + random() * 2);
      }
    });
  }
}

/**
 * A moon robot: a little rounded box on two treads, one big cyan eye, an
 * antenna with a red light, and two grabbing arms held out front -- it
 * wants to pick you up. It faces right; the scene flips it.
 */
function generateRobot(scene: Phaser.Scene): void {
  const { width, height } = GROUND_ENEMY_SIZES.robot;
  bakeTexture(scene, 'robot', width, height, (g) => {
    // Treads.
    g.fillStyle(0x2c2e36, 1);
    g.fillRoundedRect(1, height - 4, width - 4, 4, 2);
    g.fillStyle(0x5a5e6a, 1);
    for (let x = 2; x < width - 4; x += 3) {
      g.fillRect(x, height - 3, 1, 2);
    }
    // Body.
    g.fillStyle(0x6e7480, 1);
    g.fillRoundedRect(2, 4, 10, height - 8, 2);
    g.fillStyle(0xb8c0cc, 1);
    g.fillRoundedRect(2, 4, 9, height - 9, 2);
    g.fillStyle(0xdde3ea, 1);
    g.fillRect(3, 5, 3, 1);
    // The eye.
    g.fillStyle(0x1a2430, 1);
    g.fillRect(6, 6, 5, 4);
    g.fillStyle(0x5ef0ff, 1);
    g.fillRect(8, 7, 2, 2);
    // Antenna and its light.
    g.fillStyle(0x6e7480, 1);
    g.fillRect(5, 1, 1, 3);
    g.fillStyle(0xff4a3a, 1);
    g.fillRect(4, 0, 3, 2);
    // A grabbing arm out front: a stick and a claw.
    g.fillStyle(0x6e7480, 1);
    g.fillRect(11, 8, 3, 1);
    g.fillStyle(0x3c4048, 1);
    g.fillRect(13, 6, 1, 2);
    g.fillRect(13, 9, 1, 2);
    g.fillRect(14, 6, 2, 1);
    g.fillRect(14, 10, 2, 1);
  });
}

/**
 * The grey block a robot climbs out of: riveted steel, a hatch in its face
 * with a light over it, and two cracked versions for when the cat is
 * breaking it.
 */
function generateHatch(scene: Phaser.Scene): void {
  const draw = (g: Phaser.GameObjects.Graphics, cracks: number): void => {
    g.fillStyle(0x4a4e58, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x8a909c, 1);
    g.fillRect(1, 1, TILE - 2, TILE - 2);
    g.fillStyle(0xa8aeba, 1);
    g.fillRect(1, 1, TILE - 2, 1);
    g.fillRect(1, 1, 1, TILE - 2);
    // Rivets.
    g.fillStyle(0x5a5e68, 1);
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]] as const) {
      g.fillRect(x, y, 1, 1);
    }
    // The hatch, with its light.
    g.fillStyle(0x3a3e48, 1);
    g.fillRect(4, 6, 8, 8);
    g.fillStyle(0x5a606c, 1);
    g.fillRect(5, 7, 6, 6);
    g.fillStyle(0x3a3e48, 1);
    g.fillRect(5, 10, 6, 1);
    g.fillStyle(0xffb03a, 1);
    g.fillRect(7, 3, 2, 2);
    if (cracks >= 1) {
      g.fillStyle(0x1e2028, 1);
      g.fillRect(3, 1, 1, 3);
      g.fillRect(4, 3, 1, 3);
      g.fillRect(12, 9, 2, 1);
      g.fillRect(13, 10, 1, 3);
    }
    if (cracks >= 2) {
      g.fillStyle(0x1e2028, 1);
      g.fillRect(8, 1, 1, 2);
      g.fillRect(9, 2, 1, 3);
      g.fillRect(1, 9, 3, 1);
      g.fillRect(3, 10, 1, 4);
      g.fillRect(10, 13, 3, 1);
    }
  };
  bakeTexture(scene, 'robot-hatch', TILE, TILE, (g) => draw(g, 0));
  bakeTexture(scene, 'robot-hatch-1', TILE, TILE, (g) => draw(g, 1));
  bakeTexture(scene, 'robot-hatch-2', TILE, TILE, (g) => draw(g, 2));
  // A chip of it, flying off when it breaks.
  bakeTexture(scene, 'hatch-chip', 3, 3, (g) => {
    g.fillStyle(0x8a909c, 1);
    g.fillRect(0, 0, 3, 3);
  });
}
