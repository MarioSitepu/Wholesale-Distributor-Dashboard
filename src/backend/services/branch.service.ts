import { BranchRepository } from '../repositories/branch.repository';

export class BranchService {
  private branchRepo = new BranchRepository();

  async getBranches(): Promise<string[]> {
    const branches = await this.branchRepo.findAll();
    return branches.filter((b) => b.name !== 'Pusat').map((b) => b.name);
  }
}
