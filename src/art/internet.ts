import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { bakeTexture, createRandom, fillVerticalGradient } from './canvas';

/**
 * Inside the internet: the cables the cat scratches through, the dark web's
 * hackers and their lying signs, Bob's machine that sends the cat there, and
 * the skies and floating pictures of the five sites.
 *
 * The sites are drawn as what they are about -- videos, photos, friends,
 * cats, and the dark -- in their colours, never with anybody's real logo.
 */

/** The internet sites, one level each, in the order they are played. */
export type NetSite = 'youtube' | 'insta' | 'facebook' | 'google' | 'darkweb';

/** A hacker, px, planted by its feet. */
export const HACKER_SIZE = { width: 16, height: 24 };

/** Bob's machine, px, standing on the lab floor by its bottom middle. */
export const MACHINE_SIZE = { width: 30, height: 30 };

/** Where the machine's zapper is, px from its top-left corner. */
export const MACHINE_ZAPPER = { x: 1, y: 13 };

/** The pictures that float in each site's sky, by texture key. */
export const NET_ICONS: Record<NetSite, string[]> = {
  youtube: ['net-video', 'net-play'],
  insta: ['net-photo', 'net-heart'],
  facebook: ['net-like', 'net-chat'],
  google: ['net-search', 'net-searchbar'],
  darkweb: ['net-skull', 'net-lock', 'net-code'],
};

const SKIES: Record<NetSite, { top: number; bottom: number; grid: number }> = {
  youtube: { top: 0x0e0e10, bottom: 0x3a1214, grid: 0xff3b3b },
  insta: { top: 0x3d1a5c, bottom: 0xd2547a, grid: 0xffc27a },
  facebook: { top: 0x0f1d44, bottom: 0x3561c4, grid: 0xbcd0ff },
  google: { top: 0xdfe8f6, bottom: 0xffffff, grid: 0x4285f4 },
  darkweb: { top: 0x000000, bottom: 0x06140a, grid: 0x1f8a3a },
};

export function generateInternetTextures(scene: Phaser.Scene): void {
  generateCables(scene);
  generateHacker(scene);
  generateMachine(scene);
  generateSkies(scene);
  generateIcons(scene);
}

/**
 * A thick cable running up through a cell: black insulation with a
 * coloured stripe, and the two scratched stages -- grooves, then copper
 * showing through. `cable-plug` is the plug at the top of a column.
 */
function generateCables(scene: Phaser.Scene): void {
  const body = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(0x15161a, 1);
    g.fillRect(3, 0, 10, TILE);
    g.fillStyle(0x2c2e36, 1);
    g.fillRect(4, 0, 3, TILE);
    g.fillStyle(0xffd23c, 1);
    g.fillRect(9, 0, 2, TILE);
    g.fillStyle(0x000000, 0.5);
    g.fillRect(12, 0, 1, TILE);
  };
  bakeTexture(scene, 'cable', TILE, TILE, body);
  bakeTexture(scene, 'cable-1', TILE, TILE, (g) => {
    body(g);
    g.fillStyle(0xb8bcc8, 1);
    for (const y of [2, 7, 12]) {
      g.fillRect(4, y, 7, 1);
      g.fillRect(5, y + 1, 6, 1);
    }
  });
  bakeTexture(scene, 'cable-2', TILE, TILE, (g) => {
    body(g);
    g.fillStyle(0xd88a3c, 1);
    for (const y of [1, 6, 11]) {
      g.fillRect(4, y, 8, 3);
    }
    g.fillStyle(0xffd09a, 1);
    for (const y of [2, 7, 12]) {
      g.fillRect(5, y, 6, 1);
    }
  });
  bakeTexture(scene, 'cable-plug', TILE, 10, (g) => {
    g.fillStyle(0x8a8e9a, 1);
    g.fillRect(5, 0, 2, 4);
    g.fillRect(9, 0, 2, 4);
    g.fillStyle(0x3a3d46, 1);
    g.fillRect(2, 4, 12, 6);
    g.fillStyle(0x5a5e6a, 1);
    g.fillRect(3, 4, 10, 2);
  });
  // A shred of cable flying off when one snaps.
  bakeTexture(scene, 'cable-bit', 4, 3, (g) => {
    g.fillStyle(0x15161a, 1);
    g.fillRect(0, 0, 4, 3);
    g.fillStyle(0xd88a3c, 1);
    g.fillRect(3, 1, 1, 1);
  });
}

/**
 * A hacker: a black hood with nothing inside but two green eyes, hunched
 * over a laptop glowing green. And the sign it holds up, an arrow pointing
 * right -- turned by the scene for the other ways.
 */
function generateHacker(scene: Phaser.Scene): void {
  const { width, height } = HACKER_SIZE;
  bakeTexture(scene, 'hacker', width, height, (g) => {
    // Legs.
    g.fillStyle(0x15161c, 1);
    g.fillRect(4, height - 6, 3, 6);
    g.fillRect(9, height - 6, 3, 6);
    // The hoodie.
    g.fillStyle(0x23252e, 1);
    g.fillRect(2, 9, 12, height - 14);
    g.fillCircle(8, 6, 6);
    g.fillStyle(0x2f323d, 1);
    g.fillRect(3, 10, 3, height - 16);
    // The dark inside the hood, and the eyes in it.
    g.fillStyle(0x050506, 1);
    g.fillCircle(8, 7, 4);
    g.fillStyle(0x39ff6a, 1);
    g.fillRect(6, 7, 1, 1);
    g.fillRect(9, 7, 1, 1);
    // The laptop, open, its screen lighting the hood from below.
    g.fillStyle(0x3a3d46, 1);
    g.fillRect(3, 14, 10, 1);
    g.fillStyle(0x0c2412, 1);
    g.fillRect(4, 9 + 2, 8, 3);
    g.fillStyle(0x39ff6a, 0.9);
    g.fillRect(5, 12, 2, 1);
    g.fillRect(8, 12, 3, 1);
  });

  bakeTexture(scene, 'hacker-sign', 22, 22, (g) => {
    // The post.
    g.fillStyle(0x3a2a1c, 1);
    g.fillRect(10, 8, 2, 14);
    // The board, and the arrow on it, pointing right.
    g.fillStyle(0x0c0e0c, 1);
    g.fillRect(1, 1, 20, 10);
    g.fillStyle(0x39ff6a, 1);
    g.fillRect(1, 1, 20, 1);
    g.fillRect(1, 10, 20, 1);
    g.fillRect(1, 1, 1, 10);
    g.fillRect(20, 1, 1, 10);
    g.fillRect(4, 5, 9, 2);
    g.fillTriangle(12, 2, 18, 6, 12, 10);
  });
}

/**
 * Bob's machine: a steel cabinet with a funnel on top for the parts, dials
 * and lights down the front, and the zapper on its side, aimed out at the
 * room -- at whoever stands in front of Bob.
 */
function generateMachine(scene: Phaser.Scene): void {
  const { width, height } = MACHINE_SIZE;
  bakeTexture(scene, 'bob-machine', width, height, (g) => {
    // The funnel.
    g.fillStyle(0x6a7080, 1);
    g.fillTriangle(9, 0, 25, 0, 19, 7);
    g.fillRect(15, 5, 4, 4);
    g.fillStyle(0x9aa0b0, 1);
    g.fillRect(9, 0, 16, 1);
    // The cabinet.
    g.fillStyle(0x4a505e, 1);
    g.fillRect(6, 8, 22, height - 8);
    g.fillStyle(0x6a7080, 1);
    g.fillRect(6, 8, 22, 2);
    g.fillRect(6, 8, 2, height - 8);
    // A dial and lights.
    g.fillStyle(0x1a1c22, 1);
    g.fillCircle(20, 16, 4);
    g.fillStyle(0xe8e8ec, 1);
    g.fillCircle(20, 16, 3);
    g.fillStyle(0xd02020, 1);
    g.fillRect(20, 14, 1, 3);
    for (const [x, colour] of [[11, 0x39ff6a], [15, 0xffd23c], [11, 0xff4040]] as const) {
      g.fillStyle(colour, 1);
      g.fillRect(x, colour === 0xff4040 ? 24 : 21, 2, 2);
    }
    // The zapper, out of its left side.
    g.fillStyle(0x3a3d46, 1);
    g.fillRect(2, 11, 5, 5);
    g.fillStyle(0x8ad8ff, 1);
    g.fillRect(0, 12, 3, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 13, 1, 1);
  });
}

/** Each site's sky: a gradient, and a faint grid in its colour, like the inside of a screen. */
function generateSkies(scene: Phaser.Scene): void {
  for (const [site, sky] of Object.entries(SKIES)) {
    bakeTexture(scene, `net-sky-${site}`, GAME_WIDTH, GAME_HEIGHT, (g) => {
      fillVerticalGradient(g, GAME_WIDTH, GAME_HEIGHT, sky.top, sky.bottom);
      g.fillStyle(sky.grid, 0.08);
      for (let x = 0; x < GAME_WIDTH; x += 24) {
        g.fillRect(x, 0, 1, GAME_HEIGHT);
      }
      for (let y = 0; y < GAME_HEIGHT; y += 24) {
        g.fillRect(0, y, GAME_WIDTH, 1);
      }
    });
  }
}

/** The pictures floating in the sites' skies. Small, chunky, and in their own colours. */
function generateIcons(scene: Phaser.Scene): void {
  // A video: a screen with a play button and a progress bar.
  bakeTexture(scene, 'net-video', 30, 20, (g) => {
    g.fillStyle(0x1a1a1e, 1);
    g.fillRect(0, 0, 30, 20);
    g.fillStyle(0x3a3a44, 1);
    g.fillRect(1, 1, 28, 15);
    g.fillStyle(0xff3b3b, 1);
    g.fillCircle(15, 8, 5);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(13, 5, 18, 8, 13, 11);
    g.fillStyle(0x5a5a64, 1);
    g.fillRect(2, 17, 26, 1);
    g.fillStyle(0xff3b3b, 1);
    g.fillRect(2, 17, 11, 1);
  });
  bakeTexture(scene, 'net-play', 14, 14, (g) => {
    g.fillStyle(0xff3b3b, 1);
    g.fillCircle(7, 7, 7);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(5, 4, 11, 7, 5, 10);
  });
  // A photo, with a sunny hill in it.
  bakeTexture(scene, 'net-photo', 20, 22, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 20, 22);
    g.fillStyle(0x7ac8ff, 1);
    g.fillRect(2, 2, 16, 14);
    g.fillStyle(0xffd23c, 1);
    g.fillCircle(13, 6, 2);
    g.fillStyle(0x5aa04a, 1);
    g.fillEllipse(7, 16, 18, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 16, 20, 6);
  });
  bakeTexture(scene, 'net-heart', 14, 12, (g) => {
    g.fillStyle(0xff4f7a, 1);
    g.fillCircle(4, 4, 4);
    g.fillCircle(10, 4, 4);
    g.fillTriangle(0, 5, 14, 5, 7, 12);
  });
  // A thumb up.
  bakeTexture(scene, 'net-like', 16, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 7, 4, 9);
    g.fillRect(5, 7, 10, 9);
    g.fillRect(6, 1, 4, 7);
    g.fillStyle(0x5b8cff, 1);
    g.fillRect(1, 8, 2, 7);
    g.fillStyle(0xbcd0ff, 1);
    for (const y of [9, 12]) {
      g.fillRect(6, y, 9, 1);
    }
  });
  // A chat bubble, with someone typing.
  bakeTexture(scene, 'net-chat', 20, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 20, 12, 4);
    g.fillTriangle(4, 11, 9, 11, 3, 16);
    g.fillStyle(0x5b8cff, 1);
    for (const x of [5, 10, 15]) {
      g.fillCircle(x, 6, 1.5);
    }
  });
  // A magnifying glass: searching.
  bakeTexture(scene, 'net-search', 16, 16, (g) => {
    g.lineStyle(3, 0x4285f4, 1);
    g.strokeCircle(6, 6, 4);
    g.fillStyle(0xeaf2ff, 1);
    g.fillCircle(6, 6, 3);
    g.lineStyle(3, 0x34a853, 1);
    g.lineBetween(9, 9, 14, 14);
  });
  // A search bar: white, rounded, a blinking-line cursor and four coloured
  // dots for the button -- a search engine, not anyone's logo.
  bakeTexture(scene, 'net-searchbar', 40, 12, (g) => {
    g.fillStyle(0xc8d0dc, 1);
    g.fillRoundedRect(0, 0, 40, 12, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(1, 1, 38, 10, 5);
    g.fillStyle(0x5a6270, 1);
    g.fillRect(6, 3, 1, 6);
    [0x4285f4, 0xea4335, 0xfbbc05, 0x34a853].forEach((colour, i) => {
      g.fillStyle(colour, 1);
      g.fillCircle(22 + i * 4, 6, 1.5);
    });
  });
  bakeTexture(scene, 'net-skull', 14, 14, (g) => {
    g.fillStyle(0x9aff9a, 1);
    g.fillCircle(7, 6, 6);
    g.fillRect(4, 10, 6, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(3, 5, 3, 3);
    g.fillRect(8, 5, 3, 3);
    g.fillRect(6, 9, 2, 1);
    g.fillRect(5, 12, 1, 2);
    g.fillRect(8, 12, 1, 2);
  });
  bakeTexture(scene, 'net-lock', 12, 14, (g) => {
    g.lineStyle(2, 0x39ff6a, 1);
    g.strokeCircle(6, 5, 4);
    g.fillStyle(0x0c0e0c, 1);
    g.fillRect(2, 5, 8, 2);
    g.fillStyle(0x39ff6a, 1);
    g.fillRect(0, 6, 12, 8);
    g.fillStyle(0x000000, 1);
    g.fillRect(5, 8, 2, 3);
  });
  // A falling column of ones and noughts.
  bakeTexture(scene, 'net-code', 6, 60, (g) => {
    const random = createRandom(6007);
    for (let y = 0; y < 60; y += 5) {
      g.fillStyle(0x39ff6a, 0.25 + (y / 60) * 0.75);
      if (random() < 0.5) {
        g.fillRect(2, y, 1, 4);
      } else {
        g.fillRect(1, y, 3, 1);
        g.fillRect(1, y + 3, 3, 1);
        g.fillRect(1, y, 1, 4);
        g.fillRect(3, y, 1, 4);
      }
    }
  });
}
