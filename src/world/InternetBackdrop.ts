import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { NET_ICONS, createRandom, type NetSite } from '../art';
import { KEEP_LIVE } from './BakeScenery';

/**
 * Inside the internet: the site's sky -- a gradient with a faint grid, like
 * the inside of a screen -- and the site's pictures floating in it in two
 * ranks, the far one smaller and dimmer, each bobbing gently. On the dark
 * web, columns of code fall behind it all instead of the sky standing still.
 */
export class InternetBackdrop {
  constructor(scene: Phaser.Scene, site: NetSite, levelWidth: number, groundLine: number) {
    scene.add.image(0, 0, `net-sky-${site}`).setOrigin(0, 0).setScrollFactor(0).setDepth(-100);

    const random = createRandom(8803 + site.length * 17);
    const icons = NET_ICONS[site];

    if (site === 'darkweb') {
      for (let x = 0; x < levelWidth * 0.15 + GAME_WIDTH; x += 14 + Math.floor(random() * 20)) {
        const column = scene.add
          .image(x, groundLine - 260 + random() * 120, 'net-code')
          .setOrigin(0.5, 0)
          .setScrollFactor(0.15, 0.3)
          .setDepth(-90)
          .setAlpha(0.35 + random() * 0.4)
          .setData(KEEP_LIVE, true);
        scene.tweens.add({
          targets: column,
          y: column.y + 70,
          alpha: 0,
          duration: 2600 + random() * 2400,
          delay: random() * 3000,
          repeat: -1,
        });
      }
    }

    for (const [factor, depth, scale, alpha, spacing] of [
      [0.2, -80, 0.8, 0.45, 70],
      [0.45, -70, 1.2, 0.8, 110],
    ] as const) {
      for (let x = 0; x < levelWidth * factor + GAME_WIDTH; x += spacing * (0.6 + random() * 0.8)) {
        const icon = scene.add
          .image(x, groundLine - 60 - random() * 170, icons[Math.floor(random() * icons.length)])
          .setScrollFactor(factor, factor)
          .setDepth(depth)
          .setScale(scale)
          .setAlpha(alpha)
          .setAngle(-12 + random() * 24)
          .setData(KEEP_LIVE, true);
        scene.tweens.add({
          targets: icon,
          y: icon.y - 6,
          duration: 1800 + random() * 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: random() * 1500,
        });
      }
    }
  }
}
