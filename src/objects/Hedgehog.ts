import Phaser from 'phaser';
import { HEDGEHOG_SIZE } from '../art';
import { HEDGEHOG } from '../config';
import { isSolidTile } from './solid';

/**
 * A hedgehog, pacing its platform.
 *
 * It never walks off an edge and turns at anything solid in its way. Both are
 * decided by looking ahead rather than by waiting for a collision: a collision
 * comes one frame too late to stop a fall, and a hedgehog that tumbles off its
 * ledge looks broken rather than dangerous.
 */
export class Hedgehog extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** 1 walking right, -1 walking left. */
  private direction: number;

  constructor(scene: Phaser.Scene, x: number, y: number, direction = -1) {
    super(scene, x, y, 'hedgehog');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.direction = direction;
    this.setOrigin(0.5, 1);
    this.body.setSize(HEDGEHOG_SIZE.width, HEDGEHOG_SIZE.height, false);
    this.body.setOffset(0, 0);
    this.body.setCollideWorldBounds(true);
    this.setDepth(-1);
  }

  /** Called from the scene once a frame, after the physics of the last one. */
  step(): void {
    if (!this.active) {
      return;
    }

    if (this.blockedAhead() || !this.groundAhead()) {
      this.direction = -this.direction;
    }

    this.setVelocityX(this.direction * HEDGEHOG.speed);
    this.setFlipX(this.direction < 0);
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
    const ahead = this.direction > 0 ? body.right : body.x - HEDGEHOG.probe;
    const face = this.direction > 0 ? 'left' : 'right';

    return this.solidIn(ahead, body.y + 2, HEDGEHOG.probe, body.height - 4, face);
  }

  /** Is there still floor under the step it is about to take? */
  private groundAhead(): boolean {
    const body = this.body;
    const ahead = this.direction > 0 ? body.right : body.x - HEDGEHOG.probe;

    return this.solidIn(ahead, body.bottom, HEDGEHOG.probe, HEDGEHOG.probe * 2, 'up');
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
