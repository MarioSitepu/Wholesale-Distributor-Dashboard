const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.stockItem.findMany({ where: { branch: 'Palembang' }, include: { product: true } });
  console.log('Palembang Fiesta count:', items.filter(i => i.product.categoryName === 'Fiesta').length);
}
main().finally(() => prisma.$disconnect());
