import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { daysSinceLast, fetchStats, streakOf, type Day } from '../src/github.js';

/* Days ending on `last`, one count each */
function days(last: string, counts: number[]): Day[] {
  return counts.map((contributionCount, i) => {
    const date = new Date(Date.parse(last) - (counts.length - 1 - i) * 86_400_000);
    return { date: date.toISOString().slice(0, 10), contributionCount };
  });
}

/* Fake API that replays recorded responses */
function fakeApi(...files: string[]) {
  const fetch = vi.fn(
    async () => new Response(readFileSync(`test/fixtures/${files.shift()}.json`)),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

test('streak counts back from today', () => {
  expect(streakOf(days('2026-05-10', [0, 1, 1, 2]), '2026-05-10')).toBe(3);
});

test('streak survives a quiet today', () => {
  expect(streakOf(days('2026-05-10', [0, 1, 1, 0]), '2026-05-10')).toBe(2);
});

test('streak crosses month, year and leap-day edges', () => {
  expect(streakOf(days('2026-05-02', [1, 1, 1]), '2026-05-02')).toBe(3);
  expect(streakOf(days('2027-01-02', [1, 1, 1]), '2027-01-02')).toBe(3);
  expect(streakOf(days('2028-03-01', [1, 1, 1]), '2028-03-01')).toBe(3);
});

test('days since last contribution', () => {
  expect(daysSinceLast(days('2026-01-03', [1, 0, 0, 0]), '2026-01-03')).toBe(3);
  expect(daysSinceLast(days('2026-01-03', [0, 0]), '2026-01-03')).toBeNull();
});

test('stats from recorded API responses', async () => {
  const fetch = fakeApi('years', 'activity');
  const stats = await fetchStats(
    'fake-token',
    'mochiicakes',
    false,
    new Date('2026-03-02T12:00:00Z'),
  );

  expect(stats).toEqual({ total: 500, streak: 4, daysSinceLast: 1, commitsThisMonth: 4 });

  /* Month counts from the 1st */
  const [, second] = fetch.mock.calls[1] as unknown as [string, RequestInit];
  expect(JSON.parse(second.body as string).variables.monthStart).toBe('2026-03-01T00:00:00Z');
  for (const [, init] of fetch.mock.calls as unknown as [string, RequestInit][]) {
    expect(init.body).not.toContain('fake-token');
  }
});

test('private counts only when opted in', async () => {
  fakeApi('years', 'activity');
  const stats = await fetchStats(
    'fake-token',
    'mochiicakes',
    true,
    new Date('2026-03-02T12:00:00Z'),
  );
  expect(stats.total).toBe(532);
});

test('unknown user', async () => {
  vi.stubGlobal('fetch', async () => Response.json({ data: { user: null } }));
  await expect(fetchStats('fake-token', 'nobody', false)).rejects.toThrow('"nobody" not found');
});
