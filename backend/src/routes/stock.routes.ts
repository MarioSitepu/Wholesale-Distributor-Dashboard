import { Router } from 'express';
import { StockController } from '../controllers/stock.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new StockController();

// GET  /stock?branch=       — semua admin
router.get('/', authenticate, ctrl.getStock);

// POST /stock/restock       — semua admin
router.post('/restock', authenticate, ctrl.restock);

// GET  /stock/export?branch= — semua admin (returns CSV)
router.get('/export', authenticate, ctrl.exportCsv);

export default router;
