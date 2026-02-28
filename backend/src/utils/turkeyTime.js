/**
 * Türkiye saati (Europe/Istanbul, UTC+3) yardımcı fonksiyonları.
 * Tarama istatistiklerinde tarih ve saat gruplaması Türkiye saatine göre yapılır.
 */

const TZ = 'Europe/Istanbul';

/**
 * UTC Date'i Türkiye saatine göre tarih (YYYY-MM-DD) ve saat (0-23) döndürür
 */
function getTurkeyDateAndHour(utcDate) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(utcDate);
  const obj = {};
  parts.forEach((p) => { obj[p.type] = p.value; });
  return {
    date: `${obj.year}-${obj.month}-${obj.day}`,
    hour: parseInt(obj.hour, 10)
  };
}

/**
 * Türkiye'de belirli bir günün başlangıç ve bitiş anını (UTC Date) döndürür
 * @param {string} dateStr - YYYY-MM-DD formatında (veya YYYY/MM/DD)
 */
function getTurkeyDayRange(dateStr) {
  const normalized = dateStr.replace(/\//g, '-');
  const [y, m, d] = normalized.split('-').map(Number);
  const start = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+03:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/**
 * Türkiye'de bugünün başlangıç ve bitiş anı
 */
function getTurkeyTodayRange() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayStr = formatter.format(new Date()).replace(/\//g, '-');
  return getTurkeyDayRange(todayStr);
}

/**
 * Türkiye'de bu yılın başlangıcı
 */
function getTurkeyYearStart() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric'
  });
  const year = formatter.format(now);
  return new Date(`${year}-01-01T00:00:00+03:00`);
}

/**
 * Türkiye'de bu ayın başlangıcı
 */
function getTurkeyMonthStart() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const obj = {};
  parts.forEach((p) => { obj[p.type] = p.value; });
  return new Date(`${obj.year}-${obj.month}-01T00:00:00+03:00`);
}

/**
 * Türkiye'de 7 gün öncesi (bugünün başlangıcından 7 gün geriye)
 */
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
  getTurkeySevenDaysAgo
};
