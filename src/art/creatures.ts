import Phaser from 'phaser';
import { COLORS } from '../config';
import { bakeTexture } from './canvas';

/** Body sizes, so gameplay code and the drawings cannot drift apart. */
export const GROUND_ENEMY_SIZES = {
  hedgehog: { width: 20, height: 13 },
  rat: { width: 19, height: 9 },
};
export const PIRANHA_SIZE = { width: 17, height: 10 };
export const CROW_SIZE = { width: 20, height: 15 };

/** The boss. Far bigger than anything else, which is most of the threat. */
export const BOSS_SIZE = { width: 66, height: 46 };

export function generateCreatureTextures(scene: Phaser.Scene): void {
  generateHedgehog(scene);
  generateRat(scene);
  generatePiranha(scene);
  generateCrow(scene);
  generateBoss(scene);
}

/**
 * The evil lord beetle: a ladybird with the sweetness taken out.
 *
 * Everything that makes a ladybird cheerful is inverted -- the red goes dark,
 * the spots grow spines, and the friendly domed shell gets a jaw under it --
 * while the silhouette stays unmistakably a ladybird. That contrast is the joke
 * and the menace at the same time.
 */
function generateBoss(scene: Phaser.Scene): void {
  const { width, height } = BOSS_SIZE;
  const midY = height / 2;

  bakeTexture(scene, 'boss', width, height, (g) => {
    // Spines along the back, drawn first so the shell sits over their roots.
    g.fillStyle(COLORS.bossSpine, 1);
    for (let i = 0; i < 6; i += 1) {
      const x = 12 + i * 8;
      g.fillTriangle(x, 14, x + 6, 14, x + 3, 1);
    }

    // Legs.
    g.fillStyle(COLORS.bossLeg, 1);
    for (const x of [14, 28, 42]) {
      g.fillRect(x, height - 10, 3, 9);
      g.fillRect(x - 3, height - 3, 7, 3);
    }

    // The shell.
    g.fillStyle(COLORS.bossShell, 1);
    g.fillEllipse(width / 2 - 4, midY, width - 18, height - 12);

    g.fillStyle(COLORS.bossShellDark, 1);
    g.fillRect(width / 2 - 5, midY - (height - 12) / 2 + 3, 3, height - 18);

    // Spots.
    g.fillStyle(COLORS.bossSpot, 1);
    for (const [sx, sy, r] of [[18, 16, 5], [20, 32, 4], [34, 13, 4], [36, 31, 5], [46, 22, 4]]) {
      g.fillCircle(sx, sy, r);
    }

    // Head, jaw and eyes, at the front.
    g.fillStyle(COLORS.bossSpot, 1);
    g.fillEllipse(width - 12, midY, 20, height - 20);

    g.fillStyle(COLORS.bossLeg, 1);
    g.fillTriangle(width - 6, midY + 2, width, midY + 6, width - 10, midY + 10);
    g.fillTriangle(width - 6, midY - 2, width, midY - 6, width - 10, midY - 10);

    g.fillStyle(COLORS.dangerEye, 1);
    g.fillCircle(width - 8, midY - 4, 4);
    g.fillCircle(width - 8, midY + 5, 3);

    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(width - 9, midY - 5, 1.5);
  });
}

function generateRat(scene: Phaser.Scene): void {
  const { width, height } = GROUND_ENEMY_SIZES.rat;

  bakeTexture(scene, 'rat', width, height, (g) => {
    // Long, low and tapered, with a bare tail -- the silhouette does the work
    // of telling it apart from a hedgehog at this size.
    g.fillStyle(COLORS.ratTail, 1);
    g.fillRect(0, 4, 6, 1);
    g.fillRect(1, 3, 3, 1);

    g.fillStyle(COLORS.ratBody, 1);
    g.fillRect(4, 3, width - 7, height - 5);
    g.fillRect(width - 6, 2, 6, 5);

    g.fillStyle(COLORS.ratBelly, 1);
    g.fillRect(6, height - 4, width - 11, 2);

    // Ear, eye, nose.
    g.fillStyle(COLORS.ratBody, 1);
    g.fillCircle(width - 7, 2, 2.5);

    g.fillStyle(0x1d1a18, 1);
    g.fillRect(width - 4, 3, 1, 1);

    g.fillStyle(COLORS.ratTail, 1);
    g.fillRect(width - 1, 4, 1, 1);

    g.fillStyle(COLORS.ratTail, 1);
    g.fillRect(7, height - 2, 2, 2);
    g.fillRect(13, height - 2, 2, 2);
  });
}

function generateHedgehog(scene: Phaser.Scene): void {
  const { width, height } = GROUND_ENEMY_SIZES.hedgehog;

  bakeTexture(scene, 'hedgehog', width, height, (g) => {
    // Spines first, so the body sits in front of their roots.
    g.fillStyle(COLORS.hedgehogSpine, 1);
    for (let i = 0; i < 6; i += 1) {
      const x = 2 + i * 2.6;
      g.fillTriangle(x, 6, x + 3, 6, x + 1, 0);
    }

    g.fillStyle(COLORS.hedgehogBody, 1);
    g.fillRect(1, 5, width - 4, height - 6);

    // Snout, pointing right; the sprite is flipped when it turns.
    g.fillStyle(COLORS.hedgehogFace, 1);
    g.fillRect(width - 5, 6, 5, 4);

    g.fillStyle(0x2a2118, 1);
    g.fillRect(width - 2, 7, 1, 1);
    g.fillRect(width - 6, 6, 2, 2);

    // Feet.
    g.fillStyle(COLORS.hedgehogFace, 1);
    g.fillRect(4, height - 2, 3, 2);
    g.fillRect(12, height - 2, 3, 2);
  });
}

function generatePiranha(scene: Phaser.Scene): void {
  const { width, height } = PIRANHA_SIZE;

  bakeTexture(scene, 'piranha', width, height, (g) => {
    g.fillStyle(COLORS.piranhaBody, 1);
    g.fillRect(3, 2, width - 6, height - 4);
    g.fillTriangle(0, 1, 0, height - 1, 4, height / 2);   // tail
    g.fillRect(width - 5, 3, 5, 4);                        // head

    g.fillStyle(COLORS.piranhaBelly, 1);
    g.fillRect(4, height - 4, width - 9, 2);

    // Teeth and a red eye: the two things that have to read at this size.
    g.fillStyle(0xffffff, 1);
    g.fillRect(width - 4, 7, 4, 1);

    g.fillStyle(COLORS.dangerEye, 1);
    g.fillRect(width - 5, 4, 2, 2);
  });
}

function generateCrow(scene: Phaser.Scene): void {
  const { width, height } = CROW_SIZE;

  bakeTexture(scene, 'crow', width, height, (g) => {
    // Wings spread, seen from the side, mid-beat.
    g.fillStyle(COLORS.crowSheen, 1);
    g.fillTriangle(3, 6, 13, 6, 0, 0);
    g.fillTriangle(6, 6, 18, 6, 20, 1);

    g.fillStyle(COLORS.crowBody, 1);
    g.fillRect(4, 5, 11, 7);
    g.fillRect(13, 3, 6, 6);                               // head
    g.fillTriangle(2, 8, 6, 8, 0, 13);                     // tail

    g.fillStyle(COLORS.crowSheen, 1);
    g.fillRect(5, 6, 6, 1);

    g.fillStyle(COLORS.dangerEye, 1);
    g.fillRect(16, 5, 2, 2);

    g.fillStyle(COLORS.crowBeak, 1);
    g.fillTriangle(19, 5, 19, 8, width, 6);
  });
}
