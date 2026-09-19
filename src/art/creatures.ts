import Phaser from 'phaser';
import { COLORS } from '../config';
import { bakeTexture } from './canvas';

/** Body sizes, so gameplay code and the drawings cannot drift apart. */
export const GROUND_ENEMY_SIZES = {
  hedgehog: { width: 20, height: 13 },
  rat: { width: 19, height: 9 },
};
export const PIRANHA_SIZE = { width: 17, height: 10 };

/** Wide and flat, because what it is for is being landed on. */
export const CROCODILE_SIZE = { width: 44, height: 16 };
export const CROW_SIZE = { width: 20, height: 15 };

/** Legs included, because the legs are what makes a spider read as one. */
export const SPIDER_SIZE = { width: 16, height: 12 };

/** The boss. Far bigger than anything else, which is most of the threat. */
export const BOSS_SIZE = { width: 66, height: 46 };

export function generateCreatureTextures(scene: Phaser.Scene): void {
  generateHedgehog(scene);
  generateRat(scene);
  generatePiranha(scene);
  generateCrocodile(scene);
  generateSpider(scene);
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

/**
 * A crocodile, side-on and facing right, lying at the surface.
 *
 * Drawn so the top few pixels read as a back and a pair of eyes above the
 * waterline and the rest as the bulk under it, because that is what a crocodile
 * afloat looks like and it is also exactly what the cat lands on. The physics
 * body is only the back (see `Crocodile`), so the snout is scenery.
 */
function generateCrocodile(scene: Phaser.Scene): void {
  const { width, height } = CROCODILE_SIZE;

  bakeTexture(scene, 'crocodile', width, height, (g) => {
    // The waterline falls at y=9 once the crocodile is placed (see `Crocodile`),
    // so nearly all of it is above water. That is deliberate: a crocodile with
    // only its scutes showing is a correct crocodile and an unreadable platform,
    // and this one has to be something the player can aim a jump at.
    g.fillStyle(COLORS.crocBack, 1);

    // Tail, tapering away at the blunt end.
    g.fillTriangle(0, 5, 0, 12, 9, 9);

    // Back, and a head a touch taller than it.
    g.fillRect(5, 2, 28, 8);
    g.fillRect(29, 1, 9, 8);

    // Snout, narrower than the head and held flat.
    g.fillRect(36, 4, 8, 4);

    // A lit top edge along the whole back. This one line is most of what makes
    // the silhouette carry against green water.
    g.fillStyle(COLORS.crocBelly, 1);
    g.fillRect(6, 2, 27, 1);
    g.fillRect(8, 10, 22, 2);

    // Scutes down the spine, and the brow the eyes sit on.
    g.fillStyle(COLORS.crocRidge, 1);
    for (let x = 7; x < 29; x += 5) {
      g.fillTriangle(x, 2, x + 4, 2, x + 2, 0);
    }
    g.fillRect(30, 0, 7, 2);

    // Jawline, with teeth along it.
    g.fillStyle(COLORS.crocJaw, 1);
    g.fillRect(29, 8, 15, 1);

    g.fillStyle(0xffffff, 1);
    for (let x = 37; x < 44; x += 2) {
      g.fillRect(x, 8, 1, 2);
    }

    // One eye, the near one, small enough to read as an eye rather than a lamp.
    g.fillStyle(COLORS.dangerEye, 1);
    g.fillRect(32, 0, 2, 2);

    g.fillStyle(0x1d2313, 1);
    g.fillRect(33, 1, 1, 1);
    g.fillRect(42, 5, 1, 1);
  });
}

/**
 * A cave spider, seen from the side, hanging the right way up.
 *
 * It is drawn as it hangs rather than as it walks, because it spends most of
 * its time upside down under a ceiling and all of the time it matters coming
 * straight down at the cat. The legs reach up and out to either side, which is
 * what a hanging spider's legs do and also what makes the silhouette wide
 * enough to read at 16px.
 */
function generateSpider(scene: Phaser.Scene): void {
  const { width, height } = SPIDER_SIZE;

  /**
   * The four left legs, each as the pixels it runs through.
   *
   * Written out pixel by pixel, and mirrored for the right side. Two attempts
   * at generating them from a loop both came out as a solid block either side
   * of the body: at 16px what makes a spider read is the *gaps* between the
   * legs, and those have to be placed by hand.
   */
  const legs: Array<Array<[number, number]>> = [
    [[5, 4], [4, 3], [3, 2], [2, 1]],
    [[5, 5], [4, 5], [3, 4], [2, 3]],
    [[5, 7], [4, 7], [3, 8], [2, 9]],
    [[5, 8], [4, 9], [3, 10], [2, 11]],
  ];

  bakeTexture(scene, 'spider', width, height, (g) => {
    g.fillStyle(COLORS.spiderLeg, 1);

    for (const leg of legs) {
      for (const [x, y] of leg) {
        g.fillRect(x, y, 1, 1);
        g.fillRect(width - 1 - x, y, 1, 1);
      }
    }

    // Head and abdomen as one rounded mass, narrow enough that the legs still
    // stand clear of it.
    g.fillStyle(COLORS.spiderBody, 1);
    g.fillRect(6, 3, 4, 7);
    g.fillRect(5, 5, 6, 4);

    // The mark on its back, the one bit of colour on it.
    g.fillStyle(COLORS.spiderMark, 1);
    g.fillRect(7, 6, 2, 3);

    g.fillStyle(COLORS.dangerEye, 1);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
  });
}
