import Phaser from 'phaser';

/**
 * Ctrl-click the level name to skip forward a level, Cmd-click to go back one.
 *
 * A development shortcut. It lives in its own module and is only ever called
 * from inside an `import.meta.env.DEV` branch, so a production build drops the
 * whole thing rather than merely never running it.
 *
 * It ignores any star the level would otherwise require: skipping past a level
 * you have not finished is the entire point of it.
 *
 * @param label The level name in the HUD, which becomes the click target.
 * @param index Which level this is.
 * @param count How many there are, so both directions wrap round.
 */
export function installLevelSkip(
  scene: Phaser.Scene,
  label: Phaser.GameObjects.Text,
  index: number,
  count: number,
): void {
  // Otherwise Ctrl-click opens the browser's own menu on a Mac.
  scene.input.mouse?.disableContextMenu();

  label.setInteractive({ useHandCursor: true });

  label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const event = pointer.event as MouseEvent;
    const step = event.ctrlKey ? 1 : event.metaKey ? -1 : 0;

    if (step === 0) {
      return;
    }

    // Modulo twice, so stepping back from the first level wraps to the last
    // rather than landing on a negative index.
    const target = (((index + step) % count) + count) % count;

    scene.cameras.main.fade(180, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      scene.scene.start('Game', { levelIndex: target });
    });
  });
}
