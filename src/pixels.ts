import { PNG } from 'pngjs';
import { ASSETS } from './assets.js';

/* RGBA image */
export interface Image {
  width: number;
  height: number;
  data: Uint8Array;
}

/* Load a bundled PNG */
export function loadImage(name: string): Image {
  const base64 = ASSETS[name];
  if (!base64) throw new Error(`Missing art: assets/${name}.png`);
  const png = PNG.sync.read(Buffer.from(base64, 'base64'));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

/* Cut a part out of an image */
export function crop(img: Image, left: number, top: number, width: number, height: number): Image {
  const out = { width, height, data: new Uint8Array(width * height * 4) };
  for (let y = 0; y < height; y++) {
    const start = ((top + y) * img.width + left) * 4;
    out.data.set(img.data.subarray(start, start + width * 4), y * width * 4);
  }
  return out;
}

/* Grow an image by repeating one column and one row */
export function stretch(
  img: Image,
  width: number,
  height: number,
  col: number,
  row: number,
): Image {
  const out = { width, height, data: new Uint8Array(width * height * 4) };
  for (let y = 0; y < height; y++) {
    const sy = y <= row ? y : Math.max(row, y - (height - img.height));
    for (let x = 0; x < width; x++) {
      const sx = x <= col ? x : Math.max(col, x - (width - img.width));
      const from = (sy * img.width + sx) * 4;
      out.data.set(img.data.subarray(from, from + 4), (y * width + x) * 4);
    }
  }
  return out;
}

/* Colour of one pixel, or null if transparent */
export function colorAt(img: Image, x: number, y: number): string | null {
  const i = (y * img.width + x) * 4;
  if (img.data[i + 3] === 0) return null;
  return (
    '#' + [...img.data.subarray(i, i + 3)].map((n) => n.toString(16).padStart(2, '0')).join('')
  );
}

/* Image → SVG paths, one per colour */
export function toPaths(img: Image): string {
  const byColor = new Map<string, string>();
  for (let y = 0; y < img.height; y++) {
    let x = 0;
    while (x < img.width) {
      const color = colorAt(img, x, y);
      let end = x + 1;
      while (end < img.width && colorAt(img, end, y) === color) end++;
      if (color) byColor.set(color, (byColor.get(color) ?? '') + `M${x} ${y}h${end - x}v1H${x}z`);
      x = end;
    }
  }
  return [...byColor].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join('');
}
