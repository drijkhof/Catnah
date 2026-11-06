import Phaser from 'phaser';
import type { ThemeName } from '../level/themes';
import type { ParsedLevel } from '../level/Level';
import { Backdrop } from './Backdrop';
import { CaveBackdrop } from './CaveBackdrop';
import { DesertBackdrop } from './DesertBackdrop';
import { BeachBackdrop } from './BeachBackdrop';
import { CityBackdrop } from './CityBackdrop';
import { MoonBackdrop } from './MoonBackdrop';
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
    case 'desert':
      new DesertBackdrop(scene, levelWidth, groundLine);
      break;
    case 'beach':
      new BeachBackdrop(scene, groundLine);
      break;
    case 'city':
      new CityBackdrop(scene, level, levelWidth, groundLine);
      break;
    case 'moon':
    case 'mars':
    case 'saturn':
    case 'jupiter':
    case 'venus':
    case 'uranus':
    case 'neptune':
    case 'pluto':
      new MoonBackdrop(scene, theme, level, levelWidth, groundLine);
      break;
    case 'path':
      // The forest's sky, sun, distant trees and bushes, out in the open:
      // no canopy closing it in from above.
      // no canopy closing it in from above. Fewer bushes than the forest, so
      // the path shows, and none in front of the big portal.
      new Backdrop(scene, levelWidth, groundLine, level.waterZones, {
        canopy: false,
        bushSpacing: 130,
        clear: level.exits.map((exit): [number, number] => [exit.x - 32 * level.portalScale, exit.x + 32 * level.portalScale]),
      });
      break;
    default:
      new Backdrop(scene, levelWidth, groundLine, level.waterZones);
  }
}
