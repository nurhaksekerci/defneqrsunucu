// DefneRandevu işletme slug - appointment_businesses tablosu için
const { slugify } = require('./slugify');

const generateUniqueBusinessSlug = async (text, prisma) => {
  let slug = slugify(text);
  let counter = 1;
  let uniqueSlug = slug;

  while (await prisma.appointmentBusiness.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

module.exports = { generateUniqueBusinessSlug };
