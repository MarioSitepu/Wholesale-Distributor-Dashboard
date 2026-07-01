const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.stockItem.findMany({ include: { product: true } });
  const bad = items.filter(i => !i.product);
  console.log('Total items:', items.length);
  console.log('Bad items (null product):', bad.length);
  
  // also check if any API errors would occur in mapping
  try {
    items.map((s) => ({
      id: s.productId,
      name: s.product ? s.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim() : 'Unknown',
      category: s.product ? s.product.categoryName : 'Unknown',
      totalIn: s.totalIn,
      totalOut: s.totalOut,
      stock: s.totalIn - s.totalOut,
      branch: s.branch,
    }));
    console.log('Mapping succeeded.');
  } catch(e) {
    console.log('Mapping failed:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
