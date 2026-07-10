import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  products.forEach(p => {
    const formatted = p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim();
    console.log(`${p.id}: ${p.name} -> ${formatted}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
