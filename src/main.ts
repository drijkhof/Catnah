import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.sky,

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
      gravity: { x: 0, y: PLAYER.gravity },
      // Flip to true to draw physics bodies and velocity vectors.
      debug: false,
    },
  },

  scene: [BootScene, GameScene],
});

if (import.meta.env.DEV) {
  // Exposed only in development, so the running game can be poked from the
  // browser console: `game.scene.getScene('Game')`.
  (window as unknown as { game: Phaser.Game }).game = game;
}
