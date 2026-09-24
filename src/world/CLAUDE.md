# World

Scenery: everything that is looked at rather than landed on. None of it has a
physics body.

One backdrop per place, chosen by `createBackdrop`:

- `Backdrop` — the forest: sky, sun, shafts of light, two ranks of trees, bushes.
- `CaveBackdrop` — stalactites at two depths, crystals, a pool of floor light.
- `CityBackdrop` — night sky, moon, two ranks of buildings with lit windows.

The backdrop is where a level's character lives, because the tiles themselves
are shared across all three and differ only by palette.

**The city inverts the forest's depth rule.** Outdoors, haze lightens distance,
so far trees are paler. At night, distance is where the *lights* are and the
near thing is what blocks them, so the near buildings are darker.

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
