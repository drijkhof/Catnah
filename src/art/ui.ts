import Phaser from 'phaser';
import { bakeTexture } from './canvas';

/** Edge length of an on-screen touch button, in game pixels. */
export const BUTTON_SIZE = 56;

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

  bakeTexture(scene, 'ui-left', BUTTON_SIZE, BUTTON_SIZE, (g) => {
    drawBase(g);
    g.fillTriangle(half + 8, half - 11, half + 8, half + 11, half - 10, half);
  });

  bakeTexture(scene, 'ui-right', BUTTON_SIZE, BUTTON_SIZE, (g) => {
    drawBase(g);
    g.fillTriangle(half - 8, half - 11, half - 8, half + 11, half + 10, half);
  });

  bakeTexture(scene, 'ui-jump', BUTTON_SIZE, BUTTON_SIZE, (g) => {
    drawBase(g);
    g.fillTriangle(half - 11, half + 8, half + 11, half + 8, half, half - 10);
  });

  // Sneak: an arrow down onto a floor line, to read as "get low" rather than
  // "go down", which an arrow on its own would suggest.
  bakeTexture(scene, 'ui-sneak', BUTTON_SIZE, BUTTON_SIZE, (g) => {
    drawBase(g);
    g.fillTriangle(half - 11, half - 6, half + 11, half - 6, half, half + 6);
    g.fillRect(half - 12, half + 9, 24, 3);
  });
}
