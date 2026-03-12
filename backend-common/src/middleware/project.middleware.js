// X-Project veya Origin/Referer'dan proje bağlamı
const setProjectContext = (req, res, next) => {
  const header = req.get('X-Project');
  if (header === 'defnerandevu') {
    req.project = 'defnerandevu';
    return next();
  }
  const origin = req.get('Origin') || req.get('Referer') || '';
  if (origin.includes('randevu.defneqr.com') || origin.includes('defnerandevu.com')) {
    req.project = 'defnerandevu';
    return next();
  }
  req.project = 'defneqr';
  next();
};

module.exports = { setProjectContext };
