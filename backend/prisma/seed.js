const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@defneqr.com' }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed.');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@defneqr.com',
      username: 'admin',
      fullName: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', {
    email: admin.email,
    username: admin.username,
    fullName: admin.fullName,
    role: admin.role
  });

  // Settings seeding removed - managed via admin panel

  // Create default plans
  const existingPlans = await prisma.plan.count();
  
  if (existingPlans === 0) {
    await prisma.plan.createMany({
      data: [
        {
          name: 'Ücretsiz',
          type: 'FREE',
          description: 'Küçük işletmeler için başlangıç paketi',
          price: 0,
          duration: 365, // 365 days (1 year)
          maxRestaurants: 1,
          maxCategories: 10,
          maxProducts: 50,
          canRemoveBranding: false,
          hasGlobalCatalog: true,
          hasDetailedReports: false,
          features: JSON.stringify([
            '1 İşletme',
            '10 Kategori',
            '50 Ürün',
            'QR Menü',
            'Global Katalog',
            'Temel Özelleştirme',
            'Mobil Uyumlu'
          ]),
          isActive: true,
          isPopular: false,
          extraRestaurantPrice: 0,
        },
        {
          name: 'Premium',
          type: 'PREMIUM',
          description: 'Büyüyen işletmeler için profesyonel paket',
          price: 299,
          duration: 30, // 30 days (monthly)
          maxRestaurants: 5,
          maxCategories: 50,
          maxProducts: 500,
          canRemoveBranding: true,
          hasGlobalCatalog: true,
          hasDetailedReports: true,
          features: JSON.stringify([
            '5 İşletme',
            '50 Kategori',
            '500 Ürün',
            'QR Menü',
            'Global Katalog',
            'Gelişmiş Özelleştirme',
            'QR Tarama Analizi',
            'Markalama Kaldırma',
            'Öncelikli Destek'
          ]),
          isActive: true,
          isPopular: true,
          extraRestaurantPrice: 50,
        },
        {
          name: 'Kurumsal',
          type: 'CUSTOM',
          description: 'Zincir işletmeler için kurumsal çözüm',
          price: 999,
          duration: 30, // 30 days (monthly)
          maxRestaurants: 999999, // Virtually unlimited
          maxCategories: 999999, // Virtually unlimited
          maxProducts: 999999, // Virtually unlimited
          canRemoveBranding: true,
          hasGlobalCatalog: true,
          hasDetailedReports: true,
          features: JSON.stringify([
            'Sınırsız İşletme',
            'Sınırsız Kategori',
            'Sınırsız Ürün',
            'QR Menü',
            'Global Katalog',
            'Tam Özelleştirme',
            'Gelişmiş Analitik',
            'Markalama Kaldırma',
            '7/24 Destek',
            'Özel Eğitim',
            'API Erişimi'
          ]),
          isActive: true,
          isPopular: false,
          extraRestaurantPrice: 75,
        },
      ],
    });
    console.log('✅ Default plans created');
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
