# Art

Every texture in the game is drawn here in code at boot, so the project has no
binary assets and runs straight after clone.

- `canvas.ts` — `bakeTexture` (draw once, register under a key) and
  `createRandom` (seeded scatter).
- `cat.ts` — the cat, standing and sneaking.
- `tiles.ts` — every level tile, drawn from a palette so three themes share one
  set of shapes. Keys are namespaced: `cave:rock-fill`.
- `forest.ts` — the forest's own scenery: sky, sun, trees, bushes, grass. And
  the minnow, which is the same everywhere.
- `backdrops.ts` — cave and city scenery: stalactites, crystals, skylines, moon.
- `creatures.ts` — hedgehog, piranha, crow.
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

## Gradients have to be drawn by hand

`fillVerticalGradient` paints a stack of bands instead of calling
`fillGradientStyle`. That call renders correctly to the screen but bakes to a
**fully transparent texture** through `generateTexture`, so a sky made with it
is invisible and what shows is the canvas clear colour behind it.

This hid itself for a long time: the clear colour was a perfectly reasonable
sky blue, so the forest looked fine and nobody looked twice. It only surfaced
when the cave's sky was supposed to be nearly black and came out blue.

## A nest is drawn in two halves

`nest` goes behind the cat and `nest-front` over it, with the ledge it stands on
set partway down the tile (`NEST_SIT_DEPTH` in the level parser). That is what
puts the cat *in* a nest rather than on top of one — sitting on top looks like
standing on a hat.

A spare heart sitting in the nest with it is drawn in front of the near rim, or
it would be buried in the straw.
