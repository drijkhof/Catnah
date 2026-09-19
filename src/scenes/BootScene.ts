import Phaser from 'phaser';
import { generatePlaceholderArt } from '../art';

/**
 * Bakes the placeholder art, then hands off to the game.
 *
 * Drawing the textures in code means the project has no binary assets to
 * manage yet, and the game runs the moment it is cloned. Once there is real
 * art, load it in `preload()` under the same texture keys and delete the
 * matching generator in `src/art` -- nothing outside this scene refers to art
 * by anything but its key.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Real asset loading goes here, e.g.
    // this.load.spritesheet('cat', 'assets/cat.png', { frameWidth: 22, frameHeight: 16 });
  }

  create(): void {
    generatePlaceholderArt(this);
    this.scene.start('Game');
  }
}
