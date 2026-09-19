# Art

Every texture in the game is drawn here in code at boot, so the project has no
binary assets and runs straight after clone.

- `canvas.ts` — `bakeTexture` (draw once, register under a key) and
  `createRandom` (seeded scatter).
- `cat.ts` — the cat, standing and sneaking.
- `forest.ts` — sky, sun, trees, bushes, grass, ground, rock, branches, berries.
- `ui.ts` — the touch-button glyphs.
- `index.ts` — `generatePlaceholderArt`, called once by `BootScene`.

## The rules that keep this swappable

**Nothing outside this folder names a colour or a shape — only a texture key.**
That is what makes real art a drop-in: load a file under the same key in
`BootScene.preload()` and delete the generator. Sizes that gameplay genuinely
needs (`BRANCH_THICKNESS`, `TREE_SIZES`, `BUTTON_SIZE`) are exported as
constants rather than repeated as literals.

**Scatter must be seeded.** `createRandom` is used instead of `Math.random` so
the forest does not rearrange itself on every hot reload and on every player's
device. A fixed seed per layer keeps placement stable and still scattered.

**A texture is baked at exactly the size of the thing it collides with.** A
branch texture is only as tall as its wood (`BRANCH_THICKNESS`), and each cat
pose is exactly its physics body, so no sprite/body offset juggling is needed
anywhere. Decoration that must not collide -- the leaves under a branch -- is a
separate texture added as a separate, bodiless sprite.

**Keep shapes chunky.** The cat is 22x18 game pixels. Detail finer than two or
three pixels turns to mush once `Scale.FIT` blows the canvas up to a laptop
screen, and `pixelArt: true` means no smoothing will hide it.

## Palette

All colours come from `COLORS` in `src/config.ts`, so the placeholder art
already reads as one scene and real art has a reference to match. Distant trees
are deliberately lighter and bluer than near ones: losing contrast with distance
is what sells depth.
