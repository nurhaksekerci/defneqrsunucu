const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function convertExistingRestaurantOwners() {
  try {
    console.log('🔄 Starting conversion of existing restaurant owners...\n');

    // 1. Zaten affiliate partner olan kullanıcıları al
    const existingAffiliates = await prisma.affiliatePartner.findMany({
      select: { userId: true }
    });
    const existingAffiliateUserIds = new Set(existingAffiliates.map(a => a.userId));

    // 2. En az bir restoranı olan RESTAURANT_OWNER kullanıcıları bul
    const restaurantOwners = await prisma.user.findMany({
      where: {
        role: 'RESTAURANT_OWNER',
        id: {
          notIn: Array.from(existingAffiliateUserIds)
        }
      },
      include: {
        restaurants: {
          where: { isDeleted: false }
        }
      }
    });

    console.log(`📊 Found ${restaurantOwners.length} restaurant owners without affiliate accounts\n`);

    if (restaurantOwners.length === 0) {
      console.log('✅ All restaurant owners already have affiliate accounts!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // 3. Her biri için affiliate partner oluştur
    for (const owner of restaurantOwners) {
      try {
        // Sadece restoranı olanları işle
        if (owner.restaurants.length === 0) {
          console.log(`⏭️  Skipping ${owner.fullName} (${owner.email}) - no restaurants`);
          continue;
        }

        // Benzersiz referral code oluştur
        let referralCode;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
          const existing = await prisma.affiliatePartner.findUnique({
            where: { referralCode }
          });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new Error('Could not generate unique referral code');
        }

        // Affiliate partner oluştur
        await prisma.affiliatePartner.create({
          data: {
            userId: owner.id,
            referralCode,
            status: 'ACTIVE' // Restoran sahipleri otomatik aktif
          }
        });

        console.log(`✅ Created affiliate for: ${owner.fullName} (${owner.email})`);
        console.log(`   📎 Referral Code: ${referralCode}`);
        console.log(`   🏪 Restaurants: ${owner.restaurants.length}\n`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating affiliate for ${owner.fullName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${successCount + errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
convertExistingRestaurantOwners()
  .then(() => {
    console.log('\n🎉 Conversion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Conversion failed:', error);
    process.exit(1);
  });
