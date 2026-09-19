import Phaser from 'phaser';
import { COLORS, TILE } from '../config';
import { Controls } from '../input/Controls';
import { Player } from '../objects/Player';
import { parseLevel, type ParsedLevel } from '../level/Level';

/** How far below the level the player may fall before respawning, in pixels. */
const FALL_OUT_MARGIN = 80;

export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;
  private level!: ParsedLevel;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.level = parseLevel();
    this.score = 0;

    this.cameras.main.setBackgroundColor(COLORS.sky);

    // The world is taller than the level so a player who misses a jump falls
    // into empty space and is respawned, rather than landing on an invisible
    // floor at the bottom of the screen.
    this.physics.world.setBounds(
      0,
      0,
      this.level.widthInPixels,
      this.level.heightInPixels + FALL_OUT_MARGIN * 2,
    );

    const solids = this.buildSolids();
    const coins = this.buildCoins();

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);

    this.physics.add.collider(this.player, solids);
    this.physics.add.overlap(this.player, coins, (_player, coin) => {
      this.collectCoin(coin as Phaser.Physics.Arcade.Sprite);
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
      this.respawn();
    }
  }

  private buildSolids(): Phaser.Physics.Arcade.StaticGroup {
    const solids = this.physics.add.staticGroup();

    for (const tile of this.level.solids) {
      solids.create(tile.x, tile.y, 'tile').setOrigin(0, 0).refreshBody();
    }

    return solids;
  }

  private buildCoins(): Phaser.Physics.Arcade.StaticGroup {
    const coins = this.physics.add.staticGroup();

    for (const coin of this.level.coins) {
      const sprite = coins.create(coin.x, coin.y, 'coin') as Phaser.Physics.Arcade.Sprite;

      this.tweens.add({
        targets: sprite,
        y: coin.y - 3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    return coins;
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Sprite): void {
    if (!coin.active) {
      return;
    }

    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(this.formatScore());
  }

  private buildHud(): void {
    this.scoreText = this.add
      .text(TILE / 2, TILE / 2, this.formatScore(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      // Scroll factor 0 pins the HUD to the viewport instead of the world.
      .setScrollFactor(0)
      .setDepth(1000);
  }

  private formatScore(): string {
    return `COINS ${this.score}/${this.level.coins.length}`;
  }

  private respawn(): void {
    this.player.setVelocity(0, 0);
    this.player.setPosition(this.level.spawn.x, this.level.spawn.y);
    this.cameras.main.flash(180, 0, 0, 0);
  }
}
