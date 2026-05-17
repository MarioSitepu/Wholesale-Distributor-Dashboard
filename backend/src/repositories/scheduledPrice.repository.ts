import { prisma } from '../config/prisma.js';

export class ScheduledPriceRepository {
  async findAll(branch?: string) {
    return prisma.scheduledPrice.findMany({
      where: branch ? { product: { branch } } : undefined,
      include: { product: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.scheduledPrice.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async create(data: { productId: string; newPrice: number; startDate: Date }) {
    return prisma.scheduledPrice.create({
      data,
      include: { product: true },
    });
  }

  async delete(id: string) {
    return prisma.scheduledPrice.delete({ where: { id } });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.scheduledPrice.count({ where: { id } });
    return count > 0;
  }
}
