import { expect, test } from 'vitest';
import { moodFor, stageFor } from '../src/pet.js';

test('stage grows with contributions', () => {
  expect(stageFor(0)).toBe('egg');
  expect(stageFor(10)).toBe('egg');
  expect(stageFor(11)).toBe('baby');
  expect(stageFor(200)).toBe('baby');
  expect(stageFor(201)).toBe('teen');
  expect(stageFor(499)).toBe('teen');
  expect(stageFor(500)).toBe('adult');
});

test('mood drops with quiet days', () => {
  expect(moodFor(0)).toBe('happy');
  expect(moodFor(7)).toBe('happy');
  expect(moodFor(8)).toBe('normal');
  expect(moodFor(20)).toBe('normal');
  expect(moodFor(21)).toBe('sleepy');
  expect(moodFor(null)).toBe('sleepy');
});
