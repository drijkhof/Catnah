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
  /** In Bob's rocket, after the moon: the robots' worlds are open, the Moon not. */
  rocket?: boolean;
  /** The world the cat has just come from, if any: the flight starts beside it. */
  from?: string;
}

/** A world out here: where it hangs, how big, and which level it is. */
interface World {
  name: PlanetName;
  /** The level it starts, or '' for the Earth, which is never landed on. */
  level: string;
  x: number;
  y: number;
  scale: number;
}

/**
 * Where every world hangs in space, the Earth in the middle. Fly into one
 * that is open and its level starts.
 */
const WORLDS: World[] = [
  { name: 'earth', level: '', x: 0, y: 0, scale: 2.6 },
  { name: 'moon', level: 'Moon', x: 330, y: -190, scale: 1.1 },
  { name: 'venus', level: 'Venus', x: -650, y: 350, scale: 1.4 },
  { name: 'mars', level: 'Mars', x: 750, y: -550, scale: 1.5 },
  { name: 'jupiter', level: 'Jupiter', x: 1500, y: 400, scale: 2 },
  { name: 'saturn', level: 'Saturn', x: -700, y: -900, scale: 1.5 },
  { name: 'uranus', level: 'Uranus', x: 500, y: -1500, scale: 1.4 },
  { name: 'neptune', level: 'Neptune', x: 1700, y: -800, scale: 1.4 },
  { name: 'pluto', level: 'Pluto', x: -1100, y: -1600, scale: 1.8 },
];

/**
 * Space: where the cat flies between the worlds.
 *
 * It is **flown**, not walked -- any direction, with the same keys and stick
 * as ever -- through stars in three layers, clouds of glowing gas, the ISS
 * going round the Earth, and a battle station and a starship firing at each
 * other. Nothing out here can hurt it. **Every world hangs out here** with
 * its name under it: fly into an open one and its level starts. The first
 * time out (from the sand path) only the Moon is open; in Bob's rocket every
 * robots' world is, with its parts found under its name, and the Moon again
 * once all the parts are found. Arrows at the edge of the screen point to
 * the open worlds out of sight. The flight starts beside the world the cat
 * has just left.
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
  /** The worlds out here, and whether each can be landed on this time. */
  private worlds: Array<World & { image: Phaser.GameObjects.Image; open: boolean; radius: number }> = [];
  /** Arrows at the edge of the screen, pointing at the open worlds out of sight. */
  private arrows!: Phaser.GameObjects.Graphics;
  /** The battle station, and the line that comes up when the cat is near it. */
  private station!: Phaser.GameObjects.Image;
  private stationWords!: CrispText;
  /** Where the station drifts about, and the starship going round it. */
  private stationHome = new Phaser.Math.Vector2();
  private ship!: Phaser.GameObjects.Image;
  /** Planets out here, for the laser to keep clear of. */
  private planets: Phaser.GameObjects.Image[] = [];
  /** The cat's speech bubble, behind those words. */
  private catBubble!: Phaser.GameObjects.Graphics;
  private starLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; factor: number }> = [];
  private trailIn = 0;
  private going = false;
  private words: CrispText[] = [];

  constructor() {
    super('Space');
  }

  init(data: Carry): void {
    this.carry = data;
    this.velocity.set(0, 0);
    this.starLayers = [];
    this.trailIn = 0;
    this.going = false;
    this.words = [];
    this.planets = [];
    this.worlds = [];
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

    // A few nameless planets far out, for company.
    for (const kind of ['ice', 'violet', 'ice', 'violet', 'moon', 'ice'] as const) {
      const angle = random() * Math.PI * 2;
      const distance = 2200 + random() * 500;
      this.planets.push(
        this.add
          .image(this.earth.x + Math.cos(angle) * distance, this.earth.y + Math.sin(angle) * distance, `planet-${kind}`)
          .setScale(0.8 + random())
          .setDepth(-50),
      );
    }

    // The worlds, each with its name under it -- and, in Bob's rocket, how
    // many of its parts are found. The first time out only the Moon can be
    // landed on; in the rocket every world the robots hold, but not the
    // Moon, until all the parts are found and it is time to take them to
    // Bob. Never the Earth.
    const rocket = this.carry.rocket ?? false;
    const complete = (this.carry.parts ?? []).length >= PARTS.total;
    for (const world of WORLDS) {
      const x = this.earth.x + world.x;
      const y = this.earth.y + world.y;
      const image = this.add.image(x, y, `planet-${world.name}`).setScale(world.scale).setDepth(-40);
      const open = world.level === 'Moon' ? !rocket || complete : world.level !== '' && rocket;
      const radius = (PLANET_SIZES[world.name] * world.scale) / 2;
      this.worlds.push({ ...world, x, y, image, open, radius });
      if (world.level !== 'Moon' && world.level !== '') {
        this.planets.push(image);
      }
      const definition = LEVELS.find((level) => level.name === world.level);
      const total = definition ? definition.rows.join('').split('K').length - 1 : 0;
      const got = (this.carry.parts ?? []).filter((id) => id.startsWith(`${world.level}:`)).length;
      const name = world.level || 'Earth';
      const label = rocket && total > 0 ? `${name} ${got}/${total}` : name;
      this.words.push(
        crispText(this, x, y + radius + 12, label, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: open ? '#ffe9a8' : '#8a94a8',
          stroke: '#02030a',
          strokeThickness: 3,
        })
          .setOrigin(0.5)
          .setDepth(-39),
      );
    }

    // The battle station, out there between the Earth and the rest: seen,
    // never entered. Come near and the cat says so, in a bubble over its
    // head that follows it about.
    this.stationHome = new Phaser.Math.Vector2(this.earth.x + 900, this.earth.y + 950);
    this.station = this.add.image(this.stationHome.x, this.stationHome.y, 'battle-station').setDepth(-38);
    // And the starship, going round it, the two of them firing at each other.
    this.ship = this.add.image(0, 0, 'starship').setDepth(-37);
    this.drift();
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
    this.time.addEvent({ delay: LASER.shipEveryMs, loop: true, callback: () => this.fireShip() });

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

    // The cat, just off the world it has come from: the Earth the first
    // time, the Moon when Bob's rocket takes off, or the planet it has just
    // left. Off to one side, so it is not straight back in.
    const home =
      this.worlds.find((world) => world.level === this.carry.from) ??
      this.worlds.find((world) => world.level === (this.carry.rocket ? 'Moon' : '')) ??
      this.worlds[0];
    const start = new Phaser.Math.Vector2(home.x + home.radius + 50, home.y - 20);
    this.cat = this.add
      .image(start.x, start.y, this.carry.rocket ? 'rocket' : 'cat-swim-a')
      .setDepth(10);
    this.arrows = this.add.graphics().setScrollFactor(0).setDepth(200);
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

    const hint = crispText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.14, !rocket
        ? 'Fly to the Moon!'
        : complete
          ? 'Take the parts to Bob on the Moon!'
          : 'Fly to a planet and find the parts!', {
      fontFamily: 'monospace',
      fontSize: `${Math.round(GAME_HEIGHT * 0.07)}px`,
      color: '#bfe3ff',
      stroke: '#0a1430',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setScrollFactor(0);
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

    this.drift();

    if (this.going) {
      return;
    }

    this.fly(delta);
    this.pointAtWorlds();

    // Into an open world: its level starts.
    for (const world of this.worlds) {
      if (world.open && Phaser.Math.Distance.Between(this.cat.x, this.cat.y, world.x, world.y) < world.radius * 0.85) {
        this.goTo(world.level);
        return;
      }
    }

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
  }

  /**
   * An arrow at the edge of the screen for every open world out of sight,
   * pointing the way to it -- space is big, and a world off screen is easy
   * to lose.
   */
  private pointAtWorlds(): void {
    const camera = this.cameras.main;
    const view = camera.worldView;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.arrows.clear();
    for (const world of this.worlds) {
      if (!world.open || view.contains(world.x, world.y)) {
        continue;
      }
      const angle = Math.atan2(world.y - (view.y + view.height / 2), world.x - (view.x + view.width / 2));
      // Where the line from the middle of the screen leaves it, pulled in a little.
      const reach = Math.min((cx - 18) / Math.abs(Math.cos(angle) || 1e-6), (cy - 18) / Math.abs(Math.sin(angle) || 1e-6));
      const x = cx + Math.cos(angle) * reach;
      const y = cy + Math.sin(angle) * reach;
      const tip = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const side = new Phaser.Math.Vector2(-tip.y, tip.x);
      this.arrows.fillStyle(0xffe9a8, 0.85);
      // Long and narrow, so it reads as pointing, not as a wedge.
      this.arrows.fillTriangle(
        x + tip.x * 10, y + tip.y * 10,
        x - tip.x * 7 + side.x * 4, y - tip.y * 7 + side.y * 4,
        x - tip.x * 7 - side.x * 4, y - tip.y * 7 - side.y * 4,
      );
    }
  }

  /**
   * Things a beam must keep clear of: the cat, the Earth, the Moon and every
   * planet out here. Nothing that is fired out here is fired at any of them.
   */
  private avoidList(): Array<{ x: number; y: number; r: number }> {
    return [
      { x: this.cat.x, y: this.cat.y, r: LASER.clearance },
      { x: this.earth.x, y: this.earth.y, r: 260 },
      ...this.worlds.map((world) => ({ x: world.x, y: world.y, r: world.radius + 40 })),
      ...this.planets.map((planet) => ({ x: planet.x, y: planet.y, r: planet.displayWidth / 2 + 40 })),
    ];
  }

  /** Whether a beam from one point to another keeps clear of all of those. */
  private beamIsClear(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2): boolean {
    const line = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
    return this.avoidList().every((thing) => {
      const nearest = Phaser.Geom.Line.GetNearestPoint(line, new Phaser.Math.Vector2(thing.x, thing.y));
      const onSegment =
        Math.min(from.x, to.x) - 1 <= nearest.x && nearest.x <= Math.max(from.x, to.x) + 1 &&
        Math.min(from.y, to.y) - 1 <= nearest.y && nearest.y <= Math.max(from.y, to.y) + 1;
      const point = onSegment
        ? nearest
        : Phaser.Math.Distance.Between(thing.x, thing.y, from.x, from.y) < Phaser.Math.Distance.Between(thing.x, thing.y, to.x, to.y)
          ? from
          : to;
      return Phaser.Math.Distance.Between(thing.x, thing.y, point.x, point.y) > thing.r;
    });
  }

  /** A beam: a bright core in a coloured glow, fading out. */
  private drawBeam(from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, glow: number, core: number): void {
    const beam = this.add.graphics().setDepth(-37).setBlendMode(Phaser.BlendModes.ADD);
    beam.lineStyle(7, glow, 0.35);
    beam.lineBetween(from.x, from.y, to.x, to.y);
    beam.lineStyle(3, core, 0.9);
    beam.lineBetween(from.x, from.y, to.x, to.y);
    beam.lineStyle(1, 0xffffff, 1);
    beam.lineBetween(from.x, from.y, to.x, to.y);
    if (Phaser.Math.Distance.Between(this.cat.x, this.cat.y, from.x, from.y) < GAME_WIDTH) {
      sound.play('laser');
    }
    this.tweens.add({ targets: beam, alpha: 0, duration: LASER.beamMs, ease: 'Cubic.easeIn', onComplete: () => beam.destroy() });
  }

  /** A flash where a beam lands. Nothing is hurt by it. */
  private impact(at: Phaser.Math.Vector2, tint: number): void {
    const flash = this.add.image(at.x, at.y, 'spark').setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(-36).setScale(2);
    this.tweens.add({ targets: flash, scale: 8, alpha: 0, duration: 450, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
  }

  /**
   * The battle station fires: its dish glows green for a moment, and then a
   * beam goes out -- at the starship, if the way to it is clear of the cat
   * and the planets, or otherwise out into empty space where it is clear.
   * If nothing is clear it does not fire this time.
   */
  private fireLaser(): void {
    if (this.going) {
      return;
    }
    const dish = new Phaser.Math.Vector2(this.station.x + 27, this.station.y - 27);
    let target: Phaser.Math.Vector2 | undefined;
    const ship = new Phaser.Math.Vector2(this.ship.x, this.ship.y);
    let hits = false;
    if (this.beamIsClear(dish, ship)) {
      target = ship;
      hits = true;
    } else {
      const start = Math.random() * Math.PI * 2;
      for (let i = 0; i < 24 && !target; i += 1) {
        const angle = start + (i / 24) * Math.PI * 2;
        const end = new Phaser.Math.Vector2(dish.x + Math.cos(angle) * LASER.length, dish.y + Math.sin(angle) * LASER.length);
        if (this.beamIsClear(dish, end)) {
          target = end;
        }
      }
    }
    if (!target) {
      return;
    }
    const aim = target;

    // The charge.
    const glow = this.add.image(dish.x, dish.y, 'spark').setTint(0x7aff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(-37).setScale(1);
    this.tweens.add({
      targets: glow,
      scale: 6,
      duration: LASER.chargeMs,
      ease: 'Sine.easeIn',
      onComplete: () => {
        glow.destroy();
        // The ship has moved on a little while the dish charged: aim again.
        const end = hits ? new Phaser.Math.Vector2(this.ship.x, this.ship.y) : aim;
        this.drawBeam(dish, end, 0x3aff5a, 0x9fff9f);
        if (hits) {
          this.impact(end, 0x9fff9f);
        }
      },
    });
  }

  /**
   * The starship fires back: a short orange phaser from its saucer to the
   * station's near side, if the way is clear of the cat and the planets.
   */
  private fireShip(): void {
    if (this.going) {
      return;
    }
    const facing = this.ship.flipX ? -1 : 1;
    const from = new Phaser.Math.Vector2(this.ship.x + 16 * facing, this.ship.y - 5);
    const toward = new Phaser.Math.Vector2(this.station.x - from.x, this.station.y - from.y).normalize();
    const to = new Phaser.Math.Vector2(this.station.x - toward.x * 70, this.station.y - toward.y * 70);
    if (!this.beamIsClear(from, to)) {
      return;
    }
    this.drawBeam(from, to, 0xff7a2a, 0xffc080);
    this.impact(to, 0xffb060);
  }

  /**
   * The station and the starship drift: the station round a small, slow
   * circle about where it was put, the ship round the station, facing it.
   */
  private drift(): void {
    const t = this.time.now;
    const a = (t / LASER.stationDriftMs) * Math.PI * 2;
    this.station.setPosition(this.stationHome.x + Math.cos(a) * LASER.stationDrift, this.stationHome.y + Math.sin(a) * LASER.stationDrift * 0.6);
    const b = (t / LASER.shipOrbitMs) * Math.PI * 2;
    this.ship.setPosition(this.station.x + Math.cos(b) * LASER.shipOrbit.x, this.station.y + Math.sin(b) * LASER.shipOrbit.y);
    this.ship.setFlipX(this.station.x < this.ship.x);
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
