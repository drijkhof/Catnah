# Level

Level data and the parser that turns it into world coordinates.

## Format

`LEVEL_SOURCE` is an array of strings, one per row of tiles:

| Char | Meaning |
| --- | --- |
| `#` | forest floor / earth |
| `=` | branch — what the platforms are in level 1 |
| `B` | fallen bough, a full-height solid for low overhangs |
| `R` | boulder — solid rock, and what wall jumps are taken from |
| `o` | berry |
| `P` | cat spawn (exactly one) |
| `.` | empty |

Rows may be written **short** — `parseLevel` pads them to
`LEVEL_WIDTH_IN_TILES` with empty tiles, so only the interesting left-hand part
of a row needs typing. Long runs use `'#'.repeat(n)` rather than hand-counted
characters, because miscounting a row by one is invisible in review and
maddening to debug.

A tile is `TILE` (16) game pixels, from `src/config.ts`.

Tiles are not all a full tile tall. A `=` branch is only as tall as its wood
(`BRANCH_THICKNESS`), so the collision box is exactly the surface the cat lands
on rather than a 16px block of air. `parseLevel` therefore returns explicit
`width`/`height` per solid instead of assuming a square.

Branch end-caps and the grass line are chosen from neighbouring tiles: a branch
is rounded off where it ends, and earth only grows grass where it is actually
exposed to the sky. That last rule is what stops a stack of ground tiles reading
as stripes.

## Buried sides are switched off

`exposedFaces` works out which sides of a tile anything could ever touch, and
`GameScene` switches the rest off with `body.checkCollision`.

This is not tidiness. Each tile is its own rectangle with four solid sides,
including the ones buried inside a mass of rock where nothing can reach. When
the cat presses against a wall, its overlap with that wall is a fraction of a
pixel — and so is its overlap with the tile above once its head crosses a seam.
Arcade separates on whichever axis overlaps least, so it could pick the vertical
one and report a *ceiling*, killing a jump against a flat wall. Turning off the
buried sides removes the choice. It fixes snagging while running along a flat
floor for the same reason.

Phaser's own tilemaps do this internally when they calculate faces; a static
group of individual sprites does not, so it is done here.

## Designing for wall jumps

A climbing face needs clear air across the **whole swing**, roughly 25px out
from the wall, not merely the column directly above it. A branch overhanging the
tower by two tiles was enough to catch the cat's head and cap the climb — and it
looked like a broken wall jump rather than a level problem.

## The sneaking passage

The bough on row 17 leaves a one-tile gap above the floor. A standing cat is
18px and does not fit; a sneaking one is 9px and does. It can still be jumped
onto and crossed over the top, which keeps it a choice rather than a wall.

A mandatory sneak needs a ceiling *and* no way over it. Nothing in the format
enforces that — it is a level-design decision.

## Parsing is separate from rendering on purpose

`parseLevel` returns plain coordinates — `solids`, `coins`, `spawn` and the
world size — and knows nothing about Phaser. `GameScene` turns that into sprites
and bodies.

That split means levels can later come from a file, a Tiled export or a
generator without touching physics or rendering: anything that can produce a
`ParsedLevel` works. Keep Phaser imports out of this folder.

## Ground line

`GROUND_ROW` states where the forest floor's surface is, and `parseLevel`
passes it through as `groundLine` for scenery to plant against. It is stated
rather than derived because the sneaking bough is also solid and sits higher, so
scanning the tiles for "the topmost solid" would find the wrong line.

## Falling out of the world

The level has a gap in the floor. `GameScene` sets the physics world **taller**
than the level (`FALL_OUT_MARGIN`) so a missed jump falls into empty space and
respawns, instead of landing on an invisible floor at the bottom of the screen.

A level with a pit therefore needs no special markup — just leave the floor out.
