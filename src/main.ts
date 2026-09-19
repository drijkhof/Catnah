import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, CAT, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { captureFrom, SNAPSHOT_KEY, type GameSnapshot } from './dev/hot';

function createGame(carried?: GameSnapshot): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.skyTop,

    // Crisp scaling for low-resolution art. Drop this (and the CSS
    // `image-rendering` rule) if the game moves to high-resolution art.
    pixelArt: true,

    scale: {
      // FIT letterboxes the fixed 640x360 canvas into whatever viewport it gets,
      // which is what lets one build serve both a laptop window and a phone in
      // landscape without any layout branching.
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: CAT.gravity },
        // Flip to true to draw physics bodies and velocity vectors.
        debug: false,
      },
    },

    callbacks: {
      // preBoot runs before any scene is created, which is the only point where
      // state carried across a hot reload is guaranteed to be waiting for the
      // Game scene when it builds itself.
      preBoot: (game) => {
        if (carried) {
          game.registry.set(SNAPSHOT_KEY, carried);
        }
      },
    },

    scene: [BootScene, TitleScene, GameScene, GameOverScene],
  });
}

/**
 * Hot reloading, so a code change swaps the game in place rather than reloading
 * the page and dropping the player back at the spawn point.
 *
 * The game is genuinely rebuilt: a module change produces new class
 * definitions while the running scenes hold instances of the old ones, so the
 * old game hands its state over on the way out and the new one picks it up.
 *
 * `accept()` and `dispose()` have to be written here, literally, in the entry
 * module. `import.meta.hot` is per module, and Vite decides what is
 * self-accepting by reading these calls statically -- routing them through a
 * helper leaves the module unaccepting, and every change falls back to a full
 * page reload.
 */
const carried = import.meta.hot?.data.snapshot as GameSnapshot | undefined;
const game = createGame(carried);

if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose((data) => {
    // Falling back to what was carried in matters: a game replaced again before
    // it has drawn its first frame has no scene to capture from, and writing
    // that nothing over the snapshot would lose the player's place on the
    // second of two quick edits.
    data.snapshot = captureFrom(game) ?? carried;
    game.destroy(true);

    // Phaser defers the teardown to the next tick of its own loop, and that
    // tick never comes for a game that has just been stopped -- in a background
    // tab the loop is not running at all. Left alone, a canvas is orphaned on
    // every edit and they stack up. Clearing the container is deterministic;
    // Phaser's own later cleanup checks for a parent, so it stays safe.
    document.getElementById('game')?.replaceChildren();
  });
}

if (import.meta.env.DEV) {
  // Exposed only in development, so the running game can be poked from the
  // browser console: `game.scene.getScene('Game')`.
  (window as unknown as { game: Phaser.Game }).game = game;
}
