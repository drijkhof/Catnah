import Phaser from 'phaser';
import { AWAKE_RANGE, BAR, BOB, ENDING, INTERNET, PARK, CAT, OBSTACLES, PARTS, RAIN, ROBOT, CACTUS, CHARMS_PER_LIFE, CHECKPOINT, EXIT, GAME_HEIGHT, GAME_WIDTH, LAVA, LIVES, MAX_LIVES, TILE, TOUCH, WATER_DROP } from '../config';
import { Controls, IdleControls, type PlayerInput } from '../input/Controls';
import { Player } from '../objects/Player';
import { Boss } from '../objects/Boss';
import { Crocodile } from '../objects/Crocodile';
import { LavaLake } from '../objects/LavaLake';
import { Rain } from '../objects/Rain';
import { Crow } from '../objects/Crow';
import { GroundEnemy } from '../objects/GroundEnemy';
import { Piranha } from '../objects/Piranha';
import { Spider } from '../objects/Spider';
import { Worm } from '../objects/Worm';
import { KEEP_LIVE, addGroundShade, bakeScenery, createBackdrop } from '../world';
import { parseLevel, type ClimbZone, type ParsedLevel, type Solid, type WaterZone } from '../level/Level';
import { LEVELS } from '../level/levels';
import { TITLE } from '../level/levels/title';
import { BAR_GLASS, FUEL_TUBE, MILK_BOTTLE, BAR_KEEPER_X, BAR_SIZE, BAR_STOOLS, HUT_DOOR, HUT_SIZE, SHIRT_COLOURS, HACKER_SIZE, MACHINE_SIZE, MACHINE_ZAPPER, BENCH_HEADROOM, FOUNTAIN_HEADROOM, bakeBench, bakeFountain, bakeLawn, BOULDER_BULGE, BRANCH_BULGE, CORNER_RADIUS, FILLET_RADIUS, CASTLE_FLAG_HEADROOM, PAD_SIZE, BRANCH_THICKNESS, bakeCloudPlatform, HEAD_IN_POSE, BASE_HEADROOM, LAB_CONSOLE_X, LAB_TANK, baseInside, bakeMoonBase, AWNING_BULGE, HOUSE_HEADROOM, bakeAwning, bakeHouse, GRASS_FRINGE_HEIGHT, JELLY_SIZE, LOG_BULGE, PALM_BULGE, PALM_CROWN_ANCHOR, PALM_CROWN_SIZE, bakePalmTrunk, bakeSandCastle, SHELF_BULGE, TILE_VARIANTS, TRUNK_BULGE, PORTAL_KEY, bakeCactus, bakeBoulder, bakeBranch, bakeFillet, bakeLog, bakeShelf, bakeTexture, bakeTrunk, bakeRockMass, createRandom, roundedTileKey, tileKey, type Corners } from '../art';
import { THEMES } from '../level/themes';
import { installLevelSkip } from '../dev/levelSkip';
import { GOD_MODE_KEY, installGodMode, isGodMode } from '../dev/godMode';
import { FuelMeter } from '../fuelMeter';
import { installSpaceShortcut } from '../dev/spaceShortcut';
import { sound, type Ambience, type SoundMode } from '../audio/Sound';
import { SNAPSHOT_KEY, type GameSnapshot } from '../dev/hot';
import { formatClock, scoreMs } from '../score';
import { stats } from '../stats';
import { crispText, onDoubleTap, type CrispText } from '../text';
import { runEnded } from '../back';

/**
 * Whether something falling should be stopped by a branch this frame.
 *
 * Branches are one-way: you pass up through them and land on them coming down.
 * Testing the previous position rather than the current one is what stops
 * something halfway up through a branch being snapped back on top of it.
 */
function landsOnBranch(
  mover: Phaser.Physics.Arcade.Sprite,
  branch: Phaser.Physics.Arcade.Sprite,
): boolean {
  const body = mover.body as Phaser.Physics.Arcade.Body;
  const wood = branch.body as Phaser.Physics.Arcade.StaticBody;

  return body.velocity.y >= 0 && body.prev.y + body.height <= wood.y + 1;
}

/** How far below the level the cat may fall before respawning, in pixels. */
const FALL_OUT_MARGIN = 80;

/** The mute button's icon for each sound mode. */
function soundTexture(mode: SoundMode): string {
  switch (mode) {
    case 'silent':
      return 'ui-sound-off';
    case 'sfxOnly':
      return 'ui-sound-quiet';
    case 'all':
      return 'ui-sound-on';
  }
}

export class GameScene extends Phaser.Scene {
  private controls!: PlayerInput & { update(): void };
  private player!: Player;
  private level!: ParsedLevel;
  private scoreText!: CrispText;

  /** The running score in the HUD: the clock plus the deaths, as one time. */
  private clockText?: CrispText;

  /** The level name in the HUD. HTML, so it is faded by hand with the level. */
  private levelName?: CrispText;
  private charms!: Phaser.Physics.Arcade.StaticGroup;
  /**
   * Little hearts collected **this run**, not this level.
   *
   * Carried from level to level the way lives are, because a hundred of them
   * is a life and no single level holds a hundred.
   */
  private collected = 0;
  /**
   * Bob's parts found so far this run, each as `<level>:<x>,<y>`, so a part
   * once taken is never there again and a planet knows how many of its own
   * are found.
   */
  private parts: string[] = [];
  /** Whether Bob has sent the cat off in his rocket: the parts are being looked for. */
  private rocket = false;
  /** Whether the rocket has been filled up at the bar on Pluto: ten times as fast in space. */
  /** Rocket fuel left from the bar, ms of thrust. */
  private fuel = 0;
  /** Coins: Bob's, to spend at the bar. */
  private coins = 0;
  private coinsText?: CrispText;
  private fuelMeter?: FuelMeter;
  /** The barkeeper on Pluto, and whether the cat is still standing where he last asked. */
  private keeper?: { sprite: Phaser.GameObjects.Sprite; floor: number; near: boolean };
  /**
   * Doors (`n`): where each doorway is. A door works once the cat has been
   * out of every doorway since it arrived, so arriving in one does not send
   * it straight back through.
   */
  private doors: Phaser.Geom.Rectangle[] = [];
  private doorArmed = false;
  /** Thrown out of the bar on Pluto: shut for the rest of the run. Its door only says so. */
  private barClosed = false;
  /** Inside a house: the level outside as the cat left it, to go back to. */
  private outside?: GameSnapshot;
  /** Coming back out through a door: the level as it was left, to put back. */
  private resume?: GameSnapshot;
  /** Came in through a door rather than a portal: no portal to arrive by. */
  private viaDoor = false;
  /** Out of the internet, the end: back out of Bob's machine on the moon, and Bob is gone. */
  private ending = false;
  /** Inside a house the view is close up; this camera draws the HUD unzoomed over it. */
  private hudCamera?: Phaser.Cameras.Scene2D.Camera;
  /** The bar's menu, while it is open. */
  private shop?: {
    panel: Phaser.GameObjects.Graphics;
    words: CrispText[];
    options: CrispText[];
    reply: CrispText;
    purse: CrispText;
    selected: number;
    /** While the keeper is pouring, or showing the cat out: no ordering. */
    busy: boolean;
    /** Orders in a row the cat could not pay for. */
    strikes: number;
    wasLeft: boolean;
    wasRight: boolean;
    wasSneak: boolean;
  };
  private partsText?: CrispText;

  /**
   * Time left before god mode will acknowledge another hit, ms.
   *
   * Without it, standing in lava replays the hurt sound sixty times a second,
   * because the lava check runs every frame for as long as the cat overlaps it.
   */
  private godCooldown = 0;

  /**
   * Where dying puts the cat back. The level's own spawn until a checkpoint
   * says otherwise -- the start of a level is itself the first checkpoint.
   */
  private respawnPoint!: { x: number; y: number };

  /** The checkpoint currently in effect, if any. Used to ignore re-touching it. */
  private activeCheckpoint?: Phaser.Physics.Arcade.Sprite;

  private checkpoints!: Phaser.Physics.Arcade.StaticGroup;

  /** Tries left on this level. Running out starts it over. */
  private lives = LIVES;

  /**
   * The most lives held at once this run, so a spare heart knows what "full"
   * means. "Full" cannot be the constant `MAX_LIVES` either -- reaching six
   * once and then dying twice should leave four hearts worth restoring, not
   * three -- so it is a watermark instead, one that rises with the highest
   * count actually reached and is itself capped at `MAX_LIVES`.
   */
  private maxLives = LIVES;
  private lifeIcons: Phaser.GameObjects.Image[] = [];

  /**
   * Spare hearts sitting in nests. Kept, rather than destroyed once taken, so
   * dying can put them back -- unlike a little heart, which stays collected.
   * A spare heart is guarded by something that can kill you; losing that fight
   * and finding the heart waiting again is the point of going back for it.
   */
  private extraLifeHearts: Phaser.Types.Physics.Arcade.ImageWithStaticBody[] = [];

  /** Which level is being played, as an index into LEVELS. */
  private levelIndex = 0;

  /**
   * True when this is the title screen's backdrop rather than a game: the
   * title level, nobody at the controls, nothing that can hurt the cat or be
   * collected, and a camera that stays put. `TitleScene` runs it underneath
   * its own words.
   */
  private titleMode = false;

  /** Set once the run is being left for the title, so a second ask is ignored. */
  private quitting = false;

  /**
   * True while the level is being left: the cat is being drawn into the
   * portal and the screen is fading. Nothing moves it and nothing can hurt it
   * from here on -- a run that ended in the doorway used to be able to die in
   * the half-second before the next level, and lose a heart for it.
   */
  private leaving = false;
  /**
   * The portals, one per `E`: the centre of each opening, and its picture so
   * leaving can fade it out with the cat. Every one does the same thing.
   */
  private exits: Array<{ centre: Phaser.Math.Vector2; hole: Phaser.GameObjects.Image }> = [];

  /**
   * Whether the portals are there to be entered. In a level with a beetle
   * they are not until it is dead: the way out opens when the boss falls.
   */
  private exitsOpen = true;
  private walkers: GroundEnemy[] = [];
  private piranhas: Piranha[] = [];
  private crows: Crow[] = [];
  /**
   * Everything a sneaking cat can hide behind: bushes, reeds, the leaves in
   * front of a branch. Their screen rectangles, gathered once the level is
   * built. All three are live objects (drawn in front of the cat or kept
   * live so a hedgehog can hide too), so they are still there to be asked.
   */
  private cover: Phaser.Geom.Rectangle[] = [];
  private crocodiles: Crocodile[] = [];
  private spiders: Spider[] = [];
  private boss?: Boss;
  /** The solid blocks, kept so a creature spawned later can collide with them. */
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private branchGroup!: Phaser.Physics.Arcade.StaticGroup;
  /**
   * The moon's grey blocks: the tile that collides, how long until the next
   * robot climbs out, how long the cat has been breaking it, and the robots
   * it let out that are still about.
   */
  /**
   * Bob, the alien in the lab: his sprite, whether the cat is near him now,
   * whether they have had their talk, and the talk itself while it lasts.
   */
  private bob?: {
    sprite: Phaser.GameObjects.Sprite;
    near: boolean;
    met: boolean;
  };
  private talk?: {
    line: number;
    bubble: Phaser.GameObjects.Graphics;
    words: CrispText;
    next: CrispText;
    hidden: Phaser.GameObjects.GameObject[];
    /** What Bob says this time: his story, or his thanks. */
    lines: readonly string[];
    /** The camera the bubble is drawn by: unzoomed, so the words stay crisp and in place. */
    camera: Phaser.Cameras.Scene2D.Camera;
  };
  /** "Too busy!", while it is up. */
  private busyWords?: CrispText;
  /** Each moon base, door to door, which no robot may enter. */
  private baseRects: Phaser.Geom.Rectangle[] = [];
  /** The robots' worlds' own obstacles: bounce pads, moving platforms, crumbling ice. */
  private pads: Array<{ image: Phaser.GameObjects.Image; x: number; y: number }> = [];
  /** True from a bounce until the cat starts to fall: its speed cap is lifted. */
  private bouncing = false;
  private movers: Array<{ body: Phaser.Types.Physics.Arcade.ImageWithDynamicBody; from: number; to: number; width: number }> = [];
  private crumbles: Array<{ tile: Phaser.Types.Physics.Arcade.ImageWithStaticBody; x: number; y: number; timer: number; gone: number }> = [];
  /** Bob's parts lying in this level, not yet taken. */
  private partSprites: Phaser.Types.Physics.Arcade.ImageWithStaticBody[] = [];
  /** The level's coins still to be found, and every coin found this run, as `<level>:<x>,<y>`. */
  private coinSprites: Phaser.Types.Physics.Arcade.ImageWithStaticBody[] = [];
  private coinsFound: string[] = [];
  /** `=` cells inside a moon base, which the base draws as lab benches. */
  private benchCells = new Set<string>();
  /** The internet's cables: each column of `I` cells, and how far it has been scratched through. */
  private cables: Array<{
    tiles: Phaser.Physics.Arcade.Sprite[];
    plug: Phaser.GameObjects.Image;
    x: number;
    top: number;
    bottom: number;
    scratched: number;
  }> = [];
  /** The dark web's hackers, and whether each has called out to the cat since it came near. */
  private hackers: Array<{ sprite: Phaser.GameObjects.Sprite; line: string; called: boolean; words?: CrispText }> = [];
  /** Bob's machine in the lab, there once the cat has every part. */
  private machine?: Phaser.GameObjects.Image;
  /** Every cable cell's tile, by `column,row`, gathered into columns by `buildCables`. */
  private cableTiles = new Map<string, Phaser.Physics.Arcade.Sprite>();
  private hatches: Array<{
    tile: Phaser.Physics.Arcade.Sprite;
    x: number;
    y: number;
    spawnIn: number;
    breaking: number;
    robots: GroundEnemy[];
  }> = [];
  /**
   * Lava: kills on contact, whatever the cat is doing. A rectangle it must not
   * be inside.
   */
  private lavaRects: Phaser.Geom.Rectangle[] = [];
  /**
   * Thorns: kill on contact unless the cat is sneaking. Low enough, it slips
   * under the points -- see `touchingSomethingDeadly`.
   */
  private thornRects: Phaser.Geom.Rectangle[] = [];
  /** Cacti: kill from any side, sneaking or not. */
  private cactusRects: Phaser.Geom.Rectangle[] = [];

  /** The beach's jellyfish: mines, deadly from any side. */
  private jellyRects: Phaser.Geom.Rectangle[] = [];
  /** The desert's worms, each in its mound; what is out of the sand kills. */
  private worms: Worm[] = [];
  private lava?: LavaLake;
  /** The city's rain, if this is the city. Only ever built outside title mode. */
  private rain?: Rain;

  /** True from the moment the cat is killed until it is back on its feet. */
  private dying = false;

  /**
   * The run's clock: time spent in levels, ms, carried from level to level.
   * With `deaths` it is the score -- see `SCORE` -- shown when the run is won.
   */
  private elapsedMs = 0;
  private deaths = 0;

  constructor() {
    super('Game');
  }

  /** Phaser hands this whatever `scene.start` was given. */
  init(data: {
    levelIndex?: number;
    lives?: number;
    maxLives?: number;
    collected?: number;
    elapsedMs?: number;
    deaths?: number;
    title?: boolean;
    parts?: string[];
    rocket?: boolean;
    fuel?: number;
    coins?: number;
    coinsFound?: string[];
    barClosed?: boolean;
    outside?: GameSnapshot;
    resume?: GameSnapshot;
    viaDoor?: boolean;
    ending?: boolean;
  }): void {
    this.titleMode = data.title ?? false;
    // The scene instance is reused from run to run, so a flag set on the
    // way out has to be cleared on the way in, or the second run's double
    // tap does nothing.
    this.quitting = false;

    const carried = this.registry.get(SNAPSHOT_KEY) as GameSnapshot | undefined;

    this.levelIndex = data.levelIndex ?? carried?.levelIndex ?? 0;
    this.elapsedMs = data.elapsedMs ?? carried?.elapsedMs ?? 0;
    this.deaths = data.deaths ?? carried?.deaths ?? 0;
    // Lives cross level boundaries; a spare heart found in one is still yours
    // in the next, which is the only thing that makes finding one worth a
    // detour.
    this.lives = Math.min(data.lives ?? carried?.lives ?? LIVES, MAX_LIVES);
    this.maxLives = Math.min(Math.max(LIVES, this.lives, data.maxLives ?? carried?.maxLives ?? 0), MAX_LIVES);
    this.collected = data.collected ?? carried?.collected ?? 0;
    this.parts = [...(data.parts ?? carried?.parts ?? [])];
    this.rocket = data.rocket ?? carried?.rocket ?? false;
    this.fuel = data.fuel ?? carried?.fuel ?? 0;
    this.coins = data.coins ?? carried?.coins ?? 0;
    this.coinsFound = [...(data.coinsFound ?? carried?.coinsFound ?? [])];
    this.barClosed = data.barClosed ?? carried?.barClosed ?? false;
    this.outside = data.outside ?? carried?.outside;
    this.resume = data.resume;
    this.viaDoor = data.viaDoor ?? false;
    this.ending = data.ending ?? false;

    // God mode lives in the registry, and a hot reload builds a new game
    // with a new registry: it rides in the snapshot and is put back here,
    // before the HUD is built, so the level name paints gold as it should.
    if (import.meta.env.DEV && carried?.godMode) {
      this.registry.set(GOD_MODE_KEY, true);
    }
  }

  create(): void {
    // A scene that ended a run left its camera drained of colour. Nothing else
    // clears it, and a new run starting in black and white is a haunting bug.
    this.cameras.main.filters.internal.clear();

    this.level = parseLevel(this.titleMode ? TITLE : LEVELS[this.levelIndex]);
    this.crocodiles = [];
    this.spiders = [];
    this.rain = undefined;
    this.hatches = [];
    this.cables = [];
    this.keeper = undefined;
    this.shop = undefined;
    this.doors = [];
    this.doorArmed = false;
    this.hudCamera = undefined;
    this.cableTiles = new Map();
    this.hackers = [];
    this.machine = undefined;
    this.benchCells = new Set();
    this.bob = undefined;
    this.baseRects = [];
    this.partSprites = [];
    this.coinSprites = [];
    this.partsText = undefined;
    this.coinsText = undefined;
    this.pads = [];
    this.bouncing = false;
    this.movers = [];
    this.crumbles = [];
    this.talk = undefined;
    this.busyWords = undefined;
    this.lifeIcons = [];
    this.fuelMeter = undefined;
    this.dying = false;
    this.leaving = false;

    // Gravity is the place's: the Earth's, or lighter on the other worlds.
    // Set every time, since the scene is reused from level to level.
    this.physics.world.gravity.y = CAT.gravity * this.level.gravity;

    // The world is taller than the level so a cat that misses a jump falls into
    // empty space and respawns, rather than landing on an invisible floor.
    this.physics.world.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels + FALL_OUT_MARGIN * 2,
    );

    if (this.level.inside) {
      // Inside a house: its own wall all round, not the sky outside.
      this.add.tileSprite(0, 0, this.level.widthInPixels, this.level.heightInPixels, 'bar-wall').setOrigin(0, 0).setDepth(-50);
    } else {
      createBackdrop(
        this.level.theme,
        this,
        this.level,
        this.level.widthInPixels,
        this.level.groundLine,
        this.level.heightInPixels,
      );
    }

    const { blocks, branches } = this.buildSolids();
    // Added straight after the tiles and before anything that stands on them,
    // so at the same depth it draws over the ground and under the cat.
    addGroundShade(
      this,
      // Not the grey blocks: they can be broken, and the shade they cast
      // would be left behind on the ground.
      this.level.solids.filter((solid) => solid.glyph !== 'D' && solid.glyph !== 'M'),
      this.level.voids,
      this.level.widthInPixels,
      this.level.heightInPixels,
      THEMES[this.level.theme].shade,
    );
    const climbZones = this.buildTrunks();
    const lianaZones = this.buildLianas();
    this.buildDeadVines();
    this.buildFoliage();
    const waterZones = this.buildWater();
    this.lavaRects = this.buildLava();
    this.thornRects = this.buildThorns();
    this.cactusRects = this.buildCacti();
    this.jellyRects = this.buildJellies();
    this.worms = this.level.mounds.map((mound, index) => new Worm(this, mound, index + 1));
    this.charms = this.buildCharms();
    this.buildParts();
    this.buildCoins();
    this.checkpoints = this.buildCheckpoints();
    this.respawnPoint = { x: this.level.spawn.x, y: this.level.spawn.y };

    this.player = new Player(
      this,
      this.level.spawn.x,
      this.level.spawn.y,
      // A level whose T columns are only scenery still draws them and still
      // lets the cat walk through them; it just hands the player nothing to
      // hold on to. That is the whole of "you cannot climb a tree". Lianas
      // are never scenery-only, so they join the list regardless.
      [...(this.level.columnsAreClimbable ? climbZones : []), ...lianaZones],
      waterZones,
    );

    // Back on the moon with every part: the rocket lands by the base, and
    // the cat starts beside Bob's door rather than at the far end.
    // (Read through a cast: `create` cleared it above, and TypeScript does
    // not see `buildBases` setting it again.)
    const bob = this.bob as GameScene['bob'];
    if (bob && this.rocket && this.hasAllParts()) {
      const x = bob.sprite.x - 80;
      this.player.body.reset(x, bob.sprite.y);
      this.respawnPoint = { x, y: bob.sprite.y };
    }

    this.physics.add.collider(this.player, blocks);
    this.physics.add.collider(
      this.player,
      branches,
      undefined,
      (_cat, branch) => this.canLandOn(branch as Phaser.Physics.Arcade.Sprite),
    );
    if (!this.titleMode) {
      this.physics.add.overlap(this.player, this.charms, (_cat, charm) => {
        this.collectCharm(charm as Phaser.Physics.Arcade.Sprite);
      });
      this.physics.add.overlap(this.player, this.checkpoints, (_cat, checkpoint) => {
        this.activateCheckpoint(checkpoint as Phaser.Physics.Arcade.Sprite);
      });
      this.physics.add.overlap(this.player, this.partSprites, (_cat, part) => {
        this.takePart(part as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
      });
      this.physics.add.overlap(this.player, this.coinSprites, (_cat, coin) => {
        this.takeCoin(coin as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
      });

      this.buildWeather();
    }

    this.cameras.main.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels,
    );
    if (this.titleMode) {
      this.frameTitle();
    } else {
      // The level is taller than the viewport, so the view has somewhere to go
      // when the cat climbs. A narrow vertical deadzone keeps it in frame on the
      // way up the great tree without the view bobbing on every small hop.
      this.cameras.main.startFollow(this.player, true, 0.12, 0.14);
      this.cameras.main.setDeadzone(140, 44);
    }
    // The camera is one object for the scene's life: a zoom from inside a
    // house would otherwise carry on outside.
    this.cameras.main.setZoom(this.level.inside && !this.titleMode ? BAR.insideZoom : 1);
    if (this.level.inside && !this.titleMode) {
      this.cameras.main.setDeadzone(40, 30);
    }

    this.buildCreatures(blocks, branches);
    this.buildObstacles();
    this.buildHelmet();
    this.buildExit();
    this.gatherCover();

    // Last, once everything static exists: flatten it into a few big
    // textures. See `world/BakeScenery.ts` for what counts as static.
    bakeScenery(this, this.level.widthInPixels, this.level.heightInPixels);

    if (this.titleMode) {
      this.controls = new IdleControls();
      return;
    }

    this.controls = new Controls(this);
    this.buildHud();

    // A level arrived at -- from the title, or through a portal -- comes up
    // out of black, the way the last one went down into it. A hot reload
    // does not: the player never left.
    if (!this.registry.has(SNAPSHOT_KEY)) {
      if (this.viaDoor) {
        this.blackout(1, 0, EXIT.fadeInMs);
      } else {
        this.arrive();
      }
    }
    this.resumeFromHotReload();
    // Back out through a door: everything as it was left -- the hearts taken,
    // the checkpoint -- and the cat in the doorway.
    if (this.resume && this.resume.levelIndex === this.levelIndex) {
      this.restoreState(this.resume);
      this.resume = undefined;
    }
    this.buildHudCamera();
    if (this.ending) {
      this.playEnding();
    }
  }

  /**
   * The black a level goes down into and comes up out of.
   *
   * Not the camera's own fade: that paints over everything the camera draws,
   * HUD included, and two things have to stay visible through it -- the
   * hearts, which are not part of the world that is being left, and the
   * arrival portal, which has to be seen *while* the screen is still black.
   * So the black is a rectangle of our own, pinned to the screen at
   * `fadeDepth`, just under the HUD; the level name sits just under the
   * black, so it fades with its level.
   *
   * A fade *in* throws its black away when done. A fade *out* does not: its
   * `onComplete` starts the next level, and `scene.start` is only carried
   * out at the top of the next frame, so this scene draws once more first.
   * Destroying the black before that showed the level, fully lit, for one
   * frame between the two fades. The scene switch takes the black with it.
   */
  private blackout(from: number, to: number, duration: number, onComplete?: () => void): void {
    const black = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(EXIT.fadeDepth)
      .setAlpha(from);
    // Text is HTML above the canvas, so the black cannot cover the level
    // name: it is faded alongside, to where the black leaves it.
    if (this.levelName) {
      this.tweens.add({ targets: this.levelName, alpha: (1 - to) * 0.75, duration });
    }
    this.tweens.add({
      targets: black,
      alpha: to,
      duration,
      onComplete: () => {
        if (to === 0) {
          black.destroy();
        }
        onComplete?.();
      },
    });
  }

  /**
   * Coming up out of black, with a portal standing where the cat appears.
   *
   * The black goes in `fadeInMs`; the portal, opaque from the first frame,
   * sits just above the black, fades to nothing over `arriveMs` and is then
   * thrown away.
   */
  private arrive(): void {
    this.blackout(1, 0, EXIT.fadeInMs);

    // Standing where an exit portal would stand on this ground: the cat's
    // feet are at `player.y`, and the disc's foot is sunk the same `sink`.
    const portal = this.add
      .image(this.player.x, this.player.y - (EXIT.diameter / 2 - EXIT.sink), PORTAL_KEY)
      .setDepth(EXIT.fadeDepth + 0.5)
      .setAlpha(EXIT.alpha);
    portal.setScale(EXIT.diameter / portal.width);
    this.tweens.add({
      targets: portal,
      alpha: 0,
      angle: 90,
      duration: EXIT.arriveMs,
      ease: 'Sine.easeIn',
      onComplete: () => portal.destroy(),
    });
  }

  /**
   * Fixes the title screen's camera: centred on the cat, and low enough that
   * exactly two rows of ground show under it, whatever the screen's size.
   * Everything above that is whatever the screen has room for.
   */
  private frameTitle(): void {
    const camera = this.cameras.main;

    camera.setScroll(Math.round(this.level.spawn.x - GAME_WIDTH / 2), this.titleViewTop());
  }

  /** The world y at the top of the title's view: two ground tiles at the bottom. */
  private titleViewTop(): number {
    return this.level.groundLine + TILE * 2 - GAME_HEIGHT;
  }

  /**
   * Hands the running game's state over to the version replacing it.
   *
   * Called from the hot-reload hook in `src/dev/hot.ts`, never during play.
   */
  captureState(): GameSnapshot | undefined {
    if (!this.player || this.titleMode) {
      return undefined;
    }

    return {
      levelIndex: this.levelIndex,
      x: this.player.x,
      y: this.player.y,
      velocityX: this.player.body.velocity.x,
      velocityY: this.player.body.velocity.y,
      facingLeft: this.player.flipX,
      // Recorded by position rather than by index, so a level edit that adds or
      // removes charms elsewhere does not un-collect the wrong ones.
      collectedCharms: this.charms
        .getChildren()
        .filter((charm) => !(charm as Phaser.Physics.Arcade.Sprite).active)
        .map((charm) => charm.getData('levelPosition') as { x: number; y: number }),
      // Same reasoning as the charms: by position, not by which checkpoint
      // object this happens to be, since a level edit can reorder them.
      activeCheckpoint: this.activeCheckpoint?.getData('levelPosition') as
        | { x: number; y: number }
        | undefined,
      elapsedMs: this.elapsedMs,
      deaths: this.deaths,
      lives: this.lives,
      maxLives: this.maxLives,
      collected: this.collected,
      parts: [...this.parts],
      rocket: this.rocket,
      fuel: this.fuel,
      coins: this.coins,
      coinsFound: [...this.coinsFound],
      barClosed: this.barClosed,
      outside: this.outside,
      godMode: isGodMode(this),
    };
  }

  /** Puts a snapshot from the previous build back into this one. */
  restoreState(snapshot: GameSnapshot): void {
    // The charms already taken are taken again, quietly: no sound, and not
    // counted -- the count came back in the snapshot, and counting them a
    // second time doubled it (and lost every earlier level's share).
    for (const mark of snapshot.collectedCharms) {
      const match = this.charms.getChildren().find((charm) => {
        const at = charm.getData('levelPosition') as { x: number; y: number };
        return at.x === mark.x && at.y === mark.y;
      });

      if (match) {
        (match as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
      }
    }
    this.scoreText.setText(this.formatScore());

    if (snapshot.activeCheckpoint) {
      const mark = snapshot.activeCheckpoint;
      const match = this.checkpoints.getChildren().find((checkpoint) => {
        const at = checkpoint.getData('levelPosition') as { x: number; y: number };
        return at.x === mark.x && at.y === mark.y;
      });

      if (match) {
        this.activateCheckpoint(match as Phaser.Physics.Arcade.Sprite);
      }
    }

    // The level may have changed underneath the cat. Dropping it inside a rock
    // would wedge it, so fall back to the spawn rather than restore blindly.
    if (this.isClearForCat(snapshot.x, snapshot.y)) {
      this.player.setPosition(snapshot.x, snapshot.y);
      this.player.setVelocity(snapshot.velocityX, snapshot.velocityY);
      this.player.setFlipX(snapshot.facingLeft);
    }

    this.cameras.main.centerOn(this.player.x, this.player.y);
  }

  private resumeFromHotReload(): void {
    const snapshot = this.registry.get(SNAPSHOT_KEY) as GameSnapshot | undefined;

    if (!snapshot) {
      return;
    }

    this.registry.remove(SNAPSHOT_KEY);

    // A snapshot from another level says nothing useful about this one, beyond
    // which level to be on -- and that was already applied before create ran.
    if (snapshot.levelIndex === this.levelIndex) {
      this.restoreState(snapshot);
    }
  }

  /** Would a standing cat placed here be inside something solid? */
  private isClearForCat(x: number, y: number): boolean {
    const body = this.player.body;

    return (
      this.physics.overlapRect(
        x - body.width / 2 + 1,
        y - body.height + 1,
        body.width - 2,
        body.height - 2,
        false,
        true,
      ).length === 0
    );
  }

  update(_time: number, delta: number): void {
    // The clock runs whenever the level does: not on the title, not while
    // paused (update does not run then), but through dying and leaving. The
    // HUD shows it to the second, so the text is only touched when the
    // second changes.
    if (!this.titleMode) {
      this.elapsedMs += delta;
      stats.addPlayed(delta);
      const shown = formatClock(scoreMs(this.elapsedMs, this.deaths));
      if (this.clockText && this.clockText.text !== shown) {
        this.clockText.setText(shown);
      }
    }

    // Input is sampled first so that edge-triggered reads (jump-just-pressed)
    // are consistent for everything that runs this frame.
    this.controls.update();

    // The camels' backs are floors, before the cat decides what it is doing
    // this frame -- it has to see itself standing on one to jump from it.
    this.rideCamels(delta);

    // A part shows faintly until the cat is near it: they are to be looked for.
    for (const part of this.partSprites) {
      const near = Phaser.Math.Distance.Between(part.x, part.y, this.player.x, this.player.y - 9) < BOB.partSeen;
      part.setAlpha(near ? 1 : BOB.partFaint);
    }
    // And so does a coin.
    for (const coin of this.coinSprites) {
      const near = Phaser.Math.Distance.Between(coin.x, coin.y, this.player.x, this.player.y - 9) < BOB.partSeen;
      coin.setAlpha(near ? 1 : BOB.partFaint);
    }

    if (this.shop) {
      // At the bar the cat stands still and orders.
      this.player.setVelocity(0, this.player.body.velocity.y);
      this.stepShop();
    } else if (this.talk) {
      // In a conversation the cat stands and listens: Next is all it does.
      this.player.setVelocity(0, this.player.body.velocity.y);
      if (this.controls.jumpJustPressed) {
        this.nextLine();
      }
      this.placeBubble();
    } else if (!this.dying && !this.leaving) {
      this.player.step(this.controls, delta);
    }
    if (!this.titleMode && !this.dying && !this.leaving) {
      this.meetBob();
      this.meetKeeper();
      this.stepDoors();
    }
    this.sortCameras();

    const cat = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // The ears are wherever the cat is, so a rat at the other end of the swamp
    // is not heard scurrying. See `Sound.playAt`.
    sound.setListener(cat.x, cat.y);

    // Only what is near the cat runs at all. Everything else is put to sleep
    // rather than merely skipped -- see `doze` -- and wakes a full screen
    // before it could be seen, so nothing is ever caught standing still.
    for (const walker of this.walkers) {
      if (this.awake(walker)) {
        walker.step(delta, cat);
      } else {
        walker.doze();
      }
    }
    // Not during a talk: the bubble's camera draws whatever is made while it
    // is up, and a robot born then would be drawn twice.
    if (!this.titleMode && !this.dying && !this.leaving && !this.talk) {
      this.stepHatches(delta);
      this.stepCables(delta);
      this.stepHackers();
      this.stepObstacles(delta);
    }
    for (const piranha of this.piranhas) {
      if (this.awake(piranha)) {
        piranha.step(delta, cat, this.player.swimming);
      } else {
        piranha.doze();
      }
    }
    const catCover = { sneaking: this.player.sneaking, hidden: this.hidden() };
    for (const crow of this.crows) {
      if (this.awake(crow)) {
        crow.step(cat, delta, catCover);
      } else {
        crow.doze();
      }
    }
    // The crocodiles and the spiders move by writing their own position rather
    // than by velocity, so not being stepped is all the stopping they need.
    for (const crocodile of this.crocodiles) {
      if (this.awake(crocodile)) {
        crocodile.step(delta, cat, this.player.swimming);
      }
    }
    for (const spider of this.spiders) {
      if (this.awake(spider)) {
        spider.step(delta, cat);
      }
    }

    if (this.titleMode) {
      return;
    }

    // Weather and lava are the place rather than things living in it: they
    // carry on whether or not anybody is looking. What the lava does *not* do
    // off screen is be heard -- that is handled where it spits.
    this.lava?.step(delta);
    this.rain?.step(delta);
    const camels = this.walkers.filter((walker) => walker.rideable);
    for (const worm of this.worms) {
      worm.step(delta, cat, camels);
    }

    // A beetle that has fallen and gone is forgotten, and the way out opens.
    if (this.boss && !this.boss.active) {
      this.boss = undefined;
      this.openExits();
    }
    if (this.boss) {
      // A dying beetle is stepped wherever it is: its fall takes it out of
      // the awake range, and dozed there it would hang, faded, for ever.
      if (this.awake(this.boss) || this.boss.defeated) {
        this.boss.step(delta, cat);
        // The thorns are the one thing that hurts it: a spot off its back
        // per sting, and the last one is the end of it.
        if (!this.boss.defeated && this.thornRects.some((thorns) => this.overlapsBody(this.boss as Boss, thorns))) {
          this.boss.sting();
        }
      } else {
        this.boss.doze();
      }
    }

    this.godCooldown = Math.max(0, this.godCooldown - delta);

    // A cat that is dying is already dead, and one in the portal is out of
    // reach: nothing below here looks at either.
    if (this.dying || this.leaving) {
      return;
    }

    if (this.touchingSomethingDeadly()) {
      this.kill();
    }

    if (this.player.swimming && this.inReachOfACrocodile()) {
      this.kill();
    }

    if (this.player.y > this.level.heightInPixels + FALL_OUT_MARGIN) {
      // Falling out is the one thing god mode cannot simply shrug off: there is
      // no floor down there to carry on standing on. It puts the cat back and
      // charges nothing for it.
      if (import.meta.env.DEV && isGodMode(this)) {
        this.graze();
        this.player.respawnAt(this.respawnPoint.x, this.respawnPoint.y);
        this.cameras.main.centerOn(this.player.x, this.player.y);
      } else {
        this.kill();
      }
    }

    const entered = this.insideExit();
    if (entered) {
      this.leaveLevel(entered);
    }
  }

  /**
   * Whether the cat is *in* the portal, not merely touching it.
   *
   * The test is the cat's centre against the hole in the middle. Phaser's
   * overlap fired the moment a paw brushed the stone rim, so a cat running at
   * the door was gone before it visibly reached it, and one jumping over the
   * portal left the level by accident.
   */
  private insideExit(): { centre: Phaser.Math.Vector2; hole: Phaser.GameObjects.Image } | null {
    if (!this.exitsOpen) {
      return null;
    }
    const { x, y } = this.player.body.center;
    return (
      this.exits.find((exit) => {
        const dx = x - exit.centre.x;
        const dy = y - exit.centre.y;
        // A big portal has a big mouth, so the cat need not climb to its
        // middle: walking into its foot is enough. One that pulls reaches
        // out further still: that many tiles past its rim.
        const pull = this.level.portalPull;
        const opening =
          pull > 0
            ? (EXIT.diameter * this.level.portalScale) / 2 + pull * TILE
            : EXIT.openingRadius * this.level.portalScale;
        return dx * dx + dy * dy <= opening * opening;
      }) ?? null
    );
  }

  /** Whether a creature's body overlaps a rectangle. */
  private overlapsBody(creature: Phaser.Physics.Arcade.Sprite, rect: Phaser.Geom.Rectangle): boolean {
    const body = creature.body as Phaser.Physics.Arcade.Body;
    return body.right > rect.x && body.x < rect.right && body.bottom > rect.y && body.y < rect.bottom;
  }

  /**
   * Standing on a camel, by geometry rather than by physics.
   *
   * Arcade's collision between two moving bodies made landing on a camel a
   * coin toss: it chose the sideways separation whenever the cat came down
   * near the edge of the back, and after a snap it still dropped the cat
   * through. So the camel has no collider with the cat at all. Each frame,
   * a cat over the back that is not rising and whose feet are at the back
   * -- or will cross it this frame -- is stood on it: feet on the top, fall
   * stopped, carried by the camel's movement, and told it is on the ground
   * so that it can jump from there. It runs before the cat's own step so
   * the flag is seen the same frame.
   */
  private rideCamels(delta: number): void {
    const cat = this.player.body;
    const dt = delta / 1000;
    for (const walker of this.walkers) {
      if (!walker.rideable) {
        continue;
      }
      const moved = walker.x - ((walker.getData('lastX') as number | undefined) ?? walker.x);
      walker.setData('lastX', walker.x);
      const back = walker.body;
      const over = cat.right > back.x + 2 && cat.x < back.right - 2;
      if (!over || cat.velocity.y < 0) {
        continue;
      }
      const atBack = cat.bottom >= back.y - 3 && cat.bottom <= back.y + 6;
      const crossing = cat.bottom <= back.y + 1 && cat.bottom + cat.velocity.y * dt >= back.y - 1;
      if (atBack || crossing) {
        this.player.x += moved;
        // Sprite *and* body, and the body's frame delta zeroed: `update` runs
        // between the physics step and Arcade's `postUpdate`, which moves the
        // sprite by however far the body fell this frame -- so a sprite put
        // on the back alone was carried below it again before it was drawn,
        // and the cat fell through.
        this.player.y = back.y;
        cat.y = back.y - cat.height;
        cat.prevFrame.y = cat.y;
        this.player.setVelocityY(0);
        cat.touching.down = true;
        cat.touching.none = false;
      }
    }
  }

  /** Collects the rectangles of everything a sneaking cat can hide behind. */
  private gatherCover(): void {
    const keys = new Set(['bush', 'reed', this.tile('foliage-near')]);
    this.cover = this.children.list
      .filter((object): object is Phaser.GameObjects.Image => object instanceof Phaser.GameObjects.Image && keys.has(object.texture.key))
      .map((image) => image.getBounds());
  }

  /**
   * Whether the cat is hidden: sneaking, with the middle of its body behind
   * a bush, a reed or a clump of leaves. Standing up in a bush is not
   * hiding -- the ears and the tail are out -- and sneaking in the open is
   * not either.
   */
  private hidden(): boolean {
    if (!this.player.sneaking) {
      return false;
    }
    const { x, y } = this.player.body.center;
    return this.cover.some((rect) => rect.contains(x, y));
  }

  /**
   * Whether something at this position is close enough to be worth running.
   *
   * A rectangle rather than a radius, because the screen is a rectangle and
   * what is being asked is "could this be on it soon". The cave is four tiles
   * wide for every one it is tall, so a circle would wake far too much of it
   * sideways and far too little of it below.
   */
  private awake(thing: { x: number; y: number }): boolean {
    return (
      Math.abs(thing.x - this.player.x) <= AWAKE_RANGE.x &&
      Math.abs(thing.y - this.player.y) <= AWAKE_RANGE.y
    );
  }

  /** A texture name, resolved to this level's theme. */
  private tile(name: string): string {
    return tileKey(this.level.theme, name);
  }

  /**
   * Places the way out, if the level has one: a wormhole standing on the `E`
   * tile's ground with its foot sunk into it, drawn just behind the cat so it
   * walks in front of the rim and then into the light.
   *
   * No physics body. Whether the cat is inside is `insideExit`'s question,
   * asked every frame, because a body fires on a touch and a portal has to be
   * entered. Walking in starts the next level; the last level loops back to
   * the first, which is a placeholder for whatever finishing the game should
   * actually do.
   */
  private buildExit(): void {
    this.exits = this.level.exits.map((exit) => this.buildPortal(exit));
    // The scene instance is reused from level to level and run to run, and
    // only the beetle ever closes or opens the portals: a run that ended in
    // the volcano with the beetle still up left them closed, and the next
    // run's level 1 had a portal that could be seen but not entered.
    this.exitsOpen = true;
    if (this.level.boss) {
      this.closeExits();
    }
  }

  /** Takes the portals away until the beetle is dead. */
  private closeExits(): void {
    this.exitsOpen = false;
    for (const exit of this.exits) {
      exit.hole.setVisible(false);
    }
  }

  /** The beetle has fallen: the portals come up out of nothing, and can be entered. */
  private openExits(): void {
    if (this.exitsOpen) {
      return;
    }
    this.exitsOpen = true;
    sound.play('checkpoint');
    for (const exit of this.exits) {
      exit.hole.setVisible(true).setAlpha(0);
      this.tweens.add({
        targets: exit.hole,
        alpha: EXIT.alpha,
        duration: EXIT.openMs,
        ease: 'Sine.easeOut',
      });
    }
  }

  /** One portal, standing on one `E` tile's ground. */
  private buildPortal(exit: { x: number; y: number }): { centre: Phaser.Math.Vector2; hole: Phaser.GameObjects.Image } {
    const scale = this.level.portalScale;
    const diameter = EXIT.diameter * scale;
    const radius = diameter / 2;

    // Wider than its tile, so an `E` in the last column would hang over the
    // edge of the world: the disc is kept a sliver inside it.
    const margin = radius + 2;
    const centre = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(exit.x, margin, this.level.widthInPixels - margin),
      exit.y - (radius - EXIT.sink * scale),
    );

    // Over all the scenery and the creatures, and just under the cat, so
    // nothing scattered on the exit tile can hide it and the cat is seen
    // being drawn in rather than disappearing behind it.
    // The picture is bigger than the portal is shown; everything that scales
    // it below works from this base.
    const hole = this.add
      .image(centre.x, centre.y, PORTAL_KEY)
      .setDepth(EXIT.depth);
    const base = diameter / hole.width;
    hole.setScale(base).setAlpha(EXIT.alpha);

    // The foot is sunk into the ground, and the ground is drawn *under* the
    // portal, so the sunk part is clipped off instead: everything below the
    // ground line is masked away. A mask rather than a cropped texture
    // because the disc turns and warps, and a crop would turn with it.
    const lid = this.make.graphics({ x: 0, y: 0 }, false);
    const reach = diameter;
    lid.fillRect(centre.x - reach, centre.y - reach, reach * 2, reach + radius - EXIT.sink * scale);
    hole.setMask(lid.createGeometryMask());

    // It spins, and on top of that it swells and shrinks. The same amount
    // in both directions: it was wider-and-narrower against
    // taller-and-shorter at two speeds once, and a round picture came out
    // oval.
    this.tweens.add({
      targets: hole,
      angle: 360,
      duration: EXIT.spinMs,
      repeat: -1,
    });
    this.tweens.add({
      targets: hole,
      scale: { from: base * (1 - EXIT.warp), to: base * (1 + EXIT.warp) },
      duration: EXIT.warpMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return { centre, hole };
  }

  /**
   * The cat has stepped into the portal.
   *
   * It stops dead and is drawn into the centre, shrinking and fading, and
   * the portal fades out with it -- both to nothing over the same
   * `drawInMs` -- while the world fades to black (`fadeMs`, under the HUD)
   * and the next level starts on the far side of that. Its body is
   * switched off: it is no longer in the physical world, so no collider or
   * overlap -- a hedgehog arriving a step behind it -- fires for it again.
   * `update` stops stepping it and checking it for the same reason.
   */
  private leaveLevel(exit: { centre: Phaser.Math.Vector2; hole: Phaser.GameObjects.Image }): void {
    if (this.leaving) {
      return;
    }

    this.leaving = true;
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;
    sound.play('portal');

    // A portal that pulls catches the cat from well outside it, so the draw
    // in takes longer the further it has to go, and speeds up as it goes:
    // sucked in, not slid. The fade waits for it.
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, exit.centre.x, exit.centre.y);
    const drawIn = this.level.portalPull > 0 ? EXIT.drawInMs + distance * EXIT.pullMsPerPx : EXIT.drawInMs;
    this.tweens.add({
      targets: this.player,
      x: exit.centre.x,
      y: exit.centre.y,
      scale: 0.15,
      alpha: 0,
      duration: drawIn,
      ease: this.level.portalPull > 0 ? 'Cubic.easeIn' : 'Sine.easeIn',
    });
    this.tweens.add({
      targets: exit.hole,
      alpha: { from: EXIT.alpha, to: 0 },
      duration: drawIn,
      ease: 'Sine.easeIn',
    });
    // The world goes to black under the HUD; the hearts stay. The level name
    // sits under the fade and goes with the level it names.
    this.blackout(0, 1, Math.max(EXIT.fadeMs, drawIn), () => {
      // The sand path's portal goes off into space, to the map; the level
      // after it is picked up from there.
      if (this.level.next === 'space') {
        this.scene.start('Space', this.carry(this.levelIndex + 1));
        return;
      }
      // The dark web's portal is the way out of the internet: back out of
      // Bob's machine on the moon, for the end.
      if (this.level.next === 'victory') {
        const moon = LEVELS.findIndex((level) => level.theme === 'moon');
        this.scene.start('Game', { ...this.carry(moon), ending: true, viaDoor: true });
        return;
      }
      this.scene.start('Game', this.carry(this.levelIndex + 1));
    });
  }

  /**
   * The robots' worlds' own obstacles, wired to the cat once it exists:
   *
   * - **bounce pads**, which throw a cat that steps or lands on one high
   *   into the air (`OBSTACLES.bounce`);
   * - **moving platforms**, one-way like a branch, sliding back and forth
   *   along their track and carrying whoever stands on them;
   * - **crumbling ice**, solid until stood on, then shaking, falling, and
   *   back a few seconds later;
   * - and **ice** underfoot, where the cat's feet barely grip.
   */
  private buildObstacles(): void {
    this.player.grip = this.level.slippery ? OBSTACLES.iceGrip : 1;

    for (const pad of this.level.bouncePads) {
      const image = this.add.image(pad.x, pad.y, 'bounce-pad').setOrigin(0.5, 1).setDepth(-0.2).setData(KEEP_LIVE, true);
      this.pads.push({ image, x: pad.x, y: pad.y });
    }

    for (const mover of this.level.movers) {
      const cells = mover.width / TILE;
      const key = `cloud-platform-${cells}`;
      if (!this.textures.exists(key)) {
        bakeCloudPlatform(this, key, cells);
      }
      const body = this.physics.add.image(mover.x - 4, mover.y, key).setOrigin(0, 0).setDepth(-0.2);
      body.body.setAllowGravity(false);
      body.body.setImmovable(true);
      body.body.pushable = false;
      body.body.setSize(mover.width, BRANCH_THICKNESS, false).setOffset(4, 0);
      body.body.setVelocityX(OBSTACLES.moverSpeed);
      body.setData(KEEP_LIVE, true);
      this.physics.add.collider(this.player, body, undefined, () => landsOnBranch(this.player, body as unknown as Phaser.Physics.Arcade.Sprite));
      this.movers.push({ body, from: mover.from, to: mover.to, width: mover.width });
    }

    if (this.level.crumbles.length > 0) {
      const group = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Image });
      for (const cell of this.level.crumbles) {
        const tile = group.create(cell.x, cell.y, 'crumble-ice').setOrigin(0, 0).refreshBody() as Phaser.Types.Physics.Arcade.ImageWithStaticBody;
        tile.setDepth(-0.2).setData(KEEP_LIVE, true).setData('solid', true);
        this.crumbles.push({ tile, x: cell.x, y: cell.y, timer: -1, gone: 0 });
      }
      this.physics.add.collider(this.player, group);
      this.physics.add.collider(this.walkers, group);
    }
  }

  /** The obstacles, once a frame: pads to bounce on, platforms to move, ice to crumble. */
  private stepObstacles(delta: number): void {
    const cat = this.player.body;
    if (this.bouncing && cat.velocity.y >= 0) {
      this.bouncing = false;
      cat.maxVelocity.y = CAT.maxFallSpeed;
    }

    for (const pad of this.pads) {
      const top = pad.y - PAD_SIZE.height + 3;
      const over = cat.right > pad.x - 7 && cat.x < pad.x + 7;
      if (over && cat.velocity.y >= 0 && cat.bottom >= top && cat.bottom <= pad.y + 1 && !this.player.climbing && !this.player.swimming) {
        // The cat's speed is capped for falling (`CAT.maxFallSpeed`), and the
        // cap holds going up too: lifted for the bounce, put back once it
        // starts to fall.
        // As high on any world: scaled from the gravity it was set for.
        const throwSpeed = OBSTACLES.bounce * Math.sqrt(this.physics.world.gravity.y / (CAT.gravity * OBSTACLES.bounceGravity));
        this.player.body.maxVelocity.y = Math.abs(throwSpeed);
        this.bouncing = true;
        this.player.setVelocityY(throwSpeed);
        sound.play('boing');
        pad.image.setTexture('bounce-pad-down');
        this.time.delayedCall(160, () => pad.image.setTexture('bounce-pad'));
      }
    }

    for (const mover of this.movers) {
      const left = mover.body.body.x;
      const right = left + mover.width;
      if (right >= mover.to && mover.body.body.velocity.x > 0) {
        mover.body.body.setVelocityX(-OBSTACLES.moverSpeed);
      } else if (left <= mover.from && mover.body.body.velocity.x < 0) {
        mover.body.body.setVelocityX(OBSTACLES.moverSpeed);
      }
    }

    for (const crumble of this.crumbles) {
      if (crumble.gone > 0) {
        crumble.gone -= delta;
        const inTheWay = cat.right > crumble.x && cat.x < crumble.x + TILE && cat.bottom > crumble.y && cat.y < crumble.y + TILE;
        if (crumble.gone <= 0 && !inTheWay) {
          crumble.tile.setPosition(crumble.x, crumble.y).setAlpha(1);
          crumble.tile.body.enable = true;
          crumble.tile.refreshBody();
          crumble.timer = -1;
        } else if (crumble.gone <= 0) {
          crumble.gone = 200;
        }
        continue;
      }
      const standing =
        cat.blocked.down &&
        Math.abs(cat.bottom - crumble.y) < 2 &&
        cat.right > crumble.x + 2 &&
        cat.x < crumble.x + TILE - 2;
      if (crumble.timer < 0 && standing) {
        crumble.timer = 0;
        sound.play('crack');
      }
      if (crumble.timer >= 0) {
        crumble.timer += delta;
        crumble.tile.x = crumble.x + (Math.floor(crumble.timer / 40) % 2 === 0 ? 0.6 : -0.6);
        if (crumble.timer >= OBSTACLES.crumbleMs) {
          crumble.tile.body.enable = false;
          crumble.gone = OBSTACLES.crumbleBackMs;
          this.tweens.add({ targets: crumble.tile, y: crumble.y + 60, alpha: 0, duration: 500, ease: 'Cubic.easeIn' });
        }
      }
    }
  }

  /** Everything the run carries into the next level, or into space. */
  private carry(levelIndex: number): {
    levelIndex: number;
    lives: number;
    maxLives: number;
    collected: number;
    elapsedMs: number;
    deaths: number;
    parts: string[];
    rocket: boolean;
    fuel: number;
    coins: number;
    coinsFound: string[];
    barClosed: boolean;
    from: string;
  } {
    return {
      // Where the cat comes from: in space it sets off beside this world.
      from: this.level.name,
      levelIndex,
      lives: this.lives,
      maxLives: this.maxLives,
      collected: this.collected,
      elapsedMs: this.elapsedMs,
      deaths: this.deaths,
      parts: [...this.parts],
      rocket: this.rocket,
      fuel: this.fuel,
      coins: this.coins,
      coinsFound: [...this.coinsFound],
      barClosed: this.barClosed,
    };
  }

  /**
   * Bob's parts in this level (`K`): a brass cog each, bobbing and turning
   * slowly, except the ones already found this run. Touching one takes it:
   * a sound, "Part 3/10" grown and faded over the screen, and the count in
   * the HUD.
   */
  private buildParts(): void {
    if (this.titleMode) {
      return;
    }
    for (const part of this.level.parts) {
      const id = `${this.level.name}:${part.x},${part.y}`;
      if (this.parts.includes(id)) {
        continue;
      }
      const sprite = this.physics.add.staticImage(part.x, part.y, 'part');
      sprite.setDepth(7);
      this.tweens.add({ targets: sprite, angle: 360, duration: 4000, repeat: -1 });
      sprite.setData('partId', id);
      this.partSprites.push(sprite);
    }
  }

  /** The cat has touched a part: it is Bob's, and one more found. */
  private takePart(sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody): void {
    const id = sprite.getData('partId') as string;
    if (this.parts.includes(id)) {
      return;
    }
    this.parts.push(id);
    sprite.destroy();
    this.partSprites = this.partSprites.filter((other) => other !== sprite);
    sound.play('checkpoint');
    this.announceBonus(`Part ${this.parts.length}/${PARTS.total}`);
    this.refreshParts();
  }

  /** The level's coins (`$`), but not one already found this run. Spinning, like a part. */
  private buildCoins(): void {
    if (this.titleMode) {
      return;
    }
    for (const coin of this.level.coins) {
      const id = `${this.level.name}:${coin.x},${coin.y}`;
      if (this.coinsFound.includes(id)) {
        continue;
      }
      const sprite = this.physics.add.staticImage(coin.x, coin.y, 'coin').setDepth(7);
      this.tweens.add({ targets: sprite, scaleX: { from: 1, to: 0.2 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      sprite.setData('coinId', id);
      this.coinSprites.push(sprite);
    }
  }

  /** The cat has found a coin: one more to spend, up to `BOB.maxCoins`. */
  private takeCoin(sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody): void {
    const id = sprite.getData('coinId') as string;
    if (this.coinsFound.includes(id)) {
      return;
    }
    this.coinsFound.push(id);
    this.coins = Math.min(this.coins + 1, BOB.maxCoins);
    sprite.destroy();
    this.coinSprites = this.coinSprites.filter((other) => other !== sprite);
    sound.play('checkpoint');
    this.announceBonus('+1 coin');
    this.refreshCoins();
  }

  /** The coins in the HUD: the row comes up the first time there are any. */
  private refreshCoins(): void {
    if (!this.coinsText && this.coins > 0 && this.scoreText) {
      this.buildCoinsHud();
    }
    this.coinsText?.setText(`${this.coins}`);
  }

  /** The coin and its count, under the parts (or where they would be). */
  private buildCoinsHud(): void {
    const y = this.partsText ? TILE * 4 + 8 : TILE * 3 + 2;
    this.add
      .image(GAME_WIDTH - TILE - 16, y + 8, 'coin')
      .setScrollFactor(0)
      .setDepth(1000);
    this.coinsText = crispText(this, GAME_WIDTH - TILE - 26, y, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd34d',
      stroke: '#2f2a1a',
      strokeThickness: 3,
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  /** The parts count in the HUD: shown once there are parts to find. */
  private refreshParts(): void {
    if (!this.partsText) {
      return;
    }
    this.partsText.setText(`${this.parts.length}/${PARTS.total}`);
  }

  /**
   * The moon's grey blocks, once a frame.
   *
   * **Breaking**: holding down while touching a block -- standing on it, or
   * pressed against its side -- cracks it, and after `ROBOT.breakMs` it is
   * gone, collision and all. Letting go mends the cracks: it has to be one
   * hold. Sneaking does not keep a robot off, so breaking a block with one
   * coming is a risk.
   *
   * **Spawning**: an awake block lets a robot out every `ROBOT.spawnEveryMs`,
   * standing on its top, unless `ROBOT.maxAlivePerBlock` of its own are
   * still about.
   */
  private stepHatches(delta: number): void {
    const cat = this.player.body;
    const reach = ROBOT.breakReach;
    const holding = this.controls.sneak && !this.player.climbing && !this.player.swimming;

    for (const hatch of this.hatches) {
      if (!hatch.tile.active) {
        continue;
      }

      const touching =
        cat.right > hatch.x - reach &&
        cat.x < hatch.x + TILE + reach &&
        cat.bottom > hatch.y - reach &&
        cat.y < hatch.y + TILE + reach;
      if (holding && touching) {
        hatch.breaking += delta;
        const stage = hatch.breaking / ROBOT.breakMs;
        hatch.tile.setTexture(stage < 1 / 3 ? 'robot-hatch' : stage < 2 / 3 ? 'robot-hatch-1' : 'robot-hatch-2');
        hatch.tile.x = hatch.x + (Math.floor(hatch.breaking / 40) % 2 === 0 ? 0.5 : -0.5);
        if (hatch.breaking >= ROBOT.breakMs) {
          this.breakHatch(hatch);
        }
        continue;
      }
      if (hatch.breaking > 0) {
        hatch.breaking = 0;
        hatch.tile.setTexture('robot-hatch');
        hatch.tile.x = hatch.x;
      }

      if (!this.awake({ x: hatch.x, y: hatch.y })) {
        continue;
      }
      hatch.robots = hatch.robots.filter((robot) => robot.active);
      hatch.spawnIn -= delta;
      if (hatch.spawnIn > 0) {
        continue;
      }
      hatch.spawnIn = ROBOT.spawnEveryMs;
      if (hatch.robots.length < ROBOT.maxAlivePerBlock) {
        hatch.robots.push(this.spawnRobot(hatch.x + TILE / 2, hatch.y));
      }
    }
  }

  /** A robot climbs out of the top of a grey block, and is wired up like any walker. */
  private spawnRobot(x: number, y: number): GroundEnemy {
    const robot = new GroundEnemy(this, x, y, 'robot', this.player.x < x ? -1 : 1);
    robot.setFences(this.baseRects);
    this.walkers.push(robot);
    this.physics.add.collider(robot, this.blocks);
    this.physics.add.collider(robot, this.branchGroup, undefined, (walker, branch) =>
      landsOnBranch(walker as Phaser.Physics.Arcade.Sprite, branch as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, robot, () => this.touchRobot(robot));
    robot.setScale(1, 0.2);
    this.tweens.add({ targets: robot, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
    sound.playAt('beep', x, y);
    return robot;
  }

  /**
   * The cat and a robot meet. Coming down on it from above breaks it: it
   * falls apart, the cat bounces off, and `ROBOT.mendMs` later the bits fly
   * back together and it rolls on. Any other way, it has the cat.
   */
  private touchRobot(robot: GroundEnemy): void {
    const cat = this.player.body;
    const fromAbove = cat.velocity.y > 0 && cat.bottom <= robot.body.y + ROBOT.stompReach;
    if (!fromAbove || this.dying || this.talk || this.shop) {
      if (!fromAbove) {
        this.bitten(false);
      }
      return;
    }
    this.player.setVelocityY(CAT.jumpVelocity * ROBOT.stompBounce);
    this.smashRobot(robot);
  }

  /** A robot in bits on the ground, and the bits back into a robot later. */
  private smashRobot(robot: GroundEnemy): void {
    robot.smash();
    sound.play('crunch');
    this.cameras.main.shake(100, 0.003);
    const floor = robot.y;
    const keys = ['robot-bit-eye', 'robot-bit-plate', 'robot-bit-plate', 'robot-bit-tread', 'robot-bit-tread', 'robot-bit-antenna', 'robot-bit-arm'];
    const bits = keys.map((key, i) => {
      const bit = this.add.image(robot.x, floor - 8, key).setOrigin(0.5, 1).setDepth(-0.4);
      const side = (i - (keys.length - 1) / 2) * 4 + (Math.random() - 0.5) * 4;
      const landX = robot.x + side;
      // Up and out, then down onto the floor where it stood, with a bounce.
      this.tweens.add({ targets: bit, x: landX, angle: (Math.random() - 0.5) * 360, duration: 520, ease: 'Quad.easeOut' });
      this.tweens.add({
        targets: bit,
        y: floor - 16 - Math.random() * 10,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({ targets: bit, y: floor, duration: 340, ease: 'Bounce.easeOut' }),
      });
      return bit;
    });
    // Coming to: a shiver first, so a cat standing there has a warning.
    this.time.delayedCall(ROBOT.mendMs - ROBOT.shakeMs, () => {
      for (const bit of bits) {
        this.tweens.add({ targets: bit, x: bit.x + 1, duration: 60, yoyo: true, repeat: Math.floor(ROBOT.shakeMs / 240) });
      }
    });
    this.time.delayedCall(ROBOT.mendMs - 300, () => {
      for (const bit of bits) {
        this.tweens.add({ targets: bit, x: robot.x, y: floor - 6, angle: 0, duration: 300, ease: 'Quad.easeIn' });
      }
    });
    // Not on top of the cat, though: while it stands there, the bits wait.
    const mend = (): void => {
      if (!this.sys.isActive() || !robot.active) {
        return;
      }
      if (Phaser.Geom.Intersects.RectangleToRectangle(robot.getBounds(), this.player.getBounds())) {
        this.time.delayedCall(250, mend);
        return;
      }
      for (const bit of bits) {
        bit.destroy();
      }
      robot.mend();
      robot.setScale(1, 0.2);
      this.tweens.add({ targets: robot, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
      sound.playAt('crunch', robot.x, robot.y);
    };
    this.time.delayedCall(ROBOT.mendMs, mend);
  }

  /** A grey block breaks: gone, in a burst of chips, and no more robots from it. */
  private breakHatch(hatch: { tile: Phaser.Physics.Arcade.Sprite; x: number; y: number }): void {
    hatch.tile.destroy();
    sound.play('crunch');
    this.cameras.main.shake(120, 0.004);
    for (let i = 0; i < 8; i += 1) {
      const chip = this.add
        .image(hatch.x + TILE / 2, hatch.y + TILE / 2, 'hatch-chip')
        .setDepth(1);
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      this.tweens.add({
        targets: chip,
        x: chip.x + Math.cos(angle) * (14 + Math.random() * 10),
        y: chip.y + Math.sin(angle) * (14 + Math.random() * 10) - 6,
        alpha: 0,
        angle: 180,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => chip.destroy(),
      });
    }
  }

  /**
   * Builds everything that can kill the cat, and wires it to do so.
   *
   * Hedgehogs walk on the world, so they collide with it. Piranhas and crows
   * fly their own paths and only ever touch the cat.
   */
  private buildCreatures(
    blocks: Phaser.Physics.Arcade.StaticGroup,
    branches: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    this.buildExtraLives();

    this.walkers = this.level.walkers.map(
      (at) => new GroundEnemy(this, at.x, at.y, at.kind),
    );
    // A camel turns two tiles short of a cactus rather than carrying its
    // rider into one.
    for (const walker of this.walkers) {
      if (walker.rideable) {
        walker.setFences(this.cactusRects);
      }
      if (walker.isRobot) {
        walker.setFences(this.baseRects);
      }
    }
    this.piranhas = this.level.piranhas.map((at, index) => {
      // Each fish gets only the pool it lives in, never all the water.
      const pool = (this.level.pools[at.poolIndex] ?? []).map(
        (tile) => new Phaser.Geom.Rectangle(tile.x, tile.y, tile.width, tile.height),
      );

      return new Piranha(this, at.x, at.y, pool, index * 700);
    });
    this.crows = this.level.crows.map(
      (at) =>
        new Crow(this, at.x, this.titleMode ? Math.max(at.y, this.titleViewTop() + TILE) : at.y, this.level.crowBehaviour, {
          left: 0,
          right: this.level.widthInPixels,
        }),
    );
    this.spiders = this.level.spiders.map((at) => new Spider(this, at.x, at.y, at.size));
    this.crocodiles = this.level.crocodiles.map((at) => {
      // Each crocodile gets only the pool it lies in, never all the water --
      // the same fence the piranhas swim behind.
      const pool = (this.level.pools[at.poolIndex] ?? []).map(
        (tile) => new Phaser.Geom.Rectangle(tile.x, tile.y, tile.width, tile.height),
      );

      return new Crocodile(this, at.x, at.y, pool);
    });

    for (const crocodile of this.crocodiles) {
      // One-way, exactly like a branch: the cat lands on the back coming down
      // and passes it going up. Landing is also what sets it sinking, which is
      // why the callback does the telling rather than a separate overlap.
      this.physics.add.collider(
        this.player,
        crocodile,
        () => crocodile.steppedOn(),
        () => landsOnBranch(this.player, crocodile),
      );
    }
    this.blocks = blocks;
    this.branchGroup = branches;
    this.boss = this.level.boss ? this.spawnBoss(this.level.boss) : undefined;

    for (const nest of this.level.nests) {
      // Two halves with the cat between them, which is what puts it *in* the
      // nest rather than on top of it.
      this.add.image(nest.x, nest.y, this.tile('nest')).setOrigin(0, 0).setDepth(-2);
      this.add
        .image(nest.x, nest.y, this.tile('nest-front'))
        .setOrigin(0, 0)
        .setDepth(6);
    }

    this.physics.add.collider(this.walkers, blocks);
    // Branches are one-way for anything that walks on them, not just the cat --
    // a hedgehog put on a branch falls straight through without this.
    this.physics.add.collider(
      this.walkers,
      branches,
      undefined,
      (walker, branch) =>
        landsOnBranch(
          walker as Phaser.Physics.Arcade.Sprite,
          branch as Phaser.Physics.Arcade.Sprite,
        ),
    );

    const everything: Phaser.Physics.Arcade.Sprite[] = [
      ...this.walkers,
      ...this.piranhas,
      ...this.crows,
      ...this.spiders,
    ];

    for (const creature of everything) {
      if (creature instanceof GroundEnemy && creature.rideable) {
        // A camel is stood on, not died on, and it is not a physics
        // collision at all: Arcade's separation of two moving bodies made
        // landing on it a coin toss, pushing the cat sideways or dropping it
        // through the back. The back is geometry, handled by `rideCamels`
        // every frame; the cat passes through the camel from the side.
        continue;
      }
      if (!this.titleMode && creature instanceof GroundEnemy && creature.isRobot) {
        this.physics.add.overlap(this.player, creature, () => this.touchRobot(creature));
        continue;
      }
      if (!this.titleMode) {
        const sneakSafe = creature instanceof Crow;
        this.physics.add.overlap(this.player, creature, () => this.bitten(sneakSafe));
      }
    }
  }

  /**
   * Draws the cacti and returns the rectangles that kill: the trunk and
   * arms, inset from the tile's sides, two tiles tall from the cell up.
   * Unlike thorns there is no crawling under a cactus and no jumping out of
   * one: touch it from any side, in any pose, and you are dead.
   */
  private buildCacti(): Phaser.Geom.Rectangle[] {
    // A column of `Y` is one cactus: each cell is two tiles tall from where
    // it stands, so a column of n is n + 1 tiles, drawn once at that height
    // and deadly as one rectangle.
    const cells = [...this.level.cacti].sort((a, b) => a.x - b.x || a.y - b.y);
    const rects: Phaser.Geom.Rectangle[] = [];
    let i = 0;
    while (i < cells.length) {
      const base = cells[i];
      let count = 1;
      while (i + count < cells.length && cells[i + count].x === base.x && cells[i + count].y === base.y + count * TILE) {
        count += 1;
      }
      // The sort puts the top cell first; the picture stands on the last.
      const bottom = cells[i + count - 1];
      const height = (count + 1) * TILE;
      const key = count === 1 ? 'cactus' : `cactus:${count}`;
      if (!this.textures.exists(key)) {
        bakeCactus(this, key, height);
      }
      this.add
        .image(bottom.x, bottom.y + TILE, key)
        .setOrigin(0, 1)
        .setDepth(-0.25);
      rects.push(new Phaser.Geom.Rectangle(bottom.x + CACTUS.inset, bottom.y + TILE - height + 2, TILE - CACTUS.inset * 2, height - 2));
      i += count;
    }
    return rects;
  }

  /**
   * Jellyfish: a mine each, washed up on the sand where the level put it,
   * pulsing a little. The pulse is a tween, which also keeps it out of the
   * scenery bake.
   */
  private buildJellies(): Phaser.Geom.Rectangle[] {
    return this.level.jellies.map((jelly, index) => {
      const image = this.add.image(jelly.x, jelly.y, 'jelly').setOrigin(0.5, 1).setDepth(-0.25).setData(KEEP_LIVE, true);
      this.tweens.add({
        targets: image,
        scaleY: 0.88,
        scaleX: 1.06,
        duration: 1300 + (index % 3) * 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return new Phaser.Geom.Rectangle(jelly.x - JELLY_SIZE.width / 2 + 2, jelly.y - JELLY_SIZE.height + 1, JELLY_SIZE.width - 4, JELLY_SIZE.height - 1);
    });
  }

  /**
   * The beetle, with everything it needs to be in the world: a collider
   * against the blocks (it flies, but not through rock), and the touch that
   * kills the cat. One place for it, so the dev respawn and the level's own
   * build cannot drift apart.
   */
  private spawnBoss(at: { x: number; y: number }): Boss {
    const boss = this.buildBoss(at);
    this.physics.add.collider(boss, this.blocks);
    if (!this.titleMode) {
      // The beetle cannot get at a cat sneaking under the thorns -- and only there.
      this.physics.add.overlap(this.player, boss, () => this.bitten(this.underThorns()));
    }
    return boss;
  }

  /**
   * Out into space from wherever the cat is, the run carried as it is.
   * Development only, off the level name: see `dev/spaceShortcut.ts`.
   */
  goToSpace(): void {
    this.scene.start('Space', this.carry(this.levelIndex));
  }

  /**
   * Is the cat in the water within reach of a crocodile?
   *
   * Only asked while swimming. Standing on a back is the safe way past one;
   * being in the water beside it is how the swamp collects its toll, and it is
   * what stops a missed jump from being free.
   */
  private inReachOfACrocodile(): boolean {
    const body = this.player.body;

    return this.crocodiles.some((crocodile) => {
      const jaws = crocodile.jaws;

      return (
        body.right > jaws.x &&
        body.x < jaws.right &&
        body.bottom > jaws.y &&
        body.y < jaws.bottom
      );
    });
  }

  /**
   * The beetle, told the one thing it needs to know about the room it is
   * in: **where the floor is**, so it never flies lower than its clearance
   * above it. Read off the level rather than tuned by hand, so moving the
   * arena does not silently leave the beetle scraping the wrong floor.
   */
  private buildBoss(at: { x: number; y: number }): Boss {
    // The floor is the first solid straight *below* the `X`, in its own
    // column. Not the level's `groundLine`: the arena's floor need not be
    // the level's, and when it was not, the beetle held station inside the
    // rock under the arena. Below only, never the nearest in any direction,
    // or an `X` written low in its arena finds the row it stands in.
    const floorY =
      this.level.solids
        .filter((solid) => !solid.isBranch && solid.x <= at.x && solid.x + solid.width > at.x && solid.y > at.y)
        .reduce<number | null>((top, solid) => (top === null || solid.y < top ? solid.y : top), null) ??
      this.level.groundLine;

    return new Boss(this, at.x, at.y, floorY);
  }

  /**
   * The weather and the sound of the place.
   *
   * Both come off the theme rather than off the level, because they are what
   * the *place* is like: two cave levels should sound and feel the same, and a
   * second swamp should have the same wind in it.
   *
   * The bed is one continuous layer. The sparse noises on top -- birds, drips --
   * are scheduled here rather than in `Sound`, because pacing them is a
   * decision about the level and the audio has no business holding timers.
   */
  private buildWeather(): void {
    const theme = this.level.theme;

    const bed: Record<string, Ambience> = {
      forest: 'wind',
      jungle: 'wind',
      swamp: 'wind',
      cave: 'hush',
      volcano: 'rumble',
      moon: 'hush',
      desert: 'wind',
      beach: 'wind',
      city: 'rain',
      path: 'wind',
    };

    sound.setAmbience(bed[theme] ?? 'none');

    if (theme === 'city') {
      this.rain = new Rain(this);
    }

    // Birds in anything with leaves in it, water in anything underground. Every
    // gap is different: birds on a fixed beat are a smoke alarm.
    const sparse: Partial<
      Record<string, { voice: 'chirp' | 'drip' | 'patter'; min: number; max: number }>
    > = {
      forest: { voice: 'chirp', min: 1800, max: 5200 },
      jungle: { voice: 'chirp', min: 1200, max: 3800 },
      // Rain is drops, not a hiss: often enough to be rain, never regular
      // enough to be a rhythm.
      city: { voice: 'patter', min: RAIN.patterMinMs, max: RAIN.patterMaxMs },
      path: { voice: 'chirp', min: 1600, max: 4600 },
      cave: { voice: 'drip', min: 2200, max: 6000 },
    };

    const sound_ = sparse[theme];

    if (sound_) {
      const again = (): void => {
        sound.play(sound_.voice);
        this.time.delayedCall(Phaser.Math.Between(sound_.min, sound_.max), again);
      };

      this.time.delayedCall(Phaser.Math.Between(sound_.min, sound_.max), again);
    }
  }

  /**
   * Is any part of the cat in the lava, or -- unless it is sneaking or on
   * its way up -- on the thorns?
   *
   * A sneaking cat crawls under the points. That is a rule of the game rather
   * than geometry (the 9px body does still overlap the thorn rectangle), and
   * it is deliberately about the *pose*, not the height: the pose is what the
   * player chose. The pose drops the moment the cat leaves the ground, and
   * that used to mean a cat could crawl into thorns but never jump out of
   * them; now a cat *rising* through thorns is spared too -- it is on its way
   * out. Coming down is not: falling into thorns, or back into the ones you
   * jumped from, still kills. Lava spares nothing.
   */
  private touchingSomethingDeadly(): boolean {
    const body = this.player.body;
    const inside = (zone: Phaser.Geom.Rectangle): boolean =>
      body.right > zone.x &&
      body.x < zone.right &&
      body.bottom > zone.y &&
      body.y < zone.bottom;

    if (this.lavaRects.some(inside) || this.cactusRects.some(inside) || this.jellyRects.some(inside)) {
      return true;
    }

    // A worm kills by the part of it that is out of the sand this frame,
    // sneaking or not.
    for (const worm of this.worms) {
      if (worm.touches(body)) {
        return true;
      }
    }

    // Velocity alone, not "airborne and rising": on the frame the jump is
    // pressed the body is still flagged as standing on the ground from the
    // last physics step, and that frame is exactly the one that killed a cat
    // jumping out of a sneak.
    const leaving = body.velocity.y < 0;

    return !this.player.sneaking && !leaving && this.thornRects.some(inside);
  }

  /**
   * Kills the cat and puts it back at the start.
   *
   * There is a pause before the respawn on purpose: a death that teleports you
   * instantly reads as a glitch rather than as something you did wrong, and
   * leaves no moment to see what hit you.
   */
  /**
   * A hit that does not count: the sound, the shake and the flush of red, and
   * nothing else. Only in god mode.
   */
  private graze(): void {
    if (this.godCooldown > 0) {
      return;
    }

    this.godCooldown = 700;
    sound.play('hurt');
    this.cameras.main.shake(140, 0.006);
    this.player.setTint(0xff6b6b);
    this.time.delayedCall(220, () => this.player.clearTint());
  }

  /**
   * A creature has touched the cat. Sneaking saves it only from the ones
   * that come down at it from above: a bird anywhere, and the beetle, but
   * only while the cat crawls under the thorns. Everything that
   * walks the ground -- hedgehog, rat, crab, robot -- and spiders and worms
   * get a sneaking cat like any other.
   */
  private underThorns(): boolean {
    const body = this.player.body;
    return this.thornRects.some(
      (zone) => body.right > zone.x && body.x < zone.right && body.bottom > zone.y && body.y < zone.bottom,
    );
  }

  private bitten(sneakSafe: boolean): void {
    if (sneakSafe && this.player.sneaking) {
      return;
    }
    this.kill();
  }

  private kill(): void {
    // Nothing happens to a cat in the middle of a conversation.
    if (this.dying || this.talk || this.shop) {
      return;
    }

    // God mode hears and feels it and loses nothing. Deliberately *not* silent:
    // a cheat that hides your mistakes hides the thing you were judging.
    if (import.meta.env.DEV && isGodMode(this)) {
      this.graze();
      return;
    }

    this.dying = true;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.player.setTint(0xff6b6b);

    sound.play('hurt');
    this.cameras.main.shake(180, 0.008);
    this.cameras.main.flash(200, 90, 0, 0);

    this.lives -= 1;
    this.deaths += 1;
    stats.addDeath();
    this.refreshLives();
    this.announce67();

    // The clock jumps a minute at once, and flushes red so the jump is seen.
    this.clockText?.setColor('#ff6b6b');
    this.time.delayedCall(650, () => this.clockText?.setColor('#ffffff'));

    this.time.delayedCall(650, () => {
      // A hot reload that lands while this is pending destroys the scene this
      // timer belongs to; without this, the callback runs anyway against
      // bodies that are already gone. Never reachable in the built game.
      if (!this.sys.isActive()) {
        return;
      }

      if (this.lives <= 0) {
        sound.play('gameOver');
        this.endRun();
        return;
      }

      this.player.clearTint();
      this.player.body.setAllowGravity(true);
      this.player.respawnAt(this.respawnPoint.x, this.respawnPoint.y);

      // Everything that was coming for the cat goes back to where it lives.
      // A crocodile is not stepped while the cat is dying, so without this it
      // goes on hunting a cat that drowned three seconds ago.
      for (const crocodile of this.crocodiles) {
        crocodile.settle();
      }
      this.resetExtraLives();
      this.cameras.main.centerOn(this.player.x, this.player.y);
      this.dying = false;
    });
  }

  /**
   * Out of hearts.
   *
   * The level is left on screen and **paused where it stands**, with the colour
   * drained out of this scene's own camera, and `GameOverScene` lays one red
   * word over it. A black screen would say the game stopped; a frozen,
   * colourless one says where it stopped and what stopped it.
   */
  private endRun(): void {
    this.cameras.main.filters.internal.addColorMatrix().colorMatrix.grayscale(1);
    this.scene.pause();
    // Out in space -- the moon or a robots' world -- the run is not over:
    // it starts again on the moon, with fresh hearts and everything found
    // so far kept. Anywhere else, back to the title.
    if (this.level.helmet) {
      const moon = LEVELS.findIndex((level) => level.theme === 'moon');
      this.scene.launch('GameOver', { restart: { ...this.carry(moon), lives: LIVES, maxLives: Math.max(LIVES, this.maxLives) } });
      return;
    }
    this.scene.launch('GameOver');
  }

  /**
   * Builds the collision, split in two because branches collide differently:
   * they are one-way, so they need a collider of their own with a rule on it.
   */
  private buildSolids(): {
    blocks: Phaser.Physics.Arcade.StaticGroup;
    branches: Phaser.Physics.Arcade.StaticGroup;
  } {
    // Physics Images, not Sprites: a tile never animates, and an Image is
    // not on the scene's update list, so once its picture is baked into the
    // scenery (`world/BakeScenery.ts`) it costs nothing per frame.
    const blocks = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Image });
    const branches = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Image });

    for (const solid of this.level.solids) {
      const group = solid.isBranch ? branches : blocks;
      // Ledges carry no art of their own: the tree crown or the nest is
      // already drawn, and this is only the surface to stand on.
      const invisible = solid.textureKey.endsWith('-ledge');
      const isVoid = solid.textureKey === 'void';
      const tile = group
        .create(
          solid.x,
          solid.y,
          // A grey block looks the same wherever it is: its texture is not the theme's.
          solid.glyph === 'D' || solid.glyph === 'I'
            ? solid.textureKey
            : this.tile(invisible ? 'branch-mid' : isVoid || solid.glyph === 'M' ? 'ground-fill' : solid.textureKey),
        )
        .setOrigin(0, 0)
        .refreshBody() as Phaser.Physics.Arcade.Sprite;

      // A grey block can be broken, so it is never flattened into the
      // scenery: it has to be able to crack and disappear.
      // A cable is scratched through and goes, so it is never baked either.
      if (solid.glyph === 'I') {
        tile.setData(KEEP_LIVE, true).setDepth(-0.25);
        this.cableTiles.set(`${solid.x / TILE},${solid.y / TILE}`, tile);
      }
      if (solid.glyph === 'D') {
        tile.setData(KEEP_LIVE, true).setData('hatch', true).setDepth(-0.25);
        this.hatches.push({ tile, x: solid.x, y: solid.y, spawnIn: ROBOT.spawnEveryMs, breaking: 0, robots: [] });
      }

      // A rock cell collides here but is not drawn here: its cluster is
      // drawn as one boulder by `buildBoulders`. A bough cell likewise: its
      // run is one fallen tree, drawn by `buildLogs`.
      if (solid.textureKey.startsWith('rock-') || solid.textureKey === 'bough' || isVoid || solid.glyph === 'M') {
        tile.setVisible(false);
      }

      // Ground in a stone place is cut from one big wall of fitted stone,
      // with a wobbling edge wherever it meets air: the cell collides here
      // but its picture is `stoneTile`'s, a little bigger than the cell.
      // Earth is a tile, and ground with air on two adjacent sides is cut
      // round at that corner.
      if (this.isGround(solid)) {
        const corners = this.cornersOf(solid);
        if (THEMES[this.level.theme].groundStyle === 'stone') {
          // Drawn as part of the whole mass by `buildStoneMass`.
          tile.setVisible(false);
        } else if (corners.tl || corners.tr || corners.bl || corners.br) {
          tile.setTexture(roundedTileKey(this, this.tile(solid.textureKey), corners, THEMES[this.level.theme]));
          this.floodCorners(solid, corners);
        }
      }

      // Probes look for solid ground by asking the physics world what is
      // nearby, and charms are static bodies too. Without this flag a hedgehog
      // turns round at a charm and the cat can wall jump off one.
      tile.setData('solid', true);
      if (invisible) {
        tile.setVisible(false);
      }

      // Sides buried inside a mass of rock or earth are switched off, so the
      // cat cannot snag on the seam between two tiles. See `exposedFaces`.
      const body = tile.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.up = solid.faces.up;
      body.checkCollision.down = solid.faces.down;
      body.checkCollision.left = solid.faces.left;
      body.checkCollision.right = solid.faces.right;

      this.dressGround(solid);

      // A branch cell in a leafy place collides here but is drawn as part of
      // one whole branch by `buildBranches`, leaves and all.
      if (this.isWood(solid)) {
        tile.setVisible(false);
      } else if (solid.isBranch && !(invisible && THEMES[this.level.theme].columnStyle === 'drainpipe')) {
        // Leaves hang below a branch as decoration only. They are not part of
        // the collision box, so the cat lands on the wood rather than on
        // foliage.
        const variant = (solid.x / TILE) % TILE_VARIANTS;
        this.add
          .image(solid.x, solid.y + solid.height, this.tile(variant === 0 ? 'branch-leaves' : `branch-leaves-${variant}`))
          .setOrigin(0, 0)
          .setDepth(-5);
      }
    }

    this.buildVoid();
    this.buildStoneMass();
    this.buildBoulders();
    this.buildBases();
    this.buildPark();
    this.buildBars();
    this.buildDoors();
    this.buildCables();
    this.buildHackers();
    this.buildLogs();
    this.buildBranches();
    this.buildFillets();

    return { blocks, branches };
  }

  /**
   * Water behind a rounded corner. A corner cut out of a ground tile shows
   * whatever is behind the tile, and behind it is the backdrop -- the water
   * is only ever drawn in water cells. So where the cell beside a rounded
   * corner is water, the bed and the translucent water are drawn into that
   * corner of the ground tile as well, and the cut reveals water. At the
   * surface the water starts `WATER_DROP` down, the same as in its own cell.
   */
  private floodCorners(solid: Solid, corners: Corners): void {
    const r = CORNER_RADIUS;
    const waterBeside = (dx: number): WaterZone | undefined =>
      this.level.waterZones.find((zone) => zone.x === solid.x + dx && zone.y === solid.y);

    const flood = (cornerX: number, cornerY: number, water: WaterZone): void => {
      const drop = water.isSurface && cornerY === 0 ? WATER_DROP : 0;

      this.add
        .image(solid.x, solid.y, this.tile('water-bed'))
        .setOrigin(0, 0)
        .setDepth(-8)
        .setCrop(cornerX, cornerY + drop, r, r - drop);
      this.add
        .image(solid.x, solid.y, this.tile('water'))
        .setOrigin(0, 0)
        .setAlpha(0.62)
        .setDepth(20)
        .setCrop(cornerX, cornerY + drop, r, r - drop);
    };

    const left = waterBeside(-TILE);
    const right = waterBeside(TILE);

    if (left && corners.tl) flood(0, 0, left);
    if (left && corners.bl) flood(0, TILE - r, left);
    if (right && corners.tr) flood(TILE - r, 0, right);
    if (right && corners.br) flood(TILE - r, TILE - r, right);
  }

  /**
   * Draws every horizontal run of `B` cells as one fallen tree. The cells
   * still collide one by one; the log is only the picture, baked once per
   * length and variant.
   */
  private buildLogs(): void {
    const boughs = this.level.solids.filter((solid) => solid.textureKey === 'bough');
    const cells = new Set(boughs.map((solid) => `${solid.x / TILE},${solid.y / TILE}`));
    const palette = THEMES[this.level.theme];
    const random = createRandom(8161);

    for (const solid of boughs) {
      const column = solid.x / TILE;
      const row = solid.y / TILE;

      if (cells.has(`${column - 1},${row}`)) {
        continue;
      }

      let length = 1;
      while (cells.has(`${column + length},${row}`)) {
        length += 1;
      }

      const variant = Math.floor(random() * 3);
      const key = `${this.level.theme}:log:${length}:${variant}`;

      if (!this.textures.exists(key)) {
        bakeLog(this, key, length, palette, 2203 + length * 41 + variant * 101);
      }

      this.add
        .image(solid.x - LOG_BULGE.side, solid.y - LOG_BULGE.top, key)
        .setOrigin(0, 0)
        .setFlipX(random() < 0.5)
        .setDepth(-1);
    }
  }

  /**
   * Fills every run of `_` cells flat dark: one stretched image per run,
   * in the colour the ground shade fades to, so `#` deep in a mass and `_`
   * beside it meet without a seam. Baked with the rest of the scenery.
   */
  private buildVoid(): void {
    const cells = new Set(this.level.voids.map((cell) => `${cell.x / TILE},${cell.y / TILE}`));
    const palette = THEMES[this.level.theme];
    const key = `${this.level.theme}:void-fill`;

    if (!this.textures.exists(key)) {
      // Flat: the tone the ground shade finishes in. Deep `#` is that tone
      // too (the fade runs to full strength), so `_` beside it is the same
      // picture and there is no seam.
      bakeTexture(this, key, TILE, TILE, (g) => {
        g.fillStyle(palette.shade, 1);
        g.fillRect(0, 0, TILE, TILE);
      });
    }

    for (const cell of this.level.voids) {
      const column = cell.x / TILE;
      const row = cell.y / TILE;

      if (cells.has(`${column - 1},${row}`)) {
        continue;
      }

      let length = 1;
      while (cells.has(`${column + length},${row}`)) {
        length += 1;
      }

      // A tile sprite repeats the texture along the run rather than
      // stretching it. Static, so the scenery bake flattens it like the rest.
      this.add.tileSprite(cell.x, cell.y, length * TILE, TILE, key).setOrigin(0, 0);
    }
  }

  /**
   * Draws all the stone ground as one mass of fitted stone, once, into a
   * Graphics that the scenery bake flattens with everything else.
   *
   * The stones come from the level: each is a run of one to three cells
   * inside a row of ground cells, so a stone never crosses into air, and
   * the mass's silhouette is the outline of the stones along it -- not a
   * cut. Rows are staggered so the joints do not line up. A stone with air
   * above is in the walking course and is drawn as such.
   */
  private buildStoneMass(): void {
    if (THEMES[this.level.theme].groundStyle !== 'stone') {
      return;
    }

    const ground = new Map<string, Solid>();
    const solid = new Set<string>();
    for (const s of this.level.solids) {
      if (this.isGround(s)) {
        ground.set(`${s.x / TILE},${s.y / TILE}`, s);
      }
      if (!s.isBranch && s.width === TILE && s.height === TILE) {
        solid.add(`${s.x / TILE},${s.y / TILE}`);
      }
    }
    for (const cell of this.level.voids) {
      solid.add(`${cell.x / TILE},${cell.y / TILE}`);
    }

    const columns = Math.ceil(this.level.widthInPixels / TILE);
    const rows = Math.ceil(this.level.heightInPixels / TILE);
    const boulders = new Set(
      this.level.solids.filter((s) => s.textureKey.startsWith('rock-')).map((s) => `${s.x / TILE},${s.y / TILE}`),
    );
    const pieces = bakeRockMass(
      this,
      `${this.level.theme}:rock:${this.levelIndex}`,
      columns,
      rows,
      (c, r) => ground.has(`${c},${r}`),
      (c, r) => solid.has(`${c},${r}`),
      (c, r) => boulders.has(`${c},${r}`),
      // A top is a surface something could lie on: ground-top with open air
      // above it. Not ground under a boulder: the rock is drawn in front of
      // the boulder, so pebbles there would sit on the boulder's foot and
      // read as pebbles on the boulder. Its feet get their own heaps.
      (c, r) => (ground.get(`${c},${r}`)?.textureKey ?? '').startsWith('ground-top') && !solid.has(`${c},${r - 1}`),
      THEMES[this.level.theme],
      9277,
    );

    for (const piece of pieces) {
      this.add.image(piece.x, piece.y, piece.key).setOrigin(0, 0).setDepth(-0.2);
    }
  }

  /** Earth: a `#` cell, whatever palette it wears. */
  private isGround(solid: Solid): boolean {
    return !solid.isBranch && solid.textureKey.startsWith('ground-');
  }

  /** Which corners of a ground tile have air on both sides. */
  private cornersOf(solid: Solid): Corners {
    const { up, down, left, right } = solid.faces;

    return { tl: up && left, tr: up && right, bl: down && left, br: down && right };
  }

  /**
   * Fills every inner corner of the ground with a quarter-disc of earth: an
   * air or water cell with ground on two adjacent sides (and in the corner
   * between them) gets one, so a floor curves up into its wall and a pool's
   * bed curves up into its bank. Pictures only; nothing collides with them.
   */
  private buildFillets(): void {
    if (THEMES[this.level.theme].groundStyle === 'stone') {
      return;
    }

    const ground = new Set(
      this.level.solids.filter((solid) => this.isGround(solid)).map((solid) => `${solid.x / TILE},${solid.y / TILE}`),
    );
    // Only an open cell gets a fillet: not rock, not a building, not void.
    // Void in particular is not `#` but is not air either, and a fillet
    // drawn into it put a green wedge at every corner of a cave's mass.
    const closed = new Set([
      ...this.level.solids
        .filter((solid) => !solid.isBranch && solid.width === TILE && solid.height === TILE)
        .map((solid) => `${solid.x / TILE},${solid.y / TILE}`),
      ...this.level.voids.map((cell) => `${cell.x / TILE},${cell.y / TILE}`),
    ]);
    const columns = Math.ceil(this.level.widthInPixels / TILE);
    const rows = Math.ceil(this.level.heightInPixels / TILE);
    const key = `${this.level.theme}:fillet`;
    const has = (c: number, r: number): boolean => ground.has(`${c},${r}`);
    const r = FILLET_RADIUS;

    bakeFillet(this, key, THEMES[this.level.theme]);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (closed.has(`${column},${row}`)) {
          continue;
        }

        const x = column * TILE;
        const y = row * TILE;
        const above = has(column, row - 1);
        const below = has(column, row + 1);
        const leftOf = has(column - 1, row);
        const rightOf = has(column + 1, row);

        // The texture is drawn for the bottom-left; the others are flips.
        if (leftOf && below && has(column - 1, row + 1)) {
          this.add.image(x, y + TILE - r, key).setOrigin(0, 0);
        }
        if (rightOf && below && has(column + 1, row + 1)) {
          this.add.image(x + TILE - r, y + TILE - r, key).setOrigin(0, 0).setFlipX(true);
        }
        if (leftOf && above && has(column - 1, row - 1)) {
          this.add.image(x, y, key).setOrigin(0, 0).setFlipY(true);
        }
        if (rightOf && above && has(column + 1, row - 1)) {
          this.add.image(x + TILE - r, y, key).setOrigin(0, 0).setFlipX(true).setFlipY(true);
        }
      }
    }
  }

  /**
   * A `=` cell drawn as part of one whole platform: a wooden branch where
   * the platforms are branches, a stone shelf where they are shelves.
   */
  private isWood(solid: Solid): boolean {
    const style = THEMES[this.level.theme].platformStyle;

    return (
      solid.isBranch &&
      (style === 'branch' || style === 'shelf' || style === 'awning') &&
      solid.textureKey.startsWith('branch-') &&
      !solid.textureKey.endsWith('-ledge')
    );
  }

  /**
   * Draws every run of `=` cells as one branch.
   *
   * The cells still collide one by one. A run with a trunk at one end grows
   * out of it: thick there, thinning to a rounded tip; one with no trunk is
   * a fallen bough, even along its length. The leaves under it hang from the
   * wood's actual underside at each cell, which the baker reports.
   */
  private buildBranches(): void {
    // A bench inside a moon base is drawn by the base, as a lab bench.
    const wood = this.level.solids.filter(
      (solid) => this.isWood(solid) && !this.benchCells.has(`${solid.x / TILE},${solid.y / TILE}`),
    );
    const cells = new Set(wood.map((solid) => `${solid.x / TILE},${solid.y / TILE}`));
    const palette = THEMES[this.level.theme];
    const random = createRandom(6131);
    const thicknessByKey = new Map<string, number[]>();

    const trunkBeside = (x: number, y: number): boolean =>
      this.level.climbZones.some((zone) => zone.x === x && zone.y <= y && zone.y + zone.height > y);

    for (const solid of wood) {
      const column = solid.x / TILE;
      const row = solid.y / TILE;

      // Only the leftmost cell of a run starts one.
      if (cells.has(`${column - 1},${row}`)) {
        continue;
      }

      let length = 1;
      while (cells.has(`${column + length},${row}`)) {
        length += 1;
      }

      const variant = Math.floor(random() * 3);

      if (palette.platformStyle === 'awning') {
        const awningKey = `${this.level.theme}:awning:${length}:${column},${row}`;
        if (!this.textures.exists(awningKey)) {
          bakeAwning(this, awningKey, length, 8101 + column * 31 + row * 17, palette.night ?? false);
        }
        this.add
          .image(solid.x - AWNING_BULGE.side, solid.y - AWNING_BULGE.top, awningKey)
          .setOrigin(0, 0)
          .setDepth(-1);
        continue;
      }

      if (palette.platformStyle === 'shelf') {
        const shelfKey = `${this.level.theme}:shelf:${length}:${variant}`;
        if (!this.textures.exists(shelfKey)) {
          bakeShelf(this, shelfKey, length, palette, 1501 + length * 37 + variant * 101);
        }
        this.add
          .image(solid.x - SHELF_BULGE.side, solid.y - SHELF_BULGE.top, shelfKey)
          .setOrigin(0, 0)
          .setDepth(-1);
        continue;
      }

      const base = trunkBeside(solid.x - TILE, solid.y)
        ? 'left'
        : trunkBeside(solid.x + length * TILE, solid.y)
          ? 'right'
          : 'none';
      const key = `${this.level.theme}:branch:${length}:${base}:${variant}`;

      if (!thicknessByKey.has(key)) {
        thicknessByKey.set(
          key,
          bakeBranch(this, key, length, base, palette, 1201 + length * 37 + variant * 101 + (base === 'left' ? 7 : base === 'right' ? 13 : 0)),
        );
      }

      const thickness = thicknessByKey.get(key) as number[];

      this.add
        .image(solid.x - (base === 'left' ? BRANCH_BULGE.root : 0), solid.y - BRANCH_BULGE.top, key)
        .setOrigin(0, 0)
        .setDepth(-1);

      for (let i = 0; i < length; i += 1) {
        const leafVariant = (column + i) % TILE_VARIANTS;
        this.add
          .image(
            solid.x + i * TILE,
            solid.y + (thickness[i] ?? solid.height),
            this.tile(leafVariant === 0 ? 'branch-leaves' : `branch-leaves-${leafVariant}`),
          )
          .setOrigin(0, 0)
          .setDepth(-5);
      }
    }
  }

  /**
   * On the beach, `R` is a sand castle, and a castle is **one picture**: every
   * cluster of touching rock cells -- `R`, `G` and `Q` alike, any shape -- is
   * baked as one mass of pressed sand by `bakeSandCastle`, edges only along
   * its silhouette, battlements along the top, a flag on each tower and an
   * arched gate wherever the `Q`s are. The cells still collide one by one as
   * rock does; this is only the picture.
   */
  private buildSandCastles(rocks: Solid[], cells: Map<string, string>): void {
    const seen = new Set<string>();
    for (const solid of rocks) {
      const startKey = `${solid.x / TILE},${solid.y / TILE}`;
      if (seen.has(startKey)) {
        continue;
      }
      // Flood the cluster.
      const cluster: Array<{ column: number; row: number; gate: boolean }> = [];
      const queue = [startKey];
      seen.add(startKey);
      while (queue.length > 0) {
        const key = queue.pop() as string;
        const [column, row] = key.split(',').map(Number);
        cluster.push({ column, row, gate: cells.get(key) === 'Q' });
        for (const next of [`${column + 1},${row}`, `${column - 1},${row}`, `${column},${row + 1}`, `${column},${row - 1}`]) {
          if (cells.has(next) && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      const left = Math.min(...cluster.map((cell) => cell.column));
      const top = Math.min(...cluster.map((cell) => cell.row));
      const wide = Math.max(...cluster.map((cell) => cell.column)) - left + 1;
      const high = Math.max(...cluster.map((cell) => cell.row)) - top + 1;
      const key = `${this.level.theme}:castle:${left},${top}`;
      if (!this.textures.exists(key)) {
        bakeSandCastle(
          this,
          key,
          cluster.map((cell) => ({ column: cell.column - left, row: cell.row - top, gate: cell.gate })),
          wide,
          high,
          5003 + left * 31 + top * 17,
        );
      }
      this.add
        .image(left * TILE, top * TILE - CASTLE_FLAG_HEADROOM, key)
        .setOrigin(0, 0)
        .setDepth(-0.3);
    }
  }

  /**
   * In the city, `R` is a house, and a house is **one picture**: every
   * cluster of touching cells of *one letter* is baked by `bakeHouse` --
   * so `RRRGGG` is two houses side by side, and a street is written by
   * alternating `R`, `G` and `Q`. Cells inside the outline that are open
   * (under wall, between walls on the same row) are an archway through it,
   * drawn as part of the house. The cells still collide one by one; this
   * is only the picture.
   */
  private buildHouses(rocks: Solid[], cells: Map<string, string>): void {
    const seen = new Set<string>();
    let houseNumber = 0;
    const solidCells = new Set(
      this.level.solids.filter((solid) => !solid.isBranch).map((solid) => `${solid.x / TILE},${solid.y / TILE}`),
    );
    // Left to right down the street, so the facades go round in order.
    for (const solid of [...rocks].sort((a, b) => a.x - b.x || a.y - b.y)) {
      const startKey = `${solid.x / TILE},${solid.y / TILE}`;
      if (seen.has(startKey)) {
        continue;
      }
      const letter = solid.glyph;
      const cluster: Array<{ column: number; row: number }> = [];
      const queue = [startKey];
      seen.add(startKey);
      while (queue.length > 0) {
        const key = queue.pop() as string;
        const [column, row] = key.split(',').map(Number);
        cluster.push({ column, row });
        for (const next of [`${column + 1},${row}`, `${column - 1},${row}`, `${column},${row + 1}`, `${column},${row - 1}`]) {
          if (cells.get(next) === letter && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      const left = Math.min(...cluster.map((cell) => cell.column));
      const top = Math.min(...cluster.map((cell) => cell.row));
      const wide = Math.max(...cluster.map((cell) => cell.column)) - left + 1;
      const mine = new Set(cluster.map((cell) => `${cell.column},${cell.row}`));

      // An archway: open air under this house, down to whatever it stands
      // over -- the upper storeys carried over the street on arches, which
      // the cat walks (or sneaks) through.
      const passages: Array<{ column: number; row: number }> = [];
      for (let column = left; column < left + wide; column += 1) {
        const lowest = Math.max(...cluster.filter((cell) => cell.column === column).map((cell) => cell.row));
        for (let row = lowest + 1; row <= lowest + 4; row += 1) {
          const below = `${column},${row}`;
          if (solidCells.has(below) || mine.has(below)) {
            break;
          }
          passages.push({ column: column - left, row: row - top });
        }
      }
      const high = Math.max(...cluster.map((cell) => cell.row - top), ...passages.map((cell) => cell.row)) + 1;

      const key = `${this.level.theme}:house:${left},${top}`;
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }
      bakeHouse(
        this,
        key,
        cluster.map((cell) => ({ column: cell.column - left, row: cell.row - top })),
        passages,
        wide,
        high,
        7001 + left * 31 + top * 17,
        // The facade: the next one along for each house down the street, so
        // two neighbours are never built of the same thing.
        houseNumber,
        THEMES[this.level.theme].night ?? false,
      );
      houseNumber += 1;
      this.add
        .image(left * TILE, top * TILE - HOUSE_HEADROOM, key)
        .setOrigin(0, 0)
        .setDepth(-0.3);
    }
  }

  /**
   * The space helmet, where the level says there is no air: a glass bubble
   * that sits on the cat's head in every pose. Moved after the physics step
   * (`postupdate`, registered after Arcade's own) so it is where the cat is
   * drawn, not where it was a frame ago, and taken off when the scene ends
   * -- the scene's events outlive a restart.
   */
  private buildHelmet(): void {
    if (!this.level.helmet) {
      return;
    }
    const helmet = this.add.image(0, 0, 'space-helmet').setDepth(this.player.depth + 0.01);
    const follow = (): void => {
      const cat = this.player;
      const key = cat.texture.key;
      const head = key.startsWith('cat-sneak')
        ? HEAD_IN_POSE.sneaking
        : key.startsWith('cat-climb')
          ? HEAD_IN_POSE.climbing
          : HEAD_IN_POSE.standing;
      const w = cat.width;
      const hx = cat.flipX ? w - head.x : head.x;
      helmet
        .setPosition(cat.x + (hx - w / 2) * cat.scaleX, cat.y + (head.y - cat.height) * cat.scaleY)
        .setScale(cat.scaleX)
        .setAlpha(cat.alpha)
        .setVisible(cat.visible);
    };
    follow();
    this.events.on('postupdate', follow);
    this.events.once('shutdown', () => this.events.off('postupdate', follow));
  }

  /**
   * Bob, once a frame: a cat that walks up to him -- within `BOB.reach`, on
   * its feet -- starts the talk, the first time; every time after that he
   * is too busy. The cat has to walk `BOB.rearm` away before he notices it
   * again, or standing there would start it over and over.
   */
  private meetBob(): void {
    const bob = this.bob;
    if (!bob || this.talk) {
      return;
    }
    const dx = Math.abs(this.player.x - bob.sprite.x);
    const dy = Math.abs(this.player.y - bob.sprite.y);
    if (bob.near) {
      if (dx > BOB.rearm || dy > TILE) {
        bob.near = false;
      }
      return;
    }
    if (dx > BOB.reach || dy > 4 || !this.player.body.blocked.down) {
      return;
    }
    bob.near = true;
    if (bob.met) {
      this.sayBusy();
      return;
    }
    this.startTalk();
  }

  /**
   * The talk with Bob: the HUD goes, the camera leaves the cat and zooms in
   * on the lab with Bob and the cat in it, and his first line comes up in a
   * bubble over him, with Next under it.
   */
  private startTalk(): void {
    const bob = this.bob as NonNullable<GameScene['bob']>;
    this.player.setVelocity(0, 0);

    // Everything pinned to the screen in front of the world -- the HUD, the
    // touch buttons -- would be zoomed with it, so it is put away.
    const hidden = this.children.list.filter((child) => {
      const pinned = child as unknown as { scrollFactorX?: number; depth?: number; visible?: boolean };
      return pinned.scrollFactorX === 0 && (pinned.depth ?? 0) >= 0 && pinned.visible === true;
    });
    for (const child of hidden) {
      (child as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    }

    const camera = this.cameras.main;
    camera.stopFollow();
    camera.pan((bob.sprite.x + this.player.x) / 2, bob.sprite.y - 36, BOB.zoomMs, 'Sine.easeInOut');
    camera.zoomTo(BOB.zoom, BOB.zoomMs, 'Sine.easeInOut');

    // The bubble is drawn by a camera of its own that does not zoom, in
    // screen space over wherever Bob is on the zoomed screen: HTML words
    // under a zoomed camera drift off their place. Everything else is
    // hidden from that camera, and the bubble from the main one.
    const overlay = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.ignore(this.children.list.filter((child) => !hidden.includes(child)));
    const bubble = this.add.graphics().setScrollFactor(0).setDepth(2000);
    const words = crispText(this, 0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#1a2030',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    const next = crispText(this, 0, 0, 'Next ▸', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#3a5aa8',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
      .setInteractive();
    next.on('pointerdown', () => this.nextLine());
    camera.ignore([bubble, words, next]);
    this.talk = { line: -1, bubble, words, next, hidden, camera: overlay, lines: this.hasAllParts()
        ? BOB.thanks
        : BOB.lines.filter((line) => line !== BOB.coinsLine || !this.rocket) };
    this.nextLine();
    if (this.hasAllParts()) {
      this.feedTheMachine();
    }
  }

  /** On to Bob's next line, or the end of the talk after the last. */
  private nextLine(): void {
    const talk = this.talk;
    const bob = this.bob;
    if (!talk || !bob) {
      return;
    }
    talk.line += 1;
    if (talk.line >= talk.lines.length) {
      this.endTalk();
      return;
    }
    sound.play('beep');
    talk.words.setText(talk.lines[talk.line]);
    // The first time Bob tells his story he gives the cat its coins.
    if (talk.lines[talk.line] === BOB.coinsLine && !this.rocket) {
      this.coins = Math.min(this.coins + BOB.coins, BOB.maxCoins);
      sound.play('checkpoint');
    }
    const last = talk.line === talk.lines.length - 1;
    talk.next.setText(last ? (this.hasAllParts() ? BOB.thanksButton : BOB.lastButton) : 'Next ▸');
    this.placeBubble();
  }

  /**
   * Puts the bubble over Bob's head where it is on the screen right now --
   * the zoom moves him -- sized to the line: white, rounded, a tail down to
   * him. Called every frame of the talk.
   */
  private placeBubble(): void {
    const talk = this.talk;
    const bob = this.bob;
    if (!talk || !bob) {
      return;
    }
    const camera = this.cameras.main;
    const view = camera.worldView;
    const headX = (bob.sprite.x - view.x) * camera.zoom;
    const headY = (bob.sprite.y - 26 - view.y) * camera.zoom;
    const width = Math.max(talk.words.width, talk.next.width) + 16;
    // As tall as the words need: some of Bob's lines are two or three.
    const height = talk.words.height + 26;
    const x = Phaser.Math.Clamp(headX - width / 2, 4, GAME_WIDTH - width - 4);
    const y = Math.max(4, headY - height - 8);
    talk.bubble.clear();
    talk.bubble.fillStyle(0xffffff, 0.95);
    talk.bubble.fillRoundedRect(x, y, width, height, 6);
    talk.bubble.fillTriangle(headX - 5, y + height, headX + 5, y + height, headX, y + height + 7);
    talk.bubble.lineStyle(1, 0x9aa4b2, 1);
    talk.bubble.strokeRoundedRect(x, y, width, height, 6);
    talk.words.setPosition(x + width / 2, y + 6 + talk.words.height / 2);
    talk.next.setPosition(x + width / 2, y + height - 11);
  }

  /** The talk is over: the cat said yes, and Bob's rocket takes it. */
  private endTalk(): void {
    if (!this.talk || !this.bob) {
      return;
    }
    this.bob.met = true;
    // With every part brought back, Bob's machine has them -- and turns on
    // the cat.
    if (this.hasAllParts()) {
      this.zapTheCat();
      return;
    }
    // Otherwise the end of Bob's story is the rocket: the cat said yes, and
    // is off. The bubble and the zoom stay up under the fade; the next scene
    // starts clean.
    this.launchRocket();
  }

  /** The cat's parts go into Bob's machine: one after another, up and into its funnel. */
  private feedTheMachine(): void {
    const machine = this.machine;
    const talk = this.talk;
    if (!machine || !talk) {
      return;
    }
    const funnel = { x: machine.x - MACHINE_SIZE.width / 2 + 17, y: machine.y - MACHINE_SIZE.height + 2 };
    for (let i = 0; i < PARTS.total; i += 1) {
      const part = this.add.image(this.player.x, this.player.y - 6, 'part').setDepth(1).setScale(0.6).setAlpha(0);
      talk.camera.ignore(part);
      this.tweens.add({
        targets: part,
        alpha: 1,
        x: funnel.x,
        y: { value: funnel.y, ease: 'Back.easeIn' },
        angle: 360,
        delay: 300 + i * 160,
        duration: 520,
        onComplete: () => {
          part.destroy();
          sound.play('beep');
          this.tweens.add({ targets: machine, scaleY: 0.92, duration: 60, yoyo: true });
        },
      });
    }
  }

  /**
   * "I'm sorry": the machine zaps the cat. Lightning from its zapper to the
   * cat, the screen flashes white, and the cat is inside the internet --
   * the first of its levels.
   */
  private zapTheCat(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    const machine = this.machine;
    const talk = this.talk;
    const from = machine
      ? { x: machine.x - MACHINE_SIZE.width / 2 + MACHINE_ZAPPER.x, y: machine.y - MACHINE_SIZE.height + MACHINE_ZAPPER.y }
      : { x: this.player.x + 40, y: this.player.y - 20 };
    const bolt = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    talk?.camera.ignore(bolt);
    const strike = (): void => {
      bolt.clear();
      for (const [width, colour] of [[3, 0x4aa8ff], [1, 0xffffff]] as const) {
        bolt.lineStyle(width, colour, 1);
        bolt.beginPath();
        bolt.moveTo(from.x, from.y);
        const steps = 6;
        for (let i = 1; i < steps; i += 1) {
          const t = i / steps;
          bolt.lineTo(
            Phaser.Math.Linear(from.x, this.player.x, t) + (Math.random() - 0.5) * 6,
            Phaser.Math.Linear(from.y, this.player.y - 4, t) + (Math.random() - 0.5) * 10,
          );
        }
        bolt.lineTo(this.player.x, this.player.y - 4);
        bolt.strokePath();
      }
    };
    sound.play('laser');
    strike();
    this.time.addEvent({ delay: 60, repeat: 12, callback: strike });
    this.player.setTint(0x8ad8ff);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 70, yoyo: true, repeat: 6 });
    this.cameras.main.shake(700, 0.01);
    const white = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3000)
      .setAlpha(0);
    talk?.camera.ignore(white);
    this.tweens.add({
      targets: white,
      alpha: 1,
      delay: 500,
      duration: 500,
      onComplete: () => {
        sound.play('whoosh');
        this.scene.start('Game', this.carry(LEVELS.findIndex((level) => level.theme === 'youtube')));
      },
    });
  }

  /** Whether the cat has found every one of Bob's parts. */
  /**
   * The end. The cat comes back out of Bob's machine, in a flash, the way it
   * went in -- and the lab is empty. It looks round, one way and the other;
   * "Bob is gone..."; and the game is won, with Bob to be back in Catnah 2.
   * The cat does not move meanwhile: it is a scene, not play.
   */
  private playEnding(): void {
    const machine = this.machine;
    if (!machine) {
      return;
    }
    this.leaving = true;
    this.player.respawnAt(machine.x - MACHINE_SIZE.width / 2 - 14, machine.y + 2);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(true);
    this.player.setVisible(false);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.time.delayedCall(ENDING.outMs, () => {
      sound.play('laser');
      this.cameras.main.flash(400, 160, 210, 255);
      this.player.setVisible(true).setTint(0x8ad8ff);
      this.tweens.add({ targets: this.player, alpha: 0.3, duration: 70, yoyo: true, repeat: 5, onComplete: () => this.player.clearTint() });
    });
    this.time.delayedCall(ENDING.lookMs, () => this.player.setFlipX(false));
    this.time.delayedCall(ENDING.lookMs * 2, () => this.player.setFlipX(true));
    this.time.delayedCall(ENDING.goneMs, () => this.announceBonus(ENDING.gone));
    this.time.delayedCall(ENDING.endMs, () =>
      this.blackout(0, 1, EXIT.fadeMs, () =>
        this.scene.start('Victory', { elapsedMs: this.elapsedMs, deaths: this.deaths, parts: this.parts.length, bobGone: true }),
      ),
    );
  }

  private hasAllParts(): boolean {
    return this.parts.length >= PARTS.total;
  }

  /**
   * Off in Bob's rocket: a whoosh, the screen goes white and then black,
   * and the flight starts -- with Mars and Saturn open on the map now, and
   * the parts to find. The talk's bubble and zoom stay up until the fade
   * covers them; the next scene starts clean.
   */
  private launchRocket(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.rocket = true;
    sound.play('whoosh');
    this.cameras.main.flash(300, 255, 255, 255);
    const black = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3000)
      .setAlpha(0);
    this.talk?.camera.ignore(black);
    this.tweens.add({
      targets: black,
      alpha: 1,
      delay: 300,
      duration: 700,
      onComplete: () => this.scene.start('Space', this.carry(this.levelIndex + 1)),
    });
  }

  /** Bob, after the talk: too busy, in a word over his head, and back to work. */
  private sayBusy(): void {
    const bob = this.bob as NonNullable<GameScene['bob']>;
    this.busyWords?.destroy();
    const words = crispText(this, bob.sprite.x, bob.sprite.y - 32, BOB.busy, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#1a2030',
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(21);
    this.busyWords = words;
    this.tweens.add({
      targets: words,
      alpha: 0,
      delay: BOB.busyMs - 400,
      duration: 400,
      onComplete: () => words.destroy(),
    });
  }

  /**
   * Draws each moon base -- every cluster of touching `M` cells -- as one
   * picture with its laboratory inside (`bakeMoonBase`). The picture reaches
   * down past the hull to the ground, for the inside and the doors; `=`
   * cells inside are its lab benches, and `buildBranches` leaves them be.
   */
  /**
   * The aliens' bar on Pluto: the hut with its shelf of bottles, the keeper
   * behind the counter, and guests on the stools in summer T-shirts, each
   * bobbing to music nobody else can hear. Robots are kept out, the way
   * they are kept out of the moon base.
   */
  private buildBars(): void {
    this.level.bars.forEach((bar, index) => {
      const left = bar.x;
      const floor = bar.y;
      this.add.image(left, floor, 'pluto-bar').setOrigin(0, 1).setDepth(-0.33);
      const keeper = this.add
        .sprite(left + BAR_KEEPER_X, floor - 14, 'bar-keeper')
        .setOrigin(0.5, 1)
        .setDepth(-0.32)
        .setData(KEEP_LIVE, true);
      this.tweens.add({ targets: keeper, y: keeper.y - 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.image(left, floor, 'pluto-bar-front').setOrigin(0, 1).setDepth(-0.31);
      BAR_STOOLS.forEach((x, stool) => {
        const guest = this.add
          .sprite(left + x, floor - 9, `bar-alien-${(stool + index * 3) % SHIRT_COLOURS.length}`)
          .setOrigin(0.5, 1)
          .setDepth(-0.3)
          .setFlipX(x > BAR_KEEPER_X)
          .setData(KEEP_LIVE, true);
        this.tweens.add({ targets: guest, y: guest.y - 1, angle: stool % 2 === 0 ? 4 : -4, duration: 380 + stool * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
      this.baseRects.push(new Phaser.Geom.Rectangle(left, floor - BAR_SIZE.height, BAR_SIZE.width, BAR_SIZE.height));
      this.keeper = { sprite: keeper, floor, near: false };
    });
  }

  /**
   * The doors (`n`). Outside, each is the doorway of a hut -- the bar on
   * Pluto -- drawn round it; inside a house, the door back out. Robots keep
   * out of a hut, as out of the bar and the moon base.
   */
  private buildDoors(): void {
    for (const door of this.level.doors) {
      if (this.level.inside) {
        this.add.image(door.x, door.y, 'bar-door').setOrigin(0.5, 1).setDepth(-0.35);
      } else {
        const left = door.x - HUT_DOOR.x - HUT_DOOR.width / 2;
        this.add.image(left, door.y, 'pluto-hut').setOrigin(0, 1).setDepth(-0.35);
        if (this.barClosed) {
          this.add.image(door.x, door.y, 'hut-boarded').setOrigin(0.5, 1).setDepth(-0.34);
        }
        this.baseRects.push(new Phaser.Geom.Rectangle(left, door.y - HUT_SIZE.height, HUT_SIZE.width, HUT_SIZE.height));
      }
      this.doors.push(new Phaser.Geom.Rectangle(door.x - 6, door.y - HUT_DOOR.height, 12, HUT_DOOR.height));
    }
  }

  /**
   * Walking into a doorway goes through it -- once the cat has been out of
   * every doorway since it arrived, so arriving in one is not a way straight
   * back.
   */
  private stepDoors(): void {
    if (this.doors.length === 0 || this.shop || this.talk) {
      return;
    }
    const inDoor = this.doors.some((door) => door.contains(this.player.x, this.player.body.bottom - 4));
    if (!inDoor) {
      this.doorArmed = true;
      return;
    }
    if (this.doorArmed && this.player.body.blocked.down) {
      // Shut, after the cat was thrown out: the keeper calls it through the door.
      if (this.barClosed && !this.level.inside) {
        this.doorArmed = false;
        this.sayClosed();
        return;
      }
      this.goThroughDoor();
    }
  }

  /** "Closed!" over the hut's door, called from inside, and gone again. */
  private sayClosed(): void {
    const door = this.level.doors[0];
    if (!door) {
      return;
    }
    sound.play('hurt');
    const words = crispText(this, door.x, door.y - HUT_DOOR.height - 8, BAR.replies.closed, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(21);
    this.tweens.add({ targets: words, y: words.y - 10, alpha: 0, delay: 1200, duration: 500, onComplete: () => words.destroy() });
  }

  /**
   * Through a door. Into a house: the level outside is remembered as it is,
   * the cat in the doorway, and the house's level starts. Out of one: the
   * level outside starts again as it was left.
   */
  private goThroughDoor(): void {
    this.leaving = true;
    this.player.setVelocity(0, 0);
    sound.play('whoosh');
    let next: object;
    if (this.level.inside) {
      const outside = LEVELS.findIndex((level) => level.name === this.level.inside);
      next = { ...this.carry(outside), resume: this.outside, viaDoor: true };
    } else {
      const inside = LEVELS.findIndex((level) => level.inside === this.level.name);
      const snapshot = this.captureState();
      next = {
        ...this.carry(inside),
        outside: snapshot && { ...snapshot, velocityX: 0, velocityY: 0 },
        viaDoor: true,
      };
    }
    this.blackout(0, 1, BAR.doorMs, () => this.scene.start('Game', next));
  }

  /**
   * Inside a house the main camera is zoomed in, and anything pinned to the
   * screen in front -- the HUD, the touch buttons, the bar's menu, the fades
   * -- would be zoomed with it and pushed off its place. So a second camera
   * that does not zoom draws those, and the main one everything else.
   */
  private buildHudCamera(): void {
    if (!this.level.inside || this.titleMode) {
      return;
    }
    this.hudCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.sortCameras();
  }

  /** Each object to the camera that draws it: see `buildHudCamera`. Every frame, as things come and go. */
  private sortCameras(): void {
    const hud = this.hudCamera;
    if (!hud) {
      return;
    }
    const main = this.cameras.main;
    for (const child of this.children.list) {
      const pinned = child as unknown as { scrollFactorX?: number; depth?: number };
      if (pinned.scrollFactorX === 0 && (pinned.depth ?? 0) >= 0) {
        main.ignore(child);
      } else {
        hud.ignore(child);
      }
    }
  }

  /** Standing in front of the keeper, on the floor, opens the menu -- once, until the cat walks off and back. */
  private meetKeeper(): void {
    const keeper = this.keeper;
    if (!keeper || this.shop || this.talk) {
      return;
    }
    const dx = Math.abs(this.player.x - keeper.sprite.x);
    const dy = Math.abs(this.player.body.bottom - keeper.floor);
    if (keeper.near) {
      if (dx > BAR.rearm || dy > TILE) {
        keeper.near = false;
      }
      return;
    }
    if (dx > BAR.reach || dy > 4 || !this.player.body.blocked.down) {
      return;
    }
    keeper.near = true;
    this.openShop();
  }

  /**
   * The menu: the keeper's question, the three things on offer with their
   * price in pink hearts, Bye, and how many hearts the cat has. Tap one, or
   * pick with left and right and take it with jump. Pinned to the screen,
   * over everything; no zoom, so the words stay put.
   */
  private openShop(): void {
    this.player.setVelocity(0, 0);
    const style = { fontFamily: 'monospace', fontSize: '11px', color: '#2a1030' };
    const width = 280;
    const height = 124;
    const x = Math.round(GAME_WIDTH / 2 - width / 2);
    // At the top, so the zoomed view of the keeper and the counter is under it.
    const y = 8;
    const panel = this.add.graphics().setScrollFactor(0).setDepth(2000);
    panel.fillStyle(0xfff4fa, 0.96);
    panel.fillRoundedRect(x, y, width, height, 8);
    panel.lineStyle(2, 0xff6fb5, 1);
    panel.strokeRoundedRect(x, y, width, height, 8);
    const question = crispText(this, GAME_WIDTH / 2, y + 12, BAR.greeting, { ...style, fontSize: '11px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    const labels = [...BAR.items.map((item) => `${item.label} — ${item.price} coins`), BAR.bye];
    const options = labels.map((label, i) => {
      const option = crispText(this, x + 22, y + 32 + i * 14, label, style)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(2001)
        .setInteractive();
      option.on('pointerdown', () => {
        if (this.shop && !this.shop.busy) {
          this.shop.selected = i;
          this.chooseInShop();
        }
      });
      return option;
    });
    const purse = crispText(this, x + width - 10, y + height - 12, '', { ...style, color: '#c0306a', align: 'right' })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    // The keeper's answer on a line of its own, over the coins.
    const reply = crispText(this, GAME_WIDTH / 2, y + height - 26, '', { ...style, color: '#3a5aa8' })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    this.shop = {
      panel,
      words: [question],
      options,
      reply,
      purse,
      selected: 0,
      busy: false,
      strikes: 0,
      wasLeft: this.controls.left,
      wasRight: this.controls.right,
      wasSneak: this.controls.sneak,
    };
    sound.play('beep');
    this.refreshShop();
    this.zoomOnKeeper(y + height);
  }

  /**
   * Close in on the keeper and the counter, the way the view closes in on
   * Bob, with them in the space under the menu.
   */
  private zoomOnKeeper(menuBottom: number): void {
    const keeper = this.keeper;
    if (!keeper) {
      return;
    }
    const camera = this.cameras.main;
    const zoom = BAR.shopZoom;
    const counter = keeper.floor - 20;
    const below = (menuBottom + GAME_HEIGHT) / 2;
    camera.stopFollow();
    camera.pan((keeper.sprite.x + this.player.x) / 2, counter - (below - GAME_HEIGHT / 2) / zoom, BAR.shopZoomMs, 'Sine.easeInOut');
    camera.zoomTo(zoom, BAR.shopZoomMs, 'Sine.easeInOut');
  }

  /** The highlight on the chosen line, and the hearts in the purse. */
  private refreshShop(): void {
    const shop = this.shop;
    if (!shop) {
      return;
    }
    const labels = [...BAR.items.map((item) => `${item.label} — ${item.price} coins`), BAR.bye];
    shop.options.forEach((option, i) => {
      option.setText(`${i === shop.selected ? '▸ ' : '  '}${labels[i]}`);
      option.setColor(i === shop.selected ? '#c0306a' : '#2a1030');
    });
    shop.purse.setText(`${this.coins} coins`);
  }

  /** Left and right move the highlight, a step per press; jump takes what it is on. */
  private stepShop(): void {
    const shop = this.shop;
    if (!shop || shop.busy) {
      return;
    }
    const count = shop.options.length;
    const left = this.controls.left;
    const right = this.controls.right || this.controls.sneak;
    if (left && !shop.wasLeft) {
      shop.selected = (shop.selected + count - 1) % count;
      this.refreshShop();
    }
    if (right && !(shop.wasRight || shop.wasSneak)) {
      shop.selected = (shop.selected + 1) % count;
      this.refreshShop();
    }
    shop.wasLeft = left;
    shop.wasRight = this.controls.right;
    shop.wasSneak = this.controls.sneak;
    if (this.controls.jumpJustPressed) {
      this.chooseInShop();
    }
  }

  /** Buys what is highlighted -- if the cat can pay and can use it -- or says goodbye. */
  private chooseInShop(): void {
    const shop = this.shop;
    if (!shop) {
      return;
    }
    const item = BAR.items[shop.selected];
    if (!item) {
      this.closeShop();
      return;
    }
    const say = (line: string): void => {
      shop.reply.setText(line);
      this.time.delayedCall(BAR.replyMs, () => {
        if (this.shop === shop && shop.reply.text === line) {
          shop.reply.setText('');
        }
      });
    };
    if (this.coins < item.price) {
      sound.play('hurt');
      shop.strikes += 1;
      if (shop.strikes >= BAR.strikes) {
        this.throwOut();
        return;
      }
      say(shop.strikes === BAR.strikes - 1 ? BAR.replies.warning : BAR.replies.poor);
      return;
    }
    if (item.id === 'life' && this.maxLives >= MAX_LIVES && this.lives >= MAX_LIVES) {
      say(BAR.replies.full);
      return;
    }
    if (item.id === 'milk' && this.lives >= this.maxLives) {
      say(BAR.replies.notHurt);
      return;
    }
    if (item.id === 'fuel' && this.fuel >= BAR.fuelMs) {
      say(BAR.replies.fueled);
      return;
    }
    // Paid up front; what was bought comes when the keeper has made it.
    this.coins -= item.price;
    shop.strikes = 0;
    shop.busy = true;
    this.refreshCoins();
    this.refreshShop();
    sound.play('beep');
    say(BAR.replies.serving);
    this.serve(item.id, () => {
      if (item.id === 'life') {
        // One more heart to hold, and filled.
        this.maxLives = Math.min(this.maxLives + 1, MAX_LIVES);
        this.lives = Math.min(this.lives + 1, this.maxLives);
      } else if (item.id === 'milk') {
        // Every empty heart filled again.
        this.lives = this.maxLives;
      } else {
        this.fuel = BAR.fuelMs;
      }
      this.refreshLives();
      sound.play('checkpoint');
      if (this.shop === shop) {
        shop.busy = false;
        say(BAR.replies[item.id]);
        this.refreshShop();
      }
    });
  }

  /**
   * The keeper makes what was ordered, on the counter in front of him, and
   * it goes to the cat; `done` once it is there. Milk is poured from the
   * bottle into a glass, a life comes up out of his hands, and rocket fuel
   * fills a tube beside him.
   */
  private serve(what: 'life' | 'milk' | 'fuel', done: () => void): void {
    const keeper = this.keeper;
    if (!keeper) {
      done();
      return;
    }
    const kx = keeper.sprite.x;
    const top = keeper.floor - 22;
    const depth = -0.305;
    const cat = { x: this.player.x, y: this.player.y - 8 };
    const after = (ms: number, then: () => void): void => {
      this.time.delayedCall(ms, () => {
        if (this.sys.isActive()) {
          then();
        }
      });
    };
    /** Off the counter to the cat, smaller and gone, and the order is the cat's. */
    const handOver = (things: Phaser.GameObjects.GameObject[], at: number): void => {
      after(at, () => {
        this.tweens.add({ targets: things, x: cat.x, y: cat.y, scale: 0.5, alpha: 0, duration: 450, ease: 'Quad.easeIn' });
      });
      after(at + 470, () => {
        for (const thing of things) {
          thing.destroy();
        }
        done();
      });
    };

    if (what === 'milk') {
      const gx = kx - 10;
      const glass = this.add.image(gx, top, 'bar-glass').setOrigin(0.5, 1).setDepth(depth);
      const inside = BAR_GLASS.inside;
      const milk = this.add
        .rectangle(gx - BAR_GLASS.width / 2 + inside.x, top - BAR_GLASS.height + inside.y + inside.height, inside.width, inside.height, 0xffffff)
        .setOrigin(0, 1)
        .setDepth(depth + 0.001)
        .setScale(1, 0);
      // The bottle in his hand over the glass, tipped, a stream of milk.
      const bottle = this.add.image(gx + 4, top - BAR_GLASS.height - MILK_BOTTLE.height / 2, 'milk-bottle').setOrigin(0.5, 0.5).setDepth(depth + 0.002);
      const stream = this.add
        .rectangle(gx, top - BAR_GLASS.height - 3, 1, BAR_GLASS.height + 1, 0xffffff)
        .setOrigin(0.5, 0)
        .setDepth(depth + 0.001)
        .setVisible(false);
      this.tweens.add({ targets: bottle, angle: -115, duration: 300, delay: 200 });
      after(500, () => {
        stream.setVisible(true);
        this.tweens.add({ targets: milk, scaleY: 1, duration: 900 });
      });
      after(1400, () => {
        stream.destroy();
        this.tweens.add({ targets: bottle, angle: 0, alpha: 0, duration: 300 });
      });
      after(1720, () => bottle.destroy());
      handOver([glass, milk], 1800);
      return;
    }

    if (what === 'life') {
      const heart = this.add.image(kx, keeper.floor - 30, 'life').setDepth(depth + 0.01).setScale(0);
      this.tweens.add({ targets: heart, scale: 1, duration: 350, ease: 'Back.easeOut' });
      this.tweens.add({ targets: heart, y: heart.y - 4, duration: 400, delay: 350, yoyo: true, ease: 'Sine.easeInOut' });
      handOver([heart], 1200);
      return;
    }

    // Rocket fuel: the tube beside him fills from the bottom up, bubbling.
    const tx = kx + 13;
    const tube = this.add.image(tx, top, 'fuel-tube').setOrigin(0.5, 1).setDepth(depth);
    const inside = FUEL_TUBE.inside;
    const fuel = this.add
      .rectangle(tx - FUEL_TUBE.width / 2 + inside.x, top - FUEL_TUBE.height + inside.y + inside.height, inside.width, inside.height, 0xffa030)
      .setOrigin(0, 1)
      .setDepth(depth + 0.001)
      .setScale(1, 0);
    this.tweens.add({ targets: fuel, scaleY: 1, duration: 1400, delay: 200 });
    const bubbles = [0, 1, 2].map((i) => {
      const bubble = this.add.rectangle(tx - 1 + (i % 2), top - 2, 1, 1, 0xfff0a0).setDepth(depth + 0.002).setAlpha(0);
      this.tweens.add({ targets: bubble, y: top - FUEL_TUBE.height + 4, alpha: { from: 1, to: 0 }, duration: 500, delay: 300 + i * 250, repeat: 2 });
      return bubble;
    });
    after(1700, () => {
      for (const bubble of bubbles) {
        bubble.destroy();
      }
    });
    handOver([tube, fuel], 1900);
  }

  /**
   * Once too often ordered what the cat cannot pay for: the keeper has had
   * enough, it reminds him of Bob, and the cat is shown the door. The bar is
   * shut for the rest of the run.
   */
  private throwOut(): void {
    const shop = this.shop;
    if (!shop) {
      return;
    }
    shop.busy = true;
    shop.reply.setText(BAR.replies.kicked);
    for (const option of shop.options) {
      option.setVisible(false);
    }
    this.cameras.main.shake(200, 0.004);
    this.time.delayedCall(BAR.kickMs, () => {
      if (!this.sys.isActive()) {
        return;
      }
      this.barClosed = true;
      this.closeShop();
      this.goThroughDoor();
    });
  }

  /** Bye: the menu goes, and the cat can walk again. */
  private closeShop(): void {
    const shop = this.shop;
    if (!shop) {
      return;
    }
    shop.panel.destroy();
    for (const word of [...shop.words, ...shop.options, shop.reply, shop.purse]) {
      word.destroy();
    }
    this.shop = undefined;
    // Back to the view of the room, following the cat again.
    const camera = this.cameras.main;
    camera.panEffect.reset();
    camera.zoomTo(this.level.inside ? BAR.insideZoom : 1, BAR.shopZoomMs, 'Sine.easeInOut');
    camera.startFollow(this.player, true, 0.12, 0.14);
  }

  /**
   * The internet's cables: each column of `I` cells is one cable, with a
   * plug on top. Scratched through as one.
   */
  private buildCables(): void {
    const seen = new Set<string>();
    const cells = [...this.cableTiles.keys()].map((key) => key.split(',').map(Number));
    cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [column, row] of cells) {
      if (seen.has(`${column},${row}`)) {
        continue;
      }
      const tiles: Phaser.Physics.Arcade.Sprite[] = [];
      let bottom = row;
      while (this.cableTiles.has(`${column},${bottom}`)) {
        seen.add(`${column},${bottom}`);
        tiles.push(this.cableTiles.get(`${column},${bottom}`) as Phaser.Physics.Arcade.Sprite);
        bottom += 1;
      }
      const plug = this.add
        .image(column * TILE, row * TILE - 10, 'cable-plug')
        .setOrigin(0, 0)
        .setDepth(-0.25)
        .setData(KEEP_LIVE, true);
      this.cables.push({ tiles, plug, x: column * TILE, top: row * TILE, bottom: bottom * TILE, scratched: 0 });
    }
  }

  /**
   * Scratching: holding down against a cable -- pressed to its side, or
   * standing on top of it -- claws at it, and after `INTERNET.scratchMs` of
   * one hold it snaps and the whole column goes. Letting go and the claw
   * marks stay, but the count starts again.
   */
  private stepCables(delta: number): void {
    if (this.cables.length === 0) {
      return;
    }
    const cat = this.player.body;
    const reach = INTERNET.scratchReach;
    const holding = this.controls.sneak && !this.player.climbing && !this.player.swimming;
    for (const cable of this.cables) {
      if (cable.tiles.length === 0) {
        continue;
      }
      const touching =
        cat.right > cable.x - reach &&
        cat.x < cable.x + TILE + reach &&
        cat.bottom > cable.top - reach &&
        cat.y < cable.bottom + reach;
      if (!(holding && touching)) {
        if (cable.scratched > 0) {
          cable.scratched = 0;
          for (const tile of cable.tiles) {
            tile.x = cable.x;
          }
        }
        continue;
      }
      const before = cable.scratched;
      cable.scratched += delta;
      const stage = cable.scratched / INTERNET.scratchMs;
      for (const tile of cable.tiles) {
        tile.setTexture(stage < 1 / 3 ? 'cable' : stage < 2 / 3 ? 'cable-1' : 'cable-2');
        tile.x = cable.x + (Math.floor(cable.scratched / 40) % 2 === 0 ? 0.5 : -0.5);
      }
      // A scratch sound every so often while the claws are at it.
      if (Math.floor(before / 220) !== Math.floor(cable.scratched / 220)) {
        sound.play('crunch');
      }
      if (cable.scratched >= INTERNET.scratchMs) {
        this.snapCable(cable);
      }
    }
  }

  /** A cable snaps: gone, with sparks and shreds of it flying. */
  private snapCable(cable: GameScene['cables'][number]): void {
    sound.play('crack');
    this.cameras.main.shake(140, 0.005);
    const middle = (cable.top + cable.bottom) / 2;
    for (let i = 0; i < 14; i += 1) {
      const y = cable.top + Math.random() * (cable.bottom - cable.top);
      const bit = this.add.image(cable.x + TILE / 2, y, i % 2 === 0 ? 'cable-bit' : 'spark').setDepth(1);
      if (i % 2 === 1) {
        bit.setTint(0x8ad8ff).setBlendMode(Phaser.BlendModes.ADD);
      }
      const angle = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: bit,
        x: bit.x + Math.cos(angle) * (16 + Math.random() * 18),
        y: bit.y + Math.sin(angle) * (16 + Math.random() * 18) + (y > middle ? 6 : -6),
        alpha: 0,
        angle: Math.random() * 360,
        duration: 420 + Math.random() * 260,
        ease: 'Cubic.easeOut',
        onComplete: () => bit.destroy(),
      });
    }
    for (const tile of cable.tiles) {
      tile.destroy();
    }
    cable.tiles = [];
    cable.plug.destroy();
  }

  /**
   * The dark web's hackers: a hooded figure at a laptop, and beside it a
   * sign with an arrow -- always pointing the wrong way, at spikes or a
   * drop. Harmless themselves; the lie is the danger.
   */
  private buildHackers(): void {
    this.level.hackers.forEach((at, index) => {
      const sprite = this.add
        .sprite(at.x, at.y, 'hacker')
        .setOrigin(0.5, 1)
        .setDepth(-0.3)
        .setFlipX(at.points === 'left')
        .setData(KEEP_LIVE, true);
      this.tweens.add({ targets: sprite, scaleY: 0.96, duration: 700 + index * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const side = at.points === 'left' ? -1 : 1;
      const sign = this.add
        .image(at.x + side * (HACKER_SIZE.width / 2 + 8), at.y, 'hacker-sign')
        .setOrigin(0.5, 1)
        .setDepth(-0.31)
        .setData(KEEP_LIVE, true);
      if (at.points === 'left') {
        sign.setFlipX(true);
      }
      if (at.points === 'up' || at.points === 'down') {
        // The board turned on its post: the arrow up, or down at the ground.
        sign.setOrigin(0.5, 0.5).setY(at.y - 11).setAngle(at.points === 'up' ? -90 : 90);
      }
      this.tweens.add({ targets: sign, angle: sign.angle + 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.hackers.push({ sprite, line: INTERNET.hackerLines[index % INTERNET.hackerLines.length], called: false });
    });
  }

  /** A hacker calls out to a cat that comes near -- once, until it goes away again. */
  private stepHackers(): void {
    for (const hacker of this.hackers) {
      const near = Phaser.Math.Distance.Between(hacker.sprite.x, hacker.sprite.y, this.player.x, this.player.y) < INTERNET.hackerCalls;
      if (near && !hacker.called) {
        hacker.called = true;
        hacker.words?.destroy();
        const words = crispText(this, hacker.sprite.x, hacker.sprite.y - HACKER_SIZE.height - 8, hacker.line, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#39ff6a',
          stroke: '#000000',
          strokeThickness: 3,
        })
          .setOrigin(0.5)
          .setDepth(21);
        hacker.words = words;
        this.tweens.add({ targets: words, alpha: 0, delay: 1800, duration: 400, onComplete: () => words.destroy() });
      } else if (!near && hacker.called && Phaser.Math.Distance.Between(hacker.sprite.x, hacker.sprite.y, this.player.x, this.player.y) > INTERNET.hackerCalls * 1.6) {
        hacker.called = false;
      }
    }
  }

  /**
   * The city's park: each run of `b` cells one bench and each run of `O`
   * cells one fountain, throwing drops up out of its bowl, with a strip of
   * lawn under the lot and a tree at each end. The seat and the rim are
   * one-way ledges already, from the parser; this is only what they look
   * like.
   */
  private buildPark(): void {
    const runs = (cells: Array<{ x: number; y: number }>): Array<{ x: number; y: number; cells: number }> => {
      const set = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
      return cells
        .filter((cell) => !set.has(`${cell.x - TILE},${cell.y}`))
        .map((cell) => {
          let length = 1;
          while (set.has(`${cell.x + length * TILE},${cell.y}`)) {
            length += 1;
          }
          return { x: cell.x, y: cell.y, cells: length };
        });
    };
    const benches = runs(this.level.benches);
    const fountains = runs(this.level.fountains);
    const all = [...benches, ...fountains];
    if (all.length === 0) {
      return;
    }

    // The lawn, from a tile before the first thing to a tile after the last.
    const left = Math.min(...all.map((run) => run.x)) - TILE;
    const right = Math.max(...all.map((run) => run.x + run.cells * TILE)) + TILE;
    const floor = all[0].y + TILE;
    const lawnCells = (right - left) / TILE;
    const lawnKey = `park-lawn:${lawnCells}:${left}`;
    if (!this.textures.exists(lawnKey)) {
      bakeLawn(this, lawnKey, lawnCells, 5501 + left);
    }
    this.add.image(left, floor - 3, lawnKey).setOrigin(0, 0).setDepth(-0.9);
    for (const x of [left + 6, right - 6]) {
      this.add.image(x, floor, 'park-tree').setOrigin(0.5, 1).setDepth(-3);
    }

    for (const bench of benches) {
      const key = `park-bench:${bench.cells}`;
      if (!this.textures.exists(key)) {
        bakeBench(this, key, bench.cells);
      }
      this.add.image(bench.x, bench.y - BENCH_HEADROOM, key).setOrigin(0, 0).setDepth(-0.8);
    }

    for (const fountain of fountains) {
      const key = `park-fountain:${fountain.cells}`;
      if (!this.textures.exists(key)) {
        bakeFountain(this, key, fountain.cells);
      }
      this.add.image(fountain.x, fountain.y - FOUNTAIN_HEADROOM, key).setOrigin(0, 0).setDepth(-0.8);

      // The jet: drops thrown up from the finial, falling back into the
      // bowl and over its edge into the basin.
      const gravity = 420;
      const speed = Math.sqrt(2 * gravity * PARK.jet);
      const emitter = this.add.particles(fountain.x + (fountain.cells * TILE) / 2, fountain.y - FOUNTAIN_HEADROOM, 'fountain-drop', {
        speedY: { min: -speed, max: -speed * 0.8 },
        speedX: { min: -22, max: 22 },
        gravityY: gravity,
        // Long enough to fall from the finial back down to the basin's rim.
        lifespan: ((speed + Math.sqrt(speed * speed + 2 * gravity * (FOUNTAIN_HEADROOM + PARK.fountainRim))) / gravity) * 1000,
        frequency: 1000 / PARK.dropsPerSecond,
        alpha: { start: 0.9, end: 0.5 },
        tint: [0xbfe3f5, 0x8ec4e6, 0xffffff],
        scale: { min: 0.5, max: 1 },
      });
      emitter.setDepth(-0.85).setData(KEEP_LIVE, true);
    }
  }

  private buildBases(): void {
    const walls = this.level.solids.filter((solid) => solid.glyph === 'M');
    const cells = new Set(walls.map((solid) => `${solid.x / TILE},${solid.y / TILE}`));
    const solid = new Set(
      this.level.solids.filter((cell) => !cell.isBranch).map((cell) => `${cell.x / TILE},${cell.y / TILE}`),
    );
    const seen = new Set<string>();
    for (const wall of walls) {
      const start = `${wall.x / TILE},${wall.y / TILE}`;
      if (seen.has(start)) {
        continue;
      }
      const cluster: Array<{ column: number; row: number }> = [];
      const queue = [start];
      seen.add(start);
      while (queue.length > 0) {
        const key = queue.pop() as string;
        const [column, row] = key.split(',').map(Number);
        cluster.push({ column, row });
        for (const next of [`${column + 1},${row}`, `${column - 1},${row}`, `${column},${row + 1}`, `${column},${row - 1}`]) {
          if (cells.has(next) && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      const left = Math.min(...cluster.map((cell) => cell.column));
      const right = Math.max(...cluster.map((cell) => cell.column));
      const top = Math.min(...cluster.map((cell) => cell.row));
      // Down to the ground under the middle of it.
      const middle = Math.round((left + right) / 2);
      let bottom = Math.max(...cluster.map((cell) => cell.row));
      while (bottom < top + 40 && !solid.has(`${middle},${bottom + 1}`)) {
        bottom += 1;
      }
      const benches = this.level.solids
        .filter((cell) => cell.isBranch && cell.textureKey.startsWith('branch-'))
        .map((cell) => ({ column: cell.x / TILE, row: cell.y / TILE }))
        .filter((cell) => cell.column > left && cell.column < right && cell.row > top && cell.row <= bottom);
      for (const bench of benches) {
        this.benchCells.add(`${bench.column},${bench.row}`);
      }
      this.baseRects.push(new Phaser.Geom.Rectangle(left * TILE, top * TILE, (right - left + 1) * TILE, (bottom - top + 1) * TILE));
      const key = `${this.level.theme}:base:${left},${top}`;
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }
      bakeMoonBase(
        this,
        key,
        cluster.map((cell) => ({ column: cell.column - left, row: cell.row - top })),
        benches.map((cell) => ({ column: cell.column - left, row: cell.row - top })),
        right - left + 1,
        bottom - top + 1,
        9101 + left * 31,
      );
      this.add
        .image(left * TILE, top * TILE - BASE_HEADROOM, key)
        .setOrigin(0, 0)
        .setDepth(-0.3);

      // The alien at work: at the computer, typing, facing it. In front of
      // the base and behind the cat; it is friendly, so nothing touches it.
      // Animated, so kept out of the scenery bake.
      const inside = baseInside(
        cluster.map((cell) => ({ column: cell.column - left, row: cell.row - top })),
        right - left + 1,
        bottom - top + 1,
      );
      const bobX = (left + inside.inLeft) * TILE + LAB_CONSOLE_X + 15;
      // At the end of the game Bob is gone: his chair is empty.
      if (!this.ending) {
        const bob = this.add
          .sprite(bobX, (bottom + 1) * TILE - 3, 'alien-a')
          .setOrigin(0.5, 1)
          .setFlipX(true)
          .setDepth(-0.28)
          .setData(KEEP_LIVE, true)
          .play('alien-work');
        this.bob = { sprite: bob, near: false, met: false };
      }

      // Back with every part: Bob has built his machine, beside him on the
      // lab floor, its zapper facing the room.
      if ((this.rocket && this.hasAllParts()) || this.ending) {
        this.machine = this.add
          .image(bobX + 50, (bottom + 1) * TILE - 3, 'bob-machine')
          .setOrigin(0.5, 1)
          .setDepth(-0.285)
          .setData(KEEP_LIVE, true);
      }

      // A little robot growing in the specimen tank: small at first, filling
      // out over a long minute, bobbing in the liquid, and starting again
      // small once it is grown -- the next one.
      const floor = (bottom + 1) * TILE - 3;
      const tankHeight = Math.min(LAB_TANK.maxHeight, floor + 3 - (top + inside.ceiling) * TILE - 12);
      const tankX = (left + inside.inRight) * TILE - LAB_TANK.fromRight + LAB_TANK.width / 2;
      const tankY = floor - tankHeight / 2 + 2;
      const growing = this.add
        .image(tankX, tankY, 'robot')
        .setDepth(-0.29)
        .setTint(0xb8f8c0)
        .setAlpha(0.9)
        .setScale(0.3)
        .setData(KEEP_LIVE, true);
      this.tweens.add({ targets: growing, scale: { from: 0.3, to: 0.85 }, duration: 9000, repeat: -1, repeatDelay: 2500, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: growing, y: tankY - 2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Flags planted in the dust, behind everything that moves.
    for (const flag of this.level.flags) {
      this.add.image(flag.x, flag.y, 'us-flag').setOrigin(0, 1).setDepth(-0.35);
    }
  }

  /**
   * Draws every cluster of `R` cells as one boulder.
   *
   * The cells still collide one by one; this is only the picture. A cluster
   * that fills its bounding rectangle is one rock; any other shape is a rock
   * per row. Anything wider than `BOULDER_MAX.wide` or taller than
   * `BOULDER_MAX.high` is broken into a pile of smaller ones, at seeded
   * widths so a long bank is not a row of equal blocks. Each size and
   * variant is baked once and cached under its key.
   */
  private buildBoulders(): void {
    const BOULDER_MAX = { wide: 9, high: 12 };
    const rocks = this.level.solids.filter((solid) => solid.textureKey.startsWith('rock-'));
    // Cell -> its letter. Cells join a cluster only through the same letter,
    // which is what lets a level draw a seam between two rocks.
    const cells = new Map(rocks.map((solid) => [`${solid.x / TILE},${solid.y / TILE}`, solid.glyph]));
    const seen = new Set<string>();
    const random = createRandom(4451);
    const palette = THEMES[this.level.theme];

    if (palette.rockStyle === 'sand') {
      this.buildSandCastles(rocks, cells);
      return;
    }
    if (palette.rockStyle === 'house') {
      this.buildHouses(rocks, cells);
      return;
    }

    // Every full cell of anything, for telling a buried stone from a boulder
    // in the open: a cluster with no air round it gets no moss.
    const anything = new Set(
      this.level.solids
        .filter((solid) => !solid.isBranch && solid.width === TILE && solid.height === TILE)
        .map((solid) => `${solid.x / TILE},${solid.y / TILE}`),
    );
    const columnsInLevel = Math.ceil(this.level.widthInPixels / TILE);
    const rowsInLevel = Math.ceil(this.level.heightInPixels / TILE);
    let exposed = true;

    const place = (column: number, row: number, wide: number, high: number): void => {
      const variant = Math.floor(random() * 3);
      // Resting on something solid? Then its base is flat.
      let restsOn = false;
      for (let c = column; c < column + wide; c += 1) {
        if (anything.has(`${c},${row + high}`)) {
          restsOn = true;
          break;
        }
      }
      const key = `${this.level.theme}:boulder:${wide}x${high}:${variant}:${exposed ? 'moss' : 'bare'}:${restsOn ? 'flat' : 'round'}`;

      if (!this.textures.exists(key)) {
        bakeBoulder(this, key, wide, high, palette, 977 + wide * 31 + high * 17 + variant * 101, exposed, restsOn);
      }

      // Behind the ground's own picture: the rock's edge draws over the
      // boulder's foot, so a boulder sits in the ground, not on it.
      this.add
        .image(column * TILE - BOULDER_BULGE.x, row * TILE - BOULDER_BULGE.y, key)
        .setOrigin(0, 0)
        .setDepth(-0.3);
    };

    // A rectangle of cells, broken into rocks no bigger than the maximum.
    const pile = (column: number, row: number, wide: number, high: number): void => {
      let r = row;
      while (r < row + high) {
        const h = Math.min(BOULDER_MAX.high, row + high - r);
        let c = column;
        while (c < column + wide) {
          const left = column + wide - c;
          const w = left <= BOULDER_MAX.wide ? left : 4 + Math.floor(random() * (BOULDER_MAX.wide - 3));
          place(c, r, Math.min(w, left), h);
          c += w;
        }
        r += h;
      }
    };

    for (const rock of rocks) {
      const start = `${rock.x / TILE},${rock.y / TILE}`;
      if (seen.has(start)) {
        continue;
      }

      // Flood the cluster, noting whether any cell of it touches air.
      const cluster: Array<[number, number]> = [];
      const queue: Array<[number, number]> = [[rock.x / TILE, rock.y / TILE]];
      const letter = rock.glyph;
      seen.add(start);
      exposed = false;
      while (queue.length) {
        const [c, r] = queue.pop() as [number, number];
        cluster.push([c, r]);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc;
          const nr = r + dr;
          const key = `${nc},${nr}`;
          const inside = nc >= 0 && nr >= 0 && nc < columnsInLevel && nr < rowsInLevel;
          if (inside && !anything.has(key)) {
            exposed = true;
          }
          if (cells.get(key) === letter && !seen.has(key)) {
            seen.add(key);
            queue.push([nc, nr]);
          }
        }
      }

      const columns = cluster.map(([c]) => c);
      const rows = cluster.map(([, r]) => r);
      const minC = Math.min(...columns);
      const maxC = Math.max(...columns);
      const minR = Math.min(...rows);
      const maxR = Math.max(...rows);
      const wide = maxC - minC + 1;
      const high = maxR - minR + 1;

      if (cluster.length === wide * high) {
        pile(minC, minR, wide, high);
        continue;
      }

      // Not a rectangle -- a staggered bank, say, each row a little wider
      // than the one above. Carve it into the biggest filled rectangles it
      // holds, top to bottom, left to right: a rock is as wide as its row
      // runs and as tall as every row below keeps that width. What is left
      // over at the edges becomes small rocks, which reads as rubble at the
      // foot of a bank.
      const free = new Set(cluster.map(([c, r]) => `${c},${r}`));
      const ordered = [...cluster].sort((a, b) => a[1] - b[1] || a[0] - b[0]);

      for (const [c, r] of ordered) {
        if (!free.has(`${c},${r}`)) {
          continue;
        }

        let w = 1;
        while (free.has(`${c + w},${r}`)) {
          w += 1;
        }

        let h = 1;
        const rowFilled = (rr: number): boolean => {
          for (let cc = c; cc < c + w; cc += 1) {
            if (!free.has(`${cc},${rr}`)) {
              return false;
            }
          }
          return true;
        };
        while (rowFilled(r + h)) {
          h += 1;
        }

        for (let rr = r; rr < r + h; rr += 1) {
          for (let cc = c; cc < c + w; cc += 1) {
            free.delete(`${cc},${rr}`);
          }
        }

        pile(c, r, w, h);
      }
    }
  }

  /**
   * Grass standing up above a ground tile. Scenery with no body: the ground's
   * silhouette against the sky is ragged turf rather than a ruled line.
   */
  private dressGround(solid: Solid): void {
    const match = /^ground-top(-\d)?$/.exec(solid.textureKey);

    if (!match || THEMES[this.level.theme].groundStyle === 'stone') {
      return;
    }

    const suffix = match[1] ?? '';
    const corners = this.cornersOf(solid);
    // Where a top corner is cut round there is no ground under the blades,
    // so the fringe stops short of it.
    const from = corners.tl ? CORNER_RADIUS : 0;
    const to = TILE - (corners.tr ? CORNER_RADIUS : 0);

    this.add
      .image(solid.x, solid.y - GRASS_FRINGE_HEIGHT + 1, this.tile(`grass-fringe${suffix}`))
      .setOrigin(0, 0)
      .setCrop(from, 0, to - from, GRASS_FRINGE_HEIGHT);
  }

  /**
   * Whether the cat should be stopped by a branch this frame.
   *
   * Branches are one-way. You jump up through one from underneath and land on
   * it coming down, which is what lets a branch grow straight out of a trunk
   * without walling off the climb.
   */
  private canLandOn(branch: Phaser.Physics.Arcade.Sprite): boolean {
    // A cat on a trunk passes through branches in both directions -- otherwise
    // the branches growing out of a trunk would block climbing it.
    if (this.player.climbing) {
      return false;
    }

    return landsOnBranch(this.player, branch);
  }

  /**
   * Draws the trunks and returns the rectangles the cat can climb.
   *
   * Trunks carry no physics body at all: they are meant to be walked past and
   * through, and only the cat's own climbing code cares where they are.
   */
  private buildTrunks(): Phaser.Geom.Rectangle[] {
    const wooded = THEMES[this.level.theme].columnStyle === 'trunk';

    if (wooded) {
      this.buildWholeTrunks();
    }

    return this.level.climbZones.map((zone) => {
      if (!wooded) {
        this.add
          .image(
            zone.x,
            zone.y,
            this.tile(
              zone.isTop ? (zone.againstWall ? 'trunk-head' : 'trunk-top') : 'trunk',
            ),
          )
          .setOrigin(0, 0)
          // Behind the cat, so a climbing cat is seen against its trunk.
          .setDepth(-3);
      }

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
  }

  /**
   * Draws every column of `T` cells as one trunk: wider at the foot than the
   * top, roots at the bottom, bark all the way up. The cells still collide
   * (and climb) one by one; this is only the picture. Each height and
   * variant is baked once and cached under its key.
   */
  private buildWholeTrunks(): void {
    const zones = [...this.level.climbZones].sort((a, b) => a.x - b.x || a.y - b.y);
    const palette = THEMES[this.level.theme];
    const random = createRandom(7919);
    let i = 0;

    if (palette.crownStyle === 'palm') {
      this.buildPalms(zones);
      return;
    }

    while (i < zones.length) {
      const top = zones[i];
      let cells = 1;

      while (
        i + cells < zones.length &&
        zones[i + cells].x === top.x &&
        zones[i + cells].y === top.y + cells * TILE
      ) {
        cells += 1;
      }

      const variant = Math.floor(random() * 3);
      const key = `${this.level.theme}:trunk:${cells}:${variant}`;

      if (!this.textures.exists(key)) {
        bakeTrunk(this, key, cells, palette, 3301 + cells * 53 + variant * 101);
      }

      this.add
        .image(top.x - TRUNK_BULGE, top.y, key)
        .setOrigin(0, 0)
        // Behind the cat, so a climbing cat is seen against its trunk.
        .setDepth(-3);

      i += cells;
    }
  }

  /**
   * The beach's palms, like its castles: columns of `T` grouped into one
   * picture each. A single column is a small palm; two columns side by side
   * with the same top and height are one **big** palm -- a wide trunk and a
   * bigger crown -- rather than two thin ones standing together. Every cell
   * still climbs on its own, so a big palm is climbed up either side. The
   * crown is anchored where the fronds meet the trunk's top, behind the cat
   * like the trunk.
   */
  private buildPalms(zones: ClimbZone[]): void {
    const palette = THEMES[this.level.theme];
    const random = createRandom(7919);

    // Columns first: x, top, and how many cells.
    const columns: Array<{ x: number; y: number; cells: number }> = [];
    let i = 0;
    while (i < zones.length) {
      const top = zones[i];
      let cells = 1;
      while (i + cells < zones.length && zones[i + cells].x === top.x && zones[i + cells].y === top.y + cells * TILE) {
        cells += 1;
      }
      columns.push({ x: top.x, y: top.y, cells });
      i += cells;
    }

    // Then palms: a column joins the one to its left when they match.
    let c = 0;
    while (c < columns.length) {
      const first = columns[c];
      const next = columns[c + 1];
      const wide = next !== undefined && next.x === first.x + TILE && next.y === first.y && next.cells === first.cells ? 2 : 1;
      const variant = Math.floor(random() * 3);
      const key = `${this.level.theme}:palm:${wide}:${first.cells}:${variant}`;
      if (!this.textures.exists(key)) {
        bakePalmTrunk(this, key, wide, first.cells, palette, 4409 + first.cells * 53 + wide * 977 + variant * 101);
      }
      this.add
        .image(first.x - PALM_BULGE, first.y, key)
        .setOrigin(0, 0)
        .setDepth(-3);
      // The crown in two layers: the back fronds and the coconuts behind
      // the cat, the front fronds in front of it (a positive depth, which
      // the scenery bake leaves alone), so a cat up a palm climbs and jumps
      // in among the leaves.
      for (const [layer, depth] of [
        ['back', -2.5],
        ['front', 0.6],
      ] as const) {
        this.add
          .image(first.x + (wide * TILE) / 2, first.y + 4, `palm-crown-${layer}`)
          .setOrigin(0.5, PALM_CROWN_ANCHOR / PALM_CROWN_SIZE.height)
          .setScale(wide === 2 ? 1.6 : 0.9)
          .setFlipX(variant === 1)
          .setDepth(depth);
      }
      c += wide;
    }
  }

  /**
   * Draws the lianas and returns the rectangles the cat can climb.
   *
   * The mirror of `buildTrunks`, kept separate rather than folded into it,
   * because the two draw from different textures (`liana`, never `trunk`) and
   * -- the whole reason `l` exists -- are never gated by
   * `columnsAreClimbable`. A liana is climbable in every level it appears in.
   */
  private buildLianas(): Phaser.Geom.Rectangle[] {
    return this.level.lianaZones.map((zone) => {
      this.add
        .image(
          zone.x,
          zone.y,
          this.tile(
            zone.isTop ? (zone.againstWall ? 'liana-head' : 'liana-top') : 'liana',
          ),
        )
        .setOrigin(0, 0)
        .setDepth(-3);

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
  }

  /**
   * Draws the dead vines. No rectangles come back -- nothing about a `v` is
   * ever climbable, so there is nothing here for the Player to be handed.
   */
  private buildDeadVines(): void {
    for (const zone of this.level.deadVineZones) {
      this.add
        .image(zone.x, zone.y, this.tile('dead-vine'))
        .setOrigin(0, 0)
        .setDepth(-3);
    }
  }

  /**
   * The leaves that are not on the grid.
   *
   * Everything else in a level is a 16px tile in a 16px slot, and that is what
   * makes it read as blocky however round the shapes inside it are. This is the
   * one layer that ignores the grid: clumps 34 and 28 pixels wide, dropped at
   * offsets no tile boundary agrees with, in **front of and behind** the things
   * they grow on.
   *
   * - **Behind** (`-6`, under the trunks at `-3`): a trunk is seen against
   *   leaves rather than against bare sky, which is what gives a tree a depth
   *   it cannot get from one column of tiles.
   * - **In front** (`5`, over the cat at `0`): a cat on a branch can get
   *   *behind* the foliage. The clump is 13 pixels and a standing cat is 18, so
   *   you are hidden to the shoulders and your ears and tail still show. You
   *   always know where you are; you are simply harder to see.
   *
   * Nothing here has a body, nothing collides, and nothing is hidden by it that
   * matters: the near clumps go only on branches, and the creatures that walk
   * the floor sit at `-1`, well behind. Charms are at `7`, in front of it, so a
   * heart in the leaves is still a heart you can see.
   *
   * Only where the place actually has leaves. A cave shelf
   * uses the same tiles underneath, and does not sprout.
   */
  private buildFoliage(): void {
    const palette = THEMES[this.level.theme];
    const leafy = palette.platformStyle === 'branch';
    // Trunks only. A liana is a vine hanging from nothing, and giving one a
    // crown puts a tree behind something that is deliberately not a tree.
    const wooded = palette.columnStyle === 'trunk';

    if (!leafy) {
      return;
    }

    // One seeded stream for the whole pass, consumed in parse order, so the
    // forest is arranged identically on every device and across every reload.
    const random = createRandom(9173);

    /** One clump of the far canopy, centred wherever it is asked for. */
    const crown = (x: number, y: number, spread: number): void => {
      this.add
        .image(
          x + (random() - 0.5) * spread,
          y + (random() - 0.5) * spread,
          this.tile('foliage-back'),
        )
        .setScale(1 + random() * 0.8)
        .setDepth(-6);
    };

    // **Leaves grow where wood grows.** Every clump is positioned from a branch
    // or from the crown at the top of a trunk, never from the trunk itself --
    // that is where a real tree carries its leaves, and a column of clumps
    // planted down a trunk is a hedge with a tree in it.
    //
    // Plenty still ends up *behind* the trunk, because a clump is four tiles
    // wide and the branches grow out of the trunk. That is the difference
    // between leaves that spill over the wood and leaves that follow it down.
    for (const solid of this.level.solids) {
      if (!this.sprouts(solid, wooded)) {
        continue;
      }

      const isCrown = solid.textureKey === 'trunk-top-ledge';

      // Deliberately overdone. One clump per branch tile reads as a row of
      // shrubs; two or three overlapping, each four tiles wide and up to nearly
      // twice that scaled, read as one mass of leaves with a tree in front of
      // it. Thickest at the crown, the way a real tree is.
      crown(solid.x + TILE / 2, solid.y - 2, TILE * 1.5);

      if (isCrown || random() < 0.6) {
        crown(solid.x + TILE / 2, solid.y - 8, TILE * 2.5);
      }

      if (random() < 0.4) {
        crown(solid.x + TILE / 2 + (random() - 0.5) * TILE * 3, solid.y - 14, TILE * 2);
      }

      if (isCrown) {
        crown(solid.x + TILE / 2, solid.y - 18, TILE * 2);
      }
    }

    for (const solid of this.level.solids) {
      if (!this.sprouts(solid, wooded) || random() > 0.5) {
        continue;
      }

      // Never in front of a charm: a heart you cannot see is a heart you walk
      // past, and this layer is scenery, not a puzzle.
      if (this.charmNear(solid.x, solid.y)) {
        continue;
      }

      this.add
        .image(
          solid.x + TILE / 2 + (random() - 0.5) * 10,
          // Growing up off the wood, with its feet a little below the surface
          // so it is planted in the branch rather than balanced on it.
          solid.y + 3,
          this.tile('foliage-near'),
        )
        .setOrigin(0.5, 1)
        .setFlipX(random() < 0.5)
        .setDepth(5);
    }
  }

  /**
   * Whether this platform is something leaves grow on.
   *
   * Branches, yes. The ledge at the top of a climbable column only if that
   * column is a *tree* -- the swamp's lianas hang from nothing on purpose, and
   * a canopy over each one puts a roof on a level that is meant to have sky.
   */
  private sprouts(solid: Solid, wooded: boolean): boolean {
    if (!solid.isBranch) {
      return false;
    }

    return solid.textureKey !== 'trunk-top-ledge' || wooded;
  }

  /** Whether a charm sits on or just above this tile. */
  private charmNear(x: number, y: number): boolean {
    return this.level.charms.some(
      (charm) => Math.abs(charm.x - (x + TILE / 2)) < TILE && charm.y > y - TILE * 2 && charm.y <= y,
    );
  }

  /**
   * Draws the pools and returns the rectangles the cat can swim in.
   *
   * Water is drawn *over* the cat and half transparent, so a swimming cat is
   * seen through the pool rather than hidden behind it. It has no physics body:
   * a pool is somewhere to be, not something to hit.
   */
  private buildWater(): Phaser.Geom.Rectangle[] {
    return this.level.waterZones.map((zone) => {
      // Opaque bed first, behind the cat, so the forest does not show through.
      const bed = this.add
        .image(zone.x, zone.y, this.tile('water-bed'))
        .setOrigin(0, 0)
        .setDepth(-8);

      const tile = this.add
        .image(zone.x, zone.y, this.tile(zone.isSurface ? 'water-surface' : 'water'))
        .setOrigin(0, 0)
        .setAlpha(0.62)
        .setDepth(20);

      // The surface sits a little below the bank, so the grass always stands
      // above the water rather than meeting it edge to edge. The zone the
      // cat swims in is unchanged; only the picture is lower. And where the
      // water touches stone, the translucent water is trimmed back the few
      // pixels a stone may bulge past its cell, so the stone shows over the
      // water, not under it.
      const stone = THEMES[this.level.theme].groundStyle === 'stone';
      const bulge = (dx: number, dy: number): number =>
        stone && this.level.solids.some((s) => this.isGround(s) && s.x === zone.x + dx && s.y === zone.y + dy) ? 3 : 0;
      const cropTop = zone.isSurface ? WATER_DROP : 0;
      const cropL = bulge(-TILE, 0);
      const cropR = bulge(TILE, 0);
      const cropB = bulge(0, TILE);

      if (zone.isSurface) {
        bed.setCrop(0, WATER_DROP, TILE, TILE - WATER_DROP);
      }
      if (cropTop || cropL || cropR || cropB) {
        tile.setCrop(cropL, cropTop, TILE - cropL - cropR, TILE - cropTop - cropB);
      }

      if (zone.isSurface) {
        // A slow swell, so the surface is alive rather than a painted line.
        this.tweens.add({
          targets: tile,
          y: zone.y + 1.5,
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (zone.x / TILE) * 90,
        });
      }

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
  }

  /**
   * Builds the lava and returns the rectangles that kill.
   *
   * Shaped exactly like water, and deliberately not solid: the danger is in
   * touching it, not in being stopped by it. Everything it *does* -- the boil,
   * the heat over it, the gobbets it throws -- belongs to `LavaLake`.
   */
  private buildLava(): Phaser.Geom.Rectangle[] {
    if (this.level.lavaZones.length === 0) {
      this.lava = undefined;
      return [];
    }

    // Whole tiles of ground and rock, for the lake to find its banks.
    const solid = new Set<string>();
    for (const s of this.level.solids) {
      if (!s.isBranch && s.width === TILE && s.height === TILE) {
        solid.add(`${s.x},${s.y}`);
      }
    }
    for (const cell of this.level.voids) {
      solid.add(`${cell.x},${cell.y}`);
    }

    this.lava = new LavaLake(this, this.level.theme, this.level.lavaZones, (x, y) => solid.has(`${x},${y}`));

    // A surface stands `LAVA.rise` above its cell, and so does the line that
    // kills: the band above the cell burns to `bankMercy` (one pixel) from
    // the bank. A cat standing at the very edge of an island with its body
    // more than a pixel over the lava cell is dead -- quick, and the point of
    // a lava level. The tongue of lava drawn over the bank is a picture only:
    // the body is narrower than the drawing, so by the time a paw *looks* to
    // be in the tongue the body is still on the island. Wider mercy, a toe's
    // and a body's width, was tried and was too kind. The cell itself kills
    // to its full width, so stepping off is as fatal as ever.
    const rects: Phaser.Geom.Rectangle[] = [];
    for (const zone of this.level.lavaZones) {
      rects.push(new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height));
      if (!zone.isSurface) {
        continue;
      }
      const from = zone.x + (solid.has(`${zone.x - TILE},${zone.y}`) ? LAVA.bankMercy : 0);
      const to = zone.x + zone.width - (solid.has(`${zone.x + TILE},${zone.y}`) ? LAVA.bankMercy : 0);
      if (to > from) {
        rects.push(new Phaser.Geom.Rectangle(from, zone.y - LAVA.rise, to - from, LAVA.rise));
      }
    }
    return rects;
  }

  /**
   * Draws the thorns and returns the rectangles that kill.
   *
   * The rectangle is **smaller than the tile**, and by a lot at the top: the
   * spikes are 9 to 15 pixels of a 16-pixel tile and the rest is air. A cat
   * that clears the points has cleared them, and brushing the very edge of the
   * tile going past is not a death.
   *
   * No physics body. Thorns are not something you land on -- there is nothing
   * to land on -- so the only thing they do is be somewhere you must not be.
   */
  private buildThorns(): Phaser.Geom.Rectangle[] {
    return this.level.thorns.map((thorn) => {
      // Two of the four spikes behind the cat and two in front, so a cat
      // sneaking under them is seen threading between the thorns, and one
      // dying on them is seen falling into them.
      this.add
        .image(thorn.x, thorn.y, this.tile('thorns'))
        .setOrigin(0, 0)
        .setDepth(-1);
      this.add
        .image(thorn.x, thorn.y, this.tile('thorns-front'))
        .setOrigin(0, 0)
        .setDepth(0.5);

      return new Phaser.Geom.Rectangle(thorn.x + 2, thorn.y + 5, TILE - 4, TILE - 5);
    });
  }

  private buildCharms(): Phaser.Physics.Arcade.StaticGroup {
    const charms = this.physics.add.staticGroup();

    for (const charm of this.level.charms) {
      const sprite = charms.create(
        charm.x,
        charm.y,
        'charm',
      ) as Phaser.Physics.Arcade.Sprite;

      // The bob tween moves the sprite, so its own y is no longer where the
      // level put it. Remember that, so a charm can be matched after a reload.
      sprite.setData('levelPosition', { x: charm.x, y: charm.y });

      this.tweens.add({
        targets: sprite,
        y: charm.y - 3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    return charms;
  }

  /**
   * Builds the checkpoints: a static body per `*`, carrying two star images
   * that spin together and crossfade between gold and blue.
   *
   * The **physics body is the gold star**, exactly the way a charm's body is
   * its own sprite. The blue one is a second image at the same position with
   * no body of its own, along for the ride purely to be faded in and out over
   * the top -- a checkpoint is one thing to touch, not two.
   */
  private buildCheckpoints(): Phaser.Physics.Arcade.StaticGroup {
    const checkpoints = this.physics.add.staticGroup();

    for (const at of this.level.checkpoints) {
      const gold = checkpoints.create(at.x, at.y, 'checkpoint-gold') as Phaser.Physics.Arcade.Sprite;
      const blue = this.add.image(at.x, at.y, 'checkpoint-blue').setAlpha(0);

      // Checkpoints are matched after a hot reload the same way charms are --
      // by where they are in the level, not by index, so an edit that adds or
      // removes one elsewhere does not silently reactivate the wrong one.
      gold.setData('levelPosition', { x: at.x, y: at.y });
      gold.setData('blue', blue);

      // A spin round the *vertical* axis rather than the flat, clock-hand spin
      // an `angle` tween gives -- squashing scaleX to 0 and back out the other
      // side is the classic 2D trick for it. The star is drawn left-right
      // symmetric, so the mirrored half of the cycle looks identical to the
      // first half and the motion reads as one continuous turn rather than a
      // flip-flop. Half the duration each way, so a full there-and-back is one
      // `spinMs` turn, matching what the constant says it is.
      this.tweens.add({
        targets: [gold, blue],
        scaleX: -1,
        duration: CHECKPOINT.spinMs / 2,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: blue,
        alpha: { from: 0, to: 1 },
        duration: CHECKPOINT.colourMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        // Not every star on the same beat, or a level full of them pulses
        // like one machine rather than shimmering like several.
        delay: Phaser.Math.Between(0, CHECKPOINT.colourMs),
      });
    }

    return checkpoints;
  }

  /**
   * Makes this checkpoint the one dying returns to.
   *
   * Idempotent on purpose: the cat can stand on one for a while, and the sound
   * and the flash are the arrival, not a metronome. Nothing here disables the
   * body either -- a checkpoint stays exactly what it looks like, always
   * touchable, unlike a charm which is spent.
   */
  private activateCheckpoint(checkpoint: Phaser.Physics.Arcade.Sprite): void {
    if (this.activeCheckpoint === checkpoint) {
      return;
    }

    this.activeCheckpoint = checkpoint;
    this.respawnPoint = { x: checkpoint.x, y: checkpoint.y };

    sound.play('checkpoint');
    this.cameras.main.flash(200, 255, 220, 140);
  }

  private collectCharm(charm: Phaser.Physics.Arcade.Sprite): void {
    stats.addHeart();
    if (!charm.active) {
      return;
    }

    charm.disableBody(true, true);
    sound.play('collect');
    this.collected += 1;
    this.scoreText.setText(this.formatScore());

    if (this.collected >= CHARMS_PER_LIFE) {
      // A hundred of them is a life -- or a refill, the same rule a spare
      // heart follows. The count starts again rather than carrying on, so the
      // number in the corner is always how far you are from the *next* one,
      // whichever that turns out to buy.
      this.collected -= CHARMS_PER_LIFE;
      this.healOrGrantLife();
      this.refreshLives();
      this.scoreText.setText(this.formatScore());
      this.cameras.main.flash(260, 255, 150, 180);
      this.announceBonus(`❤️ Collection Bonus ❤️`);
    }
  }

  /**
   * Below the most lives ever held this run, tops every spent one back up.
   * At that watermark or above, raises it and adds one more, up to
   * `MAX_LIVES`. Shared by the hundred-charm bonus and a spare heart in a
   * nest -- both spend something to grant this, and both grant the same
   * thing by the same rule: a run that has taken damage gets healed before it
   * gets ahead.
   *
   * Returns which of the two happened, so a caller that says which out loud
   * -- a spare heart does, the charm bonus does not -- knows what to say.
   */
  private healOrGrantLife(): 'healed' | 'granted' {
    if (this.lives < this.maxLives) {
      this.lives = this.maxLives;
      return 'healed';
    }

    this.lives = Math.min(this.lives + 1, MAX_LIVES);
    this.maxLives = this.lives;
    stats.addBigHeart();
    return 'granted';
  }

  private buildHud(): void {
    // Top left: the running score over the level name. Top right: the lives,
    // and under them the little-heart count beside the mute button -- an
    // icon rather than a word, so the HUD needs no translating. The count
    // is right-aligned so it does not shift with the number of lives.
    this.add
      .image(GAME_WIDTH - TILE - 16, TILE * 2 + 4, 'charm')
      .setScrollFactor(0)
      .setDepth(1000);

    const levelName = crispText(
      this,TILE + 10, TILE + 9, this.level.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#1d2a18',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      // Just under the fade (999), unlike the rest of the HUD above it: the
      // name belongs to the level, so it goes dark and comes up with it.
      .setDepth(EXIT.fadeDepth - 1)
      .setAlpha(0.75);

    if (import.meta.env.DEV) {
      // A development shortcut, in its own module so the build drops it.
      installLevelSkip(this, levelName, this.levelIndex, LEVELS.length);

      // A development cheat, same reasoning. See `dev/godMode.ts`.
      installGodMode(this, levelName);
    }
    this.levelName = levelName;
    if (import.meta.env.DEV) {

      // Straight out into space. See `dev/spaceShortcut.ts`.
      installSpaceShortcut(this, levelName);
    }

    this.refreshLives();
    this.buildMuteButton();

    // Bob's parts, under the little hearts: a cog and the count, once the
    // cat is looking for them or the level has some.
    if (this.rocket || this.level.parts.length > 0) {
      this.add
        .image(GAME_WIDTH - TILE - 16, TILE * 3 + 10, 'part')
        .setScrollFactor(0)
        .setDepth(1000);
      this.partsText = crispText(this, GAME_WIDTH - TILE - 26, TILE * 3 + 2, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffd34d',
        stroke: '#2f2a1a',
        strokeThickness: 3,
      })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1000);
      this.refreshParts();
    }

    // The coins, under the parts: once there are any.
    if (this.coins > 0) {
      this.buildCoinsHud();
      this.refreshCoins();
    }

    this.scoreText = crispText(
      this,GAME_WIDTH - TILE - 26, TILE * 2 - 4, this.formatScore(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#2f3d2a',
        strokeThickness: 3,
      })
      .setOrigin(1, 0)
      // Scroll factor 0 pins the HUD to the viewport instead of the world.
      .setScrollFactor(0)
      .setDepth(1000);

    // The score, top left, running: the clock plus a minute per death. A
    // death makes it jump by a minute, which is the point of showing it.
    this.clockText = crispText(
      this,TILE + 10, TILE - 7, formatClock(scoreMs(this.elapsedMs, this.deaths)), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#2f3d2a',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    // Double-tap the clock to quit to the title. The clock is the one HUD
    // word that takes touches: it sits in the top-left corner, well clear of
    // the stick and the jump button, and a phone has no other way out of a
    // run -- there is no key to press, and the back gesture is not on every
    // phone. Two taps, not one, so a stray touch costs nothing.
    onDoubleTap(this.clockText, TOUCH.doubleTapMs, () => this.quitToTitle());

    // The keyboard's way out, so the feature exists on a laptop too.
    this.input.keyboard?.on('keydown-ESC', () => this.quitToTitle());
  }

  /**
   * Leaves the run for the title screen: the run is over, like a game over.
   *
   * Takes the run's history entry back first (`runEnded`), the same as the
   * game-over and victory screens do, so the back button stays in step. Not
   * while the scene is paused: a game over is already on its way to the
   * title, and a fade would never finish on a paused camera.
   */
  private quitToTitle(): void {
    if (this.quitting || this.titleMode || this.scene.isPaused()) {
      return;
    }
    this.quitting = true;
    runEnded();
    this.cameras.main.fade(180, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Title');
    });
  }

  /**
   * The mute button, top right, just under the row of hearts.
   *
   * Out of the way of the score, which sits top left, and out of the way of
   * the touch controls, which are along the bottom. `M` does the same thing,
   * because a button is no use to somebody already holding the keyboard.
   *
   * One tap cycles all three sound modes -- silent, effects only, everything
   * -- rather than just toggling two, so `soundTexture` has to translate the
   * current mode into an icon instead of a plain ternary.
   */
  private buildMuteButton(): void {
    const button = this.add
      .image(GAME_WIDTH - TILE, TILE * 2 + 4, soundTexture(sound.mode))
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.55)
      .setInteractive({ useHandCursor: true });

    const flip = (): void => {
      // Every press is a gesture, so it is also the moment the audio is
      // allowed to start. Unmuting before the context exists would otherwise
      // be silent and look broken.
      sound.unlock();
      button.setTexture(soundTexture(sound.cycle()));
    };

    button.on('pointerdown', flip);
    this.input.keyboard?.on('keydown-M', flip);
  }

  /**
   * Redraws the row of hearts.
   *
   * There are always at least three, so spent ones stay visible as something to
   * win back rather than vanishing. Above three the row simply grows, which is
   * what a spare heart looks like once you are already full.
   */
  private refreshLives(): void {
    // The row's length is the watermark, not the current count -- otherwise
    // losing a heart shrinks the row along with it, and 4/4 taking a hit
    // reads as a clean 3/3 instead of the 3/4 it actually is.
    const wanted = Math.max(LIVES, this.maxLives);

    while (this.lifeIcons.length < wanted) {
      this.lifeIcons.push(
        this.add
          .image(0, TILE, 'life')
          .setScrollFactor(0)
          .setDepth(1000),
      );
    }

    while (this.lifeIcons.length > wanted) {
      this.lifeIcons.pop()?.destroy();
    }

    this.lifeIcons.forEach((icon, index) => {
      const spent = index >= this.lives;

      icon.setPosition(GAME_WIDTH - TILE - index * 15, TILE);
      icon.setAlpha(spent ? 0.22 : 1);
      icon.setScale(spent ? 0.85 : 1);
    });

    // The rocket fuel left, beside the hearts.
    this.fuelMeter ??= new FuelMeter(this);
    this.fuelMeter.show(GAME_WIDTH - TILE - (wanted - 1) * 15 - 12, TILE, this.fuel);
  }

  /**
   * Places the spare hearts sitting in nests.
   *
   * Never required to finish a level. **Below the most you have ever held**
   * this run, one tops every spent heart back up in a single go; at that
   * watermark or above, it raises the watermark and adds one more, up to
   * `MAX_LIVES`. A run that has taken damage gets its hearts back before it
   * gets ahead; a run that has not gets ahead.
   *
   * **Taking it does not spend it for good.** It is hidden rather than
   * destroyed, and `resetExtraLives` brings every taken one back the moment
   * the cat dies. A spare heart is guarded by something that can kill you, so
   * losing that fight and finding the heart waiting again is the point of
   * going back for it -- it would otherwise be a heart you only ever get once
   * per level, by the first route that works.
   */
  private buildExtraLives(): void {
    for (const at of this.level.extraLives) {
      // Already sits low in its own tile -- see the `+` case in Level.ts --
      // so a nest written directly under it needs no correction here.
      const heart = this.physics.add.staticImage(at.x, at.y, 'life').setDepth(7);

      this.extraLifeHearts.push(heart);

      this.tweens.add({
        targets: heart,
        scale: { from: 1, to: 1.15 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.physics.add.overlap(this.player, heart, () => {
        if (!heart.active) {
          return;
        }

        heart.disableBody(true, true);

        const outcome = this.healOrGrantLife();

        this.refreshLives();
        this.cameras.main.flash(180, 255, 190, 150);
        this.announceBonus(outcome === 'granted' ? 'Extra Life!' : 'Lives Restored');

      });
    }
  }

  /**
   * Brings back every spare heart the cat has already taken.
   *
   * Called from `kill()`'s respawn, not from god mode's own fall-out save --
   * god mode never actually dies, so there is nothing to give back. A spare
   * heart taken on the way to a death you did not come back from should not
   * simply be gone.
   */
  private resetExtraLives(): void {
    for (const heart of this.extraLifeHearts) {
      // `heart.body` can be gone without `heart` itself being: a hot reload
      // that lands while this exact timer is pending tears the old scene's
      // bodies down, and `enableBody` reads straight through to
      // `body.gameObject` with no guard of its own. Never reachable in the
      // built game, only from editing code while a death is mid-flight.
      if (!heart.active && heart.body) {
        heart.enableBody(false, 0, 0, true, true);
      }
    }
  }

  private formatScore(): string {
    return `${this.collected}/${CHARMS_PER_LIFE}`;
  }

  /**
   * A word in the middle of the screen that grows and dissolves, like a
   * struck coin's ring spreading and fading.
   *
   * Same colours as god mode's own on/off note in `dev/godMode.ts` --
   * monospace, gold on a dark stroke -- but this one is not a fixed size that
   * floats a few pixels; it grows from 10px to 60px as it fades out.
   *
   * **The growth is a bigger `fontSize` each step, not a `setScale`.** A Text
   * object is a canvas rasterised at its own font size; scaling that up
   * stretches the same soft, antialiased 10px glyphs into something blurrier
   * the bigger it gets. Re-asking for a bigger size instead rasterises new,
   * genuinely crisp glyphs at every step -- the cost of doing that every frame
   * for one second is nothing for something this short-lived and this rare.
   */
  private announceBonus(text: string): void {
    const note = crispText(
      this,GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffd34d',
        stroke: '#1d2a18',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    // A plain object to tween, because `fontSize` lives inside the text
    // style rather than as a property Phaser's tweens can reach directly.
    const grown = { size: 10 };

    this.tweens.add({
      targets: grown,
      size: 40,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onUpdate: () => note.setFontSize(Math.round(grown.size)),
    });

    this.tweens.add({
      targets: note,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeIn',
      onComplete: () => note.destroy(),
    });
  }

  /**
   * "6/7" -- one heart short of the absolute ceiling, at the ceiling -- grown
   * and faded the same way `announceBonus` shows what a heart bought.
   *
   * **Only that exact count.** Not "not full" in general: 2/3, 4/5 and 3/6 all
   * say nothing, on purpose. This is a one-off notice for a specific moment,
   * not a running readout of the watermark.
   */
  private announce67(): void {
    if (this.lives == 6 && this.maxLives == 7) {
      this.announceBonus(`6/7`);
    }

  }
}
