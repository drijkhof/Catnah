# World

Scenery: everything that is looked at rather than landed on.

`Backdrop` builds level 1's forest -- sky, sun, shafts of light, two ranks of
trees, and bushes along the floor. None of it has a physics body.

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
| Mid trees | 0.5 |
| Bushes, grass tufts | 1 |

**Anything touching the forest floor must stay at scroll factor 1.** Bushes sit
on the ground the cat walks on; parallaxing them would make them visibly slide
across it. Only things clearly far away can afford to move at a different rate.

Tree trunks are planted slightly *below* the ground line so the forest floor,
drawn in front of them, hides their bases. That is why `Backdrop` takes the
ground line from `ParsedLevel` rather than guessing it from the tiles — the
sneaking log is also solid and would otherwise be mistaken for ground level.

## Adding scenery

Scatter with `createRandom` from `src/art`, never `Math.random`, or the forest
rearranges itself on every reload. Spread placement across the full level width
plus a margin; layers with a scroll factor below 1 need less than the level's
width to cover it, so covering the whole width always over-covers.
