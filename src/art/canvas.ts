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
