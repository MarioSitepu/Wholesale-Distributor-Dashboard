const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.stockItem.count();
  console.log('Total stock items:', count);
  const items = await prisma.stockItem.findMany({ take: 5, include: { product: true } });
  console.log(JSON.stringify(items, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
