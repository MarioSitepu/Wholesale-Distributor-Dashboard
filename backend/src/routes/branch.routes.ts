import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new BranchController();

// GET /branches — Super Admin only
router.get('/', authenticate, requireSuperAdmin, ctrl.getBranches);

export default router;
