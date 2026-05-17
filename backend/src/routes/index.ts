import { Router } from 'express';
import authRoutes from './auth.routes.js';
import branchRoutes from './branch.routes.js';
import accountRoutes from './account.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import scheduledPriceRoutes from './scheduledPrice.routes.js';
import stockRoutes from './stock.routes.js';
import storeRoutes from './store.routes.js';
import orderRoutes from './order.routes.js';
import receivableRoutes from './receivable.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/accounts', accountRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/scheduled-prices', scheduledPriceRoutes);
router.use('/stock', stockRoutes);
router.use('/stores', storeRoutes);
router.use('/orders', orderRoutes);
router.use('/receivables', receivableRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
