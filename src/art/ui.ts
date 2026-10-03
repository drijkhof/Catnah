import Phaser from 'phaser';
import { bakeTexture } from './canvas';

/** Edge length of an on-screen touch button, in game pixels. */
export const BUTTON_SIZE = 56;

/** Edge length of the touch stick's base, and of its knob, in game pixels. */
export const STICK_SIZE = 88;
export const STICK_KNOB_SIZE = 36;

/**
 * Glyphs for the touch controls, drawn plain white. The Controls class tints
 * and fades them, so they carry no colour of their own.
 */
export function generateUiTextures(scene: Phaser.Scene): void {
  const half = BUTTON_SIZE / 2;

  const drawBase = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, 10);
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokeRoundedRect(1, 1, BUTTON_SIZE - 2, BUTTON_SIZE - 2, 10);
    g.fillStyle(0xffffff, 1);
  };

  // The stick: a ring with an arrow at each of the four directions, and a knob
  // that is moved over it by the thumb.
  const stickHalf = STICK_SIZE / 2;

  bakeTexture(scene, 'ui-stick', STICK_SIZE, STICK_SIZE, (g) => {
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(stickHalf, stickHalf, stickHalf - 1);
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokeCircle(stickHalf, stickHalf, stickHalf - 2);
    g.fillStyle(0xffffff, 1);
    const reach = stickHalf - 8;
    g.fillTriangle(stickHalf - 6, stickHalf - reach + 9, stickHalf + 6, stickHalf - reach + 9, stickHalf, stickHalf - reach);
    g.fillTriangle(stickHalf - 6, stickHalf + reach - 9, stickHalf + 6, stickHalf + reach - 9, stickHalf, stickHalf + reach);
    g.fillTriangle(stickHalf - reach + 9, stickHalf - 6, stickHalf - reach + 9, stickHalf + 6, stickHalf - reach, stickHalf);
    g.fillTriangle(stickHalf + reach - 9, stickHalf - 6, stickHalf + reach - 9, stickHalf + 6, stickHalf + reach, stickHalf);
  });

  bakeTexture(scene, 'ui-stick-knob', STICK_KNOB_SIZE, STICK_KNOB_SIZE, (g) => {
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(STICK_KNOB_SIZE / 2, STICK_KNOB_SIZE / 2, STICK_KNOB_SIZE / 2 - 1);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(STICK_KNOB_SIZE / 2, STICK_KNOB_SIZE / 2, STICK_KNOB_SIZE / 2 - 2);
  });

  bakeTexture(scene, 'ui-jump', BUTTON_SIZE, BUTTON_SIZE, (g) => {
    drawBase(g);
    g.fillTriangle(half - 11, half + 8, half + 11, half + 8, half, half - 10);
  });

  // The mute button. Small: it lives in the HUD, not under a thumb with the
  // movement controls, so it is sized to be read rather than to be hit hard.
  const SPEAKER = 14;

  const drawSpeaker = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 5, 3, 4);
    g.fillTriangle(4, 7, 8, 2, 8, 12);
  };

  bakeTexture(scene, 'ui-sound-on', SPEAKER, SPEAKER, (g) => {
    drawSpeaker(g);

    // Two arcs, drawn as stepped pixels: a curve this small has to be built.
    g.fillRect(10, 5, 1, 4);
    g.fillRect(11, 4, 1, 6);
    g.fillRect(12, 2, 1, 10);
  });

  // The middle state: sound effects still play, only the level's own bed
  // (wind, that hum) is held back. One arc rather than two, reading as
  // quieter without being confused for fully off.
  bakeTexture(scene, 'ui-sound-quiet', SPEAKER, SPEAKER, (g) => {
    drawSpeaker(g);
    g.fillRect(10, 5, 1, 4);
  });

  bakeTexture(scene, 'ui-sound-off', SPEAKER, SPEAKER, (g) => {
    drawSpeaker(g);

    // A cross where the arcs were.
    for (let i = 0; i < 5; i += 1) {
      g.fillRect(10 + i, 4 + i, 1, 1);
      g.fillRect(14 - i, 4 + i, 1, 1);
    }
  });
}
