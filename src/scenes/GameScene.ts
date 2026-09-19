import Phaser from 'phaser';
import { TILE } from '../config';
import { Controls } from '../input/Controls';
import { Player } from '../objects/Player';
import { Crow } from '../objects/Crow';
import { GroundEnemy } from '../objects/GroundEnemy';
import { Piranha } from '../objects/Piranha';
import { createBackdrop } from '../world';
import { parseLevel, type ParsedLevel } from '../level/Level';
import { LEVELS } from '../level/levels';
import { tileKey } from '../art';
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
  private starIcon?: Phaser.GameObjects.Image;
  private berries!: Phaser.Physics.Arcade.StaticGroup;
  private collected = 0;

  /** True once the level's star has been picked up. Needed to leave. */
  private hasStar = false;

  /** Which level is being played, as an index into LEVELS. */
  private levelIndex = 0;

  /** True while the level is being left, so the exit cannot fire twice. */
  private leaving = false;
  private walkers: GroundEnemy[] = [];
  private piranhas: Piranha[] = [];
  private crows: Crow[] = [];
  private lavaRects: Phaser.Geom.Rectangle[] = [];

  /** True from the moment the cat is killed until it is back on its feet. */
  private dying = false;

  constructor() {
    super('Game');
  }

  /** Phaser hands this whatever `scene.start` was given. */
  init(data: { levelIndex?: number }): void {
    const carried = this.registry.get(SNAPSHOT_KEY) as GameSnapshot | undefined;

    this.levelIndex = data.levelIndex ?? carried?.levelIndex ?? 0;
  }

  create(): void {
    this.level = parseLevel(LEVELS[this.levelIndex]);
    this.collected = 0;
    this.hasStar = false;
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
    const waterZones = this.buildWater();
    this.lavaRects = this.buildLava();
    this.berries = this.buildBerries();

    this.player = new Player(
      this,
      this.level.spawn.x,
      this.level.spawn.y,
      climbZones,
      waterZones,
    );

    this.physics.add.collider(this.player, blocks);
    this.physics.add.collider(
      this.player,
      branches,
      undefined,
      (_cat, branch) => this.canLandOn(branch as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, this.berries, (_cat, berry) => {
      this.collectBerry(berry as Phaser.Physics.Arcade.Sprite);
    });

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
      // removes berries elsewhere does not un-collect the wrong ones.
      collectedBerries: this.berries
        .getChildren()
        .filter((berry) => !(berry as Phaser.Physics.Arcade.Sprite).active)
        .map((berry) => berry.getData('levelPosition') as { x: number; y: number }),
    };
  }

  /** Puts a snapshot from the previous build back into this one. */
  restoreState(snapshot: GameSnapshot): void {
    for (const mark of snapshot.collectedBerries) {
      const match = this.berries.getChildren().find((berry) => {
        const at = berry.getData('levelPosition') as { x: number; y: number };
        return at.x === mark.x && at.y === mark.y;
      });

      if (match) {
        this.collectBerry(match as Phaser.Physics.Arcade.Sprite);
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
    for (const walker of this.walkers) {
      walker.step();
    }
    for (const piranha of this.piranhas) {
      piranha.step(delta, cat, this.player.swimming);
    }
    for (const crow of this.crows) {
      crow.step(cat, delta);
    }

    if (!this.dying && this.touchingLava()) {
      this.kill();
    }

    if (!this.dying && this.player.y > this.level.heightInPixels + FALL_OUT_MARGIN) {
      this.kill();
    }
  }

  /**
   * Places the star, if the level has one.
   *
   * It is the one thing a level actually requires: the door will not open
   * without it, so it is worth the climb it is usually put at the top of.
   */
  private buildStar(): void {
    const at = this.level.star;
    if (!at) {
      this.hasStar = true;
      return;
    }

    const star = this.physics.add
      .staticImage(at.x, at.y, 'star')
      .setDepth(5);

    this.tweens.add({
      targets: star,
      y: at.y - 3,
      scale: { from: 1, to: 1.12 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.physics.add.overlap(this.player, star, () => {
      if (!star.active) {
        return;
      }

      star.destroy();
      this.hasStar = true;
      this.cameras.main.flash(260, 255, 240, 170);
      this.starIcon?.setAlpha(1);
    });
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

    // The star is the level's actual goal; the door is just where you take it.
    if (!this.hasStar) {
      this.starIcon?.setScale(1.4);
      this.tweens.add({ targets: this.starIcon, scale: 1, duration: 300 });
      return;
    }

    this.leaving = true;
    this.cameras.main.fade(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', {
        levelIndex: (this.levelIndex + 1) % LEVELS.length,
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
    this.buildStar();

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

    for (const nest of this.level.nests) {
      this.add.image(nest.x, nest.y, this.tile('nest')).setOrigin(0, 0).setDepth(-2);
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

    for (const creature of [...this.walkers, ...this.piranhas, ...this.crows]) {
      this.physics.add.overlap(this.player, creature, () => this.kill());
    }
  }

  /** Is any part of the cat in the lava? */
  private touchingLava(): boolean {
    const body = this.player.body;

    return this.lavaRects.some(
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
  private kill(): void {
    if (this.dying) {
      return;
    }

    this.dying = true;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.player.setTint(0xff6b6b);

    this.cameras.main.shake(180, 0.008);
    this.cameras.main.flash(200, 90, 0, 0);

    this.time.delayedCall(650, () => {
      this.player.clearTint();
      this.player.body.setAllowGravity(true);
      this.player.respawnAt(this.level.spawn.x, this.level.spawn.y);
      this.cameras.main.centerOn(this.player.x, this.player.y);
      this.dying = false;
    });
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
      // nearby, and berries are static bodies too. Without this flag a hedgehog
      // turns round at a berry and the cat can wall jump off one.
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
        .image(zone.x, zone.y, this.tile(zone.isTop ? 'trunk-top' : 'trunk'))
        .setOrigin(0, 0)
        // Behind the cat, so a climbing cat is seen against its trunk.
        .setDepth(-3);

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
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
   * Draws the lava and returns the rectangles that kill.
   *
   * Shaped exactly like water, and deliberately not solid: the danger is in
   * touching it, not in being stopped by it. It is drawn over the cat, so
   * falling in is visibly falling *in*.
   */
  private buildLava(): Phaser.Geom.Rectangle[] {
    return this.level.lavaZones.map((zone) => {
      this.add
        .image(zone.x, zone.y, this.tile('lava'))
        .setOrigin(0, 0)
        .setDepth(-8);

      const tile = this.add
        .image(zone.x, zone.y, this.tile(zone.isSurface ? 'lava-surface' : 'lava'))
        .setOrigin(0, 0)
        .setAlpha(0.9)
        .setDepth(20);

      if (zone.isSurface) {
        this.tweens.add({
          targets: tile,
          y: zone.y + 1.5,
          alpha: { from: 0.78, to: 1 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (zone.x / TILE) * 70,
        });
      }

      return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
    });
  }

  private buildBerries(): Phaser.Physics.Arcade.StaticGroup {
    const berries = this.physics.add.staticGroup();

    for (const berry of this.level.berries) {
      const sprite = berries.create(
        berry.x,
        berry.y,
        'berry',
      ) as Phaser.Physics.Arcade.Sprite;

      // The bob tween moves the sprite, so its own y is no longer where the
      // level put it. Remember that, so a berry can be matched after a reload.
      sprite.setData('levelPosition', { x: berry.x, y: berry.y });

      this.tweens.add({
        targets: sprite,
        y: berry.y - 3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    return berries;
  }

  private collectBerry(berry: Phaser.Physics.Arcade.Sprite): void {
    if (!berry.active) {
      return;
    }

    berry.disableBody(true, true);
    this.collected += 1;
    this.scoreText.setText(this.formatScore());
  }

  private buildHud(): void {
    // An icon rather than a word, so the HUD needs no translating.
    this.add
      .image(TILE, TILE, 'berry')
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
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

    if (this.level.star) {
      // Shown dim until it is found, so it reads as something still to get.
      this.starIcon = this.add
        .image(TILE * 4, TILE, 'star')
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(0.3);
    }

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

  private formatScore(): string {
    return `${this.collected}/${this.level.berries.length}`;
  }
}
