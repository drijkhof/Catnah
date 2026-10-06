import Phaser from 'phaser';

/**
 * Puts the evil lord beetle back, spots and all, and the cat back at its
 * respawn point: **shift-click** the level name. Development only, like
 * everything in this folder -- the call site is wrapped in
 * `import.meta.env.DEV`, so it drops out of a production build.
 *
 * A boss that can die needs a way to be fought again from the top, without
 * walking the whole level, and without the level restart that a death would
 * cost.
 */
export function installBossRespawn(
  scene: Phaser.Scene & { respawnBoss(): void },
  label: Phaser.GameObjects.Text,
): void {
  // Harmless if the other shortcuts have already done this.
  label.setInteractive({ useHandCursor: true });

  label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if ((pointer.event as MouseEvent).shiftKey) {
      scene.respawnBoss();
    }
  });
}
