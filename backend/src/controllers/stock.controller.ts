import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { StockService } from '../services/stock.service.js';
import { AuthRequest } from '../types/index.js';

const restockSchema = z.object({
  productId: z.string().min(1),
  branch: z.string().min(1),
  amount: z.number().int().positive({ message: 'Jumlah restock tidak valid' }),
});

export class StockController {
  private service = new StockService();

  getStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const stock = await this.service.getStock(branch, req.user!);
      res.status(200).json(stock);
    } catch (err) {
      next(err);
    }
  };

  restock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = restockSchema.parse(req.body);
      const updated = await this.service.restock(body, req.user!);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  exportCsv = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const { csv, filename } = await this.service.exportCsv(branch, req.user!);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };
}
