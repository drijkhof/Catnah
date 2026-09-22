import Phaser from 'phaser';
import { AWAKE_RANGE, CHARMS_PER_LIFE, GAME_HEIGHT, GAME_WIDTH, LIVES, TILE } from '../config';
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
import { createBackdrop } from '../world';
import { parseLevel, type ParsedLevel, type Solid } from '../level/Level';
import { LEVELS } from '../level/levels';
import { createRandom, tileKey } from '../art';
import { THEMES } from '../level/themes';
import { installLevelSkip } from '../dev/levelSkip';
import { installGodMode, isGodMode } from '../dev/godMode';
import { sound, type Ambience } from '../audio/Sound';
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

  /** Tries left on this level. Running out starts it over. */
  private lives = LIVES;
  private lifeIcons: Phaser.GameObjects.Image[] = [];

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
   * Everything that kills on contact and is not a creature: lava, and thorns.
   *
   * One list rather than two, because the cat's side of it is identical -- a
   * rectangle it must not be inside. What each of them *is* lives elsewhere.
   */
  private deadlyRects: Phaser.Geom.Rectangle[] = [];
  private lava?: LavaLake;
  private rain?: Rain;

  /** True from the moment the cat is killed until it is back on its feet. */
  private dying = false;

  constructor() {
    super('Game');
  }

  /** Phaser hands this whatever `scene.start` was given. */
  init(data: { levelIndex?: number; lives?: number; collected?: number }): void {
    const carried = this.registry.get(SNAPSHOT_KEY) as GameSnapshot | undefined;

    this.levelIndex = data.levelIndex ?? carried?.levelIndex ?? 0;
    // Lives cross level boundaries; a spare heart found in one is still yours
    // in the next, which is the only thing that makes finding one worth a
    // detour.
    this.lives = data.lives ?? LIVES;
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
    const climbZones = this.buildTrunks();
    this.buildFoliage();
    const waterZones = this.buildWater();
    this.deadlyRects = [...this.buildLava(), ...this.buildThorns()];
    this.charms = this.buildCharms();

    this.player = new Player(
      this,
      this.level.spawn.x,
      this.level.spawn.y,
      // A level whose columns are only scenery still draws them and still lets
      // the cat walk through them; it just hands the player nothing to hold on
      // to. That is the whole of "you cannot climb a tree".
      this.level.columnsAreClimbable ? climbZones : [],
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
      if (isGodMode(this)) {
        this.graze();
        this.player.respawnAt(this.level.spawn.x, this.level.spawn.y);
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

  /** Is any part of the cat in the lava, or on the thorns? */
  private touchingSomethingDeadly(): boolean {
    const body = this.player.body;

    return this.deadlyRects.some(
      (zone) =>
        body.right > zone.x &&
        body.x < zone.right &&
        body.bottom > zone.y &&
        body.y < zone.bottom,
    );
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
    if (isGodMode(this)) {
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

    this.time.delayedCall(650, () => {
      if (this.lives <= 0) {
        sound.play('gameOver');
        this.endRun();
        return;
      }

      this.player.clearTint();
      this.player.body.setAllowGravity(true);
      this.player.respawnAt(this.level.spawn.x, this.level.spawn.y);

      // Everything that was coming for the cat goes back to where it lives.
      // A crocodile is not stepped while the cat is dying, so without this it
      // goes on hunting a cat that drowned three seconds ago.
      for (const crocodile of this.crocodiles) {
        crocodile.settle();
      }
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
    const blocks = this.physics.add.staticGroup();
    const branches = this.physics.add.staticGroup();

    for (const solid of this.level.solids) {
      const group = solid.isBranch ? branches : blocks;
      // Ledges carry no art of their own: the tree crown or the nest is
      // already drawn, and this is only the surface to stand on.
      const invisible = solid.textureKey.endsWith('-ledge');
      const tile = group
        .create(solid.x, solid.y, this.tile(invisible ? 'branch-mid' : solid.textureKey))
        .setOrigin(0, 0)
        .refreshBody() as Phaser.Physics.Arcade.Sprite;

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

      // Leaves hang below a branch as decoration only. They are not part of the
      // collision box, so the cat lands on the wood rather than on foliage.
      if (solid.isBranch) {
        this.add
          .image(solid.x, solid.y + solid.height, this.tile('branch-leaves'))
          .setOrigin(0, 0)
          .setDepth(-5);
      }
    }

    return { blocks, branches };
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
    return this.level.climbZones.map((zone) => {
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

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
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

      if (isCrown) {
        crown(solid.x + TILE / 2, solid.y - 18, TILE * 2);
      }
    }

    for (const solid of this.level.solids) {
      if (!this.sprouts(solid, wooded) || random() > 0.38) {
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
      this.add
        .image(zone.x, zone.y, this.tile('water-bed'))
        .setOrigin(0, 0)
        .setDepth(-8);

      const tile = this.add
        .image(zone.x, zone.y, this.tile(zone.isSurface ? 'water-surface' : 'water'))
        .setOrigin(0, 0)
        .setAlpha(0.62)
        .setDepth(20);

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

  private collectCharm(charm: Phaser.Physics.Arcade.Sprite): void {
    if (!charm.active) {
      return;
    }

    charm.disableBody(true, true);
    sound.play('collect');
    this.collected += 1;
    this.scoreText.setText(this.formatScore());

    if (this.collected >= CHARMS_PER_LIFE) {
      // A hundred of them is a life. The count starts again rather than
      // carrying on, so the number in the corner is always how far you are
      // from the *next* one.
      this.collected -= CHARMS_PER_LIFE;
      this.lives += 1;
      this.refreshLives();
      this.scoreText.setText(this.formatScore());
      this.cameras.main.flash(260, 255, 150, 180);
    }
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
    }

    // This one is *not* dev-only: the game is played and tested on a phone,
    // against the deployed copy, so a cheat that only exists on the machine it
    // was written on would be no use. See `dev/godMode.ts`.
    installGodMode(this, levelName);

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
   * The mute button, bottom left.
   *
   * Out of the way of the hearts, which grow along the top right, and out of
   * the way of the touch controls, which are along the bottom. `M` does the
   * same thing, because a button is no use to somebody already holding the
   * keyboard.
   */
  private buildMuteButton(): void {
    const button = this.add
      .image(TILE, GAME_HEIGHT - TILE, sound.muted ? 'ui-sound-off' : 'ui-sound-on')
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.55)
      .setInteractive({ useHandCursor: true });

    const flip = (): void => {
      // Every press is a gesture, so it is also the moment the audio is
      // allowed to start. Unmuting before the context exists would otherwise
      // be silent and look broken.
      sound.unlock();
      button.setTexture(sound.toggle() ? 'ui-sound-off' : 'ui-sound-on');
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
    const wanted = Math.max(LIVES, this.lives);

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
   * Never required to finish a level. Below three they fill a spent heart back
   * in; at three or above they simply add another.
   */
  private buildExtraLives(): void {
    for (const at of this.level.extraLives) {
      // In front of the nest's near rim, so it is not buried in the straw.
      const heart = this.physics.add.staticImage(at.x, at.y - 3, 'life').setDepth(7);

      this.tweens.add({
        targets: heart,
        y: at.y - 3,
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

        heart.destroy();
        this.lives += 1;
        this.refreshLives();
        this.cameras.main.flash(180, 255, 190, 150);
      });
    }
  }

  private formatScore(): string {
    return `${this.collected}/${CHARMS_PER_LIFE}`;
  }
}
