import Phaser from 'phaser';
import { GROUND_ENEMY_SIZES } from '../art';
import { GROUND_ENEMIES, type GroundEnemyKind } from '../config';
import { isSolidTile } from './solid';

/** How far ahead it looks for a wall or the end of the floor, px. */
const PROBE = 3;

/**
 * Something that paces the floor: a hedgehog in the wild, a rat in the city.
 *
 * They differ in what they look like and how fast they scurry, and in nothing
 * else, so they are one class rather than two nearly identical ones.
 *
 * It never walks off an edge and turns at anything solid in its way. Both are
 * decided by looking ahead rather than by waiting for a collision: a collision
 * comes one frame too late to stop a fall, and a hedgehog that tumbles off its
 * ledge looks broken rather than dangerous.
 */
export class GroundEnemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** 1 walking right, -1 walking left. */
  private direction: number;

  private readonly kind: GroundEnemyKind;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: GroundEnemyKind = 'hedgehog',
    direction = -1,
  ) {
    super(scene, x, y, kind);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = kind;
    this.direction = direction;
    this.setOrigin(0.5, 1);

    const size = GROUND_ENEMY_SIZES[kind];
    this.body.setSize(size.width, size.height, false);
    this.body.setOffset(0, 0);
    this.body.setCollideWorldBounds(true);
    this.setDepth(-1);
  }

  /** Called from the scene once a frame, after the physics of the last one. */
  step(): void {
    if (!this.active) {
      return;
    }

    if (this.atLevelEdge() || this.blockedAhead() || !this.groundAhead()) {
      this.direction = -this.direction;
    }

    this.setVelocityX(this.direction * GROUND_ENEMIES[this.kind].speed);
    this.setFlipX(this.direction < 0);
  }

  /** Has it reached the end of the world? */
  private atLevelEdge(): boolean {
    const bounds = this.scene.physics.world.bounds;

    return this.direction > 0
      ? this.body.right >= bounds.right - PROBE
      : this.body.x <= bounds.x + PROBE;
  }

  /**
   * Is something solid directly in front of it?
   *
   * Only faces that would actually stop it count. A branch has its sides
   * switched off, so a hedgehog walking along one does not turn round at the
   * next branch tile it meets.
   */
  private blockedAhead(): boolean {
    const body = this.body;
    const ahead = this.direction > 0 ? body.right : body.x - PROBE;
    const face = this.direction > 0 ? 'left' : 'right';

    return this.solidIn(ahead, body.y + 2, PROBE, body.height - 4, face);
  }

  /** Is there still floor under the step it is about to take? */
  private groundAhead(): boolean {
    const body = this.body;
    const ahead = this.direction > 0 ? body.right : body.x - PROBE;

    return this.solidIn(ahead, body.bottom, PROBE, PROBE * 2, 'up');
  }

  private solidIn(
    x: number,
    y: number,
    width: number,
    height: number,
    face: 'up' | 'left' | 'right',
  ): boolean {
    const found = this.scene.physics.overlapRect(
      x,
      y,
      width,
      height,
      false,
      true,
    ) as Phaser.Physics.Arcade.StaticBody[];

    return found.some((body) => isSolidTile(body) && body.checkCollision[face]);
  }
}
