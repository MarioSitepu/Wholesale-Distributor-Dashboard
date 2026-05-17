import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new DashboardController();

// GET /dashboard/kpi?branch=
router.get('/kpi', authenticate, ctrl.getKpi);

// GET /dashboard/weekly-sales?branch=
router.get('/weekly-sales', authenticate, ctrl.getWeeklySales);

// GET /dashboard/branch-contribution — Super Admin only
router.get('/branch-contribution', authenticate, requireSuperAdmin, ctrl.getBranchContribution);

// GET /dashboard/low-stock?branch=
router.get('/low-stock', authenticate, ctrl.getLowStock);

// GET /dashboard/recent-orders?branch=
router.get('/recent-orders', authenticate, ctrl.getRecentOrders);

export default router;
