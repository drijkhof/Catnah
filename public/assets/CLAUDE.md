# Assets

Static files served as-is from the site root: `public/assets/player.png` is
fetched as `/assets/player.png`.

**Nearly everything is drawn at runtime** by `BootScene` (see
`src/scenes/CLAUDE.md`), so the project has almost no binary files to manage
and runs straight after clone. The look is described in `work.md` under *The
look*; it is drawn, not placeholder, but every drawing is still one function
that a file can replace.

The one file so far is `portal.png`: the level exit, a 78px picture of a
blue spiral with transparent corners, shown at 32px and spun by `GameScene`.
It is loaded as `exit-source`; `shadePortal` in `src/art/portal.ts` makes
the `exit` texture from it with the rim faded out. That is the one texture
given `LINEAR` filtering, because a photo-like image turning under
nearest-neighbour sampling shimmers.

## Replacing placeholders with real art

1. Drop the file here.
2. Load it in `BootScene.preload()` under the **same texture key** the
   placeholder used (`cat`, `cat-sneak`, `ground-top`, `ground-fill`,
   `branch-*`, `bough`, `little heart`, `tree-*`, `bush`, `grass-tuft`, `sun`, `sky`,
   `ui-*`; `exit` is already a file — see above).
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

## The planets are NASA photographs

`planets/<name>.jpg`: each a NASA image (public domain), cropped square
round its globe -- Saturn round its rings -- with a 2% margin, made smaller,
and saved as JPEG; `src/art/photos.ts` has each one's size and the radius
of its globe, and cuts it round at boot. Change a picture and change those
numbers with it -- **and give it a new file name**: these files have no
content hash, and the service worker serves everything but the page
cache-first, so an installed game would keep the old picture for ever.

| Planet | Image | Taken by |
| --- | --- | --- |
| earth | GSFC_20171208_Archive_e000676, Africa and Europe | DSCOVR / EPIC |
| moon | GSFC_20171208_Archive_e000868, the full Moon | Lunar Reconnaissance Orbiter |
| venus | PIA23791, the right-hand (enhanced) half | Mariner 10 |
| mars | GSFC_20171208_Archive_e000332 | Hubble |
| jupiter | PIA02873 | Cassini |
| saturn | Hubble 2019, STScI-01EVSV8C626ZM3EHGH96SVQPN0, 2000px rendition | Hubble (NASA, ESA, A. Simon, M.H. Wong, OPAL) |
| uranus | PIA00032, the true-colour half; colour boosted 1.8x, red 0.88 | Voyager 2 |
| neptune | PIA01492 | Voyager 2 |
| pluto | PIA19952 | New Horizons |

`death-star.jpg` is not NASA's: a picture of the battle station the player gave, cut round the same way (`STATION_PHOTO`).

All from images-api.nasa.gov but Saturn, from science.nasa.gov/asset/hubble/saturn-2019.
The globe was found by its bright area (its centroid and its area), or for
a globe with a dark limb or a phase -- Venus, Mars, Neptune -- by its
bounding box; Saturn's by the widest row of the globe between the rings.
