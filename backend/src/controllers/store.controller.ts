import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { StoreService } from '../services/store.service.js';
import { AuthRequest } from '../types/index.js';

const createStoreSchema = z.object({
  name: z.string().min(1),
  branch: z.string().min(1),
});

const updateStoreSchema = z.object({
  name: z.string().min(1),
});

export class StoreController {
  private service = new StoreService();

  getStores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const stores = await this.service.getStores(branch, req.user!);
      res.status(200).json(stores);
    } catch (err) {
      next(err);
    }
  };

  createStore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createStoreSchema.parse(req.body);
      const store = await this.service.createStore(body, req.user!);
      res.status(201).json(store);
    } catch (err) {
      next(err);
    }
  };

  updateStore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = updateStoreSchema.parse(req.body);
      const store = await this.service.updateStore(req.params.id, name, req.user!);
      res.status(200).json(store);
    } catch (err) {
      next(err);
    }
  };

  deleteStore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteStore(req.params.id, req.user!);
      res.status(200).json({ message: 'Toko berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  };
}
