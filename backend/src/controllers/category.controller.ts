import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { CategoryService } from '../services/category.service.js';
import { AuthRequest } from '../types/index.js';

const createCategorySchema = z.object({
  name: z.string().min(1),
});

export class CategoryController {
  private service = new CategoryService();

  getCategories = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.getCategories();
      res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  };

  createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = createCategorySchema.parse(req.body);
      const categories = await this.service.createCategory(name);
      res.status(201).json({ categories });
    } catch (err) {
      next(err);
    }
  };

  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteCategory(req.params.name);
      res.status(200).json({ message: 'Kategori berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  };
}
