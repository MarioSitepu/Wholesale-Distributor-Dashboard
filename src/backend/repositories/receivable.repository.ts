import { prisma } from '../config/prisma';

export class ReceivableRepository {
  async findByBranch(branch: string) {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where = isUniversal ? {} : { store: { branch: { in: [branch, 'all', 'Pusat'] } } };
    return prisma.receivable.findMany({
      where,
      include: { store: true, order: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.receivable.findUnique({
      where: { id },
      include: { store: true, order: true },
    });
  }

  async create(data: { storeId: string; orderId: string; amount: number; dueDate: Date }) {
    return prisma.receivable.create({
      data,
      include: { store: true, order: true },
    });
  }

  async markAsPaid(id: string) {
    return prisma.receivable.update({
      where: { id },
      data: { isPaid: true },
      include: { store: true, order: true },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.receivable.count({ where: { id } });
    return count > 0;
  }

  async sumUnpaid(branch: string): Promise<number> {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const where = isUniversal ? { isPaid: false } : { isPaid: false, store: { branch: { in: [branch, 'all', 'Pusat'] } } };
    const result = await prisma.receivable.aggregate({ where, _sum: { amount: true } });
    return Number(result._sum.amount ?? 0);
  }
}
