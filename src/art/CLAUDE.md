# Art

Every texture in the game is drawn here in code at boot, so the project has no
binary assets but the portal picture and runs straight after clone.

- `canvas.ts` — `bakeTexture` (draw once, register under a key) and
  `createRandom` (seeded scatter).
- `cat.ts` — the cat: standing, sneaking, climbing, swimming, and the walk,
  climb and swim animation cycles built from them.
- `tiles.ts` — every level tile, drawn from a palette so three themes share one
  set of shapes. Keys are namespaced: `cave:rock-fill`. Ground and rock tiles
  come in `TILE_VARIANTS` drawings (`ground-top`, `ground-top-1`, ...), and
  `grass-fringe*` / `grass-droop` are the turf that stands above and hangs
  over them, placed by `GameScene.dressGround`.
- `forest.ts` — the forest's own scenery: sky, sun, trees, bushes, grass. And
  the little heart, which is the same everywhere.
- `backdrops.ts` — cave, swamp and volcano scenery: stalactites, crystals, cones.
- `creatures.ts` — hedgehog, piranha, crow.
- `ui.ts` — the touch-button glyphs.
- `portal.ts` — the way out of a level. The portal is a picture,
  `public/assets/portal.png`, the one real asset; `shadePortal` copies it to
  a canvas texture at boot with the alpha fading out towards the rim, and the
  scene spins that, which works because it is round.
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

**A picture need not be a tile.** Collision is per 16px cell; what is drawn
over it can be any size. `bakeBoulder`, `bakeTrunk` and `bakeBranch` each
draw a whole cluster, column or run of cells as one thing, baked on demand
at the size the level asks for and cached by key (`GameScene.buildBoulders`,
`buildWholeTrunks` and `buildBranches` find them and hide the per-cell tile
sprites, which go on colliding). The canopy is one seamless strip in a
tiling sprite. When a thing looks like a grid, that is the drawing's fault,
not the level's.

`bakeRockMass` (`stone.ts`) draws a cave's ground as fractured rock: seeds
scattered through the ground, every pixel assigned to its nearest seed (a
Voronoi split, bucketed by cell, typed arrays, squared distances), a fissure
where two fragments meet, a bevel toward the light, and an outline made by
each seed's own reach into the air. Pixel work, into canvas textures of 512
square, only over cells that are ground or touch ground; the scene places
them and the bake flattens them. Textures outlive the scene, so it removes
a stale piece before baking over it -- a level restart hit "texture key
already in use" before that. Earlier versions were stones set in mortar,
first clipped from a periodic wall, then packed as rectangles; both read as
masonry, and the ask was rock.

`bakeBranch` returns the wood's thickness under each cell so the leaves can
hang from the real underside; the flat top is the collision surface and is
never tapered.

**Corners are canvas textures, not Graphics.** `corners.ts` rounds a ground
tile's exposed corners and draws the inner-corner fillets pixel by pixel into
a `CanvasTexture`, because a `Graphics` object can paint but never erase, and
a crisp transparent corner needs erasing. Its bands are a pixel or two wide
on purpose: at six pixels of radius a fillet with two-pixel bands had no
earth left in it at all and vanished into the grass.

**A texture is baked at exactly the size of the thing it collides with.** A
branch texture is only as tall as its wood (`BRANCH_THICKNESS`), and each cat
pose is exactly its physics body, so no sprite/body offset juggling is needed
anywhere. Decoration that must not collide -- the leaves under a branch -- is a
separate texture added as a separate, bodiless sprite.

**Keep shapes chunky.** The cat is 22x18 game pixels. Detail finer than two or
three pixels turns to mush once `Scale.FIT` blows the canvas up to a laptop
screen, and `pixelArt: true` means no smoothing will hide it.

## Animations are just several textures, cycled

`cat.ts`'s `createCatAnimations` registers the cat's walk, climb-shuffle and
swim cycles with `scene.anims.create`, and every frame in them is a whole
separate baked texture (`{ key: 'cat-walk-a' }`) rather than a region of a
spritesheet. Phaser does not mind: each baked texture is implicitly its own
frame 0, and an `AnimationFrameConfig`'s `key` can point at any texture at
all, so multiple independent single-frame textures cycle exactly like slices
of a sheet would. Baking one file per pose is already how everything else
here works, and a walk cycle is only two or three more poses, not a new way of
drawing.

Called once, right after `generateCatTextures`, since an animation is
registered on the game the same way a texture is -- see
`objects/CLAUDE.md`'s "Walking, climbing and swimming loop" for how `Player`
decides when one plays.

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

## The checkpoint star is baked pale, then tinted at runtime

`checkpoint-gold` and `checkpoint-blue` in `forest.ts` are the same star drawn
in two near-white shades rather than in gold and blue outright, because
`setTint` **multiplies** a texture's colour rather than replacing it -- a pure
white body times a tint comes out exactly that tint, so the shading baked into
the star (a dim body, a bright core) survives being dyed.

They are still two separate textures rather than one tinted at two different
moments, because `GameScene` shows both at once and crossfades the top one's
alpha for the shimmer -- one texture animated by tint alone read as a slow
strobe, not a shimmer, when this was tried first.

## Two leaf masses that ignore the grid

`foliage-back` and `foliage-near` are the only scenery deliberately sized so no
tile boundary lines up with them: 64 and 28 pixels wide against a 16px grid.
That is the whole trick. The shapes inside a tile can be as round as you like
and the level still reads as blocks, because every edge falls on the same
sixteen pixels; something straddling four tiles is what breaks it.

The back one is **overdone on purpose**. One clump per tile is a row of shrubs;
two or three overlapping, each four tiles wide and scaled up to nearly twice
that, are one canopy with a tree standing in front of it.

Every clump is positioned **from a branch or from the crown**, never from the
trunk. That is where a real tree carries its leaves; clumps planted down a trunk
give you a hedge with a tree in it. Plenty still ends up behind the trunk
anyway, because a clump is four tiles wide and the branches grow out of the
trunk — the difference is leaves that spill over the wood rather than leaves
that follow it to the ground.

The back one is drawn from a **darkened** palette leaf rather than from a
`leafDark` of its own. It is the shadowed inside of a canopy, and deriving it
means six themes cannot drift apart by hand.

`foliage-near` is 13 pixels tall against a standing cat's 18, and that number is
the design: a cat behind one is hidden to the shoulders with its ears and tail
still showing. Taller and you lose the cat; shorter and there is nothing to hide
behind. `GameScene.buildFoliage` places both.

## The liana is baked once per theme, not switched by `columnStyle`

Every other column shape (trunk, rope, chain) is one texture per theme,
picked by that theme's `columnStyle`. The liana is not: it is baked
unconditionally, always from its own shape, because a level can have `T` trees
and `V` lianas standing side by side and each needs to look like what it is
regardless of what the other one is doing in that same theme. Its colours
still come from the palette, so a jungle liana and a swamp liana are not
identical, only the same shape.

## A theme's `trunk`/`trunkDark`/`trunkLight` are always bark now

They used to double as the liana's stem colour in jungle and swamp, back when
`T` was the liana there. Now that `T` is always a real tree and `V` draws its
own liana regardless of palette, those three fields mean one thing in every
theme: bark. Jungle and swamp share their `branch`/`branchDark` wood tone for
this, the same way a trunk growing the branches it carries should.

The liana's stem still reads from these same fields (`drawLiana` in
`tiles.ts`), so it comes out a woody brown rather than the bright green it
used to be. Kept rather than given the liana its own colour fields: the leaf
blobs along it are still green and still what tells a liana apart from a bare
trunk at a glance, and a vine with a woody stem is a real thing.

## The dead vine shares the liana's stem, not its leaves

`drawVineStem` is the part both `V` and `v` are made of; `drawLiana` adds
leaves on top of it, and the dead vine's `dead-vine` texture does not. One
function extracted once, rather than two textures drawn independently, so the
two can never quietly drift apart in what the bare stem looks like.
