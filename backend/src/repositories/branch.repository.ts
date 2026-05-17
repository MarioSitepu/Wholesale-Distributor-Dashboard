import { prisma } from '../config/prisma.js';

export class BranchRepository {
  async findAll() {
    return prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }
}
