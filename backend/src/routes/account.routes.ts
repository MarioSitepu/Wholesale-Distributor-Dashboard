import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new AccountController();

// Semua endpoint accounts — Super Admin only
router.use(authenticate, requireSuperAdmin);

// GET  /accounts
router.get('/', ctrl.getAccounts);

// POST /accounts
router.post('/', ctrl.createAccount);

// DELETE /accounts/:username
router.delete('/:username', ctrl.deleteAccount);

export default router;
