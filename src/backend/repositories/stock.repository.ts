import { prisma } from '../config/prisma';

export class StockRepository {
  async findByBranch(branch: string, page?: number, limit?: number, search?: string, category?: string, status?: string) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };

    const andConditions: any[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { productId: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }
    if (category && category !== 'all' && category !== 'Semua Kategori') {
      andConditions.push({
        product: { categoryName: { equals: category, mode: 'insensitive' } }
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const query: any = {
      where,
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    };

    if (page !== undefined && limit !== undefined) {
      query.skip = (page - 1) * limit;
      query.take = limit;
    }

    return prisma.stockItem.findMany(query);
  }

  async countByBranch(branch: string, search?: string, category?: string): Promise<number> {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };

    const andConditions: any[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { productId: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }
    if (category && category !== 'all' && category !== 'Semua Kategori') {
      andConditions.push({
        product: { categoryName: { equals: category, mode: 'insensitive' } }
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return prisma.stockItem.count({ where });
  }

  async findByProductAndBranch(productId: string, branch: string) {
    return prisma.stockItem.findUnique({
      where: { productId_branch: { productId, branch } },
    });
  }

  async addStock(productId: string, branch: string, amount: number) {
    return prisma.stockItem.upsert({
      where: { productId_branch: { productId, branch } },
      update: { totalIn: { increment: amount } },
      create: { productId, branch, totalIn: amount, totalOut: 0 },
    });
  }

  async deductStock(productId: string, branch: string, quantity: number) {
    return prisma.stockItem.update({
      where: { productId_branch: { productId, branch } },
      data: { totalOut: { increment: quantity } },
    });
  }

  async getCurrentStock(productId: string, branch: string): Promise<number> {
    const item = await prisma.stockItem.findUnique({
      where: { productId_branch: { productId, branch } },
    });
    if (!item) return 0;
    return item.totalIn - item.totalOut;
  }

  async findLowStock(branch: string, threshold = 49) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    // Identik dengan findByBranch: sertakan produk universal ('all', 'Pusat')
    // agar hasilnya 100% sama dengan Kelola Stok (/api/inventory?status=low)
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };
    const items = await prisma.stockItem.findMany({
      where,
      include: { product: true },
    });
    return items.filter((i) => {
      const stock = i.totalIn - i.totalOut;
      return stock > 0 && stock <= threshold;
    });
  }

  async countLowStock(branch: string, threshold = 49): Promise<number> {
    const items = await this.findLowStock(branch, threshold);
    return items.length;
  }

  /**
   * Hitung ringkasan statistik stok secara global untuk cabang tertentu.
   * Tidak menggunakan pagination — selalu menghitung seluruh data di database.
   */
  async getSummaryStats(branch: string): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where: any = isUniversal ? {} : { branch: { in: [branch, 'all', 'Pusat'] } };

    // Ambil semua item tanpa pagination
    const allItems = await prisma.stockItem.findMany({ where });

    let totalProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of allItems) {
      const stock = item.totalIn - item.totalOut;
      totalProducts++;
      if (stock === 0) outOfStockCount++;
      else if (stock > 0 && stock < 50) lowStockCount++;
    }

    return { totalProducts, lowStockCount, outOfStockCount };
  }
}
