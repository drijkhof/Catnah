import Phaser from 'phaser';

/**
 * The phone's back button, and the browser's.
 *
 * Title screen, any key, run, **back** -- title screen; **back** again --
 * out of the game. One history entry is pushed when a run starts and taken
 * back when the run ends, so the title screen never has an entry of its
 * own: back from there is the browser's ordinary back, which leaves the page
 * or closes the installed app. Back during a run, a game over or a victory
 * pops that entry, and the `popstate` it fires is read as "to the title".
 *
 * iPhones have no back button, but the edge swipe back fires the same
 * `popstate`, so it is covered by the same code.
 */
const RUN_STATE = { catnah: 'run' } as const;

function inRun(): boolean {
  return (history.state as { catnah?: string } | null)?.catnah === RUN_STATE.catnah;
}

/** Set while we take our own entry back, so that pop is not read as a back press. */
let consuming = false;

/** A run is starting: give back something to come back from. */
export function runStarted(): void {
  if (!inRun()) {
    history.pushState(RUN_STATE, '');
  }
}

/** A run is over, title next: take the entry back, quietly. */
export function runEnded(): void {
  if (inRun()) {
    consuming = true;
    history.back();
  }
}

/**
 * Hooks the back button up to the game. Called once, from `main.ts`. A page
 * loaded with a run's entry still on the stack -- a reload mid-run -- takes
 * it back first, so the first back on the title leaves as it should.
 */
export function installBackButton(game: Phaser.Game): void {
  if (inRun()) {
    runEnded();
  }

  window.addEventListener('popstate', () => {
    if (consuming) {
      consuming = false;
      return;
    }
    // Back during a run (or on the screens that end one): to the title.
    // On the title itself nothing is ours to catch; the browser has already
    // gone back, which is the exit asked for.
    const title = game.scene.getScene('Title');
    if (title?.scene.isActive()) {
      return;
    }
    for (const key of ['GameOver', 'Victory', 'Game']) {
      const scene = game.scene.getScene(key);
      if (scene?.scene.isActive() || scene?.scene.isPaused()) {
        scene.scene.stop();
      }
    }
    game.scene.start('Title');
  });
}
