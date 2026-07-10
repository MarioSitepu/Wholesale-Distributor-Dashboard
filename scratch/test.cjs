const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: { items: true }
  });
  console.log(orders.map(o => o.createdAt));
}
main().catch(console.error).finally(() => prisma.$disconnect());
