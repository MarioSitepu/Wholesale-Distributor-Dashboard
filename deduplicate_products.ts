import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ include: { orderItems: true, stockItems: true, scheduledPrices: true } });
  
  const byName: Record<string, typeof products> = {};
  
  products.forEach(p => {
    const formatted = p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim();
    if (!byName[formatted]) byName[formatted] = [];
    byName[formatted].push(p);
  });
  
  let deletedCount = 0;
  
  for (const [name, arr] of Object.entries(byName)) {
    if (arr.length > 1) {
      // Sort to keep the one with most orders/stock
      arr.sort((a, b) => {
        const scoreA = a.orderItems.length * 1000 + a.stockItems.reduce((acc, s) => acc + s.totalIn, 0);
        const scoreB = b.orderItems.length * 1000 + b.stockItems.reduce((acc, s) => acc + s.totalIn, 0);
        return scoreB - scoreA;
      });
      
      const keep = arr[0];
      const toDelete = arr.slice(1);
      
      console.log(`Keeping ${keep.id} for ${name}`);
      
      for (const p of toDelete) {
        if (p.orderItems.length > 0) {
          console.log(`  Cannot delete ${p.id} because it has orders!`);
          continue;
        }
        console.log(`  Deleting ${p.id}...`);
        
        // Delete related
        await prisma.stockItem.deleteMany({ where: { productId: p.id } });
        await prisma.scheduledPrice.deleteMany({ where: { productId: p.id } });
        
        // Delete product
        await prisma.product.delete({ where: { id: p.id } });
        deletedCount++;
      }
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} duplicate products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
