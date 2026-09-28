import Phaser from 'phaser';
import { createCatAnimations, generateCatTextures } from './cat';
import { generateBackdropTextures } from './backdrops';
import { generateCreatureTextures } from './creatures';
import { generateForestTextures } from './forest';
import { generateUiTextures } from './ui';
import { generateTileset } from './tiles';
import { THEMES } from '../level/themes';

export { bakeTexture, createRandom } from './canvas';
export { CORNER_RADIUS, FILLET_RADIUS, bakeFillet, roundedTileKey, type Corners } from './corners';
export { BUSH_SIZE, CANOPY_SIZE, CHECKPOINT_SIZE, FOG_HEIGHT, SUN_SIZE, TREE_SIZES, TUFT_SIZE } from './forest';
export { BUTTON_SIZE } from './ui';
export { BUILDING_SIZE, CONE_SIZE, DEAD_TREE_SIZE, MOON_SIZE, STALACTITE_SIZE, STALAGMITE_SIZE } from './backdrops';
export {
  BRANCH_LEAF_DROP,
  BRANCH_THICKNESS,
  FOLIAGE_BACK_SIZE,
  FOLIAGE_NEAR_SIZE,
  generateTileset,
  tileKey,
  GRASS_DROOP,
  GRASS_FRINGE_HEIGHT,
  TILE_VARIANTS,
  TRUNK_FOOT,
  BOULDER_BULGE,
  BRANCH_BULGE,
  TRUNK_BULGE,
  SHELF_BULGE,
  bakeBoulder,
  bakeBranch,
  bakeShelf,
  bakeTrunk,
} from './tiles';
export type { TilePalette } from './tiles';
export {
  BOSS_SIZE,
  CROCODILE_SIZE,
  CROW_SIZE,
  GROUND_ENEMY_SIZES,
  PIRANHA_SIZE,
  SPIDER_SIZE,
} from './creatures';

/**
 * Bakes every placeholder texture the game uses. Called once from BootScene,
 * before any scene that draws.
 */
export function generatePlaceholderArt(scene: Phaser.Scene): void {
  generateCatTextures(scene);
  createCatAnimations(scene);
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
