import Phaser from 'phaser';

/**
 * Smooth value noise, 0 to 1, seeded; `period` wraps it sideways, so noise
 * laid round a circle meets itself with no seam.
 */
export function makeNoise(seed: number): (x: number, y: number, period?: number) => number {
  const hash = (ix: number, iy: number): number => {
    let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  return (x, y, period) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const wrap = (ix: number): number => (period ? ((ix % period) + period) % period : ix);
    const a = hash(wrap(x0), y0);
    const b = hash(wrap(x0 + 1), y0);
    const c = hash(wrap(x0), y0 + 1);
    const d = hash(wrap(x0 + 1), y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

/** Several octaves of it, each finer and fainter, 0 to 1. */
export function fbm(noise: ReturnType<typeof makeNoise>, x: number, y: number, octaves: number, period?: number): number {
  let sum = 0;
  let weight = 0.5;
  let total = 0;
  let scale = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += noise(x * scale, y * scale, period ? period * scale : undefined) * weight;
    total += weight;
    weight *= 0.5;
    scale *= 2;
  }
  return sum / total;
}

/**
 * A texture worked out pixel by pixel: `pixel` gets each one's offset from
 * the middle and gives its colour and alpha, or nothing for clear.
 */
export function paint(
  scene: Phaser.Scene,
  key: string,
  size: number,
  pixel: (x: number, y: number) => [number, number, number, number] | undefined,
): Phaser.Textures.CanvasTexture {
  const canvas = scene.textures.createCanvas(key, size, size) as Phaser.Textures.CanvasTexture;
  const image = canvas.context.createImageData(size, size);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const colour = pixel(px + 0.5 - size / 2, py + 0.5 - size / 2);
      if (colour) {
        image.data.set(colour, (py * size + px) * 4);
      }
    }
  }
  canvas.context.putImageData(image, 0, 0);
  canvas.refresh();
  return canvas;
}
