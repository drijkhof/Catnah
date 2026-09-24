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

**A scroll factor below 1 means the camera outruns the rank it is attached
to.** `addTreeRank` used to draw exactly one row, at a fixed height above the
ground, which was every row the forest ever needed — nothing there climbed
far enough to leave it behind. A canopy of real trees can climb several
screens above `groundLine`, and past about one screen of that the whole rank
has scrolled below the bottom of the frame, leaving bare sky above it. It now
stacks rows all the way to the top of the level, spaced by the tree's own
height so they read as a receding rank rather than a solid wall, each row up
a little fainter than the last. A short level simply gets one row, same as
before; the fix falls out of `groundLine` alone; nothing about it is
theme-specific.

## Adding scenery

Scatter with `createRandom` from `src/art`, never `Math.random`, or the forest
rearranges itself on every reload. Spread placement across the full level width
plus a margin; layers with a scroll factor below 1 need less than the level's
width to cover it, so covering the whole width always over-covers.
