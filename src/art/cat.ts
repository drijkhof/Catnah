import Phaser from 'phaser';
import { CAT, COLORS } from '../config';
import { bakeTexture } from './canvas';

/**
 * The cat, drawn side-on and facing right.
 *
 * Both poses are baked at exactly their physics body size, so the sprite and
 * the body are the same rectangle and no offset juggling is needed when the
 * pose swaps. Shapes are deliberately chunky: at 22x16 game pixels, anything
 * finer turns to mush once the canvas is scaled up.
 */
export function generateCatTextures(scene: Phaser.Scene): void {
  generateStanding(scene);
  generateSneaking(scene);
}

function generateStanding(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat', width, height, (g) => {
    // Tail, sweeping up behind.
    g.fillStyle(COLORS.cat, 1);
    g.fillRect(0, 4, 3, 6);
    g.fillRect(1, 3, 3, 2);
    g.fillRect(2, 8, 3, 3);

    // Hind and front legs.
    g.fillRect(5, 13, 3, 5);
    g.fillRect(14, 13, 3, 5);

    // Body.
    g.fillRect(3, 6, 15, 8);

    // Head.
    g.fillRect(14, 3, 8, 8);

    // Ears.
    g.fillTriangle(15, 4, 18, 4, 16, 0);
    g.fillTriangle(19, 4, 22, 4, 21, 0);

    // Pale chest and belly.
    g.fillStyle(COLORS.catLight, 1);
    g.fillRect(6, 11, 9, 3);
    g.fillRect(16, 9, 5, 2);

    // Tabby stripes.
    g.fillStyle(COLORS.catDark, 1);
    g.fillRect(7, 6, 2, 4);
    g.fillRect(11, 6, 2, 4);
    g.fillRect(15, 3, 2, 2);

    // Eye and nose.
    g.fillStyle(0x2a2118, 1);
    g.fillRect(18, 6, 2, 2);

    g.fillStyle(COLORS.catNose, 1);
    g.fillRect(21, 8, 1, 2);
  });
}

function generateSneaking(scene: Phaser.Scene): void {
  const width = CAT.sneakWidth;
  const height = CAT.sneakHeight;

  bakeTexture(scene, 'cat-sneak', width, height, (g) => {
    // Tail held low and straight out behind.
    g.fillStyle(COLORS.cat, 1);
    g.fillRect(0, 4, 5, 2);

    // Body, stretched long and flat.
    g.fillRect(4, 2, 17, 6);

    // Head, dropped to the same low line.
    g.fillRect(17, 1, 8, 7);

    // Ears flattened back, the way a stalking cat holds them.
    g.fillTriangle(17, 2, 20, 2, 16, 0);
    g.fillTriangle(20, 2, 23, 2, 21, 0);

    // Tucked paws.
    g.fillRect(6, 7, 3, 2);
    g.fillRect(15, 7, 3, 2);

    g.fillStyle(COLORS.catLight, 1);
    g.fillRect(7, 6, 9, 2);

    g.fillStyle(COLORS.catDark, 1);
    g.fillRect(9, 2, 2, 4);
    g.fillRect(13, 2, 2, 4);

    g.fillStyle(0x2a2118, 1);
    g.fillRect(21, 3, 2, 2);

    g.fillStyle(COLORS.catNose, 1);
    g.fillRect(24, 5, 1, 2);
  });
}
