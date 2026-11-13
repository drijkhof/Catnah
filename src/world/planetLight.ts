import Phaser from 'phaser';
import { PLANET_DISCS, PLANET_LIGHT_SIZE, type PlanetName } from '../art';

/**
 * The sunlight on a planet: `planet-light` laid over its picture, the same
 * size as its globe, just in front of it. The planet itself is never turned
 * -- its bands and rings stay level -- only its light, by `faceTheSun`.
 */
export function addPlanetLight(scene: Phaser.Scene, planet: Phaser.GameObjects.Image, name: PlanetName): Phaser.GameObjects.Image {
  const light = scene.add
    .image(planet.x, planet.y, 'planet-light')
    .setDepth(planet.depth + 0.01)
    .setScrollFactor(planet.scrollFactorX, planet.scrollFactorY);
  light.setData('scale', (PLANET_DISCS[name] * 2 * planet.scaleX) / PLANET_LIGHT_SIZE);
  light.setScale(light.getData('scale') as number);
  // A ring's near half goes over the light: it is not in the planet's shadow.
  const frontKey = `planet-${name}-front`;
  if (scene.textures.exists(frontKey)) {
    const front = scene.add
      .image(planet.x, planet.y, frontKey)
      .setScale(planet.scaleX, planet.scaleY)
      .setDepth(planet.depth + 0.02)
      .setScrollFactor(planet.scrollFactorX, planet.scrollFactorY);
    light.setData('front', front);
  }
  return light;
}

/** Puts the light on its planet and turns its lit side towards the sun at `sunX`, `sunY`. */
export function faceTheSun(light: Phaser.GameObjects.Image, planet: Phaser.GameObjects.Image, sunX: number, sunY: number): void {
  light.setPosition(planet.x, planet.y);
  (light.getData('front') as Phaser.GameObjects.Image | undefined)?.setPosition(planet.x, planet.y);
  // The picture is lit from the left: turned by the angle from the sun to the planet.
  light.setRotation(Math.atan2(planet.y - sunY, planet.x - sunX));
}
