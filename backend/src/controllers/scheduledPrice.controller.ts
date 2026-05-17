import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ScheduledPriceService } from '../services/scheduledPrice.service.js';
import { AuthRequest } from '../types/index.js';

const createSchema = z.object({
  productId: z.string().min(1),
  newPrice: z.number().positive({ message: 'newPrice harus lebih dari 0' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' }),
});

export class ScheduledPriceController {
  private service = new ScheduledPriceService();

  getScheduledPrices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const prices = await this.service.getScheduledPrices(branch);
      res.status(200).json(prices);
    } catch (err) {
      next(err);
    }
  };

  createScheduledPrice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const result = await this.service.createScheduledPrice(body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteScheduledPrice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteScheduledPrice(req.params.id);
      res.status(200).json({ message: 'Jadwal berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  };
}
