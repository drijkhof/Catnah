import Phaser from 'phaser';
import { LAVA, TILE } from '../config';
import { tileKey } from '../art';
import type { WaterZone } from '../level/Level';

/** How many frames the boil cycles through. Matches what `tiles.ts` bakes. */
const BOIL_FRAMES = 4;

/**
 * The lava, and everything it does besides kill you.
 *
 * Lava that sits still is a floor painted orange. This one **boils** -- each
 * surface tile cycles through four frames, and no two tiles are in step, so the
 * lake churns instead of pulsing as one -- **throws heat**, as a haze standing
 * over the surface that breathes, and every so often **spits**: a gobbet jumps
 * out of a random tile, arcs, and falls back in.
 *
 * None of it is a new way to die. Touching lava already kills; this is so that
 * the lake looks like something that would.
 */
export class LavaLake {
  private readonly scene: Phaser.Scene;

  private readonly theme: string;

  /** The surface tiles, which are the ones that boil and spit. */
  private readonly surface: Phaser.GameObjects.Image[] = [];

  /** Where a gobbet may be thrown from: the top of each surface tile. */
  private readonly vents: Phaser.Math.Vector2[] = [];

  /** Gobbets in the air, with the time each has left, ms. */
  private readonly spits: Array<{ sprite: Phaser.GameObjects.Image; life: number; vy: number; vx: number }> = [];

  private boilClock = 0;

  private spitClock = 0;

  constructor(scene: Phaser.Scene, theme: string, zones: WaterZone[]) {
    this.scene = scene;
    this.theme = theme;

    for (const zone of zones) {
      // The bed, behind the cat, so nothing shows through the lava.
      scene.add
        .image(zone.x, zone.y, tileKey(theme, 'lava'))
        .setOrigin(0, 0)
        .setDepth(-8);

      if (!zone.isSurface) {
        scene.add
          .image(zone.x, zone.y, tileKey(theme, 'lava'))
          .setOrigin(0, 0)
          .setAlpha(0.9)
          .setDepth(20);
        continue;
      }

      const tile = scene.add
        .image(zone.x, zone.y, tileKey(theme, 'lava-surface-0'))
        .setOrigin(0, 0)
        .setAlpha(0.92)
        .setDepth(20);

      // Each tile starts at its own point in the cycle, from its own position.
      // A shared clock would make the whole lake blink at once, which reads as
      // a lighting bug rather than as boiling.
      tile.setData('phase', ((zone.x / TILE) * 3 + (zone.y / TILE) * 5) % BOIL_FRAMES);

      this.surface.push(tile);
      this.vents.push(new Phaser.Math.Vector2(zone.x + TILE / 2, zone.y));

      this.addHaze(zone);
    }
  }

  /**
   * The heat standing over one tile of surface.
   *
   * A pale, almost transparent column that breathes in and out. Drawn *under*
   * the lava's own depth so the crust stays the brightest thing, and given the
   * tile's own delay so the haze ripples along the lake rather than throbbing.
   */
  private addHaze(zone: WaterZone): void {
    const haze = this.scene.add
      .rectangle(
        zone.x + TILE / 2,
        zone.y,
        TILE,
        LAVA.hazeHeight,
        0xff8a3c,
        0.14,
      )
      .setOrigin(0.5, 1)
      .setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: haze,
      scaleY: { from: 0.6, to: 1.15 },
      alpha: { from: 0.07, to: 0.2 },
      duration: LAVA.hazeBreathMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: ((zone.x / TILE) % 7) * 180,
    });
  }

  /** Advances the boil and the gobbets. Called from the scene each frame. */
  step(delta: number): void {
    this.boil(delta);
    this.spit(delta);
  }

  private boil(delta: number): void {
    this.boilClock += delta;

    for (const tile of this.surface) {
      const phase = tile.getData('phase') as number;
      const frame =
        Math.floor(this.boilClock / LAVA.boilFrameMs + phase) % BOIL_FRAMES;

      tile.setTexture(tileKey(this.theme, `lava-surface-${frame}`));
    }
  }

  /**
   * Throws a gobbet out of a random vent, and moves the ones already up.
   *
   * They are plain images moved by hand rather than physics bodies: there are
   * a lot of them, nothing may ever collide with one, and a body that nothing
   * touches is a body the physics step walks over for no reason.
   */
  private spit(delta: number): void {
    this.spitClock += delta;

    if (this.vents.length > 0 && this.spitClock >= LAVA.spitEveryMs) {
      this.spitClock = 0;
      this.launch();
    }

    const gravity = 900;

    for (let i = this.spits.length - 1; i >= 0; i -= 1) {
      const blob = this.spits[i];

      blob.life -= delta;
      blob.vy += gravity * (delta / 1000);
      blob.sprite.x += blob.vx * (delta / 1000);
      blob.sprite.y += blob.vy * (delta / 1000);
      blob.sprite.setAlpha(Math.min(1, blob.life / 300));

      if (blob.life <= 0) {
        blob.sprite.destroy();
        this.spits.splice(i, 1);
      }
    }
  }

  private launch(): void {
    const vent = Phaser.Utils.Array.GetRandom(this.vents);
    const sprite = this.scene.add
      .image(vent.x, vent.y, tileKey(this.theme, 'lava-blob'))
      .setDepth(21);

    this.spits.push({
      sprite,
      life: LAVA.spitLifeMs,
      vy: -Phaser.Math.Between(LAVA.spitSpeedMin, LAVA.spitSpeedMax),
      vx: Phaser.Math.Between(-LAVA.spitDrift, LAVA.spitDrift),
    });
  }
}
