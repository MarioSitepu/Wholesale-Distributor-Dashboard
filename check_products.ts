import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  const nameCounts: Record<string, number> = {};
  products.forEach(p => {
    nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
  });
  const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
  console.log("DUPLICATES:", duplicates);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
