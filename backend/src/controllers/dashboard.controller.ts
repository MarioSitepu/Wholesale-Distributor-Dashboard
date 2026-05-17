import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AuthRequest } from '../types/index.js';

export class DashboardController {
  private service = new DashboardService();

  getKpi = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const kpi = await this.service.getKpi(branch);
      res.status(200).json(kpi);
    } catch (err) {
      next(err);
    }
  };

  getWeeklySales = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const data = await this.service.getWeeklySales(branch);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getBranchContribution = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.service.getBranchContribution();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getLowStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const data = await this.service.getLowStock(branch);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getRecentOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const data = await this.service.getRecentOrders(branch);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}
