export interface Day {
  date: string;
  contributionCount: number;
}

export interface Stats {
  total: number;
  streak: number;
  daysSinceLast: number | null;
  commitsThisMonth: number;
}

const DAY_MS = 86_400_000;

/* Date string → day number */
const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);

/* Streak: consecutive active days, today may still be empty */
export function streakOf(days: Day[], today: string): number {
  const active = new Set(days.filter((d) => d.contributionCount > 0).map((d) => dayNumber(d.date)));
  let day = dayNumber(today);
  if (!active.has(day)) day--;
  let streak = 0;
  while (active.has(day)) {
    streak++;
    day--;
  }
  return streak;
}

/* Days since the last active day */
export function daysSinceLast(days: Day[], today: string): number | null {
  const active = days.filter((d) => d.contributionCount > 0).map((d) => dayNumber(d.date));
  if (active.length === 0) return null;
  return dayNumber(today) - Math.max(...active);
}

/* GraphQL request */
async function graphql(token: string, query: string, variables: object, api: string) {
  const res = await fetch(api, {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'user-agent': 'git-pals' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API error: HTTP ${res.status}`);
  const body = (await res.json()) as { data: { user: any }; errors?: { message: string }[] };
  if (body.errors)
    throw new Error(`GitHub API error: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data.user;
}

/* Fetch a user's stats */
export async function fetchStats(
  token: string,
  login: string,
  includePrivate: boolean,
  now = new Date(),
  api = 'https://api.github.com/graphql',
): Promise<Stats> {
  /* Years with activity */
  const first = await graphql(
    token,
    'query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }',
    { login },
    api,
  );
  if (!first) throw new Error(`GitHub user "${login}" not found`);
  const years: number[] = first.contributionsCollection.contributionYears;

  /* Totals per year, last year's calendar, this month's commits */
  const perYear = years
    .map(
      (
        y,
      ) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        contributionCalendar { totalContributions }
        restrictedContributionsCount
      }`,
    )
    .join('\n');
  const user = await graphql(
    token,
    `query($login: String!, $from: DateTime!, $monthStart: DateTime!, $to: DateTime!) {
      user(login: $login) {
        ${perYear}
        recent: contributionsCollection(from: $from, to: $to) {
          contributionCalendar { weeks { contributionDays { date contributionCount } } }
        }
        month: contributionsCollection(from: $monthStart, to: $to) {
          totalCommitContributions
        }
      }
    }`,
    {
      login,
      from: new Date(now.getTime() - 364 * DAY_MS).toISOString(),
      monthStart: `${now.toISOString().slice(0, 7)}-01T00:00:00Z`,
      to: now.toISOString(),
    },
    api,
  );

  /* Total, minus hidden private counts unless opted in */
  let total = 0;
  for (const y of years) {
    total += user[`y${y}`].contributionCalendar.totalContributions;
    if (!includePrivate) total -= user[`y${y}`].restrictedContributionsCount;
  }

  /* Reduce to numbers */
  const days: Day[] = user.recent.contributionCalendar.weeks.flatMap(
    (w: { contributionDays: Day[] }) => w.contributionDays,
  );
  const today = now.toISOString().slice(0, 10);

  return {
    total: Math.max(0, total),
    streak: streakOf(days, today),
    daysSinceLast: daysSinceLast(days, today),
    commitsThisMonth: user.month.totalCommitContributions,
  };
}
