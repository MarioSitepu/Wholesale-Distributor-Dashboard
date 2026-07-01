const { StockRepository } = require('./src/backend/repositories/stock.repository.ts');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const isUniversal = 'all' === 'all' || 'all' === 'Pusat';
  const where = isUniversal ? {} : { branch: { in: ['all', 'all', 'Pusat'] } };
  const rows = await prisma.stockItem.findMany({
    where,
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  });
  console.log("Found rows:", rows.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
