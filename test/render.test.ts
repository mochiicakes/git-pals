import { expect, test } from 'vitest';
import { renderSvg, statusText, type Options } from '../src/render.js';

const pal: Options = {
  species: 'betta',
  window: 'hydrangea',
  background: 'night',
  stage: 'adult',
  mood: 'happy',
  petName: 'Pal',
  stats: { streak: 12, commitsThisMonth: 34 },
};

test('matches the saved images', async () => {
  await expect(renderSvg(pal)).toMatchFileSnapshot('__snapshots__/adult-happy.svg');
  await expect(renderSvg({ ...pal, stage: 'egg', window: 'classic' })).toMatchFileSnapshot(
    '__snapshots__/egg-classic.svg',
  );
  await expect(
    renderSvg({ ...pal, stage: 'teen', mood: 'sleepy', window: 'clover', background: 'rose' }),
  ).toMatchFileSnapshot('__snapshots__/teen-sleepy-clover.svg');
});

test('six animation frames', () => {
  expect(renderSvg(pal).match(/class="f"/g)).toHaveLength(6);
});

test('no scripts or links', () => {
  expect(renderSvg(pal)).not.toMatch(/<script|href=|on\w+=/);
});

test('pet name is escaped', () => {
  expect(renderSvg({ ...pal, petName: '<b>' })).not.toContain('<b>');
});

test('status bar text', () => {
  expect(statusText({ streak: 3, commitsThisMonth: 41 })).toBe(
    'Streak: 3 · Commits this Month: 41',
  );
});
