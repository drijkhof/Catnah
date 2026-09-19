import Phaser from 'phaser';
import { generateCatTextures } from './cat';
import { generateCreatureTextures } from './creatures';
import { generateForestTextures } from './forest';
import { generateUiTextures } from './ui';

export { bakeTexture, createRandom } from './canvas';
export {
  BRANCH_THICKNESS,
  BRANCH_LEAF_DROP,
  BUSH_SIZE,
  SUN_SIZE,
  TREE_SIZES,
  TUFT_SIZE,
} from './forest';
export { BUTTON_SIZE } from './ui';
export { CROW_SIZE, HEDGEHOG_SIZE, PIRANHA_SIZE } from './creatures';

/**
 * Bakes every placeholder texture the game uses. Called once from BootScene,
 * before any scene that draws.
 */
export function generatePlaceholderArt(scene: Phaser.Scene): void {
  generateCatTextures(scene);
  generateForestTextures(scene);
  generateCreatureTextures(scene);
  generateUiTextures(scene);
}
