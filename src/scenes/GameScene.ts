import Phaser from 'phaser';
import { AWAKE_RANGE, CHARMS_PER_LIFE, CHECKPOINT, GAME_HEIGHT, GAME_WIDTH, LIVES, MAX_LIVES, TILE, WATER_DROP } from '../config';
import { Controls } from '../input/Controls';
import { Player } from '../objects/Player';
import { Boss } from '../objects/Boss';
import { Crocodile } from '../objects/Crocodile';
import { LavaLake } from '../objects/LavaLake';
import { Rain } from '../objects/Rain';
import { Crow } from '../objects/Crow';
import { GroundEnemy } from '../objects/GroundEnemy';
import { Piranha } from '../objects/Piranha';
import { Spider } from '../objects/Spider';
import { addGroundShade, bakeScenery, createBackdrop } from '../world';
import { parseLevel, type ParsedLevel, type Solid, type WaterZone } from '../level/Level';
import { LEVELS } from '../level/levels';
import { BOULDER_BULGE, BRANCH_BULGE, CORNER_RADIUS, FILLET_RADIUS, GRASS_FRINGE_HEIGHT, LOG_BULGE, SHELF_BULGE, TILE_VARIANTS, TRUNK_BULGE, bakeBoulder, bakeBranch, bakeFillet, bakeLog, bakeShelf, bakeTexture, bakeTrunk, createRandom, roundedTileKey, tileKey, type Corners } from '../art';
import { THEMES } from '../level/themes';
import { installLevelSkip } from '../dev/levelSkip';
import { installGodMode, isGodMode } from '../dev/godMode';
import { sound, type Ambience, type SoundMode } from '../audio/Sound';
import { SNAPSHOT_KEY, type GameSnapshot } from '../dev/hot';

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
  private controls!: Controls;
  private player!: Player;
  private level!: ParsedLevel;
  private scoreText!: Phaser.GameObjects.Text;
  private charms!: Phaser.Physics.Arcade.StaticGroup;
  /**
   * Little hearts collected **this run**, not this level.
   *
   * Carried from level to level the way lives are, because a hundred of them
   * is a life and no single level holds a hundred.
   */
  private collected = 0;

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

  /** True while the level is being left, so the exit cannot fire twice. */
  private leaving = false;
  private walkers: GroundEnemy[] = [];
  private piranhas: Piranha[] = [];
  private crows: Crow[] = [];
  private crocodiles: Crocodile[] = [];
  private spiders: Spider[] = [];
  private boss?: Boss;
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
  private lava?: LavaLake;
  private rain?: Rain;

  /** True from the moment the cat is killed until it is back on its feet. */
  private dying = false;

  constructor() {
    super('Game');
  }

  /** Phaser hands this whatever `scene.start` was given. */
  init(data: { levelIndex?: number; lives?: number; maxLives?: number; collected?: number }): void {
    const carried = this.registry.get(SNAPSHOT_KEY) as GameSnapshot | undefined;

    this.levelIndex = data.levelIndex ?? carried?.levelIndex ?? 0;
    // Lives cross level boundaries; a spare heart found in one is still yours
    // in the next, which is the only thing that makes finding one worth a
    // detour.
    this.lives = Math.min(data.lives ?? LIVES, MAX_LIVES);
    this.maxLives = Math.min(Math.max(LIVES, this.lives, data.maxLives ?? 0), MAX_LIVES);
    this.collected = data.collected ?? 0;
  }

  create(): void {
    // A scene that ended a run left its camera drained of colour. Nothing else
    // clears it, and a new run starting in black and white is a haunting bug.
    this.cameras.main.filters.internal.clear();

    this.level = parseLevel(LEVELS[this.levelIndex]);
    this.crocodiles = [];
    this.spiders = [];
    this.rain = undefined;
    this.lifeIcons = [];
    this.dying = false;
    this.leaving = false;

    // The world is taller than the level so a cat that misses a jump falls into
    // empty space and respawns, rather than landing on an invisible floor.
    this.physics.world.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels + FALL_OUT_MARGIN * 2,
    );

    createBackdrop(
      this.level.theme,
      this,
      this.level.widthInPixels,
      this.level.groundLine,
      this.level.heightInPixels,
    );

    const { blocks, branches } = this.buildSolids();
    // Added straight after the tiles and before anything that stands on them,
    // so at the same depth it draws over the ground and under the cat.
    addGroundShade(
      this,
      this.level.solids,
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
    this.charms = this.buildCharms();
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

    this.physics.add.collider(this.player, blocks);
    this.physics.add.collider(
      this.player,
      branches,
      undefined,
      (_cat, branch) => this.canLandOn(branch as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, this.charms, (_cat, charm) => {
      this.collectCharm(charm as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.checkpoints, (_cat, checkpoint) => {
      this.activateCheckpoint(checkpoint as Phaser.Physics.Arcade.Sprite);
    });

    this.buildWeather();

    this.cameras.main.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels,
    );
    // The level is taller than the viewport, so the view has somewhere to go
    // when the cat climbs. A narrow vertical deadzone keeps it in frame on the
    // way up the great tree without the view bobbing on every small hop.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.14);
    this.cameras.main.setDeadzone(140, 44);

    this.buildCreatures(blocks, branches);
    this.buildExit();

    // Last, once everything static exists: flatten it into a few big
    // textures. See `world/BakeScenery.ts` for what counts as static.
    bakeScenery(this, this.level.widthInPixels, this.level.heightInPixels);

    this.controls = new Controls(this);
    this.buildHud();
    this.resumeFromHotReload();
  }

  /**
   * Hands the running game's state over to the version replacing it.
   *
   * Called from the hot-reload hook in `src/dev/hot.ts`, never during play.
   */
  captureState(): GameSnapshot | undefined {
    if (!this.player) {
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
    };
  }

  /** Puts a snapshot from the previous build back into this one. */
  restoreState(snapshot: GameSnapshot): void {
    for (const mark of snapshot.collectedCharms) {
      const match = this.charms.getChildren().find((charm) => {
        const at = charm.getData('levelPosition') as { x: number; y: number };
        return at.x === mark.x && at.y === mark.y;
      });

      if (match) {
        this.collectCharm(match as Phaser.Physics.Arcade.Sprite);
      }
    }

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
    // Input is sampled first so that edge-triggered reads (jump-just-pressed)
    // are consistent for everything that runs this frame.
    this.controls.update();

    if (!this.dying) {
      this.player.step(this.controls, delta);
    }

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
    for (const piranha of this.piranhas) {
      if (this.awake(piranha)) {
        piranha.step(delta, cat, this.player.swimming);
      } else {
        piranha.doze();
      }
    }
    for (const crow of this.crows) {
      if (this.awake(crow)) {
        crow.step(cat, delta);
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

    // Weather and lava are the place rather than things living in it: they
    // carry on whether or not anybody is looking. What the lava does *not* do
    // off screen is be heard -- that is handled where it spits.
    this.lava?.step(delta);
    this.rain?.step(delta);

    if (this.boss) {
      if (this.awake(this.boss)) {
        this.boss.step(delta, cat);
      } else {
        this.boss.doze();
      }
    }

    this.godCooldown = Math.max(0, this.godCooldown - delta);

    if (!this.dying && this.touchingSomethingDeadly()) {
      this.kill();
    }

    if (!this.dying && this.player.swimming && this.inReachOfACrocodile()) {
      this.kill();
    }

    if (!this.dying && this.player.y > this.level.heightInPixels + FALL_OUT_MARGIN) {
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
   * Places the way out, if the level has one.
   *
   * Reaching it starts the next level. The last level loops back to the first,
   * which is a placeholder for whatever finishing the game should actually do.
   */
  private buildExit(): void {
    const exit = this.level.exit;
    if (!exit) {
      return;
    }

    const door = this.physics.add
      .staticImage(exit.x, exit.y, this.tile('exit'))
      .setOrigin(0.5, 1);
    door.refreshBody();

    this.tweens.add({
      targets: door,
      alpha: { from: 0.75, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.physics.add.overlap(this.player, door, () => this.leaveLevel());
  }

  private leaveLevel(): void {
    if (this.leaving || this.dying) {
      return;
    }

    this.leaving = true;
    this.cameras.main.fade(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', {
        levelIndex: (this.levelIndex + 1) % LEVELS.length,
        lives: this.lives,
        maxLives: this.maxLives,
        collected: this.collected,
      });
    });
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
    this.piranhas = this.level.piranhas.map((at, index) => {
      // Each fish gets only the pool it lives in, never all the water.
      const pool = (this.level.pools[at.poolIndex] ?? []).map(
        (tile) => new Phaser.Geom.Rectangle(tile.x, tile.y, tile.width, tile.height),
      );

      return new Piranha(this, at.x, at.y, pool, index * 700);
    });
    this.crows = this.level.crows.map((at) => new Crow(this, at.x, at.y));
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
    this.boss = this.level.boss ? this.buildBoss(this.level.boss) : undefined;

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

    if (this.boss) {
      everything.push(this.boss);
    }

    for (const creature of everything) {
      this.physics.add.overlap(this.player, creature, () => this.kill());
    }
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
   * The beetle, told two things about the room it is in.
   *
   * **Which way the way out is**, because it keeps itself between the cat and
   * that, and **where the floor is**, because it holds station just above it --
   * close enough that a standing cat does not fit under and a sneaking one
   * does. Both are read off the level rather than tuned by hand, so moving the
   * arena does not silently leave the beetle hovering in the wrong place.
   */
  private buildBoss(at: { x: number; y: number }): Boss {
    // `groundLine` rather than a search for the nearest solid underneath: the
    // beetle is placed low in its arena, so half the floor is *above* it and a
    // search finds the second row down and hangs the beetle in the ground.
    return new Boss(
      this,
      at.x,
      at.y,
      this.level.exit?.x ?? at.x + 1,
      this.level.groundLine,
    );
  }

  /**
   * The weather and the sound of the place.
   *
   * Both come off the theme rather than off the level, because they are what
   * the *place* is like: two city levels should sound and feel the same, and a
   * second swamp should have the same wind in it.
   *
   * The bed is one continuous layer. The sparse noises on top -- birds, drips --
   * are scheduled here rather than in `Sound`, because pacing them is a
   * decision about the level and the audio has no business holding timers.
   */
  private buildWeather(): void {
    const theme = this.level.theme;

    if (theme === 'city') {
      this.rain = new Rain(this);
    }

    const bed: Record<string, Ambience> = {
      forest: 'wind',
      jungle: 'wind',
      swamp: 'wind',
      city: 'rain',
      cave: 'hush',
      volcano: 'rumble',
    };

    sound.setAmbience(bed[theme] ?? 'none');

    // Birds in anything with leaves in it, water in anything underground. Every
    // gap is different: birds on a fixed beat are a smoke alarm.
    const sparse: Partial<
      Record<string, { voice: 'chirp' | 'drip' | 'patter'; min: number; max: number }>
    > = {
      forest: { voice: 'chirp', min: 1800, max: 5200 },
      jungle: { voice: 'chirp', min: 1200, max: 3800 },
      cave: { voice: 'drip', min: 2200, max: 6000 },
      // Rain is drops, not a hiss. Often enough to be rain, never regular
      // enough to be a rhythm.
      city: { voice: 'patter', min: 70, max: 300 },
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
   * Is any part of the cat in the lava, or -- unless it is sneaking -- on the
   * thorns?
   *
   * A sneaking cat crawls under the points. That is a rule of the game rather
   * than geometry (the 9px body does still overlap the thorn rectangle), and
   * it is deliberately about the *pose*, not the height: the pose is what the
   * player chose, and it drops the moment the cat leaves the ground, so a
   * fall into thorns still kills. Lava spares nothing.
   */
  private touchingSomethingDeadly(): boolean {
    const body = this.player.body;
    const inside = (zone: Phaser.Geom.Rectangle): boolean =>
      body.right > zone.x &&
      body.x < zone.right &&
      body.bottom > zone.y &&
      body.y < zone.bottom;

    if (this.lavaRects.some(inside)) {
      return true;
    }

    return !this.player.sneaking && this.thornRects.some(inside);
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

  private kill(): void {
    if (this.dying) {
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
    this.refreshLives();
    this.announce67();

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
        .create(solid.x, solid.y, this.tile(invisible ? 'branch-mid' : isVoid ? 'ground-fill' : solid.textureKey))
        .setOrigin(0, 0)
        .refreshBody() as Phaser.Physics.Arcade.Sprite;

      // A rock cell collides here but is not drawn here: its cluster is
      // drawn as one boulder by `buildBoulders`. A bough cell likewise: its
      // run is one fallen tree, drawn by `buildLogs`.
      if (solid.textureKey.startsWith('rock-') || solid.textureKey === 'bough' || isVoid) {
        tile.setVisible(false);
      }

      // Ground with air on two adjacent sides is cut round at that corner.
      if (this.isGround(solid)) {
        const corners = this.cornersOf(solid);
        if (corners.tl || corners.tr || corners.bl || corners.br) {
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
      } else if (solid.isBranch) {
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
    this.buildBoulders();
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
   * the platforms are branches, a stone shelf where they are shelves. A
   * city girder stays a girder, tile by tile.
   */
  private isWood(solid: Solid): boolean {
    const style = THEMES[this.level.theme].platformStyle;

    return (
      solid.isBranch &&
      (style === 'branch' || style === 'shelf') &&
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
    const wood = this.level.solids.filter((solid) => this.isWood(solid));
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
      const key = `${this.level.theme}:boulder:${wide}x${high}:${variant}:${exposed ? 'moss' : 'bare'}`;

      if (!this.textures.exists(key)) {
        bakeBoulder(this, key, wide, high, palette, 977 + wide * 31 + high * 17 + variant * 101, exposed);
      }

      this.add
        .image(column * TILE - BOULDER_BULGE.x, row * TILE - BOULDER_BULGE.y, key)
        .setOrigin(0, 0);
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

    if (!match) {
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
   * Only where the place actually has leaves. A cave shelf and a city girder
   * use the same tiles underneath, and neither of them sprouts.
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
      // cat swims in is unchanged; only the picture is lower.
      if (zone.isSurface) {
        bed.setCrop(0, WATER_DROP, TILE, TILE - WATER_DROP);
        tile.setCrop(0, WATER_DROP, TILE, TILE - WATER_DROP);
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

    this.lava = new LavaLake(this, this.level.theme, this.level.lavaZones);

    return this.level.lavaZones.map(
      (zone) => new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height),
    );
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
      this.add
        .image(thorn.x, thorn.y, this.tile('thorns'))
        .setOrigin(0, 0)
        // In front of the ground they grow out of, behind the cat, so a cat
        // dying on them is seen falling into them.
        .setDepth(-1);

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
    return 'granted';
  }

  private buildHud(): void {
    // An icon rather than a word, so the HUD needs no translating.
    this.add
      .image(TILE, TILE, 'charm')
      .setScrollFactor(0)
      .setDepth(1000);

    const levelName = this.add
      .text(TILE + 10, TILE + 9, this.level.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#1d2a18',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.75);

    if (import.meta.env.DEV) {
      // A development shortcut, in its own module so the build drops it.
      installLevelSkip(this, levelName, this.levelIndex, LEVELS.length);

      // A development cheat, same reasoning. See `dev/godMode.ts`.
      installGodMode(this, levelName);
    }

    this.refreshLives();
    this.buildMuteButton();

    this.scoreText = this.add
      .text(TILE + 10, TILE - 7, this.formatScore(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#2f3d2a',
        strokeThickness: 3,
      })
      // Scroll factor 0 pins the HUD to the viewport instead of the world.
      .setScrollFactor(0)
      .setDepth(1000);
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
    const note = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
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
