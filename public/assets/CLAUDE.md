# Assets

Static files served as-is from the site root: `public/assets/player.png` is
fetched as `/assets/player.png`.

**This folder is empty on purpose.** All current art is generated at runtime by
`BootScene` (see `src/scenes/CLAUDE.md`), so the project has no binary files to
manage and runs straight after clone. The placeholder look — flat rectangles,
and a highlight stripe on every ground tile rather than only the top one — is
expected, not a bug to fix in code.

## Replacing placeholders with real art

1. Drop the file here.
2. Load it in `BootScene.preload()` under the **same texture key** the
   placeholder used (`cat`, `cat-crouch`, `ground-top`, `ground-fill`,
   `branch-*`, `bough`, `berry`, `tree-*`, `bush`, `grass-tuft`, `sun`, `sky`,
   `ui-*`).
3. Delete the matching generator in `src/art`.

Nothing else changes: the rest of the game only ever refers to textures by key.

## Keep phones in mind

This is a target platform, not an afterthought. Assets are downloaded over
mobile data and decoded on a mobile GPU:

- Prefer a packed spritesheet or atlas over many single files.
- The game renders at a fixed 640x360 and is scaled up, so art should be authored
  at that scale. The cat is 22x18 pixels; shipping 4K sprites wastes memory and
  buys nothing.
- A texture that collides should be baked at exactly its collision size -- see
  `src/art/CLAUDE.md`.
- `pixelArt: true` in `src/main.ts` disables smoothing. Art that is not pixel art
  will look harsh until that is turned off.
