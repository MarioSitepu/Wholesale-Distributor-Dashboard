import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing data
  await prisma.stockItem.deleteMany({});
  await prisma.receivable.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.scheduledPrice.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  console.log('Cleaned up existing database tables.');

  // 2. Seed Branches
  const branches = [
    { id: 'pusat', name: 'Pusat' },
    { id: 'palembang', name: 'Palembang' },
    { id: 'baturaja', name: 'Baturaja' },
    { id: 'jambi', name: 'Jambi' },
  ];

  for (const b of branches) {
    await prisma.branch.create({ data: b });
  }
  console.log('Seeded branches.');

  // 3. Seed Users (with hashed passwords)
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { username: 'superadmin', password: passwordHash, role: 'admin', branch: 'Pusat' },
    { username: 'palembang', password: passwordHash, role: 'admin', branch: 'Palembang' },
    { username: 'baturaja', password: passwordHash, role: 'admin', branch: 'Baturaja' },
    { username: 'jambi', password: passwordHash, role: 'admin', branch: 'Jambi' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('Seeded users.');

  // 4. Seed Categories
  const categories = [
    { name: 'Air Mineral' },
    { name: 'RTD Tea' },
    { name: 'RTD Juice' },
    { name: 'Carbonated Drink' },
  ];

  for (const c of categories) {
    await prisma.category.create({ data: c });
  }
  console.log('Seeded categories.');

  // 5. Seed Products and their Stock Items across branches
  // We'll create identical product SKUs for each branch so each branch has its own local inventory pricing/records.
  const productTemplates = [
    { id: 'AQUA-600', name: 'AQUA Botol 600ml', categoryName: 'Air Mineral', price: 45000 }, // Dus (isi 24)
    { id: 'AQUA-1500', name: 'AQUA Botol 1500ml', categoryName: 'Air Mineral', price: 48000 }, // Dus (isi 12)
    { id: 'VIT-600', name: 'VIT Botol 600ml', categoryName: 'Air Mineral', price: 34000 },
    { id: 'TEH-PUCUK', name: 'Teh Pucuk Harum 350ml', categoryName: 'RTD Tea', price: 54000 }, // Dus (isi 24)
    { id: 'FLORIDINA', name: 'Floridina Orange 350ml', categoryName: 'RTD Juice', price: 32000 }, // Dus (isi 12)
    { id: 'COCA-COLA', name: 'Coca-Cola Kaleng 330ml', categoryName: 'Carbonated Drink', price: 85000 }, // Dus (isi 24)
    { id: 'SPRITE', name: 'Sprite Kaleng 330ml', categoryName: 'Carbonated Drink', price: 85000 },
  ];

  const activeBranches = ['Palembang', 'Baturaja', 'Jambi'];
  
  for (const branch of activeBranches) {
    for (const template of productTemplates) {
      const productId = `${template.id}-${branch.toUpperCase().substring(0, 3)}`;
      
      // Let's vary stock levels so some have low stock count.
      // Category 'RTD Juice' and 'Carbonated Drink' will have low stocks for testing alerts.
      let totalIn = 150;
      let totalOut = 40;
      
      if (template.categoryName === 'RTD Juice') {
        totalIn = 12;
        totalOut = 9; // stock 3 (under low stock threshold of 10)
      } else if (template.id === 'SPRITE') {
        totalIn = 8;
        totalOut = 4; // stock 4 (under low stock threshold of 10)
      }

      await prisma.product.create({
        data: {
          id: productId,
          name: `${template.name} (${branch})`,
          categoryName: template.categoryName,
          price: template.price,
          branch: branch,
          stockItems: {
            create: {
              branch: branch,
              totalIn: totalIn,
              totalOut: totalOut,
            }
          }
        }
      });
    }
  }
  console.log('Seeded products and local branch stock records.');

  // 6. Seed Stores for each branch
  const storeTemplates = [
    { id: 'STR-PAL-001', name: 'Toko Sentosa (Palembang)', branch: 'Palembang' },
    { id: 'STR-PAL-002', name: 'Maju Jaya Swalayan', branch: 'Palembang' },
    { id: 'STR-PAL-003', name: 'Cahaya Indah Mart', branch: 'Palembang' },
    { id: 'STR-BAT-001', name: 'Toko Barokah (Baturaja)', branch: 'Baturaja' },
    { id: 'STR-BAT-002', name: 'Mitra Usaha Grosir', branch: 'Baturaja' },
    { id: 'STR-JAM-001', name: 'Sinar Abadi Agen', branch: 'Jambi' },
    { id: 'STR-JAM-002', name: 'Toko Rejeki Jambi', branch: 'Jambi' },
  ];

  for (const s of storeTemplates) {
    await prisma.store.create({ data: s });
  }
  console.log('Seeded stores.');

  // 7. Seed Orders & Receivables for realistic analytical charts
  const now = new Date();
  
  // Helper to subtract days
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d;
  };

  const sampleOrders = [
    // Palembang Orders
    {
      id: 'ORD-PAL-1001',
      storeId: 'STR-PAL-001',
      branch: 'Palembang',
      createdAt: getPastDate(5),
      items: [
        { productId: 'AQUA-600-PAL', productName: 'AQUA Botol 600ml (Palembang)', quantity: 20, price: 45000 },
        { productId: 'TEH-PUCUK-PAL', productName: 'Teh Pucuk Harum 350ml (Palembang)', quantity: 15, price: 54000 },
      ],
      receivable: { amount: 1710000, daysToDue: 14, isPaid: false }
    },
    {
      id: 'ORD-PAL-1002',
      storeId: 'STR-PAL-002',
      branch: 'Palembang',
      createdAt: getPastDate(2),
      items: [
        { productId: 'AQUA-1500-PAL', productName: 'AQUA Botol 1500ml (Palembang)', quantity: 10, price: 48000 },
        { productId: 'COCA-COLA-PAL', productName: 'Coca-Cola Kaleng 330ml (Palembang)', quantity: 5, price: 85000 },
      ],
      receivable: { amount: 905000, daysToDue: 20, isPaid: true }
    },
    {
      id: 'ORD-PAL-1003',
      storeId: 'STR-PAL-003',
      branch: 'Palembang',
      createdAt: getPastDate(0),
      items: [
        { productId: 'FLORIDINA-PAL', productName: 'Floridina Orange 350ml (Palembang)', quantity: 2, price: 32000 },
      ],
      receivable: null
    },

    // Baturaja Orders
    {
      id: 'ORD-BAT-1001',
      storeId: 'STR-BAT-001',
      branch: 'Baturaja',
      createdAt: getPastDate(6),
      items: [
        { productId: 'AQUA-600-BAT', productName: 'AQUA Botol 600ml (Baturaja)', quantity: 30, price: 45000 },
        { productId: 'VIT-600-BAT', productName: 'VIT Botol 600ml (Baturaja)', quantity: 25, price: 34000 },
      ],
      receivable: { amount: 2200000, daysToDue: -2, isPaid: false } // Overdue receivable!
    },
    {
      id: 'ORD-BAT-1002',
      storeId: 'STR-BAT-002',
      branch: 'Baturaja',
      createdAt: getPastDate(1),
      items: [
        { productId: 'TEH-PUCUK-BAT', productName: 'Teh Pucuk Harum 350ml (Baturaja)', quantity: 8, price: 54000 },
      ],
      receivable: { amount: 432000, daysToDue: 15, isPaid: false }
    },

    // Jambi Orders
    {
      id: 'ORD-JAM-1001',
      storeId: 'STR-JAM-001',
      branch: 'Jambi',
      createdAt: getPastDate(4),
      items: [
        { productId: 'COCA-COLA-JAM', productName: 'Coca-Cola Kaleng 330ml (Jambi)', quantity: 12, price: 85000 },
      ],
      receivable: { amount: 1020000, daysToDue: 10, isPaid: false }
    }
  ];

  for (const o of sampleOrders) {
    const total = o.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    
    // Create the Order
    await prisma.order.create({
      data: {
        id: o.id,
        storeId: o.storeId,
        branch: o.branch,
        total: total,
        createdAt: o.createdAt,
        items: {
          create: o.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // Create Receivable if specified
    if (o.receivable) {
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + o.receivable.daysToDue);
      
      await prisma.receivable.create({
        data: {
          storeId: o.storeId,
          orderId: o.id,
          amount: o.receivable.amount,
          dueDate: dueDate,
          isPaid: o.receivable.isPaid
        }
      });
    }
  }
  
  console.log('Seeded sample branch orders and store accounts receivables.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
