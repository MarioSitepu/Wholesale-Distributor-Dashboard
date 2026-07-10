const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany();
  console.log("Total stores:", stores.length);
  console.log(stores.slice(0, 3));
}
main().catch(console.error).finally(() => prisma.$disconnect());
