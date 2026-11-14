import Phaser from 'phaser';
import { BAKED_KEYS, generateSpaceHeavy } from '../art/space';

/**
 * The page `npm run bake` opens (`bake.html`, served by the dev server,
 * never built): a bare game whose one scene draws the heavy pictures --
 * `generateSpaceHeavy`, exactly what the game would draw for itself -- and
 * hands each over as a PNG data URL on `window.baked`, for
 * `scripts/bake-art.mjs` to write into `src/art/baked/`.
 */
class Bake extends Phaser.Scene {
  constructor() {
    super('Bake');
  }

  create(): void {
    generateSpaceHeavy(this);
    const out: Record<string, string> = {};
    for (const key of BAKED_KEYS) {
      const source = this.textures.get(key).getSourceImage() as HTMLCanvasElement | HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      canvas.getContext('2d')?.drawImage(source, 0, 0);
      out[key] = canvas.toDataURL('image/png');
    }
    (window as unknown as { baked?: Record<string, string> }).baked = out;
  }
}

new Phaser.Game({ type: Phaser.CANVAS, width: 64, height: 64, scene: [Bake], banner: false, audio: { noAudio: true } });
