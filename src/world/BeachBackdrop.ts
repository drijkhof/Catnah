import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * The beach behind the level: a sky paling to the horizon, the sun, and the
 * sea -- a far band of swells, a nearer band of lighter water streaked with
 * foam, and the foam edge where it runs up the sand just behind where the
 * cat walks. The bands are pinned sideways and tile along, each drifting at
 * its own pace, so the water is always moving and never runs out.
 */
export class BeachBackdrop {
  constructor(scene: Phaser.Scene, groundLine: number) {
    scene.add
      .image(0, 0, 'beach-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const sun = scene.add
      .image(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.16, 'sun')
      .setScrollFactor(0.03)
      .setDepth(-95)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: sun,
      scale: { from: 1, to: 1.05 },
      duration: 4600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // The horizon sits well up the screen; the sea fills down from it to
    // just short of the sand.
    const horizon = groundLine - 74;

    const far = scene.add
      .tileSprite(0, horizon, GAME_WIDTH, 36, 'sea-far')
      .setOrigin(0, 0)
      .setScrollFactor(0, 1)
      .setDepth(-80);
    scene.tweens.add({ targets: far, tilePositionX: 128, duration: 26000, repeat: -1, ease: 'Linear' });

    // Sailboats, a few, far out on the swells: pinned sideways like the
    // water and drifting across it, each at its own pace and the other way
    // from its neighbour, slipping off one side and in again at the other
    // so there is always one about. Higher up the band is further out and
    // smaller; the near water's crests pass in front of the hulls.
    const boats: Array<{ variant: 'a' | 'b'; y: number; scale: number; secondsAcross: number; dir: 1 | -1; start: number }> = [
      { variant: 'a', y: horizon + 10, scale: 0.75, secondsAcross: 150, dir: 1, start: 0.15 },
      { variant: 'b', y: horizon + 22, scale: 1, secondsAcross: 110, dir: -1, start: 0.6 },
      { variant: 'a', y: horizon + 30, scale: 1.1, secondsAcross: 95, dir: 1, start: 0.85 },
    ];
    const span = GAME_WIDTH + 40;
    for (const boat of boats) {
      const from = boat.dir > 0 ? -20 : GAME_WIDTH + 20;
      const to = boat.dir > 0 ? GAME_WIDTH + 20 : -20;
      const sprite = scene.add
        .image(from + (to - from) * boat.start, boat.y, `sailboat-${boat.variant}`)
        .setOrigin(0.5, 1)
        .setScale(boat.scale)
        .setFlipX(boat.dir < 0)
        .setScrollFactor(0, 1)
        .setDepth(-75)
        .setAlpha(0.9);
      // The crossing, from wherever it starts: the first leg is the rest of
      // the way, then full crossings for ever.
      const remaining = Math.abs(to - sprite.x) / span;
      scene.tweens.add({
        targets: sprite,
        x: to,
        duration: boat.secondsAcross * 1000 * remaining,
        ease: 'Linear',
        onComplete: () => {
          sprite.x = from;
          scene.tweens.add({ targets: sprite, x: to, duration: boat.secondsAcross * 1000, ease: 'Linear', repeat: -1, onRepeat: () => { sprite.x = from; } });
        },
      });
      // Riding the swell: a pixel up and down, slow.
      scene.tweens.add({
        targets: sprite,
        y: boat.y - 1,
        duration: 1800 + boat.secondsAcross * 4,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const near = scene.add
      .tileSprite(0, horizon + 34, GAME_WIDTH, 34, 'sea-near')
      .setOrigin(0, 0)
      .setScrollFactor(0, 1)
      .setDepth(-70);
    scene.tweens.add({ targets: near, tilePositionX: -128, duration: 15000, repeat: -1, ease: 'Linear' });

    // The water's edge: foam that creeps up the sand and slides back.
    const foam = scene.add
      .tileSprite(0, groundLine - 7, GAME_WIDTH, 6, 'foam')
      .setOrigin(0, 0.5)
      .setScrollFactor(0, 1)
      .setDepth(-65)
      .setAlpha(0.9);
    scene.tweens.add({ targets: foam, tilePositionX: 64, duration: 9000, repeat: -1, ease: 'Linear' });
    scene.tweens.add({
      targets: foam,
      y: groundLine - 4,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
