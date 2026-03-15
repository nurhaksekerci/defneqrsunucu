/**
 * Global kategorileri örnek görsellerle seed eder.
 * Çalıştırma: node prisma/seed-global-categories.js
 * veya: cd backend && node prisma/seed-global-categories.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GLOBAL_CATEGORIES = [
  {
    name: 'Çaylar',
    description: 'Sıcak çay çeşitleri',
    order: 1,
    images: [
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400',
      'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400',
      'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    ],
  },
  {
    name: 'Kahveler',
    description: 'Filtre kahve, espresso, sütlü kahveler',
    order: 2,
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    ],
  },
  {
    name: 'Soğuk İçecekler',
    description: 'Limonata, smoothie, buzlu kahve',
    order: 3,
    images: [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
      'https://images.unsplash.com/photo-1523365237953-9f36b3c8cada?w=400',
      'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
    ],
  },
  {
    name: 'Tatlılar',
    description: 'Pasta, cheesecake, baklava',
    order: 4,
    images: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    ],
  },
  {
    name: 'Ana Yemekler',
    description: 'Et, tavuk, balık yemekleri',
    order: 5,
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    ],
  },
  {
    name: 'Salatalar',
    description: 'Taze salata çeşitleri',
    order: 6,
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
      'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400',
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ],
  },
  {
    name: 'Çorbalar',
    description: 'Sıcak çorba çeşitleri',
    order: 7,
    images: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      'https://images.unsplash.com/photo-1604329760661-e71dc83f2b26?w=400',
      'https://images.unsplash.com/photo-1476718406336-bb5a2470ea76?w=400',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
    ],
  },
  {
    name: 'Başlangıçlar',
    description: 'Mezeler ve başlangıçlar',
    order: 8,
    images: [
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
      'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400',
      'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400',
    ],
  },
  {
    name: 'Burger & Sandviç',
    description: 'Burger ve sandviç çeşitleri',
    order: 9,
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400',
      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400',
    ],
  },
  {
    name: 'Pizza',
    description: 'Pizza çeşitleri',
    order: 10,
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
    ],
  },
  {
    name: 'Kahvaltı',
    description: 'Kahvaltılık ürünler',
    order: 11,
    images: [
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
      'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=400',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    ],
  },
  {
    name: 'Atıştırmalıklar',
    description: 'Aperatif ve atıştırmalıklar',
    order: 12,
    images: [
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
      'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400',
      'https://images.unsplash.com/photo-1604329760661-e71dc83f2b26?w=400',
      'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding global categories...');

  const existing = await prisma.category.count({ where: { isGlobal: true, isDeleted: false } });
  if (existing > 0) {
    console.log(`✅ ${existing} global kategori zaten mevcut. Güncellemek için önce silin.`);
    return;
  }

  for (const cat of GLOBAL_CATEGORIES) {
    await prisma.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        order: cat.order,
        images: cat.images,
        isGlobal: true,
        restaurantId: null,
      },
    });
    console.log(`  ✓ ${cat.name}`);
  }

  console.log(`✅ ${GLOBAL_CATEGORIES.length} global kategori oluşturuldu.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
