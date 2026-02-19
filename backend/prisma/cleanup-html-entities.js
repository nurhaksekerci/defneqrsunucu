const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Decode HTML entities in database
 * This script fixes data that was accidentally HTML-encoded by the sanitization middleware
 */

function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // This must be last!
}

function decodeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return decodeHtmlEntities(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => decodeObject(item));
  }
  
  if (typeof obj === 'object') {
    const decoded = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        decoded[key] = decodeObject(obj[key]);
      }
    }
    return decoded;
  }
  
  return obj;
}

async function cleanupRestaurants() {
  console.log('🔍 Cleaning up restaurants...');
  const restaurants = await prisma.restaurant.findMany();
  
  let updated = 0;
  for (const restaurant of restaurants) {
    const updates = {};
    
    if (restaurant.name && restaurant.name.includes('&')) {
      updates.name = decodeHtmlEntities(restaurant.name);
    }
    
    if (restaurant.description && restaurant.description.includes('&')) {
      updates.description = decodeHtmlEntities(restaurant.description);
    }
    
    if (restaurant.address && restaurant.address.includes('&')) {
      updates.address = decodeHtmlEntities(restaurant.address);
    }
    
    if (restaurant.menuSettings && typeof restaurant.menuSettings === 'object') {
      const decoded = decodeObject(restaurant.menuSettings);
      if (JSON.stringify(decoded) !== JSON.stringify(restaurant.menuSettings)) {
        updates.menuSettings = decoded;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: updates
      });
      updated++;
      console.log(`  ✅ Updated restaurant: ${restaurant.name} (${restaurant.id})`);
    }
  }
  
  console.log(`✅ Cleaned ${updated} restaurants\n`);
}

async function cleanupCategories() {
  console.log('🔍 Cleaning up categories...');
  const categories = await prisma.category.findMany();
  
  let updated = 0;
  for (const category of categories) {
    const updates = {};
    
    if (category.name && category.name.includes('&')) {
      updates.name = decodeHtmlEntities(category.name);
    }
    
    if (category.description && category.description.includes('&')) {
      updates.description = decodeHtmlEntities(category.description);
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.category.update({
        where: { id: category.id },
        data: updates
      });
      updated++;
      console.log(`  ✅ Updated category: ${category.name} (${category.id})`);
    }
  }
  
  console.log(`✅ Cleaned ${updated} categories\n`);
}

async function cleanupProducts() {
  console.log('🔍 Cleaning up products...');
  const products = await prisma.product.findMany();
  
  let updated = 0;
  for (const product of products) {
    const updates = {};
    
    if (product.name && product.name.includes('&')) {
      updates.name = decodeHtmlEntities(product.name);
    }
    
    if (product.description && product.description.includes('&')) {
      updates.description = decodeHtmlEntities(product.description);
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updates
      });
      updated++;
      console.log(`  ✅ Updated product: ${product.name} (${product.id})`);
    }
  }
  
  console.log(`✅ Cleaned ${updated} products\n`);
}

async function cleanupSettings() {
  console.log('🔍 Cleaning up settings...');
  const settings = await prisma.settings.findMany();
  
  let updated = 0;
  for (const setting of settings) {
    const updates = {};
    
    if (setting.siteName && setting.siteName.includes('&')) {
      updates.siteName = decodeHtmlEntities(setting.siteName);
    }
    
    if (setting.siteDescription && setting.siteDescription.includes('&')) {
      updates.siteDescription = decodeHtmlEntities(setting.siteDescription);
    }
    
    if (setting.contactEmail && setting.contactEmail.includes('&')) {
      updates.contactEmail = decodeHtmlEntities(setting.contactEmail);
    }
    
    if (setting.siteUrl && setting.siteUrl.includes('&')) {
      updates.siteUrl = decodeHtmlEntities(setting.siteUrl);
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.settings.update({
        where: { id: setting.id },
        data: updates
      });
      updated++;
      console.log(`  ✅ Updated settings (${setting.id})`);
    }
  }
  
  console.log(`✅ Cleaned ${updated} settings\n`);
}

async function cleanupUsers() {
  console.log('🔍 Cleaning up users...');
  const users = await prisma.user.findMany();
  
  let updated = 0;
  for (const user of users) {
    const updates = {};
    
    if (user.fullName && user.fullName.includes('&')) {
      updates.fullName = decodeHtmlEntities(user.fullName);
    }
    
    if (user.username && user.username.includes('&')) {
      updates.username = decodeHtmlEntities(user.username);
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
      updated++;
      console.log(`  ✅ Updated user: ${user.email} (${user.id})`);
    }
  }
  
  console.log(`✅ Cleaned ${updated} users\n`);
}

async function main() {
  console.log('🧹 Starting HTML entity cleanup...\n');
  
  try {
    await cleanupRestaurants();
    await cleanupCategories();
    await cleanupProducts();
    await cleanupSettings();
    await cleanupUsers();
    
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
