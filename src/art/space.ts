import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';
import { GROUND_ENEMY_SIZES } from './creatures';
import { generateSun } from './sun';
import { paint } from './noise';
import { PLANET_PHOTOS, drawPhotoGlobe, makePhotoPlanets } from './photos';

/** A seamless tile of stars, px; repeated to fill space. */
export const STARFIELD_SIZE = 256;

/**
 * How big each planet was first drawn, px across (Saturn's rings reach
 * further): what the skies' `scale`s are against. The photographed ones are
 * far bigger pictures now; `MoonBackdrop` scales them back to this.
 */
export const PLANET_SIZES = {
  earth: 160,
  moon: 70,
  mars: 110,
  saturn: 240,
  jupiter: 200,
  venus: 130,
  uranus: 200,
  neptune: 160,
  pluto: 72,
  iss: 60,
  // The moons in other worlds' skies, as big as the Moon was drawn.
  phobos: 70,
  deimos: 70,
  io: 70,
  europa: 70,
  charon: 70,
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

/** The light over a planet: drawn this many px across, scaled to each disc. */
export const PLANET_LIGHT_SIZE = 128;

/**
 * Each planet's disc, the radius of the globe in its texture, px: what
 * `planet-light` is scaled to cover. Saturn's and Uranus's textures are
 * wider than their globes, for the rings.
 */
export const PLANET_DISCS: Record<PlanetName, number> = {
  earth: PLANET_PHOTOS.earth.disc,
  moon: PLANET_PHOTOS.moon.disc,
  mars: PLANET_PHOTOS.mars.disc,
  saturn: PLANET_PHOTOS.saturn.disc,
  jupiter: PLANET_PHOTOS.jupiter.disc,
  venus: PLANET_PHOTOS.venus.disc,
  // Uranus's photograph, small in a picture of its rings, which reach half
  // again as wide as the ball.
  uranus: PLANET_PHOTOS.uranus.disc,
  neptune: PLANET_PHOTOS.neptune.disc,
  pluto: PLANET_PHOTOS.pluto.disc,
  iss: PLANET_SIZES.iss / 2,
  phobos: PLANET_PHOTOS.phobos.disc,
  deimos: PLANET_PHOTOS.deimos.disc,
  io: PLANET_PHOTOS.io.disc,
  europa: PLANET_PHOTOS.europa.disc,
  charon: PLANET_PHOTOS.charon.disc,
};

/**
 * Sunlight on a ball, for a sun to the left: the night side dark, the line
 * between day and night soft, a highlight where the sun is straight on.
 * Worked out per pixel, as the light on a real sphere (a normal at each
 * point, against the sun's direction, a little in front so the edge of the
 * day side still catches it). Turned by the scene to face the sun.
 */
function generatePlanetLight(scene: Phaser.Scene): void {
  const size = PLANET_LIGHT_SIZE;
  const canvas = scene.textures.createCanvas('planet-light', size, size) as Phaser.Textures.CanvasTexture;
  const image = canvas.context.createImageData(size, size);
  const sun = new Phaser.Math.Vector3(-1, -0.15, 0.35).normalize();
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = ((px + 0.5) / size) * 2 - 1;
      const y = ((py + 0.5) / size) * 2 - 1;
      const rr = x * x + y * y;
      if (rr > 1) {
        continue;
      }
      const lit = x * sun.x + y * sun.y + Math.sqrt(1 - rr) * sun.z;
      const i = (py * size + px) * 4;
      // Night: up to nearly black, faded in across the terminator.
      const night = 1 - Phaser.Math.Clamp((lit + 0.1) / 0.45, 0, 1);
      // Day: a soft highlight where the sun is head on.
      const glint = Math.pow(Math.max(0, lit), 6) * 0.35;
      // Edge softening, so the overlay never shows its own rim.
      const edge = Phaser.Math.Clamp((1 - Math.sqrt(rr)) * size * 0.5, 0, 1);
      if (night > glint) {
        image.data.set([0, 0, 12, Math.round(night * 0.82 * 255 * edge)], i);
      } else {
        image.data.set([255, 250, 235, Math.round(glint * 255 * edge)], i);
      }
    }
  }
  canvas.context.putImageData(image, 0, 0);
  canvas.refresh();
}

/**
 * Uranus: its NASA photograph (Voyager 2) in a set of drawn rings, after a
 * photograph the player sent -- thin grey rings standing nearly on end and
 * leaning over, a broad dark band among them, reaching half again past the
 * ball. `planet-uranus` is the rings with the ball over them;
 * `planet-uranus-front` the near half of the rings where it crosses the ball,
 * laid over the ball's sunlight by the scene.
 */
function generateUranus(scene: Phaser.Scene): void {
  const r = PLANET_DISCS.uranus;
  const d = Math.round((2 * r) / 0.58);
  const reach = d / 2 - 2;
  const px = d / 200;
  const lean = -0.38;
  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  // Each ring: where it is, out of `reach`; how wide, px; how bright and opaque.
  const open = 0.26;
  const rings: Array<[number, number, number, number]> = [
    [0.74, 0.8 * px, 190, 0.45],
    [0.8, 4.5 * px, 60, 0.4],
    [0.86, 0.8 * px, 210, 0.55],
    [0.9, 0.7 * px, 190, 0.5],
    [0.95, 1.1 * px, 230, 0.8],
    [0.985, 0.7 * px, 200, 0.6],
  ];
  // The ring there, if any: grey level and alpha; and whether it is the near half.
  const ringAt = (x: number, y: number): { grey: number; alpha: number; near: boolean } | undefined => {
    const across = (x * cos + y * sin) / reach;
    const along = (-x * sin + y * cos) / reach;
    const rho = Math.hypot(across / open, along);
    // How fast rho changes per pixel here, so a ring is as thick on its
    // narrow ends as along its sides.
    const slope = Math.hypot(across / (open * open), along) / Math.max(rho, 0.01) / reach;
    for (const [at, width, grey, alpha] of rings) {
      const off = Math.abs(rho - at) / slope / width;
      if (off < 1) {
        return { grey, alpha: alpha * (1 - off * off), near: across < 0 };
      }
    }
    return undefined;
  };
  const back = paint(scene, 'planet-uranus', d, (x, y) => {
    const ring = ringAt(x, y);
    return ring ? [ring.grey, ring.grey, ring.grey + 8, 255 * ring.alpha] : undefined;
  });
  drawPhotoGlobe(scene, back.context, 'uranus', d / 2, d / 2, r);
  back.refresh();
  back.setFilter(Phaser.Textures.FilterMode.LINEAR);
  const front = paint(scene, 'planet-uranus-front', d, (x, y) => {
    const ring = ringAt(x, y);
    if (!ring || !ring.near || Math.hypot(x, y) > r) {
      return undefined;
    }
    return [ring.grey, ring.grey, ring.grey + 8, 255 * ring.alpha];
  });
  front.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

function generatePlanets(scene: Phaser.Scene): void {
  generatePlanetLight(scene);
  makePhotoPlanets(scene);
  generateUranus(scene);

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
  // The bits it falls apart into when the cat lands on it: the eye, a
  // plate of the body, a tread, the antenna with its light, an arm.
  bakeTexture(scene, 'robot-bit-eye', 5, 4, (g) => {
    g.fillStyle(0x1a2430, 1);
    g.fillRect(0, 0, 5, 4);
    g.fillStyle(0x5ef0ff, 1);
    g.fillRect(2, 1, 2, 2);
  });
  bakeTexture(scene, 'robot-bit-plate', 5, 5, (g) => {
    g.fillStyle(0x6e7480, 1);
    g.fillRect(0, 0, 5, 5);
    g.fillStyle(0xb8c0cc, 1);
    g.fillRect(0, 0, 4, 4);
  });
  bakeTexture(scene, 'robot-bit-tread', 6, 3, (g) => {
    g.fillStyle(0x2c2e36, 1);
    g.fillRect(0, 0, 6, 3);
    g.fillStyle(0x5a5e6a, 1);
    g.fillRect(1, 1, 1, 1);
    g.fillRect(4, 1, 1, 1);
  });
  bakeTexture(scene, 'robot-bit-antenna', 3, 5, (g) => {
    g.fillStyle(0x6e7480, 1);
    g.fillRect(1, 2, 1, 3);
    g.fillStyle(0xff4a3a, 1);
    g.fillRect(0, 0, 3, 2);
  });
  bakeTexture(scene, 'robot-bit-arm', 4, 3, (g) => {
    g.fillStyle(0x6e7480, 1);
    g.fillRect(0, 1, 3, 1);
    g.fillStyle(0x3c4048, 1);
    g.fillRect(3, 0, 1, 3);
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
