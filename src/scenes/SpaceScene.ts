import Phaser from 'phaser';
import { addPlanetLight, faceTheSun } from '../world/planetLight';
import { BAR, CHASE, EARTH_GLOBE, ISS_CRASH, GAME_HEIGHT, GAME_WIDTH, LASER, LIVES, PARTS, PLANET_SIZE_KEEP, REAL_PLANET_SIZE, SPACE, TILE } from '../config';
import { LEVELS } from '../level/levels';
import { Controls } from '../input/Controls';
import { CHASE_DETAIL, ROCKET_DETAIL, HEAD_IN_POSE, STATION_PHOTO, STATION_SIZE, PLANET_DISCS, STARFIELD_SIZE, SPACE_SUN_SIZE, createRandom, type PlanetName } from '../art';
import { stats } from '../stats';
import { sound } from '../audio/Sound';
import { crispText, type CrispText } from '../text';
import { FuelMeter } from '../fuelMeter';
import { installFuelShortcut } from '../dev/fuelShortcut';
import { GOD_MODE_KEY } from '../dev/godMode';

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
  /** Rocket fuel left from the bar on Pluto, ms of thrust: ten times as fast out here while it lasts. */
  fuel?: number;
  /** Bob's coins, carried through. */
  coins?: number;
  coinsFound?: string[];
  /** What the cat carries to sell, carried through. */
  bag?: Record<'wallet' | 'candy' | 'hat', number>;
  itemsFound?: string[];
  /** The bar on Pluto is shut for the run, carried through. */
  barClosed?: boolean;
  /** The ISS came down on the Earth, at this angle round it, radians: gone for the run, and a crater there. */
  issDown?: number;
}

/** A world out here: its orbit, how big, and which level it is. */
interface World {
  name: PlanetName;
  /** The level it starts, or '' for the Earth, which is never landed on. */
  level: string;
  /** How far out it goes round, px: round the sun, or round the Earth for the Moon. */
  orbit: number;
  /** How long one time round takes, in Earth years (the Moon: in `SPACE.moonMonthMs`). */
  years: number;
  /** Where on its orbit it is at the start, radians. */
  angle: number;
}

/** A world's globe across, px, out here: see `REAL_PLANET_SIZE`. */
function globeOf(name: keyof typeof REAL_PLANET_SIZE): number {
  return EARTH_GLOBE * Math.pow(REAL_PLANET_SIZE[name], PLANET_SIZE_KEEP);
}

/**
 * Every world, going round the sun in the middle -- in the right order, at
 * distances squeezed to fit, and taking the real number of Earth years for
 * one time round (`SPACE.yearMs` each). Pluto takes 248 of them, and still
 * creeps along. The Moon goes round the Earth instead, and much more slowly
 * than the real month, or it could never be caught. Fly into one that is
 * open and its level starts.
 */
const WORLDS: World[] = [
  { name: 'earth', level: '', orbit: 820, years: 1, angle: 0.6 },
  { name: 'moon', level: 'Moon', orbit: 250, years: 0, angle: -0.5 },
  { name: 'venus', level: 'Venus', orbit: 330, years: 0.615, angle: 2.4 },
  { name: 'mars', level: 'Mars', orbit: 1250, years: 1.88, angle: -0.9 },
  { name: 'jupiter', level: 'Jupiter', orbit: 1900, years: 11.86, angle: 0.3 },
  { name: 'saturn', level: 'Saturn', orbit: 2750, years: 29.46, angle: -2.2 },
  { name: 'uranus', level: 'Uranus', orbit: 3500, years: 84.0, angle: -1.4 },
  { name: 'neptune', level: 'Neptune', orbit: 3900, years: 164.8, angle: -0.5 },
  { name: 'pluto', level: 'Pluto', orbit: 4250, years: 248, angle: -2.1 },
];

/**
 * Space: where the cat flies between the worlds.
 *
 * It is **flown**, not walked -- any direction, with the same keys and stick
 * as ever -- through stars in three layers, clouds of glowing gas, the ISS
 * going round the Earth, and a battle station and a starship firing at each
 * other. The **sun** burns in the middle: too close and the cat dies.
 * **Every world goes round it** with its name under it: fly into an open
 * one and its level starts. The first
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
  /** The middle of space, where the sun is. */
  private sun = new Phaser.Math.Vector2();
  /** The worlds out here, and whether each can be landed on this time. */
  private worlds: Array<World & { x: number; y: number; image: Phaser.GameObjects.Image; label: CrispText; light?: Phaser.GameObjects.Image; open: boolean; done: boolean; radius: number }> = [];
  /** Burnt by the sun: the cat is gone until it sets off again. */
  private burning = false;
  /** Arrows at the edge of the screen, pointing at the open worlds out of sight. */
  private arrows!: Phaser.GameObjects.Graphics;
  /** The battle station, and the line that comes up when the cat is near it. */
  private station!: Phaser.GameObjects.Image;
  private stationWords!: CrispText;
  /** The station's beam while it can hit: its ends, and until when. */
  /** The beams still bright enough to kill, the station's and the starship's. */
  private deadly: Array<{ from: Phaser.Math.Vector2; to: Phaser.Math.Vector2; until: number }> = [];
  /** Each world's name under it, to be written again when the parts change. */
  private labels: Array<{ level: string; text: CrispText }> = [];
  /** Where the station drifts about, and the starship going round it. */
  private stationHome = new Phaser.Math.Vector2();
  private ship!: Phaser.GameObjects.Image;
  /** The flying camper, and the fighter chasing it (`chase`). */
  private camper!: Phaser.GameObjects.Image;
  private fighter!: Phaser.GameObjects.Image;
  /** Where the camper and the fighter are, which way each is heading, and where the camper is going. */
  private flight = {
    camper: new Phaser.Math.Vector2(),
    fighter: new Phaser.Math.Vector2(),
    camperHeading: { angle: 0 },
    fighterHeading: { angle: 0 },
    target: new Phaser.Math.Vector2(),
  };
  /** Planets out here, for the laser to keep clear of. */
  private planets: Phaser.GameObjects.Image[] = [];
  /** The Moon's shadow on the Earth, when it passes in front of the sun. */
  private moonShadow?: Phaser.GameObjects.Graphics;
  /** The cat's speech bubble, behind those words. */
  private catBubble!: Phaser.GameObjects.Graphics;
  /** The ISS while it is up: its picture, where it is in its orbit, the tween that goes round. */
  private iss?: { image: Phaser.GameObjects.Image; orbit: { angle: number }; going: Phaser.Tweens.Tween; falling: boolean };
  /** When the flight began, by `clock`. */
  private arrivedAt = 0;
  /** Until when the cat is saying "... oops", by `clock`. */
  private oopsUntil = 0;
  /** Things that go with the Earth as it moves: the crash's explosion, each at its offset from the middle. */
  private onEarth: Array<{ thing: Phaser.GameObjects.Components.Transform; dx: number; dy: number }> = [];
  private starLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; factor: number }> = [];
  private trailIn = 0;
  private lifeIcons: Phaser.GameObjects.Image[] = [];
  private fuelMeter?: FuelMeter;
  private going = false;
  private words: CrispText[] = [];

  constructor() {
    super('Space');
  }

  /** How many times as fast the cat flies: the bar's rocket fuel, while it lasts. */
  private boost(): number {
    return (this.carry.fuel ?? 0) > 0 ? BAR.fuelBoost : 1;
  }

  /**
   * The hearts in the top right corner, as in a level -- the sun can take
   * one -- and the rocket fuel left beside them.
   */
  /** A full tank of rocket fuel. Development only: see `dev/fuelShortcut.ts`. */
  fillTank(): void {
    this.carry.fuel = BAR.fuelMs;
    sound.play('checkpoint');
    this.refreshHud();
  }

  private refreshHud(): void {
    const wanted = Math.max(LIVES, this.carry.maxLives ?? LIVES);
    const lives = this.carry.lives ?? LIVES;
    while (this.lifeIcons.length < wanted) {
      this.lifeIcons.push(this.add.image(0, TILE, 'life').setScrollFactor(0).setDepth(1000));
    }
    while (this.lifeIcons.length > wanted) {
      this.lifeIcons.pop()?.destroy();
    }
    this.lifeIcons.forEach((icon, index) => {
      const spent = index >= lives;
      icon.setPosition(GAME_WIDTH - TILE - index * 15, TILE).setAlpha(spent ? 0.22 : 1).setScale(spent ? 0.85 : 1);
    });
    this.fuelMeter ??= new FuelMeter(this);
    this.fuelMeter.show(GAME_WIDTH - TILE - (wanted - 1) * 15 - 12, TILE, this.carry.fuel ?? 0);
  }

  init(data: Carry): void {
    this.carry = data;
    this.velocity.set(0, 0);
    this.starLayers = [];
    this.trailIn = 0;
    this.lifeIcons = [];
    this.fuelMeter = undefined;
    this.going = false;
    this.words = [];
    this.planets = [];
    this.moonShadow = undefined;
    this.worlds = [];
    this.labels = [];
    this.deadly = [];
    this.burning = false;
  }

  create(): void {
    const size = SPACE.worldSize;
    this.cameras.main.setBackgroundColor('#04050c');
    this.cameras.main.setBounds(0, 0, size, size);
    this.cameras.main.filters.internal.clear();
    this.sun.set(size / 2, size / 2);

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

    // The sun, alive: a red haze that breathes; two manes of flame turning
    // opposite ways and swelling out of step, so they flicker where they
    // cross; the ball turning slowly, and its hottest swirls laid over it
    // twice, added, turning against each other, so the surface boils. And
    // a faint ring along every world's orbit, so the way each one goes is seen.
    const glow = this.add.image(this.sun.x, this.sun.y, 'space-sun-glow').setDepth(-62).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, scale: { from: 1, to: 1.08 }, alpha: { from: 0.8, to: 1 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const spin = (image: Phaser.GameObjects.Image, turnMs: number): void => {
      this.tweens.add({ targets: image, angle: { from: 0, to: turnMs > 0 ? 360 : -360 }, duration: Math.abs(turnMs), repeat: -1 });
    };
    const corona = [
      { key: 'space-sun-corona-a', turnMs: 90000, swell: 1.06, breathMs: 1700, flip: false },
      { key: 'space-sun-corona-b', turnMs: -70000, swell: 1.09, breathMs: 2300, flip: true },
    ];
    for (const layer of corona) {
      const flames = this.add.image(this.sun.x, this.sun.y, layer.key).setDepth(-61).setBlendMode(Phaser.BlendModes.ADD).setFlipX(layer.flip);
      spin(flames, layer.turnMs);
      this.tweens.add({ targets: flames, scale: layer.swell, alpha: { from: 1, to: 0.7 }, duration: layer.breathMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    spin(this.add.image(this.sun.x, this.sun.y, 'space-sun').setDepth(-60), 240000);
    for (const [turnMs, flip] of [[50000, false], [-36000, true]] as const) {
      const churn = this.add.image(this.sun.x, this.sun.y, 'space-sun-churn').setDepth(-59).setBlendMode(Phaser.BlendModes.ADD).setFlipY(flip);
      spin(churn, turnMs);
      this.tweens.add({ targets: churn, alpha: { from: 1, to: 0.55 }, duration: 1300 + Math.abs(turnMs) / 50, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const rings = this.add.graphics().setDepth(-58);
    rings.lineStyle(1, 0x8aa0d0, 0.18);
    for (const world of WORLDS) {
      if (world.name !== 'moon') {
        rings.strokeCircle(this.sun.x, this.sun.y, world.orbit);
      }
    }

    // The worlds, each with its name under it -- and, in Bob's rocket, how
    // many of its parts are found. The first time out only the Moon can be
    // landed on; in the rocket every world the robots hold, but not the
    // Moon, until all the parts are found and it is time to take them to
    // Bob. Never the Earth.
    const rocket = this.carry.rocket ?? false;
    const complete = (this.carry.parts ?? []).length >= PARTS.total;
    for (const world of WORLDS) {
      const globe = globeOf(world.name as keyof typeof REAL_PLANET_SIZE);
      const image = this.add.image(0, 0, `planet-${world.name}`).setScale(globe / (2 * PLANET_DISCS[world.name])).setDepth(-40);
      const open = world.level === 'Moon' ? !rocket || complete : world.level !== '' && rocket;
      const radius = globe / 2;
      if (world.level !== 'Moon' && world.level !== '') {
        this.planets.push(image);
      }
      const text = crispText(this, 0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: open ? '#ffe9a8' : '#8a94a8',
        stroke: '#02030a',
        strokeThickness: 3,
      })
        .setOrigin(0.5)
        .setDepth(-39);
      this.words.push(text);
      this.labels.push({ level: world.level, text });
      this.worlds.push({ ...world, x: 0, y: 0, image, label: text, light: addPlanetLight(this, image, world.name), open, done: false, radius });
    }
    this.orbit();
    this.refreshLabels();

    // The battle station, far out down and to the right of the Earth --
    // close enough to come across, with no arrow to it: seen,
    // never entered. Come near and the cat says so, in a bubble over its
    // head that follows it about.
    this.stationHome = new Phaser.Math.Vector2(this.sun.x + LASER.stationOrbit.x, this.sun.y + LASER.stationOrbit.y);
    this.station = this.add.image(this.stationHome.x, this.stationHome.y, 'battle-station').setScale(STATION_SIZE / (2 * STATION_PHOTO.disc)).setDepth(-38);
    // And the starship, going round it, the two of them firing at each other.
    this.ship = this.add.image(0, 0, 'starship').setDepth(-37);
    // And far out, a camper with a fighter on its tail, round and round.
    // Fairly small: three quarters of the size they were drawn at.
    this.camper = this.add.image(0, 0, 'space-camper').setScale(0.75 / CHASE_DETAIL).setDepth(-37);
    this.fighter = this.add.image(0, 0, 'space-fighter').setScale(0.75 / CHASE_DETAIL).setDepth(-37);
    // Somewhere out there, already on their way.
    const start = this.randomSpot();
    const heading = Math.random() * Math.PI * 2;
    this.flight = {
      camper: start,
      fighter: start.clone().subtract(new Phaser.Math.Vector2(Math.cos(heading), Math.sin(heading)).scale(CHASE.gap)),
      camperHeading: { angle: heading },
      fighterHeading: { angle: heading },
      target: this.randomSpot(),
    };
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

    if (this.carry.issDown !== undefined) {
      this.breakEarth(this.carry.issDown, false);
    }

    // The ISS, going round the Earth -- never landed on, and better not
    // touched (`crashIss`). Not there at all once it has come down.
    this.iss = undefined;
    this.oopsUntil = 0;
    this.arrivedAt = this.clock;
    this.onEarth = [];
    if (this.carry.issDown === undefined) {
      const iss = this.add.image(0, 0, 'planet-iss').setScale(0.7).setDepth(-39);
      const orbit = { angle: -0.6 };
      const radius = EARTH_GLOBE / 2 + 45;
      const placeIss = (): void => {
        iss.setPosition(this.earth.x + Math.cos(orbit.angle) * radius, this.earth.y + Math.sin(orbit.angle) * radius * 0.55);
        iss.setRotation(orbit.angle * 0.2);
      };
      placeIss();
      const going = this.tweens.add({ targets: orbit, angle: orbit.angle + Math.PI * 2, duration: 40000, repeat: -1, onUpdate: placeIss });
      this.iss = { image: iss, orbit, going, falling: false };
    }

    this.cat = this.add.image(0, 0, this.carry.rocket ? 'rocket' : 'cat-swim-a').setScale(this.carry.rocket ? 1 / ROCKET_DETAIL : 1).setDepth(10);
    this.arrows = this.add.graphics().setScrollFactor(0).setDepth(200);
    this.helmet = this.add.image(0, 0, 'space-helmet').setDepth(11).setVisible(!this.carry.rocket);
    this.setOff();
    this.cameras.main.startFollow(this.cat, true, 0.1, 0.1);
    this.refreshHud();

    this.controls = new Controls(this);
    if (import.meta.env.DEV) {
      // A full tank, from where a level's name would be. See `dev/fuelShortcut.ts`.
      installFuelShortcut(this);
    }

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
    this.orbit();
    for (const { thing, dx, dy } of this.onEarth) {
      thing.setPosition(this.earth.x + dx, this.earth.y + dy);
    }

    if (this.going || this.burning) {
      return;
    }

    this.fly(delta);
    this.pointAtWorlds();
    const iss = this.iss;
    // Not in the first moments: the cat sets off beside the Earth, which is
    // just where the ISS goes round, and arriving is not touching it.
    if (iss && !iss.falling && this.clock > this.arrivedAt + ISS_CRASH.graceMs && Phaser.Math.Distance.Between(this.cat.x, this.cat.y, iss.image.x, iss.image.y) < ISS_CRASH.touch) {
      this.crashIss();
    }

    // Too close to the sun: burnt.
    if (Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.sun.x, this.sun.y) < SPACE_SUN_SIZE / 2 + SPACE.sunReach) {
      this.die('sun');
      return;
    }

    // Into a beam while it lasts: dead. They fire at each other, not
    // at the cat -- but a cat in between is in the way.
    this.deadly = this.deadly.filter((beam) => this.clock <= beam.until);
    for (const beam of this.deadly) {
      const line = new Phaser.Geom.Line(beam.from.x, beam.from.y, beam.to.x, beam.to.y);
      const nearest = Phaser.Geom.Line.GetNearestPoint(line, new Phaser.Math.Vector2(this.cat.x, this.cat.y));
      const length = Phaser.Geom.Line.Length(line);
      const between =
        Phaser.Math.Distance.Between(beam.from.x, beam.from.y, nearest.x, nearest.y) <= length &&
        Phaser.Math.Distance.Between(beam.to.x, beam.to.y, nearest.x, nearest.y) <= length;
      if (between && Phaser.Math.Distance.Between(this.cat.x, this.cat.y, nearest.x, nearest.y) < LASER.hitReach) {
        this.die('laser');
        return;
      }
    }

    // Into an open world: its level starts.
    for (const world of this.worlds) {
      if (world.open && Phaser.Math.Distance.Between(this.cat.x, this.cat.y, world.x, world.y) < world.radius * 0.85) {
        this.goTo(world.level);
        return;
      }
    }

    // Near the battle station, the cat says what it sees; away, it stops.
    // Just after the ISS has come down, it says something else.
    const oops = this.clock < this.oopsUntil;
    // Back to its own words only once the bubble has gone, or they flash up
    // as it fades.
    const line = oops || this.stationWords.alpha > 0.02 ? (oops ? ISS_CRASH.oops : this.stationWords.text) : "That's no moon...";
    if (this.stationWords.text !== line) {
      this.stationWords.setText(line);
    }
    const near = oops || Phaser.Math.Distance.Between(this.cat.x, this.cat.y, this.station.x, this.station.y) < 220;
    const shown = Phaser.Math.Linear(this.stationWords.alpha, near ? 1 : 0, 0.08);
    // Text set while hidden is measured as nothing (the browser does not lay
    // out what is not shown), so it is measured again once it shows.
    if (shown > 0.2 && this.stationWords.width < 24) {
      this.stationWords.updateSize();
    }
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
   * The cat touched the ISS: knocked out of its orbit, it tumbles down onto
   * the Earth, burning, and goes up in a huge explosion where it hits; a
   * moment later the cat says "... oops". It is gone for the run
   * (`issDown`). Everything is placed from the Earth's middle, since the
   * Earth goes on round the sun while it happens.
   */
  private crashIss(): void {
    const iss = this.iss;
    const earth = this.worlds.find((world) => world.name === 'earth');
    if (!iss || !earth) {
      return;
    }
    iss.falling = true;
    iss.going.stop();
    sound.play('crack');
    const from = new Phaser.Math.Vector2(iss.image.x - this.earth.x, iss.image.y - this.earth.y);
    const hit = from.clone().normalize().scale(earth.radius * 0.92);
    const fall = { t: 0 };
    let lastSpark = 0;
    this.tweens.add({
      targets: fall,
      t: 1,
      duration: ISS_CRASH.fallMs,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        const at = from.clone().lerp(hit, fall.t);
        iss.image.setPosition(this.earth.x + at.x, this.earth.y + at.y).setRotation(iss.image.rotation + 0.12).setDepth(-38);
        // Burning up on the way down: sparks left behind, going out.
        if (this.clock - lastSpark > 40) {
          lastSpark = this.clock;
          const spark = this.add
            .circle(iss.image.x, iss.image.y, 3 + fall.t * 4, fall.t > 0.5 ? 0xff7a20 : 0xffd060)
            .setDepth(-38.5)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: spark, alpha: 0, scale: 0.3, duration: 500, onComplete: () => spark.destroy() });
        }
      },
      onComplete: () => {
        iss.image.destroy();
        this.iss = undefined;
        this.carry.issDown = Math.atan2(hit.y, hit.x);
        this.explodeOnEarth(hit.x, hit.y);
        this.breakEarth(this.carry.issDown, true);
        this.time.delayedCall(ISS_CRASH.oopsAfterMs, () => {
          this.oopsUntil = this.clock + ISS_CRASH.oopsMs;
        });
      },
    });
  }

  /**
   * The crater where the ISS hit, `angle` round the Earth's middle: a bite
   * out of its picture, jagged, its edge glowing, and a few lumps of Earth
   * left floating by it, bobbing, going round with it. `fresh` when it has
   * just happened: the lumps fly out first.
   */
  private breakEarth(angle: number, fresh: boolean): void {
    const earth = this.worlds.find((world) => world.name === 'earth');
    if (!earth) {
      return;
    }
    const key = 'planet-earth-crater';
    const source = this.textures.get('planet-earth').getSourceImage() as HTMLCanvasElement;
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const canvas = this.textures.createCanvas(key, source.width, source.height) as Phaser.Textures.CanvasTexture;
    const context = canvas.context;
    context.drawImage(source, 0, 0);
    const disc = PLANET_DISCS.earth;
    const middle = source.width / 2;
    const cx = middle + Math.cos(angle) * disc;
    const cy = middle + Math.sin(angle) * disc;
    const bite = disc * ISS_CRASH.crater;
    // A jagged edge, the same for this crater every time it is drawn.
    const random = createRandom(Math.round(angle * 1000) + 77);
    const edge: Array<[number, number]> = [];
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const r = bite * (0.75 + random() * 0.45);
      edge.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    const trace = (): void => {
      context.beginPath();
      edge.forEach(([x, y], i) => (i === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
      context.closePath();
    };
    // The glowing rim first, then the hole cut out of the middle of it.
    context.save();
    context.beginPath();
    context.arc(middle, middle, disc, 0, Math.PI * 2);
    context.clip();
    trace();
    context.lineWidth = disc * 0.07;
    context.strokeStyle = 'rgba(255, 120, 30, 0.95)';
    context.shadowColor = 'rgba(255, 90, 20, 1)';
    context.shadowBlur = disc * 0.08;
    context.stroke();
    context.restore();
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.translate(cx, cy);
    context.scale(0.82, 0.82);
    context.translate(-cx, -cy);
    trace();
    context.fill();
    context.restore();
    canvas.refresh();
    canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
    earth.image.setTexture(key);

    // Lumps of Earth, floating off the crater.
    const scale = earth.image.scaleX;
    const out = earth.radius * 1.05;
    for (let i = 0; i < ISS_CRASH.chunks; i += 1) {
      const size = 3 + random() * 4;
      const lump = this.add
        .polygon(0, 0, [0, 0, size, -size * 0.4, size * 1.3, size * 0.6, size * 0.3, size * 1.1, -size * 0.4, size * 0.5], random() < 0.5 ? 0x6a5a3a : 0x3a6a3a)
        .setStrokeStyle(1, 0xff8a30, 0.8)
        .setDepth(-39.5);
      const spread = (random() - 0.5) * 1.4;
      const reach = out + bite * scale * (0.6 + random() * 1.4);
      const dx = Math.cos(angle + spread * 0.5) * reach;
      const dy = Math.sin(angle + spread * 0.5) * reach;
      const entry = { thing: lump, dx: fresh ? Math.cos(angle) * earth.radius : dx, dy: fresh ? Math.sin(angle) * earth.radius : dy };
      this.onEarth.push(entry);
      lump.setPosition(this.earth.x + entry.dx, this.earth.y + entry.dy);
      if (fresh) {
        this.tweens.add({ targets: entry, dx, dy, duration: 1400, ease: 'Cubic.easeOut' });
      }
      // Bobbing and turning slowly where they float.
      this.tweens.add({ targets: entry, dx: dx + (random() - 0.5) * 8, dy: dy + (random() - 0.5) * 8, duration: 2600 + random() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: fresh ? 1400 : 0 });
      this.tweens.add({ targets: lump, angle: random() < 0.5 ? 360 : -360, duration: 9000 + random() * 8000, repeat: -1 });
    }
  }

  /**
   * A huge explosion on the Earth, `dx`, `dy` from its middle: a white flash,
   * fireballs swelling out of it white to yellow to red, a shockwave ring,
   * debris thrown out, smoke left rising; the screen flashes and shakes.
   */
  private explodeOnEarth(dx: number, dy: number): void {
    const blast = ISS_CRASH.blast / 2;
    const random = Math.random;
    const put = <T extends Phaser.GameObjects.Components.Transform>(thing: T, ox = 0, oy = 0): T => {
      this.onEarth.push({ thing, dx: dx + ox, dy: dy + oy });
      thing.setPosition(this.earth.x + dx + ox, this.earth.y + dy + oy);
      return thing;
    };
    const gone = (thing: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform): void => {
      this.onEarth = this.onEarth.filter((entry) => entry.thing !== thing);
      thing.destroy();
    };
    sound.play('bossDie');
    sound.play('crack');
    this.cameras.main.flash(260, 255, 240, 210);
    this.cameras.main.shake(900, 0.014);

    const flash = put(this.add.circle(0, 0, 10, 0xffffff).setDepth(6).setBlendMode(Phaser.BlendModes.ADD));
    this.tweens.add({ targets: flash, scale: blast / 10, alpha: 0, duration: 550, ease: 'Quad.easeOut', onComplete: () => gone(flash) });

    const fire = [0xffffff, 0xfff0a0, 0xffd060, 0xffa030, 0xff6a20, 0xe03a18, 0xa02010];
    fire.forEach((colour, i) => {
      for (let n = 0; n < 2; n += 1) {
        const ball = put(
          this.add.circle(0, 0, 8, colour).setDepth(5 + i * 0.01).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2),
          (random() - 0.5) * 30,
          (random() - 0.5) * 30,
        );
        const size = (blast * (0.35 + random() * 0.4)) / 8;
        this.tweens.add({
          targets: ball,
          scale: size,
          alpha: { from: 1, to: 0 },
          duration: 900 + i * 160 + random() * 300,
          delay: i * 60,
          ease: 'Cubic.easeOut',
          onComplete: () => gone(ball),
        });
      }
    });

    // The shockwave: a thin ring, its radius grown rather than its scale,
    // so the line stays thin.
    const ring = put(this.add.circle(0, 0, 10).setStrokeStyle(2, 0xffe8b0, 1).setDepth(6));
    ring.isFilled = false;
    this.tweens.add({ targets: ring, radius: blast * 1.3, alpha: 0, duration: 1000, ease: 'Quad.easeOut', onComplete: () => gone(ring) });

    for (let n = 0; n < 28; n += 1) {
      const angle = random() * Math.PI * 2;
      const reach = blast * (0.5 + random() * 0.8);
      const bit = put(this.add.rectangle(0, 0, 2 + random() * 2, 2 + random() * 2, random() < 0.5 ? 0xffc060 : 0x8a8a90).setDepth(6));
      const entry = this.onEarth[this.onEarth.length - 1];
      this.tweens.add({
        targets: entry,
        dx: entry.dx + Math.cos(angle) * reach,
        dy: entry.dy + Math.sin(angle) * reach,
        duration: 900 + random() * 600,
        ease: 'Quad.easeOut',
      });
      this.tweens.add({ targets: bit, alpha: 0, angle: random() * 720, duration: 1500, delay: 200, onComplete: () => gone(bit) });
    }

    for (let n = 0; n < 7; n += 1) {
      const smoke = put(this.add.circle(0, 0, 10 + random() * 10, 0x3a3434, 0.7).setDepth(4).setAlpha(0), (random() - 0.5) * 40, (random() - 0.5) * 30);
      const entry = this.onEarth[this.onEarth.length - 1];
      this.tweens.add({ targets: smoke, alpha: { from: 0.75, to: 0 }, scale: 2.4, duration: 3200, delay: 500 + n * 120, onComplete: () => gone(smoke) });
      this.tweens.add({ targets: entry, dx: entry.dx * 1.4, dy: entry.dy * 1.4 - 30, duration: 3200, delay: 500 + n * 120 });
    }
  }

  /**
   * The time out here, ms: the game's own, which never stops. Not
   * `this.time.now` -- that is only brought up to date once the scene has
   * run a frame, so in `create` it still said when space was last left,
   * and the cat set off from where its planet was then.
   */
  private get clock(): number {
    return this.game.loop.time;
  }

  /**
   * Where a world is at a moment, ms: round the sun, or for the Moon round
   * wherever the Earth is then.
   */
  private placeOf(world: World, t: number): Phaser.Math.Vector2 {
    if (world.name === 'moon') {
      const earth = this.placeOf(WORLDS[0], t);
      const a = world.angle + (t / SPACE.moonMonthMs) * Math.PI * 2;
      return new Phaser.Math.Vector2(earth.x + Math.cos(a) * world.orbit, earth.y + Math.sin(a) * world.orbit);
    }
    const a = world.angle + (t / (SPACE.yearMs * world.years)) * Math.PI * 2;
    return new Phaser.Math.Vector2(this.sun.x + Math.cos(a) * world.orbit, this.sun.y + Math.sin(a) * world.orbit);
  }

  /**
   * Every world moved on along its orbit, with its name under it, and its
   * light (`addPlanetLight`) turned to the sun. The world itself is not
   * turned, so its bands and rings stay level.
   */
  private orbit(): void {
    const t = this.clock;
    for (const world of this.worlds) {
      const at = this.placeOf(world, t);
      world.x = at.x;
      world.y = at.y;
      world.image.setPosition(at.x, at.y);
      if (world.light) {
        faceTheSun(world.light, world.image, this.sun.x, this.sun.y);
      }
      world.label.setPosition(at.x, at.y + world.radius + 12);
      if (world.name === 'earth') {
        this.earth.copy(at);
      }
    }
    this.eclipses();
  }

  /**
   * The Earth and the Moon in each other's way. Behind the Earth, away from
   * the sun, the Moon is in its shadow: an eclipse of the Moon, which goes
   * dark and red, the way it really does. In front of it, between it and the
   * sun, the Moon's shadow falls on the Earth: a dark spot, going across.
   */
  private eclipses(): void {
    const earth = this.worlds.find((world) => world.name === 'earth');
    const moon = this.worlds.find((world) => world.name === 'moon');
    if (!earth || !moon) {
      return;
    }
    const sunward = new Phaser.Math.Vector2(earth.x - this.sun.x, earth.y - this.sun.y).normalize();
    const toMoon = new Phaser.Math.Vector2(moon.x - earth.x, moon.y - earth.y);
    const along = toMoon.dot(sunward);
    const side = toMoon.clone().subtract(sunward.clone().scale(along));
    const off = side.length();

    // Into the Earth's shadow: none at all once clear of it, all of it once
    // the whole Moon is inside.
    const into = along > 0 ? Phaser.Math.Clamp((earth.radius + moon.radius - off) / (2 * moon.radius), 0, 1) : 0;
    const red = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0x8a3424),
      100,
      Math.round(into * 100),
    );
    moon.image.setTint(Phaser.Display.Color.GetColor(red.r, red.g, red.b));
    moon.light?.setAlpha(1 - into * 0.6);

    // The Moon's shadow on the Earth.
    this.moonShadow ??= this.add.graphics().setDepth(earth.image.depth + 0.015);
    this.moonShadow.clear();
    const spot = moon.radius * 0.55;
    if (along < 0 && off < earth.radius - spot * 1.5) {
      this.moonShadow.fillStyle(0x000008, 0.25);
      this.moonShadow.fillCircle(earth.x + side.x, earth.y + side.y, spot * 1.5);
      this.moonShadow.fillStyle(0x000008, 0.55);
      this.moonShadow.fillCircle(earth.x + side.x, earth.y + side.y, spot);
    }
  }

  /**
   * The cat, just off the world it has come from: the Earth the first
   * time, the Moon when Bob's rocket takes off, or the planet it has just
   * left. Behind it on its way round, drifting back, so the world moves
   * off and the cat is not straight back in.
   */
  private setOff(): void {
    const home =
      this.worlds.find((world) => world.level === this.carry.from) ??
      this.worlds.find((world) => world.level === (this.carry.rocket ? 'Moon' : '')) ??
      this.worlds[0];
    const now = this.placeOf(home, this.clock);
    const way = now.clone().subtract(this.placeOf(home, this.clock - 100));
    if (way.lengthSq() === 0) {
      way.set(1, 0);
    }
    way.normalize();
    this.cat.setPosition(now.x - way.x * (home.radius + 50), now.y - way.y * (home.radius + 50));
    this.velocity.set(-way.x * 60, -way.y * 60);
  }

  /**
   * Too close to the sun: the cat burns. A heart is lost, as for any
   * death, and it sets off again from where it came. The last heart is
   * game over -- and, out here, back to the moon.
   */
  private die(by: 'sun' | 'laser'): void {
    if (this.burning) {
      return;
    }
    const [r, g, b] = by === 'sun' ? [255, 200, 80] : [120, 255, 120];
    if (this.game.registry.get('catnah:god-mode')) {
      // God mode: felt, and thrown back out, but nothing lost.
      this.cameras.main.flash(250, r, g, b);
      this.setOff();
      return;
    }
    this.burning = true;
    sound.play('hurt');
    this.cameras.main.shake(260, 0.012);
    this.cameras.main.flash(300, r, g, b);
    this.cat.setTint(by === 'sun' ? 0xff8040 : 0xff6b6b);
    this.helmet.setTint(by === 'sun' ? 0xff8040 : 0xff6b6b);
    this.velocity.set(0, 0);
    const lives = (this.carry.lives ?? LIVES) - 1;
    this.carry = { ...this.carry, lives, deaths: (this.carry.deaths ?? 0) + 1 };
    stats.addDeath();
    this.refreshHud();
    this.time.delayedCall(650, () => {
      if (lives <= 0) {
        this.cameras.main.filters.internal.addColorMatrix().colorMatrix.grayscale(1);
        this.scene.pause();
        const moon = LEVELS.findIndex((level) => level.theme === 'moon');
        this.scene.launch('GameOver', {
          restart: { ...this.carry, levelIndex: moon, from: '', lives: LIVES, maxLives: Math.max(LIVES, this.carry.maxLives ?? LIVES) },
        });
        return;
      }
      this.cat.clearTint();
      this.helmet.clearTint();
      this.setOff();
      this.burning = false;
    });
  }

  /**
   * Each world's name, and in the rocket how many of its parts are found;
   * and whether it is open, which changes with the parts (the Moon opens
   * with all of them, and shuts again if they are lost).
   */
  private refreshLabels(): void {
    const rocket = this.carry.rocket ?? false;
    const complete = (this.carry.parts ?? []).length >= PARTS.total;
    for (const world of this.worlds) {
      world.open = world.level === 'Moon' ? !rocket || complete : world.level !== '' && rocket;
    }
    for (const { level, text } of this.labels) {
      text.setColor(this.worlds.find((world) => world.level === level)?.open ? '#ffe9a8' : '#8a94a8');
      const definition = LEVELS.find((candidate) => candidate.name === level);
      const total = definition ? definition.rows.join('').split('K').length - 1 : 0;
      const got = (this.carry.parts ?? []).filter((id) => id.startsWith(`${level}:`)).length;
      const name = level || 'Earth';
      const world = this.worlds.find((candidate) => candidate.level === level);
      if (world) {
        // Every part on it found: still open, but no arrow sends you back.
        world.done = (this.carry.rocket ?? false) && total > 0 && got >= total;
      }
      text.setText(this.carry.rocket && total > 0 ? `${name} ${got}/${total}` : name);
    }
  }

  /**
   * An arrow at the edge of the screen for every open world out of sight,
   * pointing the way to it -- space is big, and a world off screen is easy
   * to lose. Not to a world whose parts are all found: nothing to go back for.
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
      // Nearer, bigger: from a third bigger close by to a third smaller far off.
      const away = Phaser.Math.Distance.Between(world.x, world.y, view.centerX, view.centerY);
      const k = Phaser.Math.Clamp(1.35 - (away - 400) / 3500, 0.65, 1.35);
      // Where the line from the middle of the screen leaves it, pulled in a little.
      const reach = Math.min((cx - 18) / Math.abs(Math.cos(angle) || 1e-6), (cy - 18) / Math.abs(Math.sin(angle) || 1e-6));
      const x = cx + Math.cos(angle) * reach;
      const y = cy + Math.sin(angle) * reach;
      const tip = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const side = new Phaser.Math.Vector2(-tip.y, tip.x);
      // Long and narrow, so it reads as pointing, not as a wedge. A world
      // with all its parts found gets just the outline: still there to fly
      // to, nothing left to fetch.
      const points = [
        x + tip.x * 10 * k, y + tip.y * 10 * k,
        x - tip.x * 7 * k + side.x * 4 * k, y - tip.y * 7 * k + side.y * 4 * k,
        x - tip.x * 7 * k - side.x * 4 * k, y - tip.y * 7 * k - side.y * 4 * k,
      ] as const;
      if (world.done) {
        this.arrows.lineStyle(1.5, 0xffd84a, 0.95);
        this.arrows.strokeTriangle(...points);
      } else {
        this.arrows.fillStyle(0xffe9a8, 0.85);
        this.arrows.fillTriangle(...points);
      }
    }
    // In god mode, development only, red arrows to the easter eggs that
    // have none: the camper and its chaser, and the Death Star.
    if (!import.meta.env.DEV || this.registry.get(GOD_MODE_KEY) !== true) {
      return;
    }
    for (const egg of [this.camper, this.station]) {
      if (view.contains(egg.x, egg.y)) {
        continue;
      }
      const angle = Math.atan2(egg.y - view.centerY, egg.x - view.centerX);
      const reach = Math.min((cx - 18) / Math.abs(Math.cos(angle) || 1e-6), (cy - 18) / Math.abs(Math.sin(angle) || 1e-6));
      const x = cx + Math.cos(angle) * reach;
      const y = cy + Math.sin(angle) * reach;
      const tip = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const side = new Phaser.Math.Vector2(-tip.y, tip.x);
      this.arrows.fillStyle(0xff3a3a, 0.9);
      this.arrows.fillTriangle(
        x + tip.x * 10, y + tip.y * 10,
        x - tip.x * 7 + side.x * 4, y - tip.y * 7 + side.y * 4,
        x - tip.x * 7 - side.x * 4, y - tip.y * 7 - side.y * 4,
      );
    }
  }

  /**
   * A beam: a bright core in a coloured glow, fading out -- drawn afresh
   * every frame from `from()` to `to()`, so it stays on the dish and on its
   * target as the two move. `from` and `to` are filled in as it goes, for
   * whoever reads them (the deadly list).
   */
  private drawBeam(
    from: () => Phaser.Math.Vector2,
    to: () => Phaser.Math.Vector2,
    glow: number,
    core: number,
    ends: { from: Phaser.Math.Vector2; to: Phaser.Math.Vector2 },
  ): void {
    const beam = this.add.graphics().setDepth(-37).setBlendMode(Phaser.BlendModes.ADD);
    const draw = (): void => {
      ends.from.copy(from());
      ends.to.copy(to());
      beam.clear();
      beam.lineStyle(7, glow, 0.35);
      beam.lineBetween(ends.from.x, ends.from.y, ends.to.x, ends.to.y);
      beam.lineStyle(3, core, 0.9);
      beam.lineBetween(ends.from.x, ends.from.y, ends.to.x, ends.to.y);
      beam.lineStyle(1, 0xffffff, 1);
      beam.lineBetween(ends.from.x, ends.from.y, ends.to.x, ends.to.y);
    };
    draw();
    if (Phaser.Math.Distance.Between(this.cat.x, this.cat.y, ends.from.x, ends.from.y) < GAME_WIDTH) {
      sound.play('laser');
    }
    this.tweens.add({ targets: beam, alpha: 0, duration: LASER.beamMs, ease: 'Cubic.easeIn', onUpdate: draw, onComplete: () => beam.destroy() });
  }

  /** A flash where a beam lands, staying on what it hit. Nothing is hurt by it. */
  private impact(at: () => Phaser.Math.Vector2, tint: number): void {
    const start = at();
    const flash = this.add.image(start.x, start.y, 'glow-dot').setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(-36).setScale(0.3);
    this.tweens.add({
      targets: flash,
      scale: 1.2,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
      onUpdate: () => flash.setPosition(at().x, at().y),
      onComplete: () => flash.destroy(),
    });
  }

  /** The station's dish, on its picture: up and to the right of the middle. */
  private dishAt(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.station.x + 35, this.station.y - 41);
  }

  /** The starship's saucer, at the front whichever way it faces. */
  private saucerAt(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.ship.x + 16 * (this.ship.flipX ? -1 : 1), this.ship.y - 5);
  }

  /**
   * The battle station fires at the starship: its dish glows green for a
   * moment -- on the dish, wherever the station has got to -- and then a
   * beam goes out to the ship, and stays on both as they move while it
   * lasts. Whatever is in between is in the way -- the cat included.
   */
  private fireLaser(): void {
    if (this.going) {
      return;
    }
    const start = this.dishAt();
    const glow = this.add.image(start.x, start.y, 'glow-dot').setTint(0x7aff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(-37).setScale(0.15);
    this.tweens.add({
      targets: glow,
      scale: 1,
      duration: LASER.chargeMs,
      ease: 'Sine.easeIn',
      onUpdate: () => glow.setPosition(this.dishAt().x, this.dishAt().y),
      onComplete: () => {
        glow.destroy();
        const ship = (): Phaser.Math.Vector2 => new Phaser.Math.Vector2(this.ship.x, this.ship.y);
        const beam = { from: new Phaser.Math.Vector2(), to: new Phaser.Math.Vector2(), until: this.clock + LASER.beamMs * 0.7 };
        this.drawBeam(() => this.dishAt(), ship, 0x3aff5a, 0x9fff9f, beam);
        this.deadly.push(beam);
        this.impact(ship, 0x9fff9f);
      },
    });
  }

  /**
   * The starship fires back: a short orange phaser from its saucer to the
   * station's near side, following both while it lasts. A cat in between
   * is hit by it too.
   */
  private fireShip(): void {
    if (this.going) {
      return;
    }
    const nearSide = (): Phaser.Math.Vector2 => {
      const from = this.saucerAt();
      const toward = new Phaser.Math.Vector2(this.station.x - from.x, this.station.y - from.y).normalize();
      return new Phaser.Math.Vector2(this.station.x - toward.x * 70, this.station.y - toward.y * 70);
    };
    const beam = { from: new Phaser.Math.Vector2(), to: new Phaser.Math.Vector2(), until: this.clock + LASER.beamMs * 0.7 };
    this.drawBeam(() => this.saucerAt(), nearSide, 0xff7a2a, 0xffc080, beam);
    this.deadly.push(beam);
    this.impact(nearSide, 0xffb060);
  }

  /**
   * The station and the starship drift: the station goes round the sun
   * (`LASER.stationOrbit`, no ring drawn), and round a small, slow circle
   * as it goes; the ship round the station, facing it.
   */
  private drift(): void {
    const t = this.clock;
    // Round the sun, like the worlds, but with no ring drawn for it.
    const start = Math.atan2(LASER.stationOrbit.y, LASER.stationOrbit.x);
    const reach = Math.hypot(LASER.stationOrbit.x, LASER.stationOrbit.y);
    const round = start + (t / (SPACE.yearMs * LASER.stationYears)) * Math.PI * 2;
    this.stationHome.set(this.sun.x + Math.cos(round) * reach, this.sun.y + Math.sin(round) * reach);
    const a = (t / LASER.stationDriftMs) * Math.PI * 2;
    this.station.setPosition(this.stationHome.x + Math.cos(a) * LASER.stationDrift, this.stationHome.y + Math.sin(a) * LASER.stationDrift * 0.6);
    const b = (t / LASER.shipOrbitMs) * Math.PI * 2;
    this.ship.setPosition(this.station.x + Math.cos(b) * LASER.shipOrbit.x, this.station.y + Math.sin(b) * LASER.shipOrbit.y);
    this.ship.setFlipX(this.station.x < this.ship.x);
    this.chase();
  }

  /**
   * The camper and the fighter on its tail, flying about at random
   * (`CHASE`): the camper turns towards a spot it has picked and picks
   * another when it gets there; the fighter turns towards a point just
   * behind it. Both stay upright, facing left or right the way they are
   * going, with a slow bob.
   */
  private chase(): void {
    const dt = Math.min(this.game.loop.delta, 100) / 1000;
    const steer = (pos: Phaser.Math.Vector2, heading: { angle: number }, to: Phaser.Math.Vector2, speed: number): void => {
      const want = Math.atan2(to.y - pos.y, to.x - pos.x);
      const diff = Phaser.Math.Angle.Wrap(want - heading.angle);
      heading.angle += Phaser.Math.Clamp(diff, -CHASE.turn * dt * 2, CHASE.turn * dt * 2);
      pos.x += Math.cos(heading.angle) * speed * dt;
      pos.y += Math.sin(heading.angle) * speed * dt;
    };
    const flight = this.flight;
    if (flight.camper.distance(flight.target) < CHASE.arrive) {
      flight.target = this.randomSpot();
    }
    steer(flight.camper, flight.camperHeading, flight.target, CHASE.speed);
    const behind = new Phaser.Math.Vector2(
      flight.camper.x - Math.cos(flight.camperHeading.angle) * CHASE.gap,
      flight.camper.y - Math.sin(flight.camperHeading.angle) * CHASE.gap,
    );
    // Faster when it has fallen behind, easing off when it is close.
    const lag = flight.fighter.distance(behind);
    steer(flight.fighter, flight.fighterHeading, behind, Phaser.Math.Clamp(CHASE.speed + lag * 1.5, CHASE.speed * 0.6, CHASE.chaserSpeed * 1.6));
    const show = (image: Phaser.GameObjects.Image, at: Phaser.Math.Vector2, heading: number, bob: number): void => {
      image.setPosition(at.x, at.y + Math.sin(this.clock / 300 + bob) * 2);
      image.setFlipX(Math.cos(heading) < 0);
    };
    show(this.camper, flight.camper, flight.camperHeading.angle, 0);
    show(this.fighter, flight.fighter, flight.fighterHeading.angle, 1.7);
  }

  /** Somewhere in space for the camper to head for: anywhere within `CHASE.reach` of the sun, clear of it. */
  private randomSpot(): Phaser.Math.Vector2 {
    const a = Math.random() * Math.PI * 2;
    const r = 600 + Math.random() * (CHASE.reach - 600);
    return new Phaser.Math.Vector2(this.sun.x + Math.cos(a) * r, this.sun.y + Math.sin(a) * r);
  }


  /**
   * Thrust towards whatever is held, on the screen -- up is up -- drag when
   * nothing is, a top speed, and the cat turned to face where it is going.
   */
  private fly(delta: number): void {
    const dt = delta / 1000;
    const input = new Phaser.Math.Vector2(
      (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0),
      (this.controls.sneak ? 1 : 0) - (this.controls.up || this.controls.jumpHeld ? 1 : 0),
    );
    const thrust = input.lengthSq() > 0;

    const before = this.velocity.length();
    if (thrust) {
      input.normalize().scale(SPACE.accel * this.boost() * dt);
      this.velocity.add(input);
      // The fuel burns while the thrust is on, and the meter goes down.
      if ((this.carry.fuel ?? 0) > 0) {
        this.carry.fuel = Math.max(0, (this.carry.fuel ?? 0) - delta);
        this.refreshHud();
      }
    } else {
      const speed = this.velocity.length();
      if (speed > 0) {
        this.velocity.scale(Math.max(0, speed - SPACE.drag * this.boost() * dt) / speed);
      }
    }
    // Over the top speed -- the fuel just ran out -- it slows down to it
    // over a second or so rather than stopping dead.
    const top = SPACE.maxSpeed * this.boost();
    const speed = this.velocity.length();
    if (speed > top) {
      this.velocity.setLength(Math.max(top, Math.min(speed, before - SPACE.maxSpeed * BAR.fuelBoost * dt)));
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
