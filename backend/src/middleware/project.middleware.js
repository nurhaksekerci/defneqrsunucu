/**
 * Project context middleware - DefneQr / DefneRandevu ayrımı
 * X-Project, Origin, Referer veya Host header'ına göre req.project set eder
 */
const RANDEVU_HOSTS = [
  'randevu.defneqr.com',
  'defnerandevu.com',
  'www.defnerandevu.com',
  'localhost:3001' // Geliştirme için
];

const isRandevuOrigin = (str) => {
  if (!str) return false;
  return RANDEVU_HOSTS.some(h => str.includes(h));
};

const setProjectContext = (req, res, next) => {
  const host = req.get('host') || '';
  const xProject = req.get('x-project');
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';

  // 1. X-Project header (frontend API'den gönderilir)
  if (xProject === 'defnerandevu') {
    req.project = 'defnerandevu';
    return next();
  }

  // 2. Origin header (CORS isteklerinde tarayıcı otomatik gönderir)
  if (isRandevuOrigin(origin)) {
    req.project = 'defnerandevu';
    return next();
  }

  // 3. Referer header (sayfa yönlendirmelerinde)
  if (isRandevuOrigin(referer)) {
    req.project = 'defnerandevu';
    return next();
  }

  // 4. Host (sadece doğrudan randevu domain'ine istek gelirse)
  if (RANDEVU_HOSTS.some(h => host.startsWith(h))) {
    req.project = 'defnerandevu';
    return next();
  }

  req.project = 'defneqr';
  next();
};

module.exports = { setProjectContext };
