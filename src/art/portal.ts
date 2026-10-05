import Phaser from 'phaser';
import { EXIT } from '../config';
import { bakeTexture, createRandom } from './canvas';

/** The portal itself: a disc that the scene spins. */
export const PORTAL_KEY = 'exit';

/** The glow behind the portal. */
export const PORTAL_GLOW_KEY = 'exit-glow';

/**
 * The way out of a level: a wormhole. A disc of deep blue with three arms of
 * light spiralling into a black centre, a thread of gold round the rim, and a
 * soft gold halo behind it.
 *
 * Round, not oval, and that is what lets it be one texture: a circle can be
 * turned at runtime and stays a circle, so the scene spins it with a tween
 * rather than this baking a frame for every angle. Drop a picture in
 * `public/assets` under the `exit` key and it spins the same way.
 */
export function generatePortalTextures(scene: Phaser.Scene): void {
  const { diameter, glowDiameter } = EXIT;
  const c = diameter / 2;
  const random = createRandom(7331);

  const deep = 0x0a1a4a;
  const blue = 0x1f6fe0;
  const cyan = 0x5fd8ff;
  const white = 0xf4fbff;
  const gold = 0xffc53d;

  bakeTexture(scene, PORTAL_KEY, diameter, diameter, (g) => {
    // The disc: a thread of gold at the rim, then near black, bluer towards
    // the edge than the middle.
    g.fillStyle(gold, 0.9);
    g.fillCircle(c, c, c);
    g.fillStyle(0x05070f, 1);
    g.fillCircle(c, c, c - 1);
    g.fillStyle(deep, 0.6);
    g.fillCircle(c, c, c - 2);
    g.fillStyle(0x05070f, 1);
    g.fillCircle(c, c, c - 6);

    // Three arms, drawn from the rim inwards so the bright inner dots land on
    // top of the dim outer ones: wide and faint at the rim, tight and white
    // at the centre.
    for (let arm = 0; arm < 3; arm += 1) {
      const offset = arm * ((Math.PI * 2) / 3);
      for (let t = 1; t >= 0.06; t -= 0.025) {
        const angle = offset + t * Math.PI * 2.1;
        const r = (0.12 + 0.85 * t) * (c - 1);
        const radius = 0.8 + 1.6 * t;
        if (t > 0.7) {
          g.fillStyle(deep, 0.5 + (1 - t) * 1.5);
        } else if (t > 0.4) {
          g.fillStyle(blue, 0.85);
        } else if (t > 0.18) {
          g.fillStyle(cyan, 0.95);
        } else {
          g.fillStyle(white, 1);
        }
        g.fillCircle(c + r * Math.cos(angle), c + r * Math.sin(angle), radius);
      }
    }

    // The hole in the middle.
    g.fillStyle(0x000000, 1);
    g.fillCircle(c, c, 3);

    // Sparks caught in the stream.
    for (let i = 0; i < 9; i += 1) {
      const angle = random() * Math.PI * 2;
      const r = (0.3 + random() * 0.65) * (c - 2);
      g.fillStyle(random() < 0.5 ? white : cyan, 0.6 + random() * 0.4);
      g.fillRect(Math.round(c + r * Math.cos(angle)), Math.round(c + r * Math.sin(angle)), 1, 1);
    }
  });

  // The halo: soft gold rings, mostly air, brightening towards the portal.
  const gc = glowDiameter / 2;
  bakeTexture(scene, PORTAL_GLOW_KEY, glowDiameter, glowDiameter, (g) => {
    const steps = 6;
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      g.fillStyle(gold, 0.06 + t * 0.09);
      g.fillCircle(gc, gc, gc * (1 - t * 0.5));
    }
  });
}
