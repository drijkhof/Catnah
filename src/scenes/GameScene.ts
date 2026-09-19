import Phaser from 'phaser';
import { TILE } from '../config';
import { Controls } from '../input/Controls';
import { Player } from '../objects/Player';
import { Backdrop } from '../world/Backdrop';
import { parseLevel, type ParsedLevel } from '../level/Level';
import { SNAPSHOT_KEY, type GameSnapshot } from '../dev/hot';

/** How far below the level the cat may fall before respawning, in pixels. */
const FALL_OUT_MARGIN = 80;

export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;
  private level!: ParsedLevel;
  private scoreText!: Phaser.GameObjects.Text;
  private berries!: Phaser.Physics.Arcade.StaticGroup;
  private collected = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.level = parseLevel();
    this.collected = 0;

    // The world is taller than the level so a cat that misses a jump falls into
    // empty space and respawns, rather than landing on an invisible floor.
    this.physics.world.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels + FALL_OUT_MARGIN * 2,
    );

    new Backdrop(this, this.level.widthInPixels, this.level.groundLine);

    const solids = this.buildSolids();
    this.berries = this.buildBerries();

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);

    this.physics.add.collider(this.player, solids);
    this.physics.add.overlap(this.player, this.berries, (_cat, berry) => {
      this.collectBerry(berry as Phaser.Physics.Arcade.Sprite);
    });

    this.cameras.main.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels,
    );
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 60);

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

    if (snapshot) {
      this.registry.remove(SNAPSHOT_KEY);
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
    this.player.step(this.controls, delta);

    if (this.player.y > this.level.heightInPixels + FALL_OUT_MARGIN) {
      this.player.respawnAt(this.level.spawn.x, this.level.spawn.y);
      this.cameras.main.flash(180, 0, 0, 0);
    }
  }

  private buildSolids(): Phaser.Physics.Arcade.StaticGroup {
    const solids = this.physics.add.staticGroup();

    for (const solid of this.level.solids) {
      const tile = solids
        .create(solid.x, solid.y, solid.textureKey)
        .setOrigin(0, 0)
        .refreshBody() as Phaser.Physics.Arcade.Sprite;

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
          .image(solid.x, solid.y + solid.height, 'branch-leaves')
          .setOrigin(0, 0)
          .setDepth(-5);
      }
    }

    return solids;
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
