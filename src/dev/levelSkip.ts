import Phaser from 'phaser';

/**
 * Ctrl- or Cmd-click the level name to skip to the next one.
 *
 * A development shortcut. It lives in its own module and is only ever called
 * from inside an `import.meta.env.DEV` branch, so a production build drops the
 * whole thing rather than merely never running it.
 *
 * It ignores any star the level would otherwise require: skipping past a level
 * you have not finished is the entire point of it.
 *
 * @param label The level name in the HUD, which becomes the click target.
 * @param nextIndex Which level to go to.
 */
export function installLevelSkip(
  scene: Phaser.Scene,
  label: Phaser.GameObjects.Text,
  nextIndex: number,
): void {
  // Otherwise Ctrl-click opens the browser's own menu on a Mac.
  scene.input.mouse?.disableContextMenu();

  label.setInteractive({ useHandCursor: true });

  label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const event = pointer.event as MouseEvent;

    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    scene.cameras.main.fade(180, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      scene.scene.start('Game', { levelIndex: nextIndex });
    });
  });
}
