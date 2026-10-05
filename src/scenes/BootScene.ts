import Phaser from 'phaser';
import { PORTAL_KEY, generatePlaceholderArt } from '../art';
import { SNAPSHOT_KEY } from '../dev/hot';

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
    // The one piece of real art so far: the portal, a 128px picture the game
    // scene spins. Everything else is drawn in `generatePlaceholderArt`; more
    // files go here under the key their generator used, e.g.
    // this.load.spritesheet('cat', 'assets/cat.png', { frameWidth: 22, frameHeight: 16 });
    this.load.image(PORTAL_KEY, 'assets/portal.png');
  }

  create(): void {
    // The portal is shown at under half its size and turning, and under the
    // game's nearest-neighbour sampling that shimmered: a photo-like spiral
    // is not pixel art, so this one texture is filtered smoothly.
    this.textures.get(PORTAL_KEY).setFilter(Phaser.Textures.FilterMode.LINEAR);

    generatePlaceholderArt(this);

    // A hot reload carries a game in progress, and dropping the player back on
    // the title screen would throw away the place it went to such trouble to
    // keep. Everything else starts at the title.
    const resuming = this.registry.has(SNAPSHOT_KEY);

    this.scene.start(resuming ? 'Game' : 'Title');
  }
}
