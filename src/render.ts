import type { Stats } from './github.js';
import type { Mood, Stage } from './pet.js';
import { crop, loadImage, stretch, toPaths } from './pixels.js';

export const WINDOWS = ['hydrangea', 'clover', 'classic'] as const;
export const BACKGROUNDS = ['night', 'dusk', 'sky', 'rose'] as const;
export const SPECIES = ['betta'] as const;

export interface Options {
  species: (typeof SPECIES)[number];
  window: (typeof WINDOWS)[number];
  background: (typeof BACKGROUNDS)[number];
  stage: Stage;
  mood: Mood;
  petName: string;
  stats: Pick<Stats, 'streak' | 'commitsThisMonth'>;
}

/* Per-window text colour and screen position */
const WINDOW_STYLE = {
  hydrangea: { text: '#afbfff', screenTop: 13, statusX: 17 },
  clover: { text: '#33691e', screenTop: 13, statusX: 14 },
  classic: { text: '#a2a8c6', screenTop: 12, statusX: 5 },
};

/* Canvas: 200×170 art pixels, shown at 2× */
const WIDTH = 200;
const HEIGHT = 170;
const SCREEN_BOTTOM = 157;

/* Sprite strips: 64px frames, 0.2s each */
const FRAME = 64;
const FRAME_MS = 200;

/* Escape text for SVG */
const escape = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/* Status bar text */
export function statusText(stats: Options['stats']): string {
  return `Streak: ${stats.streak} · Commits this Month: ${stats.commitsThisMonth}`;
}

/* Build the SVG */
export function renderSvg(opts: Options): string {
  const style = WINDOW_STYLE[opts.window];
  const screen = { x: 1, y: style.screenTop, w: WIDTH - 2, h: SCREEN_BOTTOM - style.screenTop + 1 };
  const centerX = screen.x + screen.w / 2;
  const centerY = screen.y + screen.h / 2;

  /* Background, 3× and centred */
  const bg = loadImage(`backgrounds/${opts.background}`);
  const bgX = Math.round(centerX - bg.width * 1.5);
  const bgY = Math.round(centerY - bg.height * 1.5);

  /* Window frame, stretched to fit */
  const frame = stretch(loadImage(`windows/${opts.window}`), WIDTH, HEIGHT, 30, 40);

  /* Pet frames, 2× and centred */
  const sprite = opts.stage === 'egg' ? 'egg' : `${opts.stage}-${opts.mood}`;
  const strip = loadImage(`${opts.species}/${opts.species}-${sprite}`);
  const count = strip.width / FRAME;
  const frames = Array.from(
    { length: count },
    (_, i) =>
      `<g class="f" style="animation-delay:-${(count - i) * FRAME_MS}ms">${toPaths(crop(strip, i * FRAME, 0, FRAME, FRAME))}</g>`,
  ).join('');
  const petX = Math.round(centerX - FRAME);
  const petY = Math.round(centerY - FRAME);

  /* Animation: show one frame at a time */
  const css =
    `.f{visibility:hidden;animation:play ${count * FRAME_MS}ms steps(1,end) infinite}` +
    `@keyframes play{0%{visibility:visible}${100 / count}%,100%{visibility:hidden}}` +
    `@media (prefers-reduced-motion:reduce){.f{animation:none}.f:first-child{visibility:visible}}` +
    `text{font-family:ui-monospace,Consolas,Menlo,monospace;font-weight:700}`;

  /* Accessible description */
  const status = statusText(opts.stats);
  const about =
    opts.stage === 'egg'
      ? `${opts.petName} is still an egg.`
      : `${opts.petName} the ${opts.species} is a ${opts.mood} ${opts.stage}.`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="340" viewBox="0 0 400 340" role="img" shape-rendering="crispEdges">`,
    `<title>${escape(`${about} ${status}`)}</title>`,
    `<style>${css}</style>`,
    `<clipPath id="screen"><rect x="${screen.x}" y="${screen.y}" width="${screen.w}" height="${screen.h}"/></clipPath>`,
    `<g transform="scale(2)">`,
    `<g clip-path="url(#screen)"><g transform="translate(${bgX} ${bgY}) scale(3)">${toPaths(bg)}</g></g>`,
    toPaths(frame),
    `<g transform="translate(${petX} ${petY}) scale(2)">${frames}</g>`,
    `<text x="28" y="8.5" font-size="7" fill="${style.text}">✦ git-pal.exe</text>`,
    `<text x="${style.statusX}" y="165" font-size="6.5" fill="${style.text}">${escape(status)}</text>`,
    `</g></svg>`,
  ].join('');
}
