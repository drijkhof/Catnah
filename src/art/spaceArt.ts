import Phaser from 'phaser';
import { PLANET_PHOTOS, photoKey, type PhotoPlanet } from './photos';
import { BAKED_KEYS, composeSpace, generateSpaceHeavy } from './space';
import { timed } from '../timing';

/**
 * Space's pictures are not needed until space: the title and the Earth's
 * levels never show them. So they are not loaded at boot, where a phone on
 * a slow connection waited seconds for them before the title came up.
 *
 * - **The photographs** (`photos/*.jpg`) and **the baked pictures**
 *   (`baked/*.png`, made at build time by `npm run bake` from
 *   `generateSpaceHeavy`) are imported as URLs, so the build gives each a
 *   content hash in its name: a changed picture is a new file, and the
 *   service worker's cache-first can never serve an old one.
 * - `prefetchSpace` fetches and decodes them in the background once the
 *   title is up, into memory only.
 * - A scene that needs them calls `queueSpaceFiles` in its `preload`: what
 *   was prefetched goes straight into the textures, anything still on its
 *   way is loaded by the scene's own loader (from the browser's cache when
 *   the prefetch got it), and the scene starts once all of it is in.
 * - Then `finishSpace` in its `create`: the planets cut from their photos
 *   (cheap) and, only where a baked file is missing -- a dev server that
 *   has not baked -- the heavy pictures worked out on the spot.
 */
const photoUrls = import.meta.glob('./photos/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const bakedUrls = import.meta.glob('./baked/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const fileName = (path: string): string => path.split('/').pop()?.replace(/\.\w+$/, '') ?? path;

/** Every file space needs: its texture key and its URL. Baked files only where the build made them. */
function spaceFiles(): Array<{ key: string; url: string }> {
  const files: Array<{ key: string; url: string }> = [];
  for (const [path, url] of Object.entries(photoUrls)) {
    const name = fileName(path);
    if (name === 'death-star' || name in PLANET_PHOTOS) {
      files.push({ key: photoKey(name as PhotoPlanet | 'death-star'), url });
    }
  }
  const baked = new Set<string>(BAKED_KEYS);
  for (const [path, url] of Object.entries(bakedUrls)) {
    const key = fileName(path);
    if (baked.has(key)) {
      files.push({ key, url });
    }
  }
  return files;
}

/** Baked pictures already set to smooth filtering. */
const smoothed = new Set<string>();

/** Pictures fetched and decoded by `prefetchSpace`, waiting to be made textures. */
const fetched = new Map<string, HTMLImageElement>();
let prefetching = false;

/**
 * Fetches and decodes every space file in the background, one after the
 * other so it never competes with anything the game is loading. Into
 * memory only: a scene that needs them makes them textures.
 */
export function prefetchSpace(): void {
  if (prefetching) {
    return;
  }
  prefetching = true;
  const files = spaceFiles();
  const next = (i: number): void => {
    const file = files[i];
    if (!file) {
      return;
    }
    const image = new Image();
    image.src = file.url;
    image
      .decode()
      .then(() => fetched.set(file.key, image))
      .catch(() => undefined)
      .finally(() => next(i + 1));
  };
  next(0);
}

/**
 * In a scene's `preload`: every space file not yet a texture -- straight
 * from the prefetch when it has it, else onto the scene's loader.
 */
export function queueSpaceFiles(scene: Phaser.Scene): void {
  for (const { key, url } of spaceFiles()) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const image = fetched.get(key);
    if (image) {
      scene.textures.addImage(key, image);
    } else {
      scene.load.image(key, url);
    }
  }
}

/**
 * In a scene's `create`, once its files are in: everything else space shows
 * -- or with `only`, just the planets named (a level's sky), since each made
 * is a picture to draw and send to the graphics card.
 */
export function finishSpace(scene: Phaser.Scene, only?: readonly string[]): void {
  timed('space-heavy', () => generateSpaceHeavy(scene));
  // Smooth, not pixelated -- once each: setting a filter sends the picture
  // to the graphics card again, which cost a level a fifth of a second.
  for (const key of BAKED_KEYS) {
    if (!smoothed.has(key)) {
      smoothed.add(key);
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }
  timed('space-compose', () => composeSpace(scene, only));
}
