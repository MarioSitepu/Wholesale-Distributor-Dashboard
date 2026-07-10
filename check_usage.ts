import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ include: { orderItems: true, stockItems: true } });
  
  const byName: Record<string, typeof products> = {};
  
  products.forEach(p => {
    const formatted = p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim();
    if (!byName[formatted]) byName[formatted] = [];
    byName[formatted].push(p);
  });
  
  for (const [name, arr] of Object.entries(byName)) {
    if (arr.length > 1) {
      console.log(`Duplicate: ${name}`);
      arr.forEach(p => {
        const orderCount = p.orderItems.length;
        const stockIn = p.stockItems.reduce((acc, s) => acc + s.totalIn, 0);
        const stockOut = p.stockItems.reduce((acc, s) => acc + s.totalOut, 0);
        console.log(`  - [${p.id}] ${p.name} (Orders: ${orderCount}, In: ${stockIn}, Out: ${stockOut})`);
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
