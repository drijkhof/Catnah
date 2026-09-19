import Phaser from 'phaser';
import { TILE } from '../config';
import { Controls } from '../input/Controls';
import { Player } from '../objects/Player';
import { Backdrop } from '../world/Backdrop';
import { parseLevel, type ParsedLevel } from '../level/Level';

/** How far below the level the cat may fall before respawning, in pixels. */
const FALL_OUT_MARGIN = 80;

export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;
  private level!: ParsedLevel;
  private scoreText!: Phaser.GameObjects.Text;
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
    const berries = this.buildBerries();

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);

    this.physics.add.collider(this.player, solids);
    this.physics.add.overlap(this.player, berries, (_cat, berry) => {
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
