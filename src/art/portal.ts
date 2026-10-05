import Phaser from 'phaser';
import { EXIT } from '../config';

/**
 * The way out of a level: a round picture, `public/assets/portal.png`, loaded
 * by `BootScene` under `PORTAL_SOURCE_KEY` and spun by `GameScene` under this
 * key. The key lives in `src/art` with the others so the rest of the game
 * never has to know which textures are files.
 */
export const PORTAL_KEY = 'exit';

/** The picture as it comes off disk, before `shadePortal` has been at it. */
export const PORTAL_SOURCE_KEY = 'exit-source';

/**
 * Makes the portal texture from the picture: the same pixels, with the alpha
 * falling off with distance from the centre.
 *
 * A hard-edged disc lay *on* the world like a sticker. Fading its rim out
 * makes it sit *in* the world instead, whatever is drawn around it. Done
 * once at boot, on a canvas, because a texture's alpha cannot be shaped at
 * draw time: inside `fadeFrom` of the radius the picture is untouched, from
 * there to the edge its alpha is eased down to nothing.
 */
export function shadePortal(scene: Phaser.Scene): void {
  const source = scene.textures.get(PORTAL_SOURCE_KEY).getSourceImage();
  if (source instanceof Phaser.GameObjects.RenderTexture) {
    throw new Error('The portal source must be an image.');
  }
  const { width, height } = source;
  const canvas = scene.textures.createCanvas(PORTAL_KEY, width, height);
  if (!canvas) {
    throw new Error(`Texture "${PORTAL_KEY}" already exists.`);
  }

  const context = canvas.context;
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const data = pixels.data;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const radius = Math.min(width, height) / 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const r = Math.hypot(x - cx, y - cy) / radius;
      // 1 inside `fadeFrom`, eased to 0 at the rim.
      const t = Phaser.Math.Clamp((r - EXIT.fadeFrom) / (1 - EXIT.fadeFrom), 0, 1);
      const keep = 1 - t * t * (3 - 2 * t);
      const i = (y * width + x) * 4 + 3;
      data[i] = Math.round(data[i] * keep);
    }
  }

  context.putImageData(pixels, 0, 0);
  canvas.refresh();

  // The picture is shown at under half its size and turning, and under the
  // game's nearest-neighbour sampling that shimmered: a photo-like spiral is
  // not pixel art, so this one texture is filtered smoothly.
  canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
