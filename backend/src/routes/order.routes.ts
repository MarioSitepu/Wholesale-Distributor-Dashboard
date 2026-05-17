import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new OrderController();

// GET /orders/daily-report?branch=&date=&storeId=
// HARUS didaftarkan sebelum /:id agar tidak tertangkap sebagai param
router.get('/daily-report', authenticate, ctrl.getDailyReport);

// GET  /orders?branch=&date= atau ?branch=&month=
router.get('/', authenticate, ctrl.getOrders);

// POST /orders
router.post('/', authenticate, ctrl.createOrder);

export default router;
