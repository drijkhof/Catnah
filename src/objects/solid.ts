import Phaser from 'phaser';

/**
 * Is this body a piece of level geometry, rather than something else that
 * happens to be a static body?
 *
 * Probes ask the physics world what is nearby, and charms are static bodies
 * too. Without this a hedgehog turns round at a charm and the cat can wall jump
 * off one. `GameScene` flags the tiles it builds.
 */
export function isSolidTile(body: Phaser.Physics.Arcade.StaticBody): boolean {
  return body.gameObject?.getData('solid') === true;
}
