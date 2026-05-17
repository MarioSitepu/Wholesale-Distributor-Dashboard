import { Response, NextFunction } from 'express';
import { BranchService } from '../services/branch.service.js';
import { AuthRequest } from '../types/index.js';

export class BranchController {
  private service = new BranchService();

  getBranches = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branches = await this.service.getBranches();
      res.status(200).json({ branches });
    } catch (err) {
      next(err);
    }
  };
}
