import Phaser from 'phaser';

/**
 * The planets that are NASA photographs (`src/art/photos`, credits in
 * `src/art/CLAUDE.md`): each picture's size, px, and the radius of the
 * globe in it, its middle the middle of the picture. Cut to that by a script
 * run once, each about one and a half times the most it is ever shown at
 * (the canvas is 640 by 360, so more pixels than that are never seen, and
 * scaled down by the GPU they only shimmer); change a picture and these
 * change with it. They are loaded when
 * space is near, not at boot: see `spaceArt.ts`.
 */
export const PLANET_PHOTOS = {
  earth: { width: 448, height: 448, disc: 220 },
  moon: { width: 192, height: 192, disc: 94 },
  venus: { width: 256, height: 256, disc: 125 },
  mars: { width: 192, height: 192, disc: 94 },
  jupiter: { width: 576, height: 576, disc: 282 },
  // Flattened at the poles, as Saturn is: between its 221 across and 205 up.
  saturn: { width: 1025, height: 444, disc: 213 },
  uranus: { width: 400, height: 400, disc: 196 },
  neptune: { width: 384, height: 384, disc: 188 },
  pluto: { width: 192, height: 192, disc: 94 },
  // Moons, for the skies of the worlds they go round. Phobos and Deimos are
  // not round: cut out by how dark the black round them is, like Saturn.
  phobos: { width: 96, height: 96, disc: 45 },
  deimos: { width: 96, height: 96, disc: 43 },
  io: { width: 96, height: 96, disc: 47 },
  europa: { width: 96, height: 96, disc: 47 },
  charon: { width: 96, height: 96, disc: 47 },
} as const;

/** The photographs cut out by how dark the space round them is, rather than round. */
const CUT_BY_DARK: readonly PhotoPlanet[] = ['saturn', 'phobos', 'deimos'];

export type PhotoPlanet = keyof typeof PLANET_PHOTOS;

/** The battle station's picture, the player's: its size, px, and its disc. */
export const STATION_PHOTO = { width: 256, height: 256, disc: 125 } as const;

/** The texture a photograph is loaded as. */
export const photoKey = (name: PhotoPlanet | 'death-star'): string => `photo-${name}`;

/**
 * Draws a photograph's globe, cut out round, into `context` at (x, y), its
 * disc `disc` px. Photographs are smooth, so the texture they end up in is
 * filtered `LINEAR`: under nearest-neighbour a turning or scaled photo
 * shimmers.
 */
export function drawPhotoGlobe(scene: Phaser.Scene, context: CanvasRenderingContext2D, name: PhotoPlanet, x: number, y: number, disc: number): void {
  const photo = PLANET_PHOTOS[name];
  const source = scene.textures.get(photoKey(name)).getSourceImage() as HTMLImageElement;
  const k = disc / photo.disc;
  context.save();
  context.beginPath();
  context.arc(x, y, disc, 0, Math.PI * 2);
  context.clip();
  context.drawImage(source, x - (photo.width / 2) * k, y - (photo.height / 2) * k, photo.width * k, photo.height * k);
  context.restore();
}

/**
 * `planet-<name>` for every photographed planet but Uranus, whose rings are
 * drawn and which `generateUranus` puts together itself. A globe is the
 * photograph cut round; Saturn keeps its rings, the black of space made
 * clear by how dark it is, and its `-front` texture is empty -- the rings in
 * front of the globe are already in the picture.
 */
export function makePhotoPlanets(scene: Phaser.Scene, only?: readonly string[]): void {
  for (const name of Object.keys(PLANET_PHOTOS) as PhotoPlanet[]) {
    if (name === 'uranus' || scene.textures.exists(`planet-${name}`) || (only && !only.includes(name))) {
      continue;
    }
    const photo = PLANET_PHOTOS[name];
    const canvas = scene.textures.createCanvas(`planet-${name}`, photo.width, photo.height) as Phaser.Textures.CanvasTexture;
    if (CUT_BY_DARK.includes(name)) {
      const source = scene.textures.get(photoKey(name)).getSourceImage() as HTMLImageElement;
      canvas.context.drawImage(source, 0, 0);
      const image = canvas.context.getImageData(0, 0, photo.width, photo.height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const light = Math.max(data[i], data[i + 1], data[i + 2]);
        data[i + 3] = Phaser.Math.Clamp((light - 12) * 6, 0, 255);
      }
      canvas.context.putImageData(image, 0, 0);
      if (name === 'saturn') {
        scene.textures.createCanvas('planet-saturn-front', photo.width, photo.height)?.refresh();
      }
    } else {
      drawPhotoGlobe(scene, canvas.context, name, photo.width / 2, photo.height / 2, photo.disc);
    }
    canvas.refresh();
    canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  // The battle station, cut round the same way.
  if (scene.textures.exists('battle-station') || only) {
    return;
  }
  const station = scene.textures.createCanvas('battle-station', STATION_PHOTO.width, STATION_PHOTO.height) as Phaser.Textures.CanvasTexture;
  const source = scene.textures.get('photo-death-star').getSourceImage() as HTMLImageElement;
  station.context.save();
  station.context.beginPath();
  station.context.arc(STATION_PHOTO.width / 2, STATION_PHOTO.height / 2, STATION_PHOTO.disc, 0, Math.PI * 2);
  station.context.clip();
  station.context.drawImage(source, 0, 0);
  station.context.restore();
  station.refresh();
  station.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
