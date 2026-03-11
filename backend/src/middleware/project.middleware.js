/**
 * Project context middleware - DefneQr / DefneRandevu ayrımı
 * Host veya X-Project header'ına göre req.project set eder
 */
const RANDEVU_HOSTS = [
  'randevu.defneqr.com',
  'defnerandevu.com',
  'www.defnerandevu.com',
  'localhost:3001' // Geliştirme için
];

const setProjectContext = (req, res, next) => {
  const host = req.get('host') || '';
  const xProject = req.get('x-project');

  if (xProject === 'defnerandevu') {
    req.project = 'defnerandevu';
    return next();
  }

  if (RANDEVU_HOSTS.some(h => host.startsWith(h))) {
    req.project = 'defnerandevu';
    return next();
  }

  req.project = 'defneqr';
  next();
};

module.exports = { setProjectContext };
