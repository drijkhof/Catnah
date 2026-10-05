import Phaser from 'phaser';
import { EXIT } from '../config';
import { bakeTexture } from './canvas';

/** The portal itself: a round picture that the scene spins. */
export const PORTAL_KEY = 'exit';

/** The glow behind the portal. */
export const PORTAL_GLOW_KEY = 'exit-glow';

/**
 * The glow behind the way out. The portal itself is a picture,
 * `public/assets/portal.png`, loaded by `BootScene` under `PORTAL_KEY`; this
 * bakes only the soft gold halo that sits behind it.
 */
export function generatePortalTextures(scene: Phaser.Scene): void {
  const { glowDiameter } = EXIT;
  const gold = 0xffc53d;

  // Soft gold rings, mostly air, brightening towards the portal.
  const gc = glowDiameter / 2;
  bakeTexture(scene, PORTAL_GLOW_KEY, glowDiameter, glowDiameter, (g) => {
    const steps = 6;
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      g.fillStyle(gold, 0.1 + t * 0.14);
      g.fillCircle(gc, gc, gc * (1 - t * 0.5));
    }
  });
}
