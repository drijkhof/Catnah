import Phaser from 'phaser';
import type { CrispText } from '../text';

/**
 * Straight out into space from any level, with the run as it is:
 * **shift-click** the level name. Development only, like everything in
 * this folder -- the call site is wrapped in `import.meta.env.DEV`, so it
 * drops out of a production build.
 *
 * Space is where the worlds are, and getting there the honest way means a
 * sand path's portal or a whole world finished first.
 */
export function installSpaceShortcut(
  scene: Phaser.Scene & { goToSpace(): void },
  label: CrispText,
): void {
  // Harmless if the other shortcuts have already done this.
  label.setInteractive();

  label.on('pointerdown', (event: PointerEvent) => {
    if (event.shiftKey) {
      scene.goToSpace();
    }
  });
}
