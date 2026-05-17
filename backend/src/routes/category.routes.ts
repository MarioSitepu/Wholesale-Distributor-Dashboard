import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new CategoryController();

// GET  /categories         — semua admin
router.get('/', authenticate, ctrl.getCategories);

// POST /categories         — Super Admin only
router.post('/', authenticate, requireSuperAdmin, ctrl.createCategory);

// DELETE /categories/:name — Super Admin only
router.delete('/:name', authenticate, requireSuperAdmin, ctrl.deleteCategory);

export default router;
