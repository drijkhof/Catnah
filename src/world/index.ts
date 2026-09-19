import Phaser from 'phaser';
import type { ThemeName } from '../level/themes';
import { Backdrop } from './Backdrop';
import { CaveBackdrop } from './CaveBackdrop';
import { CityBackdrop } from './CityBackdrop';
import { SwampBackdrop } from './SwampBackdrop';

/**
 * Builds the scenery for a place.
 *
 * Each backdrop draws itself in its constructor and then looks after itself, so
 * there is nothing to hold on to and nothing to tick.
 */
export function createBackdrop(
  theme: ThemeName,
  scene: Phaser.Scene,
  levelWidth: number,
  groundLine: number,
): void {
  switch (theme) {
    case 'cave':
      new CaveBackdrop(scene, levelWidth, groundLine);
      break;
    case 'swamp':
      new SwampBackdrop(scene, levelWidth, groundLine);
      break;
    case 'city':
      new CityBackdrop(scene, levelWidth, groundLine);
      break;
    default:
      new Backdrop(scene, levelWidth, groundLine);
  }
}
