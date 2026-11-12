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
  venus: 66,
  uranus: 76,
  neptune: 74,
  pluto: 40,
  iss: 60,
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
/** The sun's disc, px across: the scene burns the cat a little past its rim. */
export const SPACE_SUN_SIZE = 260;

/**
 * The sun: a white-hot middle going out to orange at the rim, with darker
 * spots and a bright edge; and a big soft glow to lay behind it, added.
 */
function generateSun(scene: Phaser.Scene): void {
  const d = SPACE_SUN_SIZE;
  const r = d / 2;
  const random = createRandom(4242);
  bakeTexture(scene, 'space-sun', d, d, (g) => {
    const bands = [0xff7a1a, 0xff9426, 0xffad33, 0xffc447, 0xffd866, 0xffe98f, 0xfff4c0];
    bands.forEach((colour, i) => {
      g.fillStyle(colour, 1);
      g.fillCircle(r, r, r * (1 - i / bands.length));
    });
    for (let i = 0; i < 22; i += 1) {
      const a = random() * Math.PI * 2;
      const at = r * (0.35 + random() * 0.5);
      g.fillStyle(random() < 0.5 ? 0xe06010 : 0xffffff, 0.35);
      g.fillCircle(r + Math.cos(a) * at, r + Math.sin(a) * at, 3 + random() * 6);
    }
    g.lineStyle(3, 0xfff0a0, 0.8);
    g.strokeCircle(r, r, r - 2);
  });
  const glow = d * 2;
  bakeTexture(scene, 'space-sun-glow', glow, glow, (g) => {
    for (let i = 0; i < 40; i += 1) {
      g.fillStyle(0xff8a20, 0.022);
      g.fillCircle(glow / 2, glow / 2, glow / 2 - i * (glow / 2 - r) / 40);
    }
  });
}

export function generateSpaceTextures(scene: Phaser.Scene): void {
  generateSun(scene);
  generateStarfields(scene);
  generatePlanets(scene);
  generateMoonScenery(scene);
  generateRobot(scene);
  generateHatch(scene);
  generateHelmet(scene);
  generatePart(scene);
  generateRocket(scene);
  generateWorldScenery(scene);
  generateBattleStation(scene);
  generateStarship(scene);
  generateObstacles(scene);
  bakeTexture(scene, 'mars-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Mars by day: a butterscotch haze, paler towards the ground.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x8a4a3a, 0xe0a878);
  });
  bakeTexture(scene, 'venus-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Under Venus's cloud: thick orange-yellow haze, darker above.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x8a5a1a, 0xf0c060);
  });
  bakeTexture(scene, 'jupiter-sky', GAME_WIDTH, GAME_HEIGHT, (g) => {
    // In Jupiter's clouds: bands of cream and brown, streaming past.
    fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, 0x6a4a32, 0xe8c8a0);
    const bands = [0.15, 0.32, 0.5, 0.66];
    for (const at of bands) {
      g.fillStyle(0xb8865a, 0.35);
      g.fillRect(0, Math.round(GAME_HEIGHT * at), GAME_WIDTH, 8);
      g.fillStyle(0xf4e4c8, 0.25);
      g.fillRect(0, Math.round(GAME_HEIGHT * at) + 8, GAME_WIDTH, 4);
    }
  });
}

/** A part for Bob's machine, px. */
export const PART_SIZE = 14;

/**
 * One of the ten parts Bob needs: a brass cog with a bolt through it, lit
 * from the top left, so it reads at a glance as a piece of machinery and
 * not as anything else that is picked up.
 */
function generatePart(scene: Phaser.Scene): void {
  const d = PART_SIZE;
  const c = d / 2;
  bakeTexture(scene, 'part', d, d, (g) => {
    // Teeth.
    g.fillStyle(0x9a6a1a, 1);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      g.fillRect(Math.round(c + Math.cos(a) * 5.5) - 1, Math.round(c + Math.sin(a) * 5.5) - 1, 3, 3);
    }
    g.fillStyle(0xd8a838, 1);
    g.fillCircle(c, c, 5);
    g.fillStyle(0xf4d878, 1);
    g.fillCircle(c - 1, c - 1, 3);
    // The bolt through the middle.
    g.fillStyle(0x6a737a, 1);
    g.fillCircle(c, c, 2);
    g.fillStyle(0xc8d0d6, 1);
    g.fillRect(c - 1, c - 1, 1, 1);
  });
}

/** Bob's rocket, px; it points right. */
export const ROCKET_SIZE = { width: 44, height: 22 };

/**
 * Bob's rocket, pointing right: a white body with a red nose and fins, a
 * round window with the cat in it -- helmet and all -- and the nozzle at
 * the back. The flame is the scene's: sparks, while it flies.
 */
function generateRocket(scene: Phaser.Scene): void {
  const { width, height } = ROCKET_SIZE;
  const cy = height / 2;
  bakeTexture(scene, 'rocket', width, height, (g) => {
    // Fins, top and bottom, at the back.
    g.fillStyle(0xc8283a, 1);
    g.fillTriangle(6, cy - 4, 16, cy - 4, 6, 1);
    g.fillTriangle(6, cy + 4, 16, cy + 4, 6, height - 1);
    // The nozzle.
    g.fillStyle(0x4a4e58, 1);
    g.fillRect(2, cy - 4, 5, 8);
    // The body.
    g.fillStyle(0xe8ecf2, 1);
    g.fillRoundedRect(6, cy - 6, 30, 12, 4);
    g.fillStyle(0xb8bec8, 1);
    g.fillRect(6, cy + 3, 30, 3);
    // The nose.
    g.fillStyle(0xc8283a, 1);
    g.fillTriangle(34, cy - 6, 34, cy + 6, width - 1, cy);
    // A stripe.
    g.fillStyle(0x3a5aa8, 1);
    g.fillRect(12, cy - 6, 2, 12);
    // The window, and the cat in it: ginger, an ear, an eye.
    g.fillStyle(0x6e7684, 1);
    g.fillCircle(25, cy - 1, 5);
    g.fillStyle(0x1a2434, 1);
    g.fillCircle(25, cy - 1, 4);
    g.fillStyle(0xe8873a, 1);
    g.fillCircle(25, cy, 3);
    g.fillTriangle(23, cy - 2, 25, cy - 2, 23, cy - 5);
    g.fillTriangle(26, cy - 2, 28, cy - 2, 28, cy - 5);
    g.fillStyle(0x3a8a3a, 1);
    g.fillRect(26, cy - 1, 1, 1);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(22, cy - 4, 2, 1);
  });
}

/** The space helmet's glass bubble, px across. */
export const HELMET_SIZE = 18;

/**
 * Where the middle of the cat's head is in each pose's picture, facing
 * right, px from its top-left corner: what the helmet is centred on.
 */
export const HEAD_IN_POSE = {
  standing: { x: 18, y: 6 },
  sneaking: { x: 21, y: 4 },
  climbing: { x: 11, y: 4 },
} as const;

/**
 * A space helmet: a bubble of glass round the cat's head, barely tinted so
 * the face shows through, a white rim, a glint, and the collar ring at the
 * bottom where it seals.
 */
function generateHelmet(scene: Phaser.Scene): void {
  const d = HELMET_SIZE;
  const r = d / 2 - 1;
  bakeTexture(scene, 'space-helmet', d, d, (g) => {
    g.fillStyle(0xcfe8ff, 0.22);
    g.fillCircle(d / 2, d / 2, r);
    g.lineStyle(1, 0xeef4fa, 0.95);
    g.strokeCircle(d / 2, d / 2, r);
    // The glint, top left.
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(d / 2 - 5, d / 2 - 5, 2, 1);
    g.fillRect(d / 2 - 6, d / 2 - 4, 1, 2);
    // The collar.
    g.fillStyle(0xb0b8c4, 1);
    g.fillRect(d / 2 - 5, d - 3, 10, 2);
    g.fillStyle(0xeef4fa, 1);
    g.fillRect(d / 2 - 5, d - 3, 10, 1);
  });
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

  // Venus: thick yellow cloud, banded softly.
  {
    const d = PLANET_SIZES.venus;
    const r = d / 2 - 1;
    bakeTexture(scene, 'planet-venus', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0xe8c878, 0xb08a48, 0xfaeab0);
      for (const [at, colour] of [[-0.4, 0xf4dc98], [0.0, 0xd8b062], [0.4, 0xf0d48c]] as const) {
        const y = d / 2 + at * r;
        const half = Math.sqrt(Math.max(0, r * r - (y - d / 2) ** 2)) - 4;
        g.fillStyle(colour, 0.6);
        g.fillEllipse(d / 2, y, half * 2, 7);
      }
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // Uranus: pale cyan, featureless, with a thin ring standing on end.
  {
    const d = PLANET_SIZES.uranus;
    const r = d / 2 - 12;
    bakeTexture(scene, 'planet-uranus', d, d, (g) => {
      g.lineStyle(1, 0xc8f0f4, 0.6);
      g.strokeEllipse(d / 2, d / 2, 14, d - 4);
      sphere(g, d / 2, d / 2, r, 0x9ae0e8, 0x5aa8b8, 0xd8f8fa);
      nightSide(g, d / 2, d / 2, r);
      // The near half of the ring, over the planet.
      g.lineStyle(1, 0xc8f0f4, 0.8);
      g.strokeEllipse(d / 2, d / 2, 14, d - 4);
    });
  }

  // Neptune: deep blue, a dark storm and a white streak of cloud.
  {
    const d = PLANET_SIZES.neptune;
    const r = d / 2 - 1;
    bakeTexture(scene, 'planet-neptune', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0x3a62d8, 0x1e3a8a, 0x7a9af0);
      g.fillStyle(0x16286a, 1);
      g.fillEllipse(d / 2 - 8, d / 2 + 6, 14, 8);
      g.fillStyle(0xe8f0ff, 0.8);
      g.fillEllipse(d / 2 + 6, d / 2 - 10, 16, 3);
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // Pluto: small, beige and pale, with the big pale heart on its face.
  {
    const d = PLANET_SIZES.pluto;
    const r = d / 2 - 1;
    bakeTexture(scene, 'planet-pluto', d, d, (g) => {
      sphere(g, d / 2, d / 2, r, 0xc8a888, 0x8a6a52, 0xe8d0b8);
      g.fillStyle(0xf4ece0, 1);
      g.fillCircle(d / 2 - 3, d / 2 + 1, 5);
      g.fillCircle(d / 2 + 4, d / 2 + 1, 5);
      g.fillTriangle(d / 2 - 8, d / 2 + 3, d / 2 + 9, d / 2 + 3, d / 2 + 1, d / 2 + 12);
      nightSide(g, d / 2, d / 2, r);
    });
  }

  // The ISS: a long truss with four pairs of solar panels and the modules
  // in the middle.
  {
    const d = PLANET_SIZES.iss;
    const c = d / 2;
    bakeTexture(scene, 'planet-iss', d, d, (g) => {
      g.fillStyle(0xb8bec8, 1);
      g.fillRect(4, c - 1, d - 8, 2);
      for (const x of [6, 16, d - 22, d - 12]) {
        g.fillStyle(0x2a3a7a, 1);
        g.fillRect(x, c - 14, 6, 12);
        g.fillRect(x, c + 2, 6, 12);
        g.fillStyle(0x5a7ad8, 1);
        g.fillRect(x + 1, c - 13, 1, 10);
        g.fillRect(x + 1, c + 3, 1, 10);
      }
      g.fillStyle(0xe8ecf2, 1);
      g.fillRoundedRect(c - 9, c - 4, 18, 8, 3);
      g.fillRect(c - 2, c - 10, 4, 20);
      g.fillStyle(0xa8aeba, 1);
      g.fillRect(c - 9, c + 2, 18, 2);
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

/** The far landmarks of the robots' worlds, px; all drawn pale, to be tinted per world. */
export const LANDMARK_SIZES = {
  spires: { width: 90, height: 120 },
  mesa: { width: 170, height: 70 },
  shield: { width: 320, height: 80 },
  cloud: { width: 130, height: 110 },
  rock: { width: 14, height: 8 },
} as const;

/**
 * The landmarks on the horizons of the robots' worlds, each drawn in pale
 * greys so one picture serves several worlds by tint: **spires** of ice,
 * tall shards leaning together (Saturn's rings, Uranus, Neptune, Pluto); a
 * **mesa**, flat-topped, banded (Mars); a **shield** volcano, wide and low
 * with a caldera (Olympus Mons, on Mars); a **cloud** tower, piled up out
 * of round puffs (Jupiter); and a little **rock** to scatter on the ground.
 * Lit from the left, shaded right, like everything else.
 */
function generateWorldScenery(scene: Phaser.Scene): void {
  const light = 0xffffff;
  const mid = 0xc8c8c8;
  const dark = 0x8a8a8a;
  for (const variant of ['a', 'b'] as const) {
    const random = createRandom(variant === 'a' ? 811 : 823);
    const { width, height } = LANDMARK_SIZES.spires;
    bakeTexture(scene, `spires-${variant}`, width, height, (g) => {
      // Five to seven shards, the tallest in the middle.
      const count = 5 + Math.floor(random() * 3);
      for (let i = 0; i < count; i += 1) {
        const cx = 10 + random() * (width - 20);
        const tall = height * (0.35 + random() * 0.6) * (1 - Math.abs(cx - width / 2) / width);
        const half = 6 + random() * 8;
        const lean = (random() - 0.5) * 10;
        g.fillStyle(mid, 1);
        g.fillTriangle(cx - half, height, cx + half, height, cx + lean, height - tall);
        g.fillStyle(light, 1);
        g.fillTriangle(cx - half, height, cx, height, cx + lean, height - tall);
        g.fillStyle(dark, 1);
        g.fillTriangle(cx + half * 0.4, height, cx + half, height, cx + lean, height - tall);
      }
    });
  }
  {
    const { width, height } = LANDMARK_SIZES.mesa;
    bakeTexture(scene, 'mesa', width, height, (g) => {
      g.fillStyle(mid, 1);
      g.fillPoints([
        new Phaser.Math.Vector2(0, height),
        new Phaser.Math.Vector2(28, 14),
        new Phaser.Math.Vector2(width - 34, 10),
        new Phaser.Math.Vector2(width, height),
      ], true);
      g.fillStyle(light, 1);
      g.fillRect(30, 10, width - 66, 4);
      g.fillStyle(dark, 1);
      for (const y of [26, 40, 54]) {
        g.fillRect(18 + (y - 26) / 3, y, width - 40 - (y - 26) / 2, 2);
      }
      g.fillPoints([
        new Phaser.Math.Vector2(width - 34, 10),
        new Phaser.Math.Vector2(width, height),
        new Phaser.Math.Vector2(width - 20, height),
      ], true);
    });
  }
  {
    const { width, height } = LANDMARK_SIZES.shield;
    bakeTexture(scene, 'shield', width, height, (g) => {
      g.fillStyle(mid, 1);
      g.fillEllipse(width / 2, height, width, height * 2 - 10);
      g.fillStyle(light, 1);
      g.fillEllipse(width / 2 - 30, height - 6, width * 0.6, height * 1.3);
      g.fillStyle(mid, 1);
      g.fillEllipse(width / 2 + 10, height + 4, width * 0.9, height * 1.4);
      // The caldera at the top.
      g.fillStyle(dark, 1);
      g.fillEllipse(width / 2, 10, 50, 8);
      g.fillStyle(mid, 1);
      g.fillEllipse(width / 2 + 4, 9, 34, 4);
    });
  }
  {
    const { width, height } = LANDMARK_SIZES.cloud;
    const random = createRandom(857);
    bakeTexture(scene, 'cloud-tower', width, height, (g) => {
      for (let i = 0; i < 14; i += 1) {
        const up = random();
        const x = width / 2 + (random() - 0.5) * width * (0.8 - up * 0.4);
        const y = height - 14 - up * (height - 40);
        const r = 14 + random() * 14;
        g.fillStyle(mid, 1);
        g.fillCircle(x + 3, y + 3, r);
        g.fillStyle(light, 1);
        g.fillCircle(x, y, r);
      }
    });
  }
  {
    const { width, height } = LANDMARK_SIZES.rock;
    bakeTexture(scene, 'ground-rock', width, height, (g) => {
      g.fillStyle(dark, 1);
      g.fillEllipse(width / 2 + 1, height / 2 + 1, width - 2, height - 1);
      g.fillStyle(mid, 1);
      g.fillEllipse(width / 2, height / 2, width - 3, height - 2);
      g.fillStyle(light, 1);
      g.fillRect(4, 2, 3, 1);
    });
  }
}

/** The battle station in space -- the Death Star -- px across. */
export const STATION_SIZE = 150;

/**
 * A moon-sized battle station: a grey sphere covered in panel lines, a dark
 * trench round its middle, and a great round dish in its upper half with a
 * point of light at its centre. Seen in space, never visited.
 */
function generateBattleStation(scene: Phaser.Scene): void {
  const d = STATION_SIZE;
  const c = d / 2;
  const r = c - 2;
  const random = createRandom(4004);
  bakeTexture(scene, 'battle-station', d, d, (g) => {
    sphere(g, c, c, r, 0x9aa0a8, 0x5e646c, 0xc8ccd2);
    // Panels: short lines in rows, following the curve a little.
    for (let y = c - r + 8; y < c + r - 6; y += 7) {
      const half = Math.sqrt(Math.max(0, r * r - (y - c) ** 2)) - 4;
      for (let x = c - half; x < c + half - 6; x += 6 + random() * 10) {
        g.fillStyle(random() < 0.5 ? 0x6e747c : 0xb4b8be, 0.8);
        g.fillRect(Math.round(x), Math.round(y), 3 + Math.floor(random() * 6), 1);
      }
    }
    // The trench round the middle.
    g.fillStyle(0x3a3e44, 1);
    g.fillRect(c - r + 2, c + 1, r * 2 - 4, 3);
    g.fillStyle(0xc8ccd2, 0.6);
    g.fillRect(c - r + 4, c + 4, r * 2 - 8, 1);
    // The dish, up and to the right.
    const dx = c + r * 0.35;
    const dy = c - r * 0.4;
    g.fillStyle(0x6e747c, 1);
    g.fillCircle(dx, dy, 19);
    g.fillStyle(0x8a9098, 1);
    g.fillCircle(dx + 2, dy + 2, 15);
    g.lineStyle(1, 0x5a6068, 1);
    g.strokeCircle(dx + 2, dy + 2, 9);
    g.fillStyle(0x9fff9f, 1);
    g.fillCircle(dx + 2, dy + 2, 2);
    nightSide(g, c, c, r);
  });
}

/** The starship -- the Enterprise -- px; it faces right. */
export const STARSHIP_SIZE = { width: 64, height: 32 };

/**
 * A starship facing right: a round saucer up front, a neck down to the
 * engineering hull behind it, and two long engine nacelles raised on
 * pylons at the back, glowing blue along their sides and red at the front.
 */
function generateStarship(scene: Phaser.Scene): void {
  const { width, height } = STARSHIP_SIZE;
  bakeTexture(scene, 'starship', width, height, (g) => {
    const hull = 0xd8dce4;
    const shade = 0x9aa0aa;
    // Nacelles, on pylons, at the back and top.
    g.fillStyle(shade, 1);
    g.fillRect(14, 9, 3, 6);
    g.fillRect(14, 4, 3, 2);
    for (const y of [2, 8]) {
      g.fillStyle(hull, 1);
      g.fillRoundedRect(2, y, 26, 4, 2);
      g.fillStyle(0x6ab0ff, 1);
      g.fillRect(5, y + 2, 20, 1);
      g.fillStyle(0xff4a3a, 1);
      g.fillRect(26, y, 2, 4);
    }
    // The engineering hull, and its deflector dish.
    g.fillStyle(hull, 1);
    g.fillEllipse(24, 20, 26, 8);
    g.fillStyle(shade, 1);
    g.fillRect(12, 21, 24, 2);
    g.fillStyle(0xffa040, 1);
    g.fillCircle(36, 20, 2);
    // The neck.
    g.fillStyle(hull, 1);
    g.fillTriangle(30, 18, 36, 18, 40, 12);
    // The saucer, seen a little from above.
    g.fillStyle(shade, 1);
    g.fillEllipse(48, 12, 30, 10);
    g.fillStyle(hull, 1);
    g.fillEllipse(48, 11, 30, 9);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(48, 10, 8, 3);
    g.fillStyle(0x6ab0ff, 0.8);
    for (const x of [38, 42, 54, 58]) {
      g.fillRect(x, 12, 1, 1);
    }
  });
}

/** A bounce pad, px: it stands on its cell's floor. */
export const PAD_SIZE = { width: 16, height: 9 };

/**
 * The robots' worlds' own obstacles: a **bounce pad** (a red plate on a
 * coiled spring, and the same squashed), a block of **crumbling ice** (pale,
 * cracked, tinted per world), and the puffs a **cloud platform** is drawn
 * from (baked per width by the scene with `bakeCloudPlatform`).
 */
function generateObstacles(scene: Phaser.Scene): void {
  const { width, height } = PAD_SIZE;
  for (const [key, squash] of [['bounce-pad', 0], ['bounce-pad-down', 3]] as const) {
    bakeTexture(scene, key, width, height, (g) => {
      g.fillStyle(0x4a4e58, 1);
      g.fillRect(1, height - 2, width - 2, 2);
      g.fillStyle(0xb8bec8, 1);
      for (let y = squash + 3; y < height - 2; y += 2) {
        g.fillRect(4, y, width - 8, 1);
      }
      g.fillStyle(0xe8483a, 1);
      g.fillRoundedRect(0, squash, width, 3, 1);
      g.fillStyle(0xff9a8a, 1);
      g.fillRect(2, squash, width - 4, 1);
    });
  }
  bakeTexture(scene, 'crumble-ice', TILE, TILE, (g) => {
    g.fillStyle(0xb8c8d8, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0xe8f4ff, 1);
    g.fillRect(0, 0, TILE, 2);
    g.fillRect(0, 0, 2, TILE);
    g.fillStyle(0x7890a8, 1);
    g.fillRect(TILE - 2, 0, 2, TILE);
    g.fillRect(0, TILE - 2, TILE, 2);
    // Cracks: this one is not to be trusted.
    g.fillStyle(0x5a7088, 1);
    g.fillRect(4, 3, 1, 4);
    g.fillRect(5, 6, 3, 1);
    g.fillRect(8, 7, 1, 4);
    g.fillRect(11, 2, 1, 3);
    g.fillRect(10, 10, 3, 1);
  });
}

/**
 * A cloud platform `cells` tiles wide: a flat top to stand on, the
 * `BRANCH_THICKNESS` the cat lands on, with puffs of cloud bulging under it.
 * Cream, lit from above.
 */
export function bakeCloudPlatform(scene: Phaser.Scene, key: string, cells: number): void {
  const width = cells * TILE + 8;
  const height = 22;
  const random = createRandom(cells * 97 + 13);
  bakeTexture(scene, key, width, height, (g) => {
    for (let i = 0; i < cells * 3; i += 1) {
      const x = 6 + random() * (width - 12);
      const r = 5 + random() * 4;
      g.fillStyle(0xc8b090, 1);
      g.fillCircle(x + 1, 9 + random() * 4, r);
    }
    for (let i = 0; i < cells * 3; i += 1) {
      const x = 6 + random() * (width - 12);
      const r = 5 + random() * 4;
      g.fillStyle(0xf4e8d4, 1);
      g.fillCircle(x, 7 + random() * 3, r);
    }
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(2, 0, width - 4, 4, 2);
  });
}
