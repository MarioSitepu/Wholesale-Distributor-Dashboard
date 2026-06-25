const { PrismaClient } = require("@prisma/client");
const allProducts = require("./products.json");

const prisma = new PrismaClient();

async function run() {
  console.log("Parsed " + allProducts.length + " products from JSON.");

  console.log("Clearing existing data...");
  await prisma.stockItem.deleteMany({});
  await prisma.receivable.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.scheduledPrice.deleteMany({});
  await prisma.product.deleteMany({});

  console.log("Inserting new Categories if not exist...");
  for (const c of ["Fiesta", "Shifudo", "OkeFood"]) {
    await prisma.category.upsert({
      where: { name: c },
      update: {},
      create: { name: c }
    });
  }

  const branches = ["Palembang", "Baturaja", "Jambi"];

  console.log("Inserting products globally and initializing branch stocks...");
  for (const p of allProducts) {
    if (p.id.endsWith('.')) {
       p.id = p.id.slice(0, -1);
    }
    
    try {
      await prisma.product.create({
        data: {
          id: p.id,
          name: p.name,
          categoryName: p.categoryName,
          price: p.price,
          branch: "all",
          stockItems: {
            create: branches.map(b => ({
              branch: b,
              totalIn: 0,
              totalOut: 0,
            }))
          }
        }
      });
    } catch (e) {
      console.warn("Duplicate or error for ID " + p.id + ": " + e.message);
    }
  }

  console.log("Done seeding new products!");
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
