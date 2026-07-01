import { prisma } from '../config/prisma';

export class OrderRepository {
  async findMany(filter: { branch: string; date?: string; month?: string }) {
    const where: Record<string, unknown> = {};
    if (filter.branch !== 'all') where.branch = filter.branch;

    if (filter.date) {
      const start = new Date(filter.date);
      const end = new Date(filter.date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    } else if (filter.month) {
      const [year, month] = filter.month.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.createdAt = { gte: start, lt: end };
    }

    return prisma.order.findMany({
      where,
      include: { store: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    id: string;
    storeId: string;
    branch: string;
    total: number;
    createdAt: Date;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    return prisma.order.create({
      data: {
        id: data.id,
        storeId: data.storeId,
        branch: data.branch,
        total: data.total,
        createdAt: data.createdAt,
        items: { create: data.items },
      },
      include: { store: true, items: true },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.order.count({ where: { id } });
    return count > 0;
  }

  async findForDailyReport(filter: { branch: string; date: string; storeId: string }) {
    const start = new Date(filter.date);
    const end = new Date(filter.date);
    end.setDate(end.getDate() + 1);

    const where: Record<string, unknown> = { createdAt: { gte: start, lt: end } };
    if (filter.branch !== 'all') where.branch = filter.branch;
    if (filter.storeId !== 'all') where.storeId = filter.storeId;

    return prisma.order.findMany({
      where,
      include: { store: true, items: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sumTotal(branch: string, gte: Date, lt: Date): Promise<number> {
    const where: Record<string, unknown> = { createdAt: { gte, lt } };
    if (branch !== 'all') where.branch = branch;
    const result = await prisma.order.aggregate({ where, _sum: { total: true } });
    return Number(result._sum.total ?? 0);
  }

  async groupByBranch(gte: Date, lt: Date) {
    return prisma.order.groupBy({
      by: ['branch'],
      where: { createdAt: { gte, lt } },
      _sum: { total: true },
    });
  }

  async findRecent(branch: string, limit = 5) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where = isUniversal ? {} : { branch };
    return prisma.order.findMany({
      where,
      include: { store: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteBeforeDate(date: Date) {
    return prisma.$transaction(async (tx) => {
      // Find all order IDs to delete
      const ordersToDelete = await tx.order.findMany({
        where: { createdAt: { lt: date } },
        select: { id: true },
      });

      const orderIds = ordersToDelete.map((o) => o.id);

      if (orderIds.length === 0) {
        return { deletedCount: 0 };
      }

      // 1. Delete Order Items
      await tx.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      // 2. Delete Receivables
      await tx.receivable.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      // 3. Delete Orders
      const deleted = await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      return { deletedCount: deleted.count };
    });
  }
}
