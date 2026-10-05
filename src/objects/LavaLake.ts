import Phaser from 'phaser';
import { LAVA, TILE } from '../config';
import { POOL_FRAMES, bakeLavaPool, groupLavaPools, POOL_HEADROOM, tileKey } from '../art';
import { THEMES, type ThemeName } from '../level/themes';
import type { WaterZone } from '../level/Level';
import { sound } from '../audio/Sound';


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

  /**
   * One picture per connected pool, cycling through `POOL_FRAMES` baked
   * frames. A pool is drawn whole -- see `art/lava.ts` -- so its crust, its
   * plates and its veins are features of the lake, not of a tile.
   */
  private readonly pools: Array<{ image: Phaser.GameObjects.Image; keys: string[]; phase: number }> = [];

  /** Wisps of heat in the air, with the time each has left, ms. */
  private readonly wisps: Array<{ sprite: Phaser.GameObjects.Image; life: number; vx: number }> = [];

  private wispClock = 0;

  /** Where a gobbet may be thrown from: the top of each surface tile. */
  private readonly vents: Phaser.Math.Vector2[] = [];

  /** Gobbets in the air, with the time each has left, ms. */
  private readonly spits: Array<{ sprite: Phaser.GameObjects.Image; life: number; vy: number; vx: number }> = [];

  private boilClock = 0;

  private spitClock = 0;

  /**
   * @param groundAt Whether a full tile of something solid stands at this
   *   world position. The lake uses it to find the ground beside its surface
   *   and spill over the edge of it.
   */
  constructor(scene: Phaser.Scene, theme: string, zones: WaterZone[], groundAt: (x: number, y: number) => boolean) {
    this.scene = scene;
    this.theme = theme;

    // Each connected group of cells is one pool, baked whole in eight
    // frames the first time a level needs it, and drawn as one picture over
    // its own opaque bed. The surface stands `LAVA.rise` above the top cells
    // -- lava heaps up over its basin rather than sitting in it -- and the
    // picture is placed `POOL_HEADROOM` above them to leave room for that.
    // The rectangle that kills rises with it: see `GameScene.buildLava`.
    const palette = THEMES[theme as ThemeName];
    groupLavaPools(zones).forEach((pool, index) => {
      const keys: string[] = [];
      for (let frame = 0; frame < POOL_FRAMES; frame += 1) {
        const key = `${theme}:lava-pool:${pool.x},${pool.y}:${frame}`;
        if (!scene.textures.exists(key)) {
          bakeLavaPool(scene, key, pool, palette, frame, 7000 + pool.x * 7 + pool.y * 13);
        }
        keys.push(key);
      }
      const image = scene.add
        .image(pool.x, pool.y - POOL_HEADROOM, keys[0])
        .setOrigin(0, 0)
        .setAlpha(0.93)
        .setDepth(20);
      this.pools.push({ image, keys, phase: (index * 3) % POOL_FRAMES });
    });

    for (const zone of zones) {
      // The bed, behind the cat, so nothing shows through the lava.
      scene.add
        .image(zone.x, zone.y, tileKey(theme, 'lava'))
        .setOrigin(0, 0)
        .setDepth(-8);

      if (!zone.isSurface) {
        continue;
      }

      // Where the surface meets ground on the same row, a tongue of lava has
      // crept over the edge onto it.
      for (const side of [-1, 1] as const) {
        if (groundAt(zone.x + side * TILE, zone.y)) {
          const x = side < 0 ? zone.x : zone.x + TILE;
          scene.add
            .image(x, zone.y - LAVA.rise, tileKey(theme, 'lava-lip'))
            .setOrigin(side < 0 ? 1 : 0, 0)
            .setFlipX(side < 0)
            .setAlpha(0.95)
            .setDepth(20);
        }
      }

      this.vents.push(new Phaser.Math.Vector2(zone.x + TILE / 2, zone.y - LAVA.rise));

      this.addHaze(zone);
    }
  }

  /**
   * The heat standing over one tile of surface.
   *
   * A soft column, brightest at the foot and ragged at the top, that
   * breathes in and out and sways a little. Drawn *under* the lava's own
   * depth so the crust stays the brightest thing, and given the tile's own
   * delay so the haze ripples along the lake rather than throbbing. The
   * wisps that lift off it are `spit`'s cousin: see `step`.
   */
  private addHaze(zone: WaterZone): void {
    const haze = this.scene.add
      .image(zone.x + TILE / 2, zone.y - LAVA.rise + 1, tileKey(this.theme, 'heat'))
      .setOrigin(0.5, 1)
      .setScale(1, LAVA.hazeHeight / 32)
      .setDepth(19)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    const delay = ((zone.x / TILE) % 7) * 180;
    this.scene.tweens.add({
      targets: haze,
      scaleY: { from: (LAVA.hazeHeight / 32) * 0.7, to: (LAVA.hazeHeight / 32) * 1.25 },
      alpha: { from: 0.3, to: 0.7 },
      duration: LAVA.hazeBreathMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay,
    });
    this.scene.tweens.add({
      targets: haze,
      x: { from: zone.x + TILE / 2 - 1.5, to: zone.x + TILE / 2 + 1.5 },
      duration: LAVA.hazeBreathMs * 0.77,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: delay * 0.6,
    });
  }

  /** Advances the boil, the gobbets and the wisps. Called from the scene each frame. */
  step(delta: number): void {
    this.boil(delta);
    this.spit(delta);
    this.drift(delta);
  }

  private boil(delta: number): void {
    this.boilClock += delta;

    // Pools start at different points in the cycle, so two lakes on one
    // screen do not blink in step.
    for (const pool of this.pools) {
      const frame = Math.floor(this.boilClock / LAVA.boilFrameMs + pool.phase) % POOL_FRAMES;
      pool.image.setTexture(pool.keys[frame]);
    }
  }

  /**
   * Wisps of heat: every so often one lifts off a random vent, rises, swells
   * and thins to nothing. Moved by hand like the gobbets, for the same
   * reason, and capped so a long lake does not fill the air.
   */
  private drift(delta: number): void {
    this.wispClock += delta;

    if (this.vents.length > 0 && this.wispClock >= LAVA.wispEveryMs && this.wisps.length < 18) {
      this.wispClock = 0;
      const vent = Phaser.Utils.Array.GetRandom(this.vents);
      const sprite = this.scene.add
        .image(vent.x + Phaser.Math.Between(-5, 5), vent.y - 2, tileKey(this.theme, 'wisp'))
        .setDepth(19)
        .setAlpha(0.6)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.wisps.push({ sprite, life: LAVA.wispLifeMs, vx: Phaser.Math.Between(-6, 6) });
    }

    for (let i = this.wisps.length - 1; i >= 0; i -= 1) {
      const wisp = this.wisps[i];
      wisp.life -= delta;
      const t = 1 - wisp.life / LAVA.wispLifeMs;
      wisp.sprite.y -= LAVA.wispRise * (delta / 1000);
      wisp.sprite.x += wisp.vx * (delta / 1000);
      wisp.sprite.setScale(1 + t * 0.9);
      wisp.sprite.setAlpha(0.6 * (1 - t));

      if (wisp.life <= 0) {
        wisp.sprite.destroy();
        this.wisps.splice(i, 1);
      }
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

    sound.playAt('bubble', vent.x, vent.y);

    this.spits.push({
      sprite,
      life: LAVA.spitLifeMs,
      vy: -Phaser.Math.Between(LAVA.spitSpeedMin, LAVA.spitSpeedMax),
      vx: Phaser.Math.Between(-LAVA.spitDrift, LAVA.spitDrift),
    });
  }
}
