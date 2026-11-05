import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SPACE } from '../config';
import { Controls } from '../input/Controls';
import { HEAD_IN_POSE, PLANET_SIZES, STARFIELD_SIZE, createRandom, type PlanetName } from '../art';
import { sound } from '../audio/Sound';
import { crispText, type CrispText } from '../text';

/** What a run carries from level to level, passed straight through this scene. */
interface Carry {
  levelIndex: number;
  lives?: number;
  maxLives?: number;
  collected?: number;
  elapsedMs?: number;
  deaths?: number;
}

/**
 * Between the sand path and the moon: the cat flies out through space.
 *
 * It starts beside the Earth and is **flown**, not walked -- any direction,
 * with the same keys and stick as ever -- through stars in three layers,
 * clouds of glowing gas and planets drifting by. Nothing out here can hurt
 * it. Once it is far enough from the Earth (`SPACE.mapDistance`), or has
 * been out long enough (`SPACE.mapAfterMs`), the **map** comes up: the
 * Earth, the Moon, Mars and Saturn. Only the Moon can be picked -- tapped,
 * clicked, or a key pressed -- and that starts the moon level.
 *
 * The run's clock does not count while out here: the time is the time
 * spent in levels.
 */
export class SpaceScene extends Phaser.Scene {
  private carry: Carry = { levelIndex: 0 };
  private controls!: Controls;
  private cat!: Phaser.GameObjects.Image;
  /** The space helmet on the cat's head. */
  private helmet!: Phaser.GameObjects.Image;
  private velocity = new Phaser.Math.Vector2();
  private earth = new Phaser.Math.Vector2();
  private starLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; factor: number }> = [];
  private flownMs = 0;
  private trailIn = 0;
  private mapShown = false;
  private going = false;
  private words: CrispText[] = [];

  constructor() {
    super('Space');
  }

  init(data: Carry): void {
    this.carry = data;
    this.velocity.set(0, 0);
    this.starLayers = [];
    this.flownMs = 0;
    this.trailIn = 0;
    this.mapShown = false;
    this.going = false;
    this.words = [];
  }

  create(): void {
    const size = SPACE.worldSize;
    this.cameras.main.setBackgroundColor('#04050c');
    this.cameras.main.setBounds(0, 0, size, size);
    this.earth.set(size / 2, size / 2);

    // Stars: pinned to the screen and scrolled by hand, each layer at its
    // own fraction of the camera's movement, so they never run out.
    for (const [key, factor, depth] of [
      ['stars-far', 0.1, -100],
      ['stars-mid', 0.25, -99],
      ['stars-near', 0.5, -98],
    ] as const) {
      const sprite = this.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth);
      this.starLayers.push({ sprite, factor });
    }

    const random = createRandom(31337);

    // Clouds of gas, big and faint, in a few colours.
    const tints = [0x8a4adf, 0x3a7adf, 0xdf4a9a, 0x4adfc8];
    for (let i = 0; i < 26; i += 1) {
      this.add
        .image(random() * size, random() * size, 'nebula')
        .setScale(2.5 + random() * 4)
        .setTint(tints[Math.floor(random() * tints.length)])
        .setAlpha(0.55)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-90);
    }

    // Planets, scattered, none too near the Earth.
    const kinds: PlanetName[] = ['mars', 'saturn', 'jupiter', 'ice', 'violet', 'moon'];
    let placed = 0;
    while (placed < 30) {
      const x = random() * size;
      const y = random() * size;
      if (Phaser.Math.Distance.Between(x, y, this.earth.x, this.earth.y) < 500) {
        continue;
      }
      const kind = kinds[Math.floor(random() * kinds.length)];
      this.add
        .image(x, y, `planet-${kind}`)
        .setScale(0.6 + random() * 1.2)
        .setDepth(-50);
      placed += 1;
    }

    // The Earth, big, with the Moon beside it.
    this.add.image(this.earth.x, this.earth.y, 'planet-earth').setScale(2.6).setDepth(-40);
    this.add
      .image(this.earth.x + 330, this.earth.y - 190, 'planet-moon')
      .setScale(1.1)
      .setDepth(-40);

    // The cat, just off the Earth, heading out.
    this.cat = this.add
      .image(this.earth.x + PLANET_SIZES.earth * 1.4, this.earth.y - 40, 'cat-swim-a')
      .setDepth(10);
    this.helmet = this.add.image(0, 0, 'space-helmet').setDepth(11);
    this.velocity.set(90, -30);
    this.cameras.main.startFollow(this.cat, true, 0.1, 0.1);

    this.controls = new Controls(this);

    sound.setAmbience('hush');
    sound.play('whoosh');

    // Up out of black, the way the sand path went down into it.
    const black = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3000);
    this.tweens.add({ targets: black, alpha: 0, duration: 900, onComplete: () => black.destroy() });

    const hint = crispText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.14, 'Fly away from Earth!', {
      fontFamily: 'monospace',
      fontSize: `${Math.round(GAME_HEIGHT * 0.07)}px`,
      color: '#bfe3ff',
      stroke: '#0a1430',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.words.push(hint);
    this.tweens.add({ targets: hint, alpha: 0, delay: 3500, duration: 1200 });
  }

  update(_time: number, delta: number): void {
    this.controls.update();

    // The stars follow the camera at a fraction of its pace.
    const camera = this.cameras.main;
    for (const layer of this.starLayers) {
      layer.sprite.tilePositionX = (camera.scrollX * layer.factor) % STARFIELD_SIZE;
      layer.sprite.tilePositionY = (camera.scrollY * layer.factor) % STARFIELD_SIZE;
    }

    if (this.mapShown) {
      return;
    }

    this.fly(delta);

    this.flownMs += delta;
    const away = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.earth.x, this.earth.y);
    if (away >= SPACE.mapDistance || this.flownMs >= SPACE.mapAfterMs) {
      this.showMap();
    }
  }

  /**
   * Thrust towards whatever is held, drag when nothing is, a top speed, and
   * the cat turned to face where it is going.
   */
  private fly(delta: number): void {
    const dt = delta / 1000;
    const input = new Phaser.Math.Vector2(
      (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0),
      (this.controls.sneak ? 1 : 0) - (this.controls.up || this.controls.jumpHeld ? 1 : 0),
    );

    if (input.lengthSq() > 0) {
      input.normalize().scale(SPACE.accel * dt);
      this.velocity.add(input);
    } else {
      const speed = this.velocity.length();
      if (speed > 0) {
        this.velocity.scale(Math.max(0, speed - SPACE.drag * dt) / speed);
      }
    }
    if (this.velocity.length() > SPACE.maxSpeed) {
      this.velocity.setLength(SPACE.maxSpeed);
    }

    const margin = 40;
    this.cat.x = Phaser.Math.Clamp(this.cat.x + this.velocity.x * dt, margin, SPACE.worldSize - margin);
    this.cat.y = Phaser.Math.Clamp(this.cat.y + this.velocity.y * dt, margin, SPACE.worldSize - margin);

    if (this.velocity.lengthSq() > 25) {
      // Facing the way it flies: the picture faces right, so a cat flying
      // left is flipped rather than turned upside down.
      const left = this.velocity.x < 0;
      this.cat.setFlipX(left);
      const angle = Math.atan2(this.velocity.y, Math.abs(this.velocity.x));
      this.cat.setRotation(left ? -angle : angle);
    }

    // The helmet on its head: the head's place in the picture, from the
    // picture's middle, flipped and turned with the cat.
    const head = HEAD_IN_POSE.standing;
    const offset = new Phaser.Math.Vector2((head.x - this.cat.width / 2) * (this.cat.flipX ? -1 : 1), head.y - this.cat.height / 2);
    offset.rotate(this.cat.rotation);
    this.helmet.setPosition(this.cat.x + offset.x, this.cat.y + offset.y).setRotation(this.cat.rotation);

    // A trail of sparks behind it while it is moving.
    this.trailIn -= delta;
    if (this.trailIn <= 0 && this.velocity.lengthSq() > 900) {
      this.trailIn = 45;
      const spark = this.add
        .image(this.cat.x - this.velocity.x * 0.05, this.cat.y - this.velocity.y * 0.05 + 3, 'spark')
        .setTint(0x9fd8ff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);
      this.tweens.add({ targets: spark, alpha: 0, scale: 0.2, duration: 600, onComplete: () => spark.destroy() });
    }
  }

  /**
   * The map: space darkens, and four worlds come up in a row along a dotted
   * line from the Earth. The Moon pulses and can be picked; Mars and Saturn
   * are there to be looked at, dimmed, and cannot.
   */
  private showMap(): void {
    this.mapShown = true;

    const veil = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02030a, 0.8)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0);
    this.tweens.add({ targets: veil, alpha: 1, duration: 700 });

    const y = GAME_HEIGHT * 0.52;
    const stops: Array<{ name: PlanetName; label: string; x: number; scale: number; open: boolean }> = [
      { name: 'earth', label: 'Earth', x: 0.13, scale: 0.42, open: false },
      { name: 'moon', label: 'Moon', x: 0.38, scale: 0.9, open: true },
      { name: 'mars', label: 'Mars', x: 0.62, scale: 0.8, open: false },
      { name: 'saturn', label: 'Saturn', x: 0.86, scale: 0.6, open: false },
    ];

    const line = this.add.graphics().setScrollFactor(0).setDepth(101).setAlpha(0);
    line.fillStyle(0x8fa8d8, 0.6);
    for (let x = GAME_WIDTH * 0.13; x < GAME_WIDTH * 0.86; x += 8) {
      line.fillRect(x, y, 4, 1);
    }
    this.tweens.add({ targets: line, alpha: 1, duration: 700 });

    const labelSize = Math.round(GAME_HEIGHT * 0.055);
    for (const stop of stops) {
      const planet = this.add
        .image(GAME_WIDTH * stop.x, y, `planet-${stop.name}`)
        .setScale(stop.scale)
        .setScrollFactor(0)
        .setDepth(102)
        .setAlpha(0);
      const shown = stop.open || stop.name === 'earth' ? 1 : 0.45;
      this.tweens.add({ targets: planet, alpha: shown, duration: 700 });

      const label = crispText(this, GAME_WIDTH * stop.x, y + PLANET_SIZES.moon * 0.75, stop.label, {
        fontFamily: 'monospace',
        fontSize: `${labelSize}px`,
        color: stop.open ? '#ffe9a8' : '#8a94a8',
        stroke: '#02030a',
        strokeThickness: 3,
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setAlpha(0);
      this.words.push(label);
      this.tweens.add({ targets: label, alpha: 1, duration: 700 });

      if (!stop.open) {
        continue;
      }
      // The one that can be picked: it breathes, and a ring circles it.
      this.tweens.add({
        targets: planet,
        scale: { from: stop.scale, to: stop.scale * 1.12 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      const ring = this.add
        .circle(GAME_WIDTH * stop.x, y, PLANET_SIZES.moon * stop.scale * 0.72)
        .setStrokeStyle(2, 0xffe9a8, 0.8)
        .setScrollFactor(0)
        .setDepth(101);
      this.tweens.add({ targets: ring, alpha: { from: 0.9, to: 0.2 }, duration: 900, yoyo: true, repeat: -1 });
      // A generous target: the planet and some room round it.
      planet.setInteractive(
        new Phaser.Geom.Circle(PLANET_SIZES.moon / 2, PLANET_SIZES.moon / 2, PLANET_SIZES.moon * 0.8),
        Phaser.Geom.Circle.Contains,
      );
      planet.input!.cursor = 'pointer';
      planet.on('pointerdown', () => this.goToMoon());
    }

    const title = crispText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.16, 'Where should we go?', {
      fontFamily: 'monospace',
      fontSize: `${Math.round(GAME_HEIGHT * 0.075)}px`,
      color: '#ffe9a8',
      stroke: '#02030a',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0);
    this.words.push(title);
    this.tweens.add({ targets: title, alpha: 1, duration: 700 });

    // On a keyboard, the only choice is a key away. Held keys from flying do
    // not count: a fresh press, after the map has had a moment.
    this.time.delayedCall(700, () => {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!event.repeat) {
          this.goToMoon();
        }
      });
    });
  }

  /** Off to the moon: fade to black and start its level, with the run as it was. */
  private goToMoon(): void {
    if (this.going) {
      return;
    }
    this.going = true;
    sound.play('portal');
    const black = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3000)
      .setAlpha(0);
    this.tweens.add({ targets: this.words, alpha: 0, duration: 650 });
    this.tweens.add({
      targets: black,
      alpha: 1,
      duration: 650,
      onComplete: () => this.scene.start('Game', this.carry),
    });
  }
}
