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
          description: 'Küçük işletmeler için başlangıç paketi',
          price: 0,
          duration: 'MONTHLY',
          maxRestaurants: 1,
          maxProducts: 50,
          maxCategories: 10,
          features: JSON.stringify([
            '1 Restoran',
            '50 Ürün',
            '10 Kategori',
            'QR Menü',
            'Temel Özelleştirme',
            'Mobil Uyumlu'
          ]),
          isActive: true,
          isPopular: false,
        },
        {
          name: 'Premium',
          description: 'Büyüyen işletmeler için profesyonel paket',
          price: 299,
          duration: 'MONTHLY',
          maxRestaurants: 5,
          maxProducts: 500,
          maxCategories: 50,
          features: JSON.stringify([
            '5 Restoran',
            '500 Ürün',
            '50 Kategori',
            'QR Menü',
            'Gelişmiş Özelleştirme',
            'QR Tarama Analizi',
            'Öncelikli Destek'
          ]),
          isActive: true,
          isPopular: true,
          extraRestaurantPrice: 50,
        },
        {
          name: 'Kurumsal',
          description: 'Zincir işletmeler için kurumsal çözüm',
          price: 999,
          duration: 'MONTHLY',
          maxRestaurants: null, // Unlimited
          maxProducts: null, // Unlimited
          maxCategories: null, // Unlimited
          features: JSON.stringify([
            'Sınırsız Restoran',
            'Sınırsız Ürün',
            'Sınırsız Kategori',
            'QR Menü',
            'Tam Özelleştirme',
            'Gelişmiş Analitik',
            '7/24 Destek',
            'Özel Eğitim'
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
