import Phaser from 'phaser';

/** Registry key the incoming game reads its restored state from. */
export const SNAPSHOT_KEY = 'hot-snapshot';

/** Where a minnow sits in the level, used to re-collect it after a reload. */
export interface MinnowMark {
  x: number;
  y: number;
}

/**
 * Enough of the running game to pick up where it left off.
 *
 * Deliberately small: positions and progress, nothing structural. Anything the
 * level or the code defines is rebuilt from the new source, which is the whole
 * point of reloading.
 */
export interface GameSnapshot {
  /** Which level was being played. */
  levelIndex: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facingLeft: boolean;
  collectedMinnows: MinnowMark[];
}

/** A scene that can hand its state over to the build replacing it. */
interface ResumableScene extends Phaser.Scene {
  captureState?: () => GameSnapshot | undefined;
}

/**
 * Reads the state out of a running game, for handing to its replacement.
 *
 * The accompanying `import.meta.hot.accept()` and `.dispose()` calls cannot
 * live in this file: `import.meta.hot` is per module, so an accept here would
 * only make *this* module self-accepting. Vite also detects those calls by
 * static analysis, so they will not register if reached through a helper. They
 * belong in the entry module, which is why `main.ts` keeps them.
 */
export function captureFrom(game: Phaser.Game): GameSnapshot | undefined {
  const scene = game.scene.getScene('Game') as ResumableScene | null;

  return scene?.captureState?.();
}
