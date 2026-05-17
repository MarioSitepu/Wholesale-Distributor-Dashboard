import { prisma } from '../config/prisma';

export class CategoryRepository {
  async findAll(): Promise<string[]> {
    const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return rows.map((r) => r.name);
  }

  async create(name: string) {
    return prisma.category.create({ data: { name } });
  }

  async deleteByName(name: string) {
    return prisma.category.delete({ where: { name } });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await prisma.category.count({ where: { name } });
    return count > 0;
  }

  async isUsedByProduct(name: string): Promise<boolean> {
    const count = await prisma.product.count({ where: { categoryName: name } });
    return count > 0;
  }
}
