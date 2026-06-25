import { prisma } from '../config/prisma';

export class StockRepository {
  async findByBranch(branch: string) {
    const where = branch === 'all' ? {} : { branch };
    return prisma.stockItem.findMany({
      where,
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
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

  async findLowStock(branch: string, threshold = 3) {
    const where = branch === 'all' ? {} : { branch };
    const items = await prisma.stockItem.findMany({
      where,
      include: { product: true },
    });
    // Hanya produk yang stoknya > 0 tapi <= threshold (menipis, bukan habis)
    return items.filter((i) => {
      const stock = i.totalIn - i.totalOut;
      return stock > 0 && stock <= threshold;
    });
  }

  async countLowStock(branch: string, threshold = 3): Promise<number> {
    const items = await this.findLowStock(branch, threshold);
    return items.length;
  }
}
