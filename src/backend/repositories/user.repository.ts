import { prisma } from '../config/prisma';

export class UserRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }

  async findAll() {
    return prisma.user.findMany({
      select: { username: true, role: true, branch: true, createdAt: true },
      orderBy: { username: 'asc' },
    });
  }

  async create(data: { username: string; password: string; role: string; branch: string }) {
    return prisma.user.create({
      data,
      select: { username: true, role: true, branch: true, createdAt: true },
    });
  }

  async deleteByUsername(username: string) {
    return prisma.user.delete({ where: { username } });
  }

  async updatePassword(username: string, passwordHash: string) {
    return prisma.user.update({
      where: { username },
      data: { password: passwordHash },
      select: { username: true, role: true, branch: true, createdAt: true },
    });
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { username } });
    return count > 0;
  }
}
