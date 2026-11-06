import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LASER, PARTS, SPACE } from '../config';
import { LEVELS } from '../level/levels';
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
  /** Bob's parts found so far, as `<level>:<x>,<y>`. */
  parts?: string[];
  /** In Bob's rocket, after the moon: Mars and Saturn are open, the Moon not. */
  rocket?: boolean;
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
  /** Where the flight starts: the map comes up once the cat is far enough from here. */
  private start = new Phaser.Math.Vector2();
  /** On the map: the planets that can be picked, and which one the keyboard is on. */
  private choices: Array<{ level: string; ring: Phaser.GameObjects.Arc }> = [];
  private chosen = 0;
  /** The battle station, and the line that comes up when the cat is near it. */
  private station!: Phaser.GameObjects.Image;
  private stationWords!: CrispText;
  /** Planets out here, for the laser to keep clear of. */
  private planets: Phaser.GameObjects.Image[] = [];
  /** The cat's speech bubble, behind those words. */
  private catBubble!: Phaser.GameObjects.Graphics;
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
    this.choices = [];
    this.chosen = 0;
    this.planets = [];
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
    const kinds: PlanetName[] = ['mars', 'saturn', 'jupiter', 'venus', 'uranus', 'neptune', 'pluto', 'ice', 'violet', 'moon'];
    let placed = 0;
    while (placed < 30) {
      const x = random() * size;
      const y = random() * size;
      if (Phaser.Math.Distance.Between(x, y, this.earth.x, this.earth.y) < 500) {
        continue;
      }
      const kind = kinds[Math.floor(random() * kinds.length)];
      this.planets.push(this.add
        .image(x, y, `planet-${kind}`)
        .setScale(0.6 + random() * 1.2)
        .setDepth(-50));
      placed += 1;
    }

    // The battle station, out there between the Earth and the rest: seen,
    // never entered. Come near and the cat says so, in a bubble over its
    // head that follows it about.
    this.station = this.add
      .image(this.earth.x + 600, this.earth.y - 470, 'battle-station')
      .setDepth(-38);
    this.catBubble = this.add.graphics().setDepth(12).setAlpha(0);
    this.stationWords = crispText(this, 0, 0, "That's no moon...", {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#1a2030',
    })
      .setOrigin(0.5)
      .setDepth(13)
      .setAlpha(0);
    this.words.push(this.stationWords);

    // It fires, now and then, out into nothing.
    this.time.addEvent({ delay: LASER.everyMs, loop: true, callback: () => this.fireLaser() });

    // The ISS, going round the Earth -- only ever seen, never landed on.
    const iss = this.add.image(0, 0, 'planet-iss').setScale(0.7).setDepth(-39);
    const orbit = { angle: -0.6 };
    const radius = PLANET_SIZES.earth * 1.3 + 30;
    const placeIss = (): void => {
      iss.setPosition(this.earth.x + Math.cos(orbit.angle) * radius, this.earth.y + Math.sin(orbit.angle) * radius * 0.55);
      iss.setRotation(orbit.angle * 0.2);
    };
    placeIss();
    this.tweens.add({ targets: orbit, angle: orbit.angle + Math.PI * 2, duration: 40000, repeat: -1, onUpdate: placeIss });

    // The Earth, big, with the Moon beside it.
    this.add.image(this.earth.x, this.earth.y, 'planet-earth').setScale(2.6).setDepth(-40);
    this.add
      .image(this.earth.x + 330, this.earth.y - 190, 'planet-moon')
      .setScale(1.1)
      .setDepth(-40);

    // The cat, just off the Earth, heading out -- or, in Bob's rocket, just
    // off the Moon, with the cat in its window.
    const moon = new Phaser.Math.Vector2(this.earth.x + 330, this.earth.y - 190);
    this.start = this.carry.rocket
      ? new Phaser.Math.Vector2(moon.x + 90, moon.y - 20)
      : new Phaser.Math.Vector2(this.earth.x + PLANET_SIZES.earth * 1.4, this.earth.y - 40);
    this.cat = this.add
      .image(this.start.x, this.start.y, this.carry.rocket ? 'rocket' : 'cat-swim-a')
      .setDepth(10);
    this.helmet = this.add.image(0, 0, 'space-helmet').setDepth(11).setVisible(!this.carry.rocket);
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

    const hint = crispText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.14, !this.carry.rocket
        ? 'Fly away from Earth!'
        : (this.carry.parts ?? []).length >= PARTS.total
          ? 'Take the parts to Bob!'
          : 'Find the parts!', {
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

    // Near the battle station, the cat says what it sees; away, it stops.
    const near = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.station.x, this.station.y) < 220;
    const shown = Phaser.Math.Linear(this.stationWords.alpha, near ? 1 : 0, 0.08);
    const width = this.stationWords.width + 12;
    const height = 18;
    const x = this.cat.x - width / 2;
    const y = this.cat.y - 22 - height;
    this.catBubble.clear();
    this.catBubble.fillStyle(0xffffff, 0.95);
    this.catBubble.fillRoundedRect(x, y, width, height, 5);
    this.catBubble.fillTriangle(this.cat.x - 3, y + height, this.cat.x + 3, y + height, this.cat.x, y + height + 5);
    this.catBubble.setAlpha(shown);
    this.stationWords.setPosition(this.cat.x, y + height / 2).setAlpha(shown);

    this.flownMs += delta;
    const away = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.start.x, this.start.y);
    if (away >= SPACE.mapDistance || this.flownMs >= SPACE.mapAfterMs) {
      this.showMap();
    }
  }

  /**
   * The battle station fires: its dish glows green for a moment, and then a
   * beam goes out from it into empty space. The way it fires is picked so
   * the beam passes well clear of the cat, the Earth, the Moon and every
   * planet out here -- it is a sight, not a danger. If no way is clear it
   * does not fire this time.
   */
  private fireLaser(): void {
    if (this.mapShown) {
      return;
    }
    const dish = new Phaser.Math.Vector2(this.station.x + 27, this.station.y - 27);
    const avoid: Array<{ x: number; y: number; r: number }> = [
      { x: this.cat.x, y: this.cat.y, r: LASER.clearance },
      { x: this.earth.x, y: this.earth.y, r: 260 },
      { x: this.earth.x + 330, y: this.earth.y - 190, r: 80 },
      ...this.planets.map((planet) => ({ x: planet.x, y: planet.y, r: planet.displayWidth / 2 + 40 })),
    ];
    // Distance from a point to the beam's segment.
    const clear = (angle: number): boolean => {
      const end = new Phaser.Math.Vector2(dish.x + Math.cos(angle) * LASER.length, dish.y + Math.sin(angle) * LASER.length);
      const line = new Phaser.Geom.Line(dish.x, dish.y, end.x, end.y);
      return avoid.every((thing) => {
        const nearest = Phaser.Geom.Line.GetNearestPoint(line, new Phaser.Math.Vector2(thing.x, thing.y));
        const onSegment =
          Math.min(dish.x, end.x) - 1 <= nearest.x && nearest.x <= Math.max(dish.x, end.x) + 1 &&
          Math.min(dish.y, end.y) - 1 <= nearest.y && nearest.y <= Math.max(dish.y, end.y) + 1;
        const point = onSegment ? nearest : Phaser.Math.Distance.Between(thing.x, thing.y, dish.x, dish.y) < Phaser.Math.Distance.Between(thing.x, thing.y, end.x, end.y) ? dish : end;
        return Phaser.Math.Distance.Between(thing.x, thing.y, point.x, point.y) > thing.r;
      });
    };
    const start = Math.random() * Math.PI * 2;
    let angle: number | undefined;
    for (let i = 0; i < 24; i += 1) {
      const candidate = start + (i / 24) * Math.PI * 2;
      if (clear(candidate)) {
        angle = candidate;
        break;
      }
    }
    if (angle === undefined) {
      return;
    }

    // The charge.
    const glow = this.add.image(dish.x, dish.y, 'spark').setTint(0x7aff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(-37).setScale(1);
    this.tweens.add({
      targets: glow,
      scale: 6,
      duration: LASER.chargeMs,
      ease: 'Sine.easeIn',
      onComplete: () => {
        glow.destroy();
        // The beam: a bright core in a green glow, out to its length.
        const beam = this.add.graphics().setDepth(-37).setBlendMode(Phaser.BlendModes.ADD);
        const end = new Phaser.Math.Vector2(dish.x + Math.cos(angle) * LASER.length, dish.y + Math.sin(angle) * LASER.length);
        beam.lineStyle(7, 0x3aff5a, 0.35);
        beam.lineBetween(dish.x, dish.y, end.x, end.y);
        beam.lineStyle(3, 0x9fff9f, 0.9);
        beam.lineBetween(dish.x, dish.y, end.x, end.y);
        beam.lineStyle(1, 0xffffff, 1);
        beam.lineBetween(dish.x, dish.y, end.x, end.y);
        if (Phaser.Math.Distance.Between(this.cat.x, this.cat.y, dish.x, dish.y) < GAME_WIDTH) {
          sound.play('laser');
        }
        this.tweens.add({ targets: beam, alpha: 0, duration: LASER.beamMs, ease: 'Cubic.easeIn', onComplete: () => beam.destroy() });
      },
    });
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

    if (this.carry.rocket && this.velocity.lengthSq() > 25) {
      // A rocket points where it goes, all the way round.
      this.cat.setRotation(Math.atan2(this.velocity.y, this.velocity.x));
    } else if (this.velocity.lengthSq() > 25) {
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
      // Behind it: the cat's sparks, or the rocket's flame from its nozzle.
      const back = this.carry.rocket ? 22 : 0;
      const heading = this.velocity.clone().normalize();
      const spark = this.add
        .image(
          this.cat.x - heading.x * back - this.velocity.x * 0.05,
          this.cat.y - heading.y * back - this.velocity.y * 0.05 + (this.carry.rocket ? 0 : 3),
          'spark',
        )
        .setTint(this.carry.rocket ? 0xffa040 : 0x9fd8ff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);
      this.tweens.add({ targets: spark, alpha: 0, scale: 0.2, duration: 600, onComplete: () => spark.destroy() });
    }
  }

  /**
   * The map: space darkens, and four worlds come up in a row along a dotted
   * line from the Earth -- the Earth, the Moon, Mars, Saturn -- and then,
   * under them, the question: "Where should we go?". The Moon pulses and can be picked; Mars and Saturn
   * are there to be looked at, dimmed, and cannot.
   */
  private showMap(): void {
    this.mapShown = true;
    // Whatever was said during the flight goes.
    this.tweens.add({ targets: [...this.words, this.catBubble], alpha: 0, duration: 300 });

    const veil = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02030a, 0.93)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0);
    this.tweens.add({ targets: veil, alpha: 1, duration: 700 });

    // The worlds in two rows, in their order out from the sun, the question
    // under them. The first time out only the Moon can be picked. In Bob's
    // rocket every world the robots hold is open but the Moon -- the parts
    // are on Mars and Saturn, each shown with how many of its five are
    // found -- until all ten are found: then the Moon opens again, to take
    // them to Bob. The Earth never.
    const rocket = this.carry.rocket ?? false;
    const parts = (this.carry.parts ?? []).length;
    const complete = parts >= PARTS.total;
    // A world's parts: how many of its own are found, out of how many it
    // has -- counted off its map, where each is a `K`.
    const found = (level: string): string => {
      const definition = LEVELS.find((candidate) => candidate.name === level);
      const total = definition ? definition.rows.join('').split('K').length - 1 : 0;
      const got = (this.carry.parts ?? []).filter((id) => id.startsWith(`${level}:`)).length;
      return `\n${got}/${total}`;
    };
    const label = (level: string): string => (rocket ? `${level}${found(level)}` : level);
    const top = GAME_HEIGHT * 0.27;
    const bottom = GAME_HEIGHT * 0.56;
    const stops: Array<{ name: PlanetName; label: string; x: number; y: number; scale: number; open: boolean; level: string }> = [
      { name: 'venus', label: label('Venus'), x: 0.12, y: top, scale: 0.55, open: rocket, level: 'Venus' },
      { name: 'earth', label: 'Earth', x: 0.31, y: top, scale: 0.28, open: false, level: '' },
      { name: 'moon', label: 'Moon', x: 0.5, y: top, scale: 0.6, open: !rocket || complete, level: 'Moon' },
      { name: 'mars', label: label('Mars'), x: 0.69, y: top, scale: 0.65, open: rocket, level: 'Mars' },
      { name: 'jupiter', label: label('Jupiter'), x: 0.88, y: top, scale: 0.4, open: rocket, level: 'Jupiter' },
      { name: 'saturn', label: label('Saturn'), x: 0.18, y: bottom, scale: 0.42, open: rocket, level: 'Saturn' },
      { name: 'uranus', label: label('Uranus'), x: 0.42, y: bottom, scale: 0.6, open: rocket, level: 'Uranus' },
      { name: 'neptune', label: label('Neptune'), x: 0.64, y: bottom, scale: 0.6, open: rocket, level: 'Neptune' },
      { name: 'pluto', label: label('Pluto'), x: 0.85, y: bottom, scale: 0.9, open: rocket, level: 'Pluto' },
    ];
    // With all the parts, the Moon is where the keyboard starts.
    const firstChoice = complete ? 'Moon' : '';

    const labelSize = Math.round(GAME_HEIGHT * 0.042);
    for (const stop of stops) {
      const planet = this.add
        .image(GAME_WIDTH * stop.x, stop.y, `planet-${stop.name}`)
        .setScale(stop.scale)
        .setScrollFactor(0)
        .setDepth(102)
        .setAlpha(0);
      const shown = stop.open ? 1 : 0.4;
      this.tweens.add({ targets: planet, alpha: shown, duration: 700 });

      const label = crispText(this, GAME_WIDTH * stop.x, stop.y + (stop.label.includes('\n') ? 34 : 30), stop.label, {
        fontFamily: 'monospace',
        fontSize: `${labelSize}px`,
        align: 'center',
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
        .circle(GAME_WIDTH * stop.x, stop.y, Math.min(26, PLANET_SIZES[stop.name] * stop.scale * 0.62))
        .setStrokeStyle(2, 0xffe9a8, 0.8)
        .setScrollFactor(0)
        .setDepth(101);
      this.tweens.add({ targets: ring, alpha: { from: 0.9, to: 0.2 }, duration: 900, yoyo: true, repeat: -1 });
      // A generous target: the planet and some room round it.
      const size = planet.width;
      planet.setInteractive(new Phaser.Geom.Circle(size / 2, planet.height / 2, 28 / stop.scale), Phaser.Geom.Circle.Contains);
      planet.input!.cursor = 'pointer';
      planet.on('pointerdown', () => this.goTo(stop.level));
      this.choices.push({ level: stop.level, ring });
    }
    this.chosen = Math.max(0, this.choices.findIndex((choice) => choice.level === firstChoice));
    this.showChoice();

    const title = crispText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.86, 'Where should we go?', {
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
    // Asked once the worlds are there to choose from.
    this.tweens.add({ targets: title, alpha: 1, delay: 900, duration: 700 });

    // On a keyboard: left and right move between the planets that can be
    // picked, and any other key goes to the one the ring is bright on. Held
    // keys from flying do not count: a fresh press, after a moment.
    this.time.delayedCall(700, () => {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (event.repeat) {
          return;
        }
        if (['ArrowLeft', 'KeyA'].includes(event.code)) {
          this.chosen = (this.chosen + this.choices.length - 1) % this.choices.length;
          this.showChoice();
          return;
        }
        if (['ArrowRight', 'KeyD'].includes(event.code)) {
          this.chosen = (this.chosen + 1) % this.choices.length;
          this.showChoice();
          return;
        }
        this.goTo(this.choices[this.chosen].level);
      });
    });
  }

  /** The keyboard's planet: its ring full, the others' rings faint. */
  private showChoice(): void {
    this.choices.forEach((choice, index) => {
      choice.ring.setStrokeStyle(index === this.chosen ? 3 : 1, 0xffe9a8, index === this.chosen ? 1 : 0.4);
    });
  }

  /** Off to a planet: fade to black and start its level, with the run as it was. */
  private goTo(levelName: string): void {
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
      onComplete: () =>
        this.scene.start('Game', {
          ...this.carry,
          levelIndex: Math.max(0, LEVELS.findIndex((level) => level.name === levelName)),
        }),
    });
  }
}
