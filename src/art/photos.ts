import Phaser from 'phaser';

/**
 * The planets that are NASA photographs (`public/assets/planets`, credits in
 * the `CLAUDE.md` there): each picture's size, px, and the radius of the
 * globe in it, its middle the middle of the picture. Cut to that by a script
 * run once; change a picture and these change with it.
 */
export const PLANET_PHOTOS = {
  earth: { width: 1024, height: 1024, disc: 502 },
  moon: { width: 800, height: 800, disc: 392 },
  venus: { width: 800, height: 800, disc: 392 },
  mars: { width: 800, height: 800, disc: 392 },
  jupiter: { width: 1024, height: 1024, disc: 502 },
  // Flattened at the poles, as Saturn is: between its 221 across and 205 up.
  saturn: { width: 1025, height: 444, disc: 213 },
  uranus: { width: 800, height: 800, disc: 392 },
  neptune: { width: 900, height: 900, disc: 441 },
  pluto: { width: 800, height: 800, disc: 392 },
} as const;

export type PhotoPlanet = keyof typeof PLANET_PHOTOS;

/** The battle station's picture, the player's: its size, px, and its disc. */
export const STATION_PHOTO = { width: 512, height: 512, disc: 251 } as const;

const photoKey = (name: PhotoPlanet): string => `photo-${name}`;

/** In `BootScene.preload`: every photograph, as `photo-<name>`. */
export function loadPlanetPhotos(scene: Phaser.Scene): void {
  for (const name of Object.keys(PLANET_PHOTOS) as PhotoPlanet[]) {
    scene.load.image(photoKey(name), `assets/planets/${name}.jpg`);
  }
  scene.load.image('photo-death-star', 'assets/planets/death-star.jpg');
}

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
export function makePhotoPlanets(scene: Phaser.Scene): void {
  for (const name of Object.keys(PLANET_PHOTOS) as PhotoPlanet[]) {
    if (name === 'uranus') {
      continue;
    }
    const photo = PLANET_PHOTOS[name];
    const canvas = scene.textures.createCanvas(`planet-${name}`, photo.width, photo.height) as Phaser.Textures.CanvasTexture;
    if (name === 'saturn') {
      const source = scene.textures.get(photoKey(name)).getSourceImage() as HTMLImageElement;
      canvas.context.drawImage(source, 0, 0);
      const image = canvas.context.getImageData(0, 0, photo.width, photo.height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const light = Math.max(data[i], data[i + 1], data[i + 2]);
        data[i + 3] = Phaser.Math.Clamp((light - 12) * 6, 0, 255);
      }
      canvas.context.putImageData(image, 0, 0);
      scene.textures.createCanvas('planet-saturn-front', photo.width, photo.height)?.refresh();
    } else {
      drawPhotoGlobe(scene, canvas.context, name, photo.width / 2, photo.height / 2, photo.disc);
    }
    canvas.refresh();
    canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  // The battle station, cut round the same way.
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
