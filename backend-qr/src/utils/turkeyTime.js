const TZ = 'Europe/Istanbul';

function getTurkeyDateAndHour(utcDate) {
  const d = new Date(utcDate);
  const utcMs = d.getTime();
  const turkeyMs = utcMs + 3 * 60 * 60 * 1000;
  const turkeyDate = new Date(turkeyMs);
  const year = turkeyDate.getUTCFullYear();
  const month = String(turkeyDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(turkeyDate.getUTCDate()).padStart(2, '0');
  let hour = turkeyDate.getUTCHours();
  if (hour < 0 || isNaN(hour)) hour = 0;
  if (hour > 23) hour = 23;
  return { date: `${year}-${month}-${day}`, hour };
}

function getTurkeyDayRange(dateStr) {
  const raw = String(dateStr || '').trim();
  const normalized = raw.replace(/\//g, '-').replace(/\./g, '-');
  const parts = normalized.split('-').map(Number).filter((n) => !isNaN(n));
  let y, m, d;
  if (parts.length >= 3) {
    if (parts[0] > 31) [y, m, d] = parts;
    else if (parts[2] > 31) [d, m, y] = parts;
    else [m, d, y] = parts;
  } else {
    y = new Date().getFullYear();
    m = 1;
    d = 1;
  }
  const start = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+03:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function getTurkeyTodayRange() {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = formatter.format(new Date()).replace(/\//g, '-');
  return getTurkeyDayRange(todayStr);
}

function getTurkeyYearStart() {
  const now = new Date();
  const year = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric' }).format(now);
  return new Date(`${year}-01-01T00:00:00+03:00`);
}

function getTurkeyMonthStart() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(now);
  const obj = {};
  parts.forEach((p) => { obj[p.type] = p.value; });
  return new Date(`${obj.year}-${obj.month}-01T00:00:00+03:00`);
}

function getTurkeySevenDaysAgo() {
  const { start: todayStart } = getTurkeyTodayRange();
  const d = new Date(todayStart);
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

module.exports = {
  getTurkeyDateAndHour,
  getTurkeyDayRange,
  getTurkeyTodayRange,
  getTurkeyYearStart,
  getTurkeyMonthStart,
  getTurkeySevenDaysAgo,
};
