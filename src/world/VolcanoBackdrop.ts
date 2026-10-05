import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MOUNTAIN_SIZES, createRandom } from '../art';

/**
 * The volcano behind the level: three ranks of mountains on a red-lit sky,
 * lava running down the near ones, smoke standing over their craters, ash
 * falling and embers rising, and a red wash along the bottom of the screen.
 *
 * Lit from below rather than above. Everywhere else in the game the light comes
 * from the sky; here the brightest thing is the ground, which is also the thing
 * that kills you. So the sky is darkest at the top, the mountains are lit at
 * their feet, and the one bright band is the horizon.
 */
export class VolcanoBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add
      .image(0, 0, 'volcano-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const random = createRandom(6621);

    // Far to near: wider spacing and taller mountains as they come forward,
    // each rank scrolling faster than the one behind. Two variants per rank,
    // flipped at random, so no two neighbours are the same silhouette.
    for (const [rank, spacing, factor, depth, lift, smokes] of [
      ['far', 250, 0.15, -85, 34, false],
      ['mid', 300, 0.3, -75, 26, false],
      ['near', 380, 0.5, -65, 16, true],
    ] as const) {
      const size = MOUNTAIN_SIZES[rank];
      for (let x = -spacing; x < levelWidth / factor + spacing; x += spacing) {
        const scale = 0.8 + random() * 0.3;
        const variant = random() < 0.5 ? 'a' : 'b';
        const flip = random() < 0.5;
        const mx = x + (random() - 0.5) * spacing * 0.5;
        const foot = groundLine + lift;

        scene.add
          .image(mx, foot, `mountain-${rank}-${variant}`)
          .setOrigin(0.5, 1)
          .setFlipX(flip)
          .setDisplaySize(size.width * scale, size.height * scale)
          .setScrollFactor(factor, 1)
          .setDepth(depth);

        if (smokes) {
          this.addSmoke(scene, random, mx, foot - size.height * scale + 6, factor, depth + 1);
        }
      }
    }

    // The glow of the horizon, over the far mountains' feet and under the
    // mid ones, so the distance reads as hot air.
    scene.add
      .image(0, groundLine + 40, 'horizon-glow')
      .setOrigin(0, 1)
      .setScrollFactor(0, 1)
      .setDepth(-80)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.addAsh(scene, random);
    this.addEmbers(scene, random);

    // The glow the lava throws up onto everything.
    scene.add
      .rectangle(0, GAME_HEIGHT, GAME_WIDTH, 150, 0xe8622a, 0.14)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-95);
  }

  /** A plume over one crater: puffs that rise, spread and thin, forever. */
  private addSmoke(
    scene: Phaser.Scene,
    random: () => number,
    x: number,
    y: number,
    factor: number,
    depth: number,
  ): void {
    for (let i = 0; i < 3; i += 1) {
      const puff = scene.add
        .image(x, y, 'smoke')
        .setScrollFactor(factor, 1)
        .setDepth(depth)
        .setAlpha(0)
        .setScale(0.5);

      scene.tweens.add({
        targets: puff,
        y: y - 70 - random() * 40,
        x: x + (random() - 0.5) * 50,
        scale: 1.6,
        alpha: { from: 0.8, to: 0 },
        duration: 6000 + random() * 3000,
        repeat: -1,
        delay: i * 2800 + random() * 1500,
        ease: 'Sine.easeOut',
      });
    }
  }

  /** Ash falling through the whole level, slow and slanting. */
  private addAsh(scene: Phaser.Scene, random: () => number): void {
    for (let i = 0; i < 34; i += 1) {
      const startY = -10 - random() * GAME_HEIGHT;
      const flake = scene.add
        .image(random() * GAME_WIDTH, startY, 'ash')
        .setScrollFactor(0.2)
        .setDepth(-62)
        .setAlpha(0.35 + random() * 0.4);

      scene.tweens.add({
        targets: flake,
        y: GAME_HEIGHT + 10,
        x: `+=${(random() - 0.5) * 80}`,
        duration: 9000 + random() * 8000,
        repeat: -1,
        delay: random() * 6000,
        ease: 'Linear',
      });
    }
  }

  /** Embers rising, each on its own slow loop. */
  private addEmbers(scene: Phaser.Scene, random: () => number): void {
    for (let i = 0; i < 30; i += 1) {
      const ember = scene.add
        .image(random() * GAME_WIDTH, GAME_HEIGHT * (0.5 + random() * 0.5), 'ember')
        .setScrollFactor(0.1)
        .setDepth(-60)
        .setAlpha(0.3 + random() * 0.5)
        .setScale(0.6 + random() * 0.7)
        .setBlendMode(Phaser.BlendModes.ADD);

      scene.tweens.add({
        targets: ember,
        y: `-=${120 + random() * 160}`,
        x: `+=${(random() - 0.5) * 40}`,
        alpha: 0,
        duration: 4000 + random() * 5000,
        repeat: -1,
        delay: random() * 4000,
        ease: 'Sine.easeOut',
      });
    }
  }
}
