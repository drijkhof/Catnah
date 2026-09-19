import Phaser from 'phaser';
import { COLORS, PLAYER, TILE } from '../config';

const BUTTON_SIZE = 56;

/**
 * Generates placeholder art at runtime, then hands off to the game.
 *
 * Drawing the textures in code means the project has no binary assets to
 * manage yet, and the game runs the moment it is cloned. Once there is real
 * art, swap the `generate*` calls below for `this.load.spritesheet(...)` and
 * nothing outside this scene needs to change -- the rest of the game only ever
 * refers to textures by key.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Real asset loading goes here, e.g.
    // this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 24 });
  }

  create(): void {
    this.generatePlayerTexture();
    this.generateTileTexture();
    this.generateCoinTexture();
    this.generateButtonTextures();

    this.scene.start('Game');
  }

  private generatePlayerTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(COLORS.player, 1);
    graphics.fillRect(0, 0, PLAYER.width, PLAYER.height);

    // A darker band at eye level, so which way the sprite faces is readable.
    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRect(PLAYER.width - 5, 5, 3, 3);

    graphics.generateTexture('player', PLAYER.width, PLAYER.height);
    graphics.destroy();
  }

  private generateTileTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(COLORS.ground, 1);
    graphics.fillRect(0, 0, TILE, TILE);

    // Lighter top edge reads as a walkable surface at a glance.
    graphics.fillStyle(COLORS.groundTop, 1);
    graphics.fillRect(0, 0, TILE, 3);

    graphics.generateTexture('tile', TILE, TILE);
    graphics.destroy();
  }

  private generateCoinTexture(): void {
    const graphics = this.add.graphics();
    const radius = 5;

    graphics.fillStyle(COLORS.coin, 1);
    graphics.fillCircle(radius, radius, radius);

    graphics.generateTexture('coin', radius * 2, radius * 2);
    graphics.destroy();
  }

  /**
   * Draws the three touch-control glyphs. They are tinted and faded by the
   * Controls class, so these are plain white shapes.
   */
  private generateButtonTextures(): void {
    const half = BUTTON_SIZE / 2;

    const drawBase = (graphics: Phaser.GameObjects.Graphics): void => {
      graphics.fillStyle(0xffffff, 0.25);
      graphics.fillRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, 10);
      graphics.lineStyle(2, 0xffffff, 0.9);
      graphics.strokeRoundedRect(1, 1, BUTTON_SIZE - 2, BUTTON_SIZE - 2, 10);
      graphics.fillStyle(0xffffff, 1);
    };

    const left = this.add.graphics();
    drawBase(left);
    left.fillTriangle(half + 8, half - 11, half + 8, half + 11, half - 10, half);
    left.generateTexture('ui-left', BUTTON_SIZE, BUTTON_SIZE);
    left.destroy();

    const right = this.add.graphics();
    drawBase(right);
    right.fillTriangle(half - 8, half - 11, half - 8, half + 11, half + 10, half);
    right.generateTexture('ui-right', BUTTON_SIZE, BUTTON_SIZE);
    right.destroy();

    const jump = this.add.graphics();
    drawBase(jump);
    jump.fillTriangle(half - 11, half + 8, half + 11, half + 8, half, half - 10);
    jump.generateTexture('ui-jump', BUTTON_SIZE, BUTTON_SIZE);
    jump.destroy();
  }
}
