import { prisma } from '../config/prisma';

export class BranchRepository {
  async findAll() {
    return prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }
}
