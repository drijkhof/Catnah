import { addPlanetLight, faceTheSun } from './planetLight';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MOON_HILLS_SIZE, PLANET_SIZES, STARFIELD_SIZE, createRandom, type PlanetName } from '../art';
import { TILE } from '../config';
import type { ParsedLevel } from '../level/Level';

/** What the sky of one of the robots' worlds looks like. */
interface Sky {
  /** The sky picture, pinned to the screen. */
  sky: string;
  /** Stars over it, or not: Mars has a sky by day. */
  stars: boolean;
  /** Planets hanging in it: where on the screen, how big, how far. */
  planets: Array<{ name: PlanetName; x: number; y: number; scale: number; factor: number }>;
  /** A tint over the grey hills, for the colour of the ground there. */
  hills: number;
  /** An American flag on the near hills. Only on the moon. */
  flag: boolean;
  /**
   * The world's landmarks on the horizon, behind the hills: what they are
   * (a texture), their tint, and how far apart. A key ending in `-` is one
   * of two variants, `a` or `b`.
   */
  range?: { key: string; tint: number; spacing: number; scale: number };
  /** Little things lying on the ground -- rocks, or crystals of ice -- and their tint. */
  decor?: { key: string; tint: number };
}

export type SpaceTheme = 'moon' | 'mars' | 'saturn' | 'jupiter' | 'venus' | 'uranus' | 'neptune' | 'pluto';

const SKIES: Record<SpaceTheme, Sky> = {
  moon: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'saturn', x: 0.82, y: 0.16, scale: 0.3, factor: 0.03 },
      { name: 'mars', x: 0.5, y: 0.1, scale: 0.291, factor: 0.05 },
      { name: 'earth', x: 0.2, y: 0.25, scale: 0.75, factor: 0.08 },
    ],
    hills: 0xffffff,
    flag: true,
    decor: { key: 'ground-rock', tint: 0xb8b8bc },
  },
  // A butterscotch day; two little grey moons, Phobos and Deimos.
  mars: {
    sky: 'mars-sky',
    stars: false,
    planets: [
      { name: 'moon', x: 0.7, y: 0.14, scale: 0.22, factor: 0.04 },
      { name: 'moon', x: 0.3, y: 0.22, scale: 0.14, factor: 0.03 },
    ],
    hills: 0xd07a52,
    flag: false,
    range: { key: 'mesa', tint: 0xb8603a, spacing: 300, scale: 1 },
    decor: { key: 'ground-rock', tint: 0xa04a2a },
  },
  // Out on the rings, looking away from Saturn: Jupiter and Uranus.
  saturn: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'jupiter', x: 0.28, y: 0.2, scale: 0.54, factor: 0.03 },
      { name: 'uranus', x: 0.78, y: 0.14, scale: 0.228, factor: 0.05 },
    ],
    hills: 0xa8c8e8,
    flag: false,
    range: { key: 'spires-', tint: 0xb8d4f0, spacing: 150, scale: 1 },
    decor: { key: 'crystal', tint: 0xcfeaff },
  },
  // Inside the cloud bands, with Io and Europa going by.
  jupiter: {
    sky: 'jupiter-sky',
    stars: false,
    planets: [
      { name: 'moon', x: 0.75, y: 0.14, scale: 0.3, factor: 0.04 },
      { name: 'ice', x: 0.3, y: 0.1, scale: 0.35, factor: 0.03 },
    ],
    hills: 0xd8b088,
    flag: false,
    range: { key: 'cloud-tower', tint: 0xf0d8b0, spacing: 170, scale: 1.1 },
    decor: { key: 'ground-rock', tint: 0xd8b888 },
  },
  // A yellow haze, and the sun a blur in it.
  venus: {
    sky: 'venus-sky',
    stars: false,
    planets: [],
    hills: 0xc87a3a,
    flag: false,
    range: { key: 'mountain-far-', tint: 0xffb070, spacing: 260, scale: 0.7 },
    decor: { key: 'ground-rock', tint: 0x8a4418 },
  },
  uranus: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'saturn', x: 0.32, y: 0.2, scale: 0.375, factor: 0.03 },
      { name: 'neptune', x: 0.82, y: 0.13, scale: 0.277, factor: 0.05 },
    ],
    hills: 0xa8e0e8,
    flag: false,
    range: { key: 'spires-', tint: 0xa8eef4, spacing: 160, scale: 1 },
    decor: { key: 'crystal', tint: 0xd0fafc },
  },
  neptune: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'uranus', x: 0.3, y: 0.2, scale: 0.342, factor: 0.03 },
      { name: 'pluto', x: 0.82, y: 0.12, scale: 0.333, factor: 0.05 },
    ],
    hills: 0x7a98e0,
    flag: false,
    range: { key: 'spires-', tint: 0x6a8ae8, spacing: 140, scale: 1.1 },
    decor: { key: 'crystal', tint: 0xa8c0ff },
  },
  // So far out that the sun is only a bright star.
  pluto: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'neptune', x: 0.65, y: 0.18, scale: 0.324, factor: 0.03 },
      { name: 'moon', x: 0.25, y: 0.12, scale: 0.35, factor: 0.05 },
    ],
    hills: 0xd8c4a8,
    flag: false,
    range: { key: 'spires-', tint: 0xe8dcc8, spacing: 190, scale: 0.9 },
    decor: { key: 'ground-rock', tint: 0xc8b090 },
  },
};

/**
 * The sky of the robots' worlds -- the moon, Mars and Saturn's rings --
 * and the hills on their horizons. Stars in three layers where it is
 * night, planets hanging in the sky and sliding a little as the cat walks,
 * the far ones least, and two ranks of low hills tinted the colour of the
 * place, rooted on the ground line. On the moon, an American flag stands
 * on the near hills.
 */
export class MoonBackdrop {
  constructor(scene: Phaser.Scene, theme: SpaceTheme, level: ParsedLevel, levelWidth: number, groundLine: number) {
    const look = SKIES[theme];
    scene.add.image(0, 0, look.sky).setOrigin(0, 0).setScrollFactor(0).setDepth(-100);

    if (look.stars) {
      for (const [key, factor, depth] of [
        ['stars-far', 0.02, -99],
        ['stars-mid', 0.05, -98],
        ['stars-near', 0.1, -97],
      ] as const) {
        scene.add
          .tileSprite(0, 0, Math.max(STARFIELD_SIZE, levelWidth * factor + GAME_WIDTH), GAME_HEIGHT, key)
          .setOrigin(0, 0)
          .setScrollFactor(factor, 0)
          .setDepth(depth);
      }
    } else {
      // A small, pale sun in a day sky.
      scene.add
        .image(GAME_WIDTH * 0.85, GAME_HEIGHT * 0.12, 'sun')
        .setScale(0.45)
        .setScrollFactor(0.03, 0)
        .setDepth(-96)
        .setTint(0xfff0d8)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    // Lit from where the sun is in this sky, or from the left where none is
    // drawn -- never baked into the picture, so it agrees with the sun.
    const sunX = look.stars ? -GAME_WIDTH : GAME_WIDTH * 0.85;
    const sunY = look.stars ? GAME_HEIGHT * 0.3 : GAME_HEIGHT * 0.12;
    for (const planet of look.planets) {
      const image = scene.add
        .image(
          GAME_WIDTH * planet.x,
          GAME_HEIGHT * planet.y + (planet.name === 'earth' ? PLANET_SIZES.earth * 0.05 : 0),
          `planet-${planet.name}`,
        )
        .setScale(planet.scale)
        .setScrollFactor(planet.factor, 0)
        .setDepth(-95);
      faceTheSun(addPlanetLight(scene, image, planet.name), image, sunX, sunY);
    }

    const random = createRandom(7707);

    // The landmarks: behind the hills, rooted on the ground line, sliding
    // slower than them. Mars's great volcano stands once, far off.
    if (look.range) {
      const { key, tint, spacing, scale } = look.range;
      const factor = 0.12;
      for (let x = -spacing; x < levelWidth * factor + GAME_WIDTH + spacing; x += spacing) {
        const name = key.endsWith('-') ? `${key}${random() < 0.5 ? 'a' : 'b'}` : key;
        scene.add
          .image(x + (random() - 0.5) * spacing * 0.5, groundLine + 18, name)
          .setOrigin(0.5, 1)
          .setScale(scale * (0.75 + random() * 0.4))
          .setFlipX(random() < 0.5)
          .setTint(tint)
          .setScrollFactor(factor, 1)
          .setDepth(-88);
      }
    }
    if (theme === 'mars') {
      scene.add
        .image(GAME_WIDTH * 0.7, groundLine + 16, 'shield')
        .setOrigin(0.5, 1)
        .setTint(0x9a4a2e)
        .setScrollFactor(0.06, 1)
        .setDepth(-89);
    }

    for (const [rank, factor, depth, sink] of [
      ['far', 0.2, -80, 14],
      ['near', 0.4, -70, 8],
    ] as const) {
      const { width } = MOON_HILLS_SIZE;
      for (let x = -width; x < levelWidth * factor + GAME_WIDTH + width; x += width) {
        scene.add
          .image(x + Math.floor(random() * 2), groundLine + sink, `moon-hills-${rank}`)
          .setOrigin(0, 1)
          .setScrollFactor(factor, 1)
          .setDepth(depth)
          .setTint(look.hills);
      }
    }

    // Things lying on the ground, here and there, on top of the floor.
    if (look.decor) {
      const scatter = createRandom(9907);
      const open = new Set(level.solids.map((solid) => `${solid.x / TILE},${solid.y / TILE}`));
      for (const solid of level.solids) {
        if (solid.isBranch || solid.y !== groundLine || open.has(`${solid.x / TILE},${solid.y / TILE - 1}`)) {
          continue;
        }
        if (scatter() > 0.18) {
          continue;
        }
        const crystal = look.decor.key === 'crystal';
        scene.add
          .image(solid.x + 2 + scatter() * (TILE - 4), solid.y + (crystal ? 3 : 2), look.decor.key)
          .setOrigin(0.5, 1)
          .setScale(crystal ? 0.55 + scatter() * 0.3 : 0.7 + scatter() * 0.5)
          .setFlipX(scatter() < 0.5)
          .setTint(look.decor.tint)
          .setDepth(-0.45);
      }
    }

    if (look.flag) {
      scene.add
        .image(GAME_WIDTH * 0.62, groundLine + 8 - 30, 'us-flag')
        .setOrigin(0, 1)
        .setScale(0.8)
        .setScrollFactor(0.4, 1)
        .setDepth(-69);
    }
  }
}
