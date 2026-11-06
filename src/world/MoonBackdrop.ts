import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MOON_HILLS_SIZE, PLANET_SIZES, STARFIELD_SIZE, createRandom, type PlanetName } from '../art';

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
}

const SKIES: Record<'moon' | 'mars' | 'saturn', Sky> = {
  moon: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'saturn', x: 0.82, y: 0.16, scale: 0.8, factor: 0.03 },
      { name: 'mars', x: 0.5, y: 0.1, scale: 0.5, factor: 0.05 },
      { name: 'earth', x: 0.2, y: 0.25, scale: 0.75, factor: 0.08 },
    ],
    hills: 0xffffff,
    flag: true,
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
  },
  // Out on the rings: Saturn itself, huge, filling the sky.
  saturn: {
    sky: 'space-sky',
    stars: true,
    planets: [
      { name: 'saturn', x: 0.55, y: 0.22, scale: 2.4, factor: 0.03 },
      { name: 'ice', x: 0.12, y: 0.12, scale: 0.4, factor: 0.05 },
    ],
    hills: 0xa8c8e8,
    flag: false,
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
  constructor(scene: Phaser.Scene, theme: 'moon' | 'mars' | 'saturn', levelWidth: number, groundLine: number) {
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

    for (const planet of look.planets) {
      scene.add
        .image(
          GAME_WIDTH * planet.x,
          GAME_HEIGHT * planet.y + (planet.name === 'earth' ? PLANET_SIZES.earth * 0.05 : 0),
          `planet-${planet.name}`,
        )
        .setScale(planet.scale)
        .setScrollFactor(planet.factor, 0)
        .setDepth(-95);
    }

    const random = createRandom(7707);
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
