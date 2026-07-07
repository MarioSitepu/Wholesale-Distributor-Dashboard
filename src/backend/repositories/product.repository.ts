import { prisma } from '../config/prisma';

export class ProductRepository {
  async findByBranch(branch: string) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };
    return prisma.product.findMany({
      where,
      include: { stockItems: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { stockItems: true },
    });
  }

  async create(data: {
    id: string;
    name: string;
    categoryName: string;
    price: number;
    unitsPerCarton: number;
    branch: string;
  }) {
    return prisma.product.create({
      data: {
        id: data.id,
        name: data.name,
        categoryName: data.categoryName,
        price: data.price,
        unitsPerCarton: data.unitsPerCarton,
        branch: data.branch,
        stockItems: {
          create: { branch: data.branch, totalIn: 0, totalOut: 0 },
        },
      },
      include: { stockItems: true },
    });
  }

  async update(id: string, data: { name: string; price: number; categoryName: string }) {
    return prisma.product.update({
      where: { id },
      data,
      include: { stockItems: true },
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Delete related ScheduledPrices
      await tx.scheduledPrice.deleteMany({ where: { productId: id } });
      // Delete related StockItems
      await tx.stockItem.deleteMany({ where: { productId: id } });
      // Delete the Product itself
      return tx.product.delete({ where: { id } });
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.product.count({ where: { id } });
    return count > 0;
  }

  async isUsedInOrder(id: string): Promise<boolean> {
    const count = await prisma.orderItem.count({ where: { productId: id } });
    return count > 0;
  }
}
// force rebuild vercel 2
