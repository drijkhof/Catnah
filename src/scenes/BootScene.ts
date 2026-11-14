import portalUrl from '../art/portal.png?inline';
import { mark } from '../timing';
import Phaser from 'phaser';
import { PORTAL_SOURCE_KEY, generatePlaceholderArt, shadePortal } from '../art';
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
    mark('boot');
    // The one piece of real art so far: the portal, a 78px picture the game
    // scene spins. Everything else is drawn in `generatePlaceholderArt`; more
    // files go here under the key their generator used, e.g.
    // this.load.spritesheet('cat', 'assets/cat.png', { frameWidth: 22, frameHeight: 16 });
    // In the script itself, as a data URL: a file of its own cost a whole
    // round trip after the script had arrived -- most of a second on a phone.
    this.load.image(PORTAL_SOURCE_KEY, portalUrl);
  }

  create(): void {
    // The portal's rim is faded out before anything draws it.
    shadePortal(this);

    generatePlaceholderArt(this);
    mark('art');
    // The page's own loading screen, up while the script came in, goes now.
    document.getElementById('loading')?.remove();

    // A hot reload carries a game in progress, and dropping the player back on
    // the title screen would throw away the place it went to such trouble to
    // keep. Everything else starts at the title.
    const resuming = this.registry.has(SNAPSHOT_KEY);

    this.scene.start(resuming ? 'Game' : 'Title');
  }
}
