/** Sri Lanka (Asia/Colombo) date helpers — no DST */

const TZ = 'Asia/Colombo';

export function toColomboDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Date(d.toLocaleString('en-US', { timeZone: TZ }));
}

export function startOfDayColombo(dateInput) {
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
  return new Date(`${y}-${m}-${day}T00:00:00+05:30`);
}

export function weekdayColombo(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
}

export function getDayOfWeekColombo(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).formatToParts(d);
  const w = parts.find((p) => p.type === 'weekday')?.value;
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[w] ?? 0;
}

export function nowColombo() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

export function parseMonthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const last = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { first, last, year: y, month: m };
}

export function formatYMD(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const mo = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${mo}-${day}`;
}

export function totalSlotsForDate(date) {
  const dow = getDayOfWeekColombo(date);
  // Default slots: treat Sunday like other weekdays for booking purposes.
  // Saturday has reduced capacity; other days have full capacity.
  if (dow === 6) return 15;
  return 30;
}

export function isOperatingHoursForCheckin(now = new Date()) {
  const dow = getDayOfWeekColombo(now);
  if (dow === 0) return { ok: false, reason: 'Closed on Sunday' };

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const minutes = hh * 60 + mm;
  // Standard operating hours for check-in: 07:00 - 16:00 for all open days
  const open = 7 * 60;
  const close = 16 * 60;
  return {
    ok: minutes >= open && minutes < close,
    reason: minutes >= close ? 'Check-in ends at 4:00 PM' : null,
  };
}
