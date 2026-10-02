import Phaser from 'phaser';

/**
 * Data key that keeps a picture out of the bake. Baked scenery all lands in one
 * layer at depth -0.5, so anything that must draw *between* it and the cat -- a
 * bush a hedgehog can hide behind -- has to stay a live object.
 */
export const KEEP_LIVE = 'keepLive';

/** The side of one baked chunk, px. A power of two, for the GPU's sake. */
const CHUNK = 512;

/**
 * Flattens the level's static scenery into a few big textures.
 *
 * A level is drawn as one picture per cell -- a tile, the shade over it, the
 * grass on it -- and the cave has fifteen thousand cells. Every one of those
 * pictures went through the renderer every frame, twenty-seven thousand of
 * them, and on a phone that was a slideshow. None of them ever moves.
 *
 * So, once the level is built, everything that is static is drawn into
 * chunks of `CHUNK` square, one draw call each, and the originals are put
 * away: a tile that also collides is hidden and keeps its body, a picture
 * that is only a picture is destroyed. What stays live is what moves or
 * animates -- the cat, the creatures, the water's swell, the hearts -- and
 * anything in front of the cat.
 *
 * Static means: scrolls with the world, at or behind the cat's depth, no
 * tween on it, no animation, no moving body. The order inside a chunk is
 * the same the display list had -- depth, then age -- so nothing changes
 * but the number of things drawn.
 */
export function bakeScenery(scene: Phaser.Scene, widthInPixels: number, heightInPixels: number): void {
  const list = scene.children.list;
  const candidates: Array<{ object: Bakeable; index: number; bounds: Phaser.Geom.Rectangle }> = [];

  // Everything a tween is moving, found once. Asking the tween manager per
  // object scans every tween every time, and there are thousands of objects.
  const tweened = new Set<object>();
  for (const tween of scene.tweens.getTweens()) {
    for (const target of tween.targets ?? []) {
      tweened.add(target as object);
    }
  }

  list.forEach((object, index) => {
    // A Graphics object drawn once for the whole level (the stone mass) has
    // no size of its own; it goes into every chunk.
    if (object instanceof Phaser.GameObjects.Graphics && object.scrollFactorX === 1 && object.depth <= 0 && !tweened.has(object)) {
      candidates.push({ object: object as unknown as Bakeable, index, bounds: new Phaser.Geom.Rectangle(0, 0, widthInPixels, heightInPixels) });
      return;
    }

    if (!isStaticScenery(object, tweened)) {
      return;
    }

    const image = object as Bakeable;
    // Nothing static is rotated, so its bounds are plain arithmetic.
    const bounds = new Phaser.Geom.Rectangle(
      image.x - image.displayWidth * image.originX,
      image.y - image.displayHeight * image.originY,
      image.displayWidth,
      image.displayHeight,
    );
    candidates.push({ object: image, index, bounds });
  });

  candidates.sort((a, b) => a.object.depth - b.object.depth || a.index - b.index);

  for (let cy = 0; cy < heightInPixels; cy += CHUNK) {
    for (let cx = 0; cx < widthInPixels; cx += CHUNK) {
      const width = Math.min(CHUNK, widthInPixels - cx);
      const height = Math.min(CHUNK, heightInPixels - cy);
      const chunkRect = new Phaser.Geom.Rectangle(cx, cy, width, height);
      const inChunk = candidates
        .filter((entry) => Phaser.Geom.Intersects.RectangleToRectangle(entry.bounds, chunkRect))
        .map((entry) => entry.object);

      if (inChunk.length === 0) {
        continue;
      }

      const chunk = scene.add
        .renderTexture(cx, cy, width, height)
        .setOrigin(0, 0)
        // Just behind the cat's depth: everything baked was at or behind
        // it, and everything left live at depth 0 was added after the
        // scenery anyway.
        .setDepth(-0.5);

      // The chunk's own camera does the offset: objects draw at their world
      // position, seen from the chunk's corner.
      chunk.camera.setScroll(cx, cy);
      chunk.draw(inChunk);
      // Phaser 4 buffers draw commands; nothing is on the texture until
      // this runs, and it has to run while the originals still exist.
      chunk.render();
    }
  }

  // Take them all off the display list in one pass. Removing them one at a
  // time is a search of the whole list each, and with twenty-seven thousand
  // of them that took most of a second.
  const baked = new Set<Phaser.GameObjects.GameObject>(candidates.map((entry) => entry.object));
  // Hidden colliding tiles -- whose picture is drawn some other way, as a
  // boulder or a stone mass -- leave the display list too. Their bodies stay.
  const hiddenTile = (object: Phaser.GameObjects.GameObject): boolean =>
    (object instanceof Phaser.GameObjects.Image || object instanceof Phaser.GameObjects.Sprite) &&
    !object.visible &&
    !!object.body &&
    (object.body as Phaser.Physics.Arcade.StaticBody).physicsType === Phaser.Physics.Arcade.STATIC_BODY;
  const kept = list.filter((object) => !baked.has(object) && !hiddenTile(object));
  list.length = 0;
  list.push(...kept);

  for (const { object } of candidates) {
    // A colliding tile keeps its body, which lives in the physics world, and
    // simply stays off the display list: it costs nothing per frame. It is a
    // physics Image, not a Sprite, so there is no update list to leave.
    if (!object.body) {
      object.destroy();
    }
  }
}

/** What the bake can flatten: anything with a texture, a position and a size. */
type Bakeable = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.TileSprite;

function isStaticScenery(object: Phaser.GameObjects.GameObject, tweened: Set<object>): boolean {
  // Images, Sprites and TileSprites: none is a subclass of another in
  // Phaser's hierarchy. The colliding tiles are physics Images, the void
  // fills are TileSprites.
  const drawable =
    object instanceof Phaser.GameObjects.Image ||
    object instanceof Phaser.GameObjects.Sprite ||
    object instanceof Phaser.GameObjects.TileSprite;

  if (!drawable || object instanceof Phaser.GameObjects.RenderTexture) {
    return false;
  }

  if (object.getData(KEEP_LIVE)) {
    return false;
  }

  if (!object.visible || object.scrollFactorX !== 1 || object.scrollFactorY !== 1 || object.depth > 0) {
    return false;
  }

  if (object instanceof Phaser.GameObjects.Sprite && (object.anims.isPlaying || object.anims.currentAnim)) {
    return false;
  }

  const body = object.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;

  if (body && body.physicsType !== Phaser.Physics.Arcade.STATIC_BODY) {
    return false;
  }

  return !tweened.has(object);
}
