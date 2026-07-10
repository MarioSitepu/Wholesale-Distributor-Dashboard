import { prisma } from '../config/prisma';

export class ProductRepository {
  async findByBranch(branch: string, page?: number, limit?: number, search?: string, category?: string) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };

    const andConditions: any[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    if (category && category !== 'all' && category !== 'Semua Kategori') {
      andConditions.push({
        categoryName: { equals: category, mode: 'insensitive' }
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const query: any = {
      where,
      include: { stockItems: true },
      orderBy: { name: 'asc' },
    };

    if (page !== undefined && limit !== undefined) {
      query.skip = (page - 1) * limit;
      query.take = limit;
    }

    return prisma.product.findMany(query);
  }

  async countByBranch(branch: string, search?: string, category?: string): Promise<number> {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };

    const andConditions: any[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    if (category && category !== 'all' && category !== 'Semua Kategori') {
      andConditions.push({
        categoryName: { equals: category, mode: 'insensitive' }
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return prisma.product.count({ where });
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
