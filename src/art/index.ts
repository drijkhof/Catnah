import Phaser from 'phaser';
import { generateCaveWall } from './backdrops';
import { createCatAnimations, generateCatTextures } from './cat';
import { generateBackdropTextures } from './backdrops';
import { generateCreatureTextures } from './creatures';
import { generateForestTextures } from './forest';
import { generateUiTextures } from './ui';
import { generateTileset } from './tiles';
import { generateCityTextures } from './house';
import { generateParkTextures } from './park';
import { generateInternetTextures } from './internet';
import { generateBarTextures } from './bar';
import { generateSpaceTextures } from './space';
import { generateAlienTextures, generateFlagTexture } from './base';
import { THEMES } from '../level/themes';

export { bakeTexture, createRandom } from './canvas';
export { CORNER_RADIUS, FILLET_RADIUS, bakeFillet, roundedTileKey, type Corners } from './corners';
export { bakeRockMass, type RockPiece } from './stone';
export { BUSH_SIZE, CANOPY_SIZE, CHECKPOINT_SIZE, FOG_HEIGHT, SUN_SIZE, TREE_SIZES, TUFT_SIZE } from './forest';
export { BUTTON_SIZE, STICK_KNOB_SIZE, STICK_SIZE } from './ui';
export { PORTAL_KEY, PORTAL_SOURCE_KEY, shadePortal } from './portal';
export { POOL_FRAMES, POOL_HEADROOM, bakeLavaPool, groupLavaPools, type LavaPool } from './lava';
export { CAVE_WALL_SIZE, DEAD_TREE_SIZE, MOUNTAIN_SIZES, PYRAMID_SIZES, SMOKE_SIZE, STALACTITE_SIZE, STALAGMITE_SIZE } from './backdrops';
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
  LOG_BULGE,
  SHELF_BULGE,
  bakeBoulder,
  bakeLog,
  bakeBranch,
  bakeShelf,
  bakeTrunk,
} from './tiles';
export type { TilePalette } from './tiles';
export { CASTLE_FLAG_HEADROOM, bakeSandCastle, type CastleCell } from './castle';
export { PALM_BULGE, bakePalmTrunk } from './palm';
export { ALIEN_SIZE, BASE_HEADROOM, FLAG_SIZE, LAB_CONSOLE_X, LAB_TANK, bakeMoonBase, baseInside } from './base';
export { HEAD_IN_POSE, HELMET_SIZE, LANDMARK_SIZES, PAD_SIZE, PART_SIZE, ROCKET_SIZE, bakeCloudPlatform } from './space';
export { MOON_HILLS_SIZE, PLANET_SIZES, SATURN_RING_SPREAD, STARFIELD_SIZE, SPACE_SUN_SIZE, type PlanetName } from './space';
export { BAR_GLASS, FUEL_TUBE, MILK_BOTTLE, COIN_SIZE, BAR_ALIEN_SIZE, BAR_KEEPER_X, BAR_SIZE, BAR_STOOLS, FUEL_CAN_SIZE, HUT_DOOR, HUT_SIZE, INSIDE_DOOR_SIZE, SHIRT_COLOURS } from './bar';
export { HACKER_SIZE, MACHINE_SIZE, MACHINE_ZAPPER, NET_ICONS, type NetSite } from './internet';
export { BENCH_HEADROOM, FOUNTAIN_HEADROOM, PARK_TREE_SIZE, bakeBench, bakeFountain, bakeLawn } from './park';
export { AWNING_BULGE, HOUSE_HEADROOM, LAMP_GLOW, LAMP_SIZE, MOON_SIZE, SKYLINE_SIZES, bakeAwning, bakeHouse, type HouseCell } from './house';
export {
  BOSS_SIZE,
  CACTUS_SIZE,
  CAMEL_BACK,
  MOUND_SIZE,
  WORM_SIZE,
  bossKey,
  CROCODILE_SIZE,
  CROW_SIZE,
  GROUND_ENEMY_SIZES,
  JELLY_SIZE,
  PALM_CROWN_ANCHOR,
  PALM_CROWN_SIZE,
  PIRANHA_SIZE,
  bakeCactus,
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
  generateCaveWall(scene);
  generateCityTextures(scene);
  generateParkTextures(scene);
  generateInternetTextures(scene);
  generateBarTextures(scene);
  generateSpaceTextures(scene);
  generateFlagTexture(scene);
  generateAlienTextures(scene);

  // All three tilesets are baked up front. They are a few dozen small textures
  // in total, and it means changing level never waits on drawing.
  for (const [theme, palette] of Object.entries(THEMES)) {
    generateTileset(scene, theme, palette);
  }
  generateUiTextures(scene);
}
