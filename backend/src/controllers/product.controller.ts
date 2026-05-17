import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service.js';
import { AuthRequest } from '../types/index.js';

const createProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
});

const updateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().min(1),
});

export class ProductController {
  private service = new ProductService();

  getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = (req.query.branch as string) ?? req.user!.branch;
      const products = await this.service.getProducts(branch, req.user!);
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  };

  createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createProductSchema.parse(req.body);
      const product = await this.service.createProduct(body, req.user!);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  };

  updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateProductSchema.parse(req.body);
      const product = await this.service.updateProduct(req.params.id, body);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  };

  deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteProduct(req.params.id);
      res.status(200).json({ message: 'Produk berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  };
}
