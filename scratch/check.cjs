const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({ take: 5 });
  console.log(JSON.stringify(products, null, 2));
}

run().finally(() => prisma.$disconnect());
