import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/order.service.js';
import { AuthRequest } from '../types/index.js';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z.object({
  id: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  branch: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive(),
  createdAt: z.string().datetime(),
});

export class OrderController {
  private service = new OrderService();

  getOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const date = req.query.date as string | undefined;
      const month = req.query.month as string | undefined;
      const orders = await this.service.getOrders({ branch, date, month }, req.user!);
      res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  };

  createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createOrderSchema.parse(req.body);
      const order = await this.service.createOrder(body, req.user!);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  };

  getDailyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const date = req.query.date as string;
      const storeId = (req.query.storeId as string) ?? 'all';
      const rows = await this.service.getDailyReport({ branch, date, storeId }, req.user!);
      res.status(200).json(rows);
    } catch (err) {
      next(err);
    }
  };
}
