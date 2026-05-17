import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ProductController();

// GET  /products?branch=  — semua admin
router.get('/', authenticate, ctrl.getProducts);

// POST /products           — semua admin
router.post('/', authenticate, ctrl.createProduct);

// PUT    /products/:id     — Super Admin only
router.put('/:id', authenticate, requireSuperAdmin, ctrl.updateProduct);

// DELETE /products/:id     — Super Admin only
router.delete('/:id', authenticate, requireSuperAdmin, ctrl.deleteProduct);

export default router;
