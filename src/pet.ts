export type Stage = 'egg' | 'baby' | 'teen' | 'adult';
export type Mood = 'happy' | 'normal' | 'sleepy';

/* Total contributions → stage */
export function stageFor(total: number): Stage {
  if (total >= 500) return 'adult';
  if (total >= 201) return 'teen';
  if (total >= 11) return 'baby';
  return 'egg';
}

/* Days since last contribution → mood */
export function moodFor(daysSinceLast: number | null): Mood {
  if (daysSinceLast === null || daysSinceLast >= 21) return 'sleepy';
  if (daysSinceLast >= 8) return 'normal';
  return 'happy';
}
