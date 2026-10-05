import Phaser from 'phaser';
import type { ThemeName } from '../level/themes';
import type { ParsedLevel } from '../level/Level';
import { Backdrop } from './Backdrop';
import { CaveBackdrop } from './CaveBackdrop';
import { SwampBackdrop } from './SwampBackdrop';
import { VolcanoBackdrop } from './VolcanoBackdrop';

export { addGroundShade } from './GroundShade';
export { KEEP_LIVE, bakeScenery } from './BakeScenery';

/**
 * Builds the scenery for a place.
 *
 * Each backdrop draws itself in its constructor and then looks after itself, so
 * there is nothing to hold on to and nothing to tick.
 */
export function createBackdrop(
  theme: ThemeName,
  scene: Phaser.Scene,
  level: ParsedLevel,
  levelWidth: number,
  groundLine: number,
  levelHeight: number,
): void {
  switch (theme) {
    case 'cave':
      new CaveBackdrop(scene, level, levelWidth, levelHeight);
      break;
    case 'swamp':
      new SwampBackdrop(scene, levelWidth, groundLine);
      break;
    case 'volcano':
      new VolcanoBackdrop(scene, levelWidth, groundLine);
      break;
    default:
      new Backdrop(scene, levelWidth, groundLine, level.waterZones);
  }
}
