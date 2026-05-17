import { prisma } from '../config/prisma.js';

export class StoreRepository {
  async findByBranch(branch: string) {
    const where = branch === 'all' ? {} : { branch };
    return prisma.store.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    return prisma.store.findUnique({ where: { id } });
  }

  async create(data: { id: string; name: string; branch: string }) {
    return prisma.store.create({ data });
  }

  async update(id: string, name: string) {
    return prisma.store.update({ where: { id }, data: { name } });
  }

  async delete(id: string) {
    return prisma.store.delete({ where: { id } });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.store.count({ where: { id } });
    return count > 0;
  }

  async hasOrders(id: string): Promise<boolean> {
    const count = await prisma.order.count({ where: { storeId: id } });
    return count > 0;
  }

  async getTotalDebt(storeId: string): Promise<number> {
    const result = await prisma.receivable.aggregate({
      where: { storeId, isPaid: false },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
