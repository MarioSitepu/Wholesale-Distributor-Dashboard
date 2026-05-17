import { BranchRepository } from '../repositories/branch.repository';

export class BranchService {
  private branchRepo = new BranchRepository();

  async getBranches(): Promise<string[]> {
    const branches = await this.branchRepo.findAll();
    return branches.map((b) => b.name);
  }
}
