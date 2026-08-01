import { BranchRepository } from '../repositories/branch.repository';
import { prisma } from '../config/prisma';

export class BranchService {
  private branchRepo = new BranchRepository();

  async getBranches(): Promise<string[]> {
    const activeUsers = await prisma.user.findMany({ select: { branch: true } });
    const activeBranchNames = new Set(activeUsers.map(u => u.branch));

    const branches = await this.branchRepo.findAll();
    return branches
      .filter((b) => b.name !== 'Pusat' && activeBranchNames.has(b.name))
      .map((b) => b.name);
  }
}
