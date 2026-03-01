/**
 * Period types and date-range helpers for stats (year / month / week).
 * Week start is Sunday to match getWeekKey in useStats.
 */

export type PeriodMode = 'year' | 'month' | 'week';

/** ISO date string YYYY-MM-DD at start of day (UTC). */
function startOfDay(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

/** ISO date string YYYY-MM-DD at end of day (UTC). */
function endOfDay(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T23:59:59.999Z`;
}

export function getRangeForYear(year: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year, 11, 31));
  return { from: startOfDay(from), to: endOfDay(to) };
}

/** @param ym - YYYY-MM */
export function getRangeForMonth(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0)); // last day of month
  return { from: startOfDay(from), to: endOfDay(to) };
}

/** Week = Sunday (weekStartDate) through Saturday. weekStartDate is YYYY-MM-DD. */
export function getRangeForWeek(weekStartDate: string): { from: string; to: string } {
  const from = new Date(weekStartDate + 'T00:00:00.000Z');
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 6);
  return { from: startOfDay(from), to: endOfDay(to) };
}

export function getRangeForPeriod(
  mode: PeriodMode,
  value: number | string
): { from: string; to: string } {
  switch (mode) {
    case 'year':
      return getRangeForYear(value as number);
    case 'month':
      return getRangeForMonth(value as string);
    case 'week':
      return getRangeForWeek(value as string);
    default:
      return getRangeForYear(new Date().getFullYear());
  }
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Format YYYY-MM as "Jan 2024". */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Format week-start YYYY-MM-DD as "Week of 4 Mar 2024". */
export function formatWeekLabel(weekStartDate: string): string {
  const d = new Date(weekStartDate + 'T12:00:00.000Z');
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `Week of ${day} ${month} ${year}`;
}

/** Get Sunday of the week containing the given ISO date string. */
export function getWeekStartFromDate(iso: string): string {
  const d = new Date(iso);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

/** Current year. */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Current month as YYYY-MM. */
export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Current week start (Sunday) as YYYY-MM-DD. */
export function getCurrentWeekStart(): string {
  return getWeekStartFromDate(new Date().toISOString());
}

/** List of years from minYear to current (desc). */
export function getYearOptions(minYear: number = 2020): number[] {
  const current = getCurrentYear();
  const years: number[] = [];
  for (let y = current; y >= minYear; y--) years.push(y);
  return years;
}

/** List of YYYY-MM from N months ago to current month (desc). */
export function getMonthOptions(monthsBack: number = 24): string[] {
  const now = new Date();
  const options: string[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    options.push(`${y}-${m}`);
  }
  return options;
}

/** List of week-start dates (YYYY-MM-DD) for the last N weeks (Sun–Sat). */
export function getWeekOptions(weeksBack: number = 52): string[] {
  const options: string[] = [];
  const d = new Date();
  for (let i = 0; i < weeksBack; i++) {
    const copy = new Date(d);
    copy.setDate(d.getDate() - i * 7);
    const start = new Date(copy);
    start.setDate(copy.getDate() - copy.getDay());
    options.push(start.toISOString().slice(0, 10));
  }
  return options;
}
