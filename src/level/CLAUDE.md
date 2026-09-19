# Level

Level data and the parser that turns it into world coordinates.

## Format

`LEVEL_SOURCE` is an array of strings, one per row of tiles:

| Char | Meaning |
| --- | --- |
| `#` | solid ground |
| `o` | coin |
| `P` | player spawn (exactly one) |
| `.` | empty |

Rows may be written **short** — `parseLevel` pads them to
`LEVEL_WIDTH_IN_TILES` with empty tiles, so only the interesting left-hand part
of a row needs typing. Long runs use `'#'.repeat(n)` rather than hand-counted
characters, because miscounting a row by one is invisible in review and
maddening to debug.

A tile is `TILE` (16) game pixels, from `src/config.ts`.

## Parsing is separate from rendering on purpose

`parseLevel` returns plain coordinates — `solids`, `coins`, `spawn` and the
world size — and knows nothing about Phaser. `GameScene` turns that into sprites
and bodies.

That split means levels can later come from a file, a Tiled export or a
generator without touching physics or rendering: anything that can produce a
`ParsedLevel` works. Keep Phaser imports out of this folder.

## Falling out of the world

The level has a gap in the floor. `GameScene` sets the physics world **taller**
than the level (`FALL_OUT_MARGIN`) so a missed jump falls into empty space and
respawns, instead of landing on an invisible floor at the bottom of the screen.

A level with a pit therefore needs no special markup — just leave the floor out.
