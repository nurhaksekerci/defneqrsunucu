const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Setup query monitoring middleware
const { setupQueryMonitoring } = require('../middleware/queryMonitoring.middleware');
setupQueryMonitoring(prisma);

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
