/* Renders every look into preview/ for checking by eye */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import type { Mood, Stage } from '../src/pet.js';
import { BACKGROUNDS, renderSvg, WINDOWS } from '../src/render.js';

const looks: [Stage, Mood][] = [
  ['egg', 'happy'],
  ...(['baby', 'teen', 'adult'] as const).flatMap((stage) =>
    (['happy', 'normal', 'sleepy'] as const).map((mood): [Stage, Mood] => [stage, mood]),
  ),
];
const stats = { streak: 12, commitsThisMonth: 34 };
const images: string[] = [];

/* Start from an empty folder */
rmSync('preview', { recursive: true, force: true });
mkdirSync('preview');
for (const [stage, mood] of looks) {
  for (const window of WINDOWS) {
    for (const background of BACKGROUNDS) {
      const name = `${stage}-${mood}-${window}-${background}.svg`;
      const svg = renderSvg({
        species: 'betta',
        window,
        background,
        stage,
        mood,
        petName: 'Pal',
        stats,
      });
      writeFileSync(`preview/${name}`, svg);
      images.push(`<img src="${name}" title="${name}">`);
    }
  }
}
writeFileSync('preview/index.html', `<body style="background:#eee">${images.join('')}</body>`);

/* README demo image */
writeFileSync(
  'docs/demo.svg',
  renderSvg({
    species: 'betta',
    window: 'hydrangea',
    background: 'night',
    stage: 'adult',
    mood: 'happy',
    petName: 'Pal',
    stats,
  }),
);
console.log(`Wrote ${images.length} previews`);
