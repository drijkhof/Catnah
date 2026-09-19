import Phaser from 'phaser';
import { generateCatTextures } from './cat';
import { generateBackdropTextures } from './backdrops';
import { generateCreatureTextures } from './creatures';
import { generateForestTextures } from './forest';
import { generateUiTextures } from './ui';
import { generateTileset } from './tiles';
import { THEMES } from '../level/themes';

export { bakeTexture, createRandom } from './canvas';
export { BUSH_SIZE, SUN_SIZE, TREE_SIZES, TUFT_SIZE } from './forest';
export { BUTTON_SIZE } from './ui';
export { BUILDING_SIZE, MOON_SIZE, STALACTITE_SIZE } from './backdrops';
export { BRANCH_LEAF_DROP, BRANCH_THICKNESS, generateTileset, tileKey } from './tiles';
export type { TilePalette } from './tiles';
export { CROW_SIZE, HEDGEHOG_SIZE, PIRANHA_SIZE } from './creatures';

/**
 * Bakes every placeholder texture the game uses. Called once from BootScene,
 * before any scene that draws.
 */
export function generatePlaceholderArt(scene: Phaser.Scene): void {
  generateCatTextures(scene);
  generateForestTextures(scene);
  generateCreatureTextures(scene);
  generateBackdropTextures(scene);

  // All three tilesets are baked up front. They are a few dozen small textures
  // in total, and it means changing level never waits on drawing.
  for (const [theme, palette] of Object.entries(THEMES)) {
    generateTileset(scene, theme, palette);
  }
  generateUiTextures(scene);
}
