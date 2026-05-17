import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReceivableService } from '../services/receivable.service.js';
import { AuthRequest } from '../types/index.js';

const patchSchema = z.object({
  isPaid: z.literal(true),
});

export class ReceivableController {
  private service = new ReceivableService();

  getReceivables = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const receivables = await this.service.getReceivables(branch, req.user!);
      res.status(200).json(receivables);
    } catch (err) {
      next(err);
    }
  };

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const summary = await this.service.getSummary(branch, req.user!);
      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  };

  markAsPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      patchSchema.parse(req.body);
      const receivable = await this.service.markAsPaid(req.params.id, req.user!);
      res.status(200).json(receivable);
    } catch (err) {
      next(err);
    }
  };
}
