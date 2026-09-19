import Phaser from 'phaser';

/**
 * Draws one texture and registers it under `key`.
 *
 * Every placeholder texture in the game is produced this way: a throwaway
 * Graphics object is drawn into, baked to a texture, and destroyed. Callers
 * work in texture-local coordinates, where (0, 0) is the top-left of the
 * texture being made.
 */
export function bakeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  const graphics = scene.add.graphics();

  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

/**
 * Paints a top-to-bottom gradient as a stack of bands.
 *
 * Not `fillGradientStyle`: that draws fine to the screen but bakes to a fully
 * transparent texture through `generateTexture`, so a sky made with it is
 * invisible and what shows is the canvas clear colour behind it. Plain fills
 * bake correctly, and at these sizes forty bands are indistinguishable from a
 * true gradient.
 */
export function fillVerticalGradient(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  top: number,
  bottom: number,
  bands = 40,
): void {
  const from = Phaser.Display.Color.ValueToColor(top);
  const to = Phaser.Display.Color.ValueToColor(bottom);
  const bandHeight = Math.ceil(height / bands);

  for (let i = 0; i < bands; i += 1) {
    const mix = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, bands - 1, i);

    graphics.fillStyle(
      Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b),
      1,
    );
    graphics.fillRect(0, i * bandHeight, width, bandHeight);
  }
}

/**
 * Deterministic pseudo-random numbers in [0, 1).
 *
 * Scenery placement needs to look scattered but must be identical on every
 * run, otherwise the forest rearranges itself on each hot reload and on each
 * player's device. Seeding by hand keeps that stable without pulling in a
 * dependency.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    // xorshift32: small, fast, and good enough for scattering bushes.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;

    return state / 0x100000000;
  };
}
