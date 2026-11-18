import Phaser from 'phaser';
import { TILE } from '../config';
import { crispText } from '../text';

/** Registry flag: red arrows to space's easter eggs, as in god mode. */
export const EGG_RADAR_KEY = 'catnah:egg-radar';

/**
 * Out in space, a full tank of rocket fuel: **click where a level's name
 * would be**, top left. It turns on the easter egg radar too (`EGG_RADAR_KEY`),
 * red arrows to the camper and the Death Star, for the rest of the session. Nothing shows there -- space has no name -- but the
 * spot answers. Development only, like everything in this folder: the call
 * site is wrapped in `import.meta.env.DEV`, so it drops out of a build.
 */
export function installFuelShortcut(scene: Phaser.Scene & { fillTank(): void }): void {
  const spot = crispText(scene, TILE + 10, TILE + 9, 'Space', {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: 'transparent',
  })
    .setScrollFactor(0)
    .setDepth(1000)
    .setInteractive();
  spot.on('pointerdown', () => scene.fillTank());
}
