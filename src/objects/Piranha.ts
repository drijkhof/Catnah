import Phaser from 'phaser';
import { PIRANHA } from '../config';

/**
 * A piranha, lurking in a pool and leaping out of it now and then.
 *
 * It sits below the surface between leaps rather than hovering at it, so the
 * pool looks empty until it moves -- which is the whole threat. The leap is
 * telegraphed by that rise, and the timing is fixed rather than random: a
 * hazard a player cannot learn is just bad luck.
 */
export class Piranha extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** Water surface it leaps out of. */
  private readonly surfaceY: number;

  /** Where it waits between leaps. */
  private readonly restY: number;

  private timer = 0;

  constructor(scene: Phaser.Scene, x: number, surfaceY: number, delayMs = 0) {
    super(scene, x, surfaceY + PIRANHA.lurkDepth, 'piranha');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.surfaceY = surfaceY;
    this.restY = surfaceY + PIRANHA.lurkDepth;
    // A stagger, so a row of them does not leap in unison.
    this.timer = -delayMs;

    this.body.setAllowGravity(false);
    this.setDepth(10);
  }

  step(delta: number): void {
    this.timer += delta;

    if (this.timer >= PIRANHA.intervalMs) {
      this.timer = 0;
      this.setVelocityY(PIRANHA.leapVelocity);
      this.body.setAllowGravity(true);
    }

    // Back below the surface: settle and wait for the next one.
    if (this.body.allowGravity && this.y >= this.restY && this.body.velocity.y > 0) {
      this.body.setAllowGravity(false);
      this.setVelocity(0, 0);
      this.setPosition(this.x, this.restY);
    }

    // Nose up on the way out, nose down on the way back in.
    this.setAngle(this.body.velocity.y < 0 ? -70 : this.y < this.surfaceY ? 70 : 0);
  }
}
