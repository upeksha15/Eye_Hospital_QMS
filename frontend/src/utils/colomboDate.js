/** Match backend Asia/Colombo week boundaries (Mon–Sun). */

const TZ = 'Asia/Colombo';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function colomboYmdFromDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
}

export function colomboStartOfDay(dateInput) {
  const parts = colomboYmdFromDate(dateInput).split('-');
  const [y, m, d] = parts.map(Number);
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00+05:30`);
}

export function colomboMondayOfWeek(dateInput) {
  const sod = colomboStartOfDay(dateInput);
  const w = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).formatToParts(sod);
  const wval = w.find((p) => p.type === 'weekday')?.value;
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[wval] ?? 0;
  const daysFromMonday = (dow + 6) % 7;
  return new Date(sod.getTime() - daysFromMonday * 86400000);
}

export function colomboSundayOfWeek(mondayDate) {
  return new Date(mondayDate.getTime() + 6 * 86400000);
}

/** YYYY-MM-DD at noon +05:30 — stable parse for calendar cells */
export function colomboDateFromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T12:00:00+05:30`);
}

export function colomboDaysInMonth(year, month) {
  const d1 = new Date(`${year}-${pad2(month)}-01T12:00:00+05:30`);
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  const d2 = new Date(`${ny}-${pad2(nm)}-01T12:00:00+05:30`);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function colomboWeekRangeLabel(ymd) {
  const mon = colomboMondayOfWeek(colomboDateFromYmd(ymd));
  const sun = colomboSundayOfWeek(mon);
  const f = (x) =>
    x.toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
  return `${f(mon)} – ${f(sun)}`;
}

export function ymdParts(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m, d };
}
