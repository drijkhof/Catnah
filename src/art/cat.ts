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
  generateClimbing(scene);
  generateWalking(scene);
  generateClimbingShuffle(scene);
  generateSwimming(scene);
}

/**
 * Registers the cat's looping animations: walk, climb-shuffle, swim.
 *
 * Every "frame" here is one whole baked texture rather than a slice of a
 * spritesheet -- Phaser's animations are happy to cycle through separate
 * textures this way, each implicitly its own frame 0. Called once, alongside
 * `generateCatTextures`, since animations live on the game the same way
 * textures do.
 */
/**
 * The cat's palette beyond the four base colours: a lit edge along the back,
 * a shaded haunch, and the eye. Derived here so the four poses agree.
 */
const TONES = {
  highlight: Phaser.Display.Color.ValueToColor(COLORS.cat).lighten(14).color,
  shadow: Phaser.Display.Color.ValueToColor(COLORS.cat).darken(10).color,
  iris: 0x7ccf63,
  pupil: 0x1a1410,
  glint: 0xf4fff0,
  mouth: 0x8f4f2a,
};

/** A cat's eye: green iris, slit pupil, and a glint. 2x2, at (x, y). */
function drawEye(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(TONES.iris, 1);
  g.fillRect(x, y, 2, 2);
  g.fillStyle(TONES.pupil, 1);
  g.fillRect(x + 1, y, 1, 2);
  g.fillStyle(TONES.glint, 1);
  g.fillRect(x, y, 1, 1);
}

/** The pink inside of an ear: one pixel at the base of the triangle. */
function drawEarInside(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(COLORS.catNose, 1);
  g.fillRect(x, y, 1, 1);
}

export function createCatAnimations(scene: Phaser.Scene): void {
  scene.anims.create({
    key: 'cat-walk',
    // The idle stance sits between the two strides rather than the two
    // strides running back to back, which is what keeps a slow walk from
    // reading as a nervous shuffle.
    frames: [{ key: 'cat' }, { key: 'cat-walk-a' }, { key: 'cat' }, { key: 'cat-walk-b' }],
    frameRate: CAT.animFrameRate,
    repeat: -1,
  });

  scene.anims.create({
    key: 'cat-sneak-walk',
    frames: [
      { key: 'cat-sneak' },
      { key: 'cat-sneak-a' },
      { key: 'cat-sneak' },
      { key: 'cat-sneak-b' },
    ],
    // Slower than the walk: the cat moves at less than half speed, and a
    // stalk is a careful placing of paws, not a trot.
    frameRate: CAT.sneakAnimFrameRate,
    repeat: -1,
  });

  scene.anims.create({
    key: 'cat-climb-shuffle',
    frames: [{ key: 'cat-climb' }, { key: 'cat-climb-a' }],
    frameRate: CAT.animFrameRate,
    repeat: -1,
  });

  scene.anims.create({
    key: 'cat-swim',
    frames: [{ key: 'cat-swim-a' }, { key: 'cat-swim-b' }],
    frameRate: CAT.animFrameRate,
    repeat: -1,
  });
}

function generateStanding(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat', width, height, (g) => drawStandingFrame(g, 0));
}

/**
 * The cat side-on, standing or mid-stride. `stride` 0 is standing; 1 and -1
 * are the two halves of the walk, one leg planted forward and long, the other
 * trailing and drawn a pixel short as if lifted. Everything above the legs is
 * the same picture.
 */
function drawStandingFrame(g: Phaser.GameObjects.Graphics, stride: 0 | 1 | -1): void {
  g.fillStyle(COLORS.cat, 1);

  // Tail, sweeping up behind.
  g.fillRect(0, 4, 3, 6);
  g.fillRect(1, 3, 3, 2);
  g.fillRect(2, 8, 3, 3);

  // Hind and front legs.
  g.fillRect(5 + stride, 13, 3, stride === 0 ? 5 : 5);
  g.fillRect(14 - stride, stride === 0 ? 13 : 12, 3, stride === 0 ? 5 : 4);

  // Body.
  g.fillRect(3, 6, 15, 8);

  // Head.
  g.fillRect(14, 3, 8, 8);

  // Ears.
  g.fillTriangle(15, 4, 18, 4, 16, 0);
  g.fillTriangle(19, 4, 22, 4, 21, 0);

  // Light along the back and the top of the head, from the sun above.
  g.fillStyle(TONES.highlight, 1);
  g.fillRect(4, 6, 10, 1);
  g.fillRect(17, 3, 3, 1);
  g.fillRect(1, 3, 2, 1);

  // Shade on the haunch and under the chin.
  g.fillStyle(TONES.shadow, 1);
  g.fillRect(3, 9, 3, 3);
  g.fillRect(14, 10, 2, 1);

  // Pale chest, belly and muzzle.
  g.fillStyle(COLORS.catLight, 1);
  g.fillRect(6, 11, 9, 3);
  g.fillRect(16, 9, 5, 2);

  // Tabby stripes, and rings on the tail.
  g.fillStyle(COLORS.catDark, 1);
  g.fillRect(7, 6, 2, 4);
  g.fillRect(11, 6, 2, 4);
  g.fillRect(15, 3, 2, 2);
  g.fillRect(0, 6, 3, 1);
  g.fillRect(2, 9, 2, 1);

  // Toes.
  g.fillRect(5 + stride, 17, 3, 1);
  g.fillRect(14 - stride, stride === 0 ? 17 : 15, 3, 1);

  drawEarInside(g, 16, 2);
  drawEarInside(g, 21, 2);
  drawEye(g, 18, 6);

  g.fillStyle(COLORS.catNose, 1);
  g.fillRect(21, 8, 1, 2);
  g.fillStyle(TONES.mouth, 1);
  g.fillRect(20, 10, 1, 1);
}

function generateSneaking(scene: Phaser.Scene): void {
  const width = CAT.sneakWidth;
  const height = CAT.sneakHeight;

  bakeTexture(scene, 'cat-sneak', width, height, (g) => drawSneakFrame(g, 0));
  bakeTexture(scene, 'cat-sneak-a', width, height, (g) => drawSneakFrame(g, 1));
  bakeTexture(scene, 'cat-sneak-b', width, height, (g) => drawSneakFrame(g, -1));
}

/**
 * One frame of the stalk. Every frame is the same 26x9, so swapping between
 * them changes nothing about the body -- see `Player.refreshTexture` for why
 * that matters.
 *
 * @param stride 0 for the rest pose; 1 and -1 slide the two paws in opposite
 *   directions, one reaching forward while the other trails, for the two
 *   stride frames.
 */
function drawSneakFrame(g: Phaser.GameObjects.Graphics, stride: 0 | 1 | -1): void {
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

  // Tucked paws: a stalk is a slow, deliberate placing of one paw at a time,
  // so the two slide against each other by a pixel rather than lifting.
  g.fillRect(6 - stride, 7, 3, 2);
  g.fillRect(15 + stride, 7, 3, 2);

  // Light along the back, shade on the haunch.
  g.fillStyle(TONES.highlight, 1);
  g.fillRect(5, 2, 11, 1);
  g.fillRect(18, 1, 5, 1);
  g.fillStyle(TONES.shadow, 1);
  g.fillRect(4, 5, 3, 2);

  g.fillStyle(COLORS.catLight, 1);
  g.fillRect(7, 6, 9, 2);
  g.fillRect(21, 6, 3, 1);

  g.fillStyle(COLORS.catDark, 1);
  g.fillRect(9, 2, 2, 4);
  g.fillRect(13, 2, 2, 4);
  g.fillRect(2, 4, 1, 2);
  // Toes.
  g.fillRect(6 - stride, 8, 3, 1);
  g.fillRect(15 + stride, 8, 3, 1);

  drawEarInside(g, 17, 1);
  drawEarInside(g, 22, 1);
  drawEye(g, 21, 3);

  g.fillStyle(COLORS.catNose, 1);
  g.fillRect(24, 5, 1, 2);
}

function generateClimbing(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat-climb', width, height, (g) => drawClimbFrame(g, false));
}

/**
 * The cat from behind, holding a rope: head at the top looking up, back
 * hanging straight down, paws out to either side. `reaching` is the shuffle
 * frame, one forepaw stretched further up and the hind paws a beat behind.
 */
function drawClimbFrame(g: Phaser.GameObjects.Graphics, reaching: boolean): void {
  const mid = CAT.width / 2;

  g.fillStyle(COLORS.cat, 1);

  // Forepaws, reaching out to either side of the rope and gripping it.
  g.fillRect(mid - 9, reaching ? 1 : 3, 3, 3);
  g.fillRect(mid + 6, reaching ? 5 : 3, 3, 3);

  // Head, at the top, where it stays.
  g.fillRect(mid - 4, 1, 8, 6);

  // Ears.
  g.fillTriangle(mid - 4, 2, mid - 1, 2, mid - 4, -1);
  g.fillTriangle(mid + 1, 2, mid + 4, 2, mid + 4, -1);

  // Back, hanging straight down from the shoulders.
  g.fillRect(mid - 4, 6, 8, 9);

  // Hind paws, tucked in lower down.
  g.fillRect(mid - 7, reaching ? 8 : 10, 3, 3);
  g.fillRect(mid + 4, reaching ? 12 : 10, 3, 3);

  // Tail, dropping away below.
  g.fillRect(mid - 1, 14, 2, 4);

  // Light on the shoulders, shade down the flanks.
  g.fillStyle(TONES.highlight, 1);
  g.fillRect(mid - 4, 6, 2, 1);
  g.fillRect(mid + 2, 6, 2, 1);
  g.fillRect(mid - 3, 1, 6, 1);
  g.fillStyle(TONES.shadow, 1);
  g.fillRect(mid - 4, 9, 1, 6);
  g.fillRect(mid + 3, 9, 1, 6);

  // Pale scruff, so the head reads as separate from the back.
  g.fillStyle(COLORS.catLight, 1);
  g.fillRect(mid - 3, 7, 6, 2);

  // Tabby stripes down the spine, and a ring on the tail.
  g.fillStyle(COLORS.catDark, 1);
  g.fillRect(mid - 1, 9, 2, 5);
  g.fillRect(mid - 3, 2, 6, 1);
  g.fillRect(mid - 1, 16, 2, 1);

  // Both eyes: this is the back of a cat's head turned to look up.
  drawEye(g, mid - 3, 3);
  drawEye(g, mid + 1, 3);
}

function generateWalking(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat-walk-a', width, height, (g) => drawStandingFrame(g, 1));
  bakeTexture(scene, 'cat-walk-b', width, height, (g) => drawStandingFrame(g, -1));
}

function generateClimbingShuffle(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat-climb-a', width, height, (g) => drawClimbFrame(g, true));
}

/**
 * Floating side-on with the head tipped up clear of the water. There is no
 * standing equivalent to fall back on here -- swimming never had its own
 * picture before, always showing the standing cat regardless of the pool it
 * was in.
 *
 * Baked at the standing frame size, same as climbing: the body is untouched
 * while swimming, so the picture has to fit the box that is already there.
 */
function generateSwimming(scene: Phaser.Scene): void {
  const { width, height } = CAT;

  bakeTexture(scene, 'cat-swim-a', width, height, (g) => drawSwimFrame(g, true));
  bakeTexture(scene, 'cat-swim-b', width, height, (g) => drawSwimFrame(g, false));
}

/** `paddleUp` swaps which forepaw is at the top of its stroke. */
function drawSwimFrame(g: Phaser.GameObjects.Graphics, paddleUp: boolean): void {
  g.fillStyle(COLORS.cat, 1);

  // Tail, kept up for balance.
  g.fillRect(0, 7, 3, 4);

  // Body, floating low and level.
  g.fillRect(3, 9, 15, 6);

  // Head, tipped up clear of the water.
  g.fillRect(14, 3, 8, 8);

  // Ears.
  g.fillTriangle(15, 4, 18, 4, 16, 0);
  g.fillTriangle(19, 4, 22, 4, 21, 0);

  // Paddling forepaw: up on the stroke, or down and trailing.
  g.fillRect(paddleUp ? 16 : 12, paddleUp ? 9 : 14, 4, 2);

  // Hind legs, streamlined and mostly submerged behind.
  g.fillRect(4, 13, 6, 3);

  // Light along the back and the head, shade on the haunch.
  g.fillStyle(TONES.highlight, 1);
  g.fillRect(4, 9, 10, 1);
  g.fillRect(17, 3, 3, 1);
  g.fillStyle(TONES.shadow, 1);
  g.fillRect(3, 12, 3, 2);

  // Pale chest and belly.
  g.fillStyle(COLORS.catLight, 1);
  g.fillRect(6, 12, 9, 2);
  g.fillRect(16, 9, 5, 2);

  // Tabby stripes, and a ring on the tail.
  g.fillStyle(COLORS.catDark, 1);
  g.fillRect(15, 3, 2, 2);
  g.fillRect(8, 9, 2, 3);
  g.fillRect(1, 8, 1, 2);

  drawEarInside(g, 16, 2);
  drawEarInside(g, 21, 2);
  drawEye(g, 18, 6);

  g.fillStyle(COLORS.catNose, 1);
  g.fillRect(21, 8, 1, 2);
  g.fillStyle(TONES.mouth, 1);
  g.fillRect(20, 10, 1, 1);
}
