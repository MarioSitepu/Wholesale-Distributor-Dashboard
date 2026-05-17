import { Router } from 'express';
import { ScheduledPriceController } from '../controllers/scheduledPrice.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ScheduledPriceController();

// Semua endpoint scheduled-prices — Super Admin only
router.use(authenticate, requireSuperAdmin);

// GET    /scheduled-prices?branch=
router.get('/', ctrl.getScheduledPrices);

// POST   /scheduled-prices
router.post('/', ctrl.createScheduledPrice);

// DELETE /scheduled-prices/:id
router.delete('/:id', ctrl.deleteScheduledPrice);

export default router;
