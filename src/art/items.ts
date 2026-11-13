import Phaser from 'phaser';
import { bakeTexture } from './canvas';

/** Each thing to find and sell, px: drawn standing on the floor. */
export const ITEM_SIZES = {
  wallet: { width: 11, height: 8 },
  candy: { width: 12, height: 6 },
  hat: { width: 13, height: 8 },
  water: { width: 6, height: 13 },
  whiskey: { width: 5, height: 13 },
} as const;

/** The man's stall in the desert: an awning on two poles over a counter. */
export const STALL_SIZE = { width: 46, height: 42 };

/** Whoever lost the wallet in the swamp, lying on the bed of the pool beside it. */
export const DROWNED_SIZE = { width: 34, height: 11 };

/** The man at the start of the desert who wants a hat. */
export const HAT_BUYER_SIZE = { width: 14, height: 26 };

/**
 * The things to find and sell -- `item-wallet`, `item-candy`, `item-hat` --
 * and the man in the desert who buys hats, bald and sunburnt (`hat-buyer`),
 * and wearing one once he has it (`hat-buyer-hat`).
 */
export function generateItemTextures(scene: Phaser.Scene): void {
  // A brown leather wallet, folded, with a gold clasp and a stitched edge.
  bakeTexture(scene, 'item-wallet', ITEM_SIZES.wallet.width, ITEM_SIZES.wallet.height, (g) => {
    g.fillStyle(0x4a2a14, 1);
    g.fillRoundedRect(0, 0, 11, 8, 2);
    g.fillStyle(0x8a5a30, 1);
    g.fillRoundedRect(1, 1, 9, 6, 1);
    g.fillStyle(0x6a4020, 1);
    g.fillRect(1, 3, 9, 1);
    g.fillStyle(0xffd23c, 1);
    g.fillRect(8, 3, 2, 2);
    g.fillStyle(0xb88a50, 1);
    g.fillRect(2, 1, 3, 1);
  });
  // A sweet in a twist of pink and white striped paper.
  bakeTexture(scene, 'item-candy', ITEM_SIZES.candy.width, ITEM_SIZES.candy.height, (g) => {
    g.fillStyle(0xff6fb5, 1);
    g.fillTriangle(0, 0, 0, 6, 4, 3);
    g.fillTriangle(12, 0, 12, 6, 8, 3);
    g.fillCircle(6, 3, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(5, 0, 1, 6);
    g.fillRect(7, 1, 1, 4);
    g.fillStyle(0xffd0e8, 1);
    g.fillRect(4, 1, 1, 1);
  });
  // A straw hat with a red band.
  const drawHat = (g: Phaser.GameObjects.Graphics, x: number, y: number): void => {
    g.fillStyle(0xb88a30, 1);
    g.fillRoundedRect(x, y + 5, 13, 3, 1);
    g.fillStyle(0xe8c060, 1);
    g.fillRoundedRect(x + 3, y, 7, 6, 2);
    g.fillRect(x + 1, y + 5, 11, 2);
    g.fillStyle(0xd02040, 1);
    g.fillRect(x + 3, y + 3, 7, 2);
    g.fillStyle(0xfff0a0, 1);
    g.fillRect(x + 4, y + 1, 2, 1);
  };
  bakeTexture(scene, 'item-hat', ITEM_SIZES.hat.width, ITEM_SIZES.hat.height, (g) => drawHat(g, 0, 0));

  // A bottle of water: clear plastic, blue water, a blue cap and label.
  bakeTexture(scene, 'item-water', ITEM_SIZES.water.width, ITEM_SIZES.water.height, (g) => {
    g.fillStyle(0x1a5aa8, 1);
    g.fillRect(2, 0, 2, 2);
    g.fillStyle(0xd8eef8, 1);
    g.fillRect(2, 2, 2, 1);
    g.fillRoundedRect(0, 3, 6, 10, 2);
    g.fillStyle(0x58b0f0, 1);
    g.fillRoundedRect(1, 5, 4, 7, 1);
    g.fillStyle(0x1a5aa8, 1);
    g.fillRect(0, 7, 6, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 4, 1, 2);
  });

  // Bob's whiskey: a square amber bottle, a black label, a red cap.
  bakeTexture(scene, 'item-whiskey', ITEM_SIZES.whiskey.width, ITEM_SIZES.whiskey.height, (g) => {
    g.fillStyle(0xb8202a, 1);
    g.fillRect(1, 0, 3, 2);
    g.fillStyle(0x8a4a10, 1);
    g.fillRect(1, 2, 3, 2);
    g.fillRect(0, 4, 5, 9);
    g.fillStyle(0xd88a20, 1);
    g.fillRect(1, 6, 3, 6);
    g.fillStyle(0x14141a, 1);
    g.fillRect(0, 7, 5, 3);
    g.fillStyle(0xf0d070, 1);
    g.fillRect(1, 8, 3, 1);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(1, 4, 1, 2);
  });
  // The shelf in Bob's lab it stands on: a steel plank on two brackets.
  bakeTexture(scene, 'lab-shelf', 20, 5, (g) => {
    g.fillStyle(0x7a828e, 1);
    g.fillRect(0, 0, 20, 2);
    g.fillStyle(0xa8b0bc, 1);
    g.fillRect(0, 0, 20, 1);
    g.fillStyle(0x5a626e, 1);
    g.fillTriangle(3, 2, 6, 2, 3, 5);
    g.fillTriangle(17, 2, 14, 2, 17, 5);
  });
  // A painting on the lab wall, in a gold frame: three brothers -- the bar
  // keeper in his bow tie, Bob in the middle in his lab coat, a head taller,
  // and Whiskey Jones in his brown shirt -- against a starry night.
  bakeTexture(scene, 'lab-painting', 40, 28, (g) => {
    g.fillStyle(0x8a6418, 1);
    g.fillRect(0, 0, 40, 28);
    g.fillStyle(0xe0b848, 1);
    g.fillRect(1, 1, 38, 26);
    g.fillStyle(0x182238, 1);
    g.fillRect(3, 3, 34, 22);
    g.fillStyle(0xffffff, 0.7);
    for (const [x, y] of [[6, 6], [12, 4], [27, 5], [34, 8], [31, 4], [8, 10]]) {
      g.fillRect(x, y, 1, 1);
    }
    const skin = 0x7ad06a;
    const brother = (x: number, top: number, shirt: number, extra: (x: number, y: number) => void): void => {
      g.fillStyle(shirt, 1);
      g.fillRect(x - 4, top + 8, 9, 25 - top - 8);
      g.fillStyle(skin, 1);
      g.fillRect(x, top + 6, 1, 2);
      g.fillEllipse(x + 0.5, top + 3, 8, 7);
      g.fillStyle(0x000000, 1);
      g.fillRect(x - 2, top + 2, 2, 2);
      g.fillRect(x + 2, top + 2, 2, 2);
      extra(x, top);
    };
    brother(10, 11, 0xf4f4f0, (x, top) => {
      g.fillStyle(0x1a1a20, 1);
      g.fillTriangle(x - 2, top + 9, x, top + 10, x - 2, top + 11);
      g.fillTriangle(x + 3, top + 9, x + 1, top + 10, x + 3, top + 11);
    });
    brother(30, 11, 0x7a5a3a, () => undefined);
    brother(20, 7, 0xf4f6f8, (x, top) => {
      g.fillStyle(0xc8ccd4, 1);
      g.fillRect(x, top + 8, 1, 25 - top - 8);
      g.fillStyle(0x3a5aa8, 1);
      g.fillRect(x - 3, top + 10, 1, 2);
      g.fillStyle(0x4f9a48, 1);
      g.fillRect(x - 2, top - 3, 1, 3);
      g.fillRect(x + 3, top - 3, 1, 3);
      g.fillStyle(0xff4040, 1);
      g.fillRect(x - 2, top - 4, 1, 1);
      g.fillRect(x + 3, top - 4, 1, 1);
    });
  });

  // The stall: two poles, a striped awning on top, a plank counter at the
  // front with a cloth over it, jugs and a sign-board's worth of wares.
  bakeTexture(scene, 'desert-stall', STALL_SIZE.width, STALL_SIZE.height, (g) => {
    const { width, height } = STALL_SIZE;
    // Poles.
    g.fillStyle(0x7a5430, 1);
    g.fillRect(2, 6, 3, height - 6);
    g.fillRect(width - 5, 6, 3, height - 6);
    // Awning, red and cream stripes, scalloped at the bottom.
    for (let x = 0; x < width; x += 6) {
      g.fillStyle((x / 6) % 2 === 0 ? 0xc83a2a : 0xf4e6c0, 1);
      g.fillRect(x, 0, 6, 7);
      g.fillCircle(x + 3, 7, 3);
    }
    g.fillStyle(0x8a2418, 1);
    g.fillRect(0, 0, width, 1);
    // Counter: planks, a cloth hanging over the front.
    g.fillStyle(0x9a6a3a, 1);
    g.fillRect(0, height - 14, width, 14);
    g.fillStyle(0x7a5028, 1);
    for (let y = height - 10; y < height; y += 4) {
      g.fillRect(0, y, width, 1);
    }
    g.fillStyle(0xc8a060, 1);
    g.fillRect(0, height - 14, width, 2);
    g.fillStyle(0x2a7a8a, 1);
    g.fillRect(12, height - 13, 22, 7);
    g.fillStyle(0xf0d070, 1);
    g.fillRect(12, height - 7, 22, 1);
    // Wares on the counter: a clay jug and a basket of dates.
    g.fillStyle(0xb8643a, 1);
    g.fillRoundedRect(4, height - 21, 6, 7, 2);
    g.fillRect(6, height - 23, 2, 2);
    g.fillStyle(0x8a5a2a, 1);
    g.fillRoundedRect(width - 13, height - 17, 9, 3, 1);
    g.fillStyle(0x5a2a14, 1);
    g.fillCircle(width - 11, height - 18, 1.5);
    g.fillCircle(width - 8, height - 18, 1.5);
    g.fillCircle(width - 6, height - 18, 1.5);
  });

  // The wallet's owner, drowned: on their back on the bed of the pool, head
  // to the left, pale, eyes crossed out, weed on the legs.
  bakeTexture(scene, 'drowned', DROWNED_SIZE.width, DROWNED_SIZE.height, (g) => {
    const { height } = DROWNED_SIZE;
    // Coat, then trousers and shoes.
    g.fillStyle(0x4a6a90, 1);
    g.fillRoundedRect(8, height - 7, 13, 6, 2);
    g.fillStyle(0x7a6448, 1);
    g.fillRect(20, height - 6, 10, 2);
    g.fillRect(20, height - 3, 10, 2);
    g.fillStyle(0x161616, 1);
    g.fillRect(30, height - 7, 3, 3);
    g.fillRect(30, height - 3, 3, 3);
    // An arm flung up over the head, the other along the side.
    g.fillStyle(0x4a6a90, 1);
    g.fillRect(9, height - 9, 6, 2);
    g.fillStyle(0xf0c8a8, 1);
    g.fillRect(4, height - 10, 5, 2);
    g.fillRect(16, height - 2, 3, 2);
    // The head, eyes crossed out, mouth open.
    g.fillStyle(0xf0c8a8, 1);
    g.fillCircle(4, height - 4, 4);
    g.fillStyle(0x6a4024, 1);
    g.fillRect(1, height - 8, 6, 1);
    g.fillStyle(0x1a1a1a, 1);
    for (const ex of [2, 5]) {
      g.fillRect(ex - 1, height - 6, 1, 1);
      g.fillRect(ex + 1, height - 6, 1, 1);
      g.fillRect(ex, height - 5, 1, 1);
      g.fillRect(ex - 1, height - 4, 1, 1);
      g.fillRect(ex + 1, height - 4, 1, 1);
    }
    g.fillRect(3, height - 2, 2, 1);
    // Weed grown over the legs.
    g.fillStyle(0x5a9a38, 1);
    g.fillTriangle(22, height, 24, 0, 26, height);
    g.fillTriangle(26, height, 27, 3, 29, height);
  });

  // The man: bald and red from the sun, a big moustache, a white shirt,
  // khaki shorts, sandals. Facing right.
  const drawMan = (g: Phaser.GameObjects.Graphics, hat: boolean): void => {
    const { height } = HAT_BUYER_SIZE;
    // Legs and sandals.
    g.fillStyle(0xe8a080, 1);
    g.fillRect(4, height - 7, 2, 6);
    g.fillRect(8, height - 7, 2, 6);
    g.fillStyle(0x6a4020, 1);
    g.fillRect(3, height - 1, 4, 1);
    g.fillRect(8, height - 1, 4, 1);
    // Shorts.
    g.fillStyle(0xb8a070, 1);
    g.fillRect(3, height - 11, 9, 5);
    // Shirt, and arms.
    g.fillStyle(0xf4f4f0, 1);
    g.fillRoundedRect(2, 12, 11, height - 22, 2);
    g.fillStyle(0xd0d0c8, 1);
    g.fillRect(7, 13, 1, height - 24);
    g.fillStyle(0xe8a080, 1);
    g.fillRect(1, 14, 2, 6);
    g.fillRect(12, 14, 2, 6);
    // Head: bald, sunburnt on top.
    g.fillStyle(0xe8a080, 1);
    g.fillRoundedRect(3, 3, 9, 9, 4);
    g.fillStyle(0xff6a50, 1);
    g.fillRect(5, 3, 5, 2);
    // Eye, nose, moustache.
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(9, 6, 1, 1);
    g.fillStyle(0xd07060, 1);
    g.fillRect(11, 7, 2, 2);
    g.fillStyle(0x5a3a20, 1);
    g.fillRect(7, 9, 6, 1);
    g.fillRect(7, 10, 2, 1);
    if (hat) {
      drawHat(g, 1, 0);
    }
  };
  bakeTexture(scene, 'hat-buyer', HAT_BUYER_SIZE.width, HAT_BUYER_SIZE.height, (g) => drawMan(g, false));
  bakeTexture(scene, 'hat-buyer-hat', HAT_BUYER_SIZE.width, HAT_BUYER_SIZE.height, (g) => drawMan(g, true));
}
