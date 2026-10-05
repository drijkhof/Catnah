# World

Scenery: everything that is looked at rather than landed on. None of it has a
physics body.

One backdrop per place, chosen by `createBackdrop`:

- `Backdrop` — the forest: sky, sun, shafts of light, two ranks of trees, haze
  between them, a canopy over the top, bushes.
- `GroundShade` — not a backdrop but used by every level: the darkness inside
  the ground, as a distance field from every exposed face. See the file.
- `BakeScenery` — run last, once a level is built: flattens every static
  picture (tiles, shade, grass, boulders, trees, fillets, beds, thorns...)
  into 512px chunk textures and throws the originals away. The cave had
  27,000 pictures and drew them all every frame; it has 32 chunks now, in
  two layers: the backdrop (anything at or behind `BACKDROP_LIMIT`, -5.5:
  the cave wall, the leaf masses behind the trees, the water bed) at -20,
  and the terrain (ground, rock, branches, boulders, shade, grass) at -0.5.
  The gap between them exists for the portal, which sits at -10: in front of
  the backdrop, behind everything you stand on. Read
  the file before adding scenery: anything static at depth 0 or behind, at
  scroll factor 1, with no tween and no animation, gets baked; anything
  else stays live. **Phaser 4 buffers `draw()` -- `render()` must follow, and
  before the originals are destroyed.**

**Colliding tiles are physics Images, not Sprites**, so once baked they sit
off the display list with only their bodies, costing nothing per frame.
- `CaveBackdrop` — the inside of a cave. A cobbled rock wall behind the
  tunnels (a seamless `cave-wall` tile sprite) locked to the world at scroll
  factor 1: there is no horizon in a cave, the wall is the far side of the
  passage. Stalactites hang from real ceilings and stalagmites and crystals
  stand on real floors, read off the level's own cells. All static, so the
  scenery bake flattens the lot.

The backdrop is where a level's character lives, because the tiles themselves
are shared across all of them and differ only by palette.

## Depth and parallax

Gameplay sits at the default depth of 0. Scenery is pushed behind with negative
depths and the few foreground touches sit just in front; the `DEPTH` table at
the top of `Backdrop.ts` is the whole draw order in one place.

Parallax comes from scroll factors — distant ranks move less than the camera,
which is what reads as depth:

| Layer | Scroll factor |
| --- | --- |
| Sky | 0 (pinned to the viewport, so it never runs out) |
| Sun and light rays | 0.04 |
| Far trees | 0.25 |
| Haze (both bands) | 0 sideways, 1 vertically: featureless, pinned to the ground line |
| Mid trees | 0.5 |
| Canopy | 0.35 sideways, 0 vertically: pinned to the top of the viewport |
| Bushes, grass tufts | 1 |

**Bushes (and the swamp's reeds) are live objects, not baked.** They sit at
depth -0.3 with `setData(KEEP_LIVE, true)`, which `bakeScenery` honours. The
rest of the static scenery is flattened into two layers, the terrain one at
-0.5, and hedgehogs walk at -0.4: above that layer (trees and rocks never hide
them) and below the
bushes (which do, on purpose). A bush therefore also draws over the foot of a
trunk or boulder beside it, which looks natural. Anything new that must pass in
front of or behind the creatures needs the same treatment.

**Anything touching the forest floor must stay at scroll factor 1.** Bushes sit
on the ground the cat walks on; parallaxing them would make them visibly slide
across it. Only things clearly far away can afford to move at a different rate.

Tree trunks are planted slightly *below* the ground line so the forest floor,
drawn in front of them, hides their bases. That is why `Backdrop` takes the
ground line from `ParsedLevel` rather than guessing it from the tiles — the
sneaking log is also solid and would otherwise be mistaken for ground level.

**A scroll factor below 1 on the vertical axis is what unroots a tree from the
ground as the camera climbs.** The floor sits at scroll factor 1; a tree rank
at 0.25 or 0.5 moves *less* than the floor does for the same camera movement,
so as the cat climbs, the ground pulls away from the tree faster than the
tree can follow and the gap between the two grows — the tree looks like it is
lifting off its own roots, worse the higher the level goes. Repeating more
rows to fill the resulting empty sky was tried first and made it worse: more
copies of something already drifting off the ground just multiplied the
drift into a mess of trees rising through each other.

The fix is `setScrollFactor(x, 1)` rather than `setScrollFactor(x)` --
`ScrollFactor` takes the two axes separately. Only the horizontal factor
still parallaxes, for the left-right depth cue; the vertical one is locked to
1, the same as the floor, so a tree's foot stays exactly on `groundLine` on
screen no matter how high the camera goes. It also quietly fixes the empty
sky: a tree pinned to the ground scrolls off the bottom of the frame exactly
when the ground itself does, which is correct -- a real distant tree behind
you would disappear the same way once you have climbed above it.

## Adding scenery

Scatter with `createRandom` from `src/art`, never `Math.random`, or the forest
rearranges itself on every reload. Spread placement across the full level width
plus a margin; layers with a scroll factor below 1 need less than the level's
width to cover it, so covering the whole width always over-covers.
