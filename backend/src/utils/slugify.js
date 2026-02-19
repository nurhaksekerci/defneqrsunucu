// Türkçe karakter destekli slug oluşturucu
const slugify = (text) => {
  const trMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };

  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Benzersiz slug oluşturucu
const generateUniqueSlug = async (text, prisma) => {
  let slug = slugify(text);
  let counter = 1;
  let uniqueSlug = slug;

  while (await prisma.restaurant.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

module.exports = { slugify, generateUniqueSlug };
