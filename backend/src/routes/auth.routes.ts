import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new AuthController();

// POST /auth/login  — tidak perlu autentikasi
router.post('/login', ctrl.login);

// POST /auth/logout — perlu token valid
router.post('/logout', authenticate, ctrl.logout);

export default router;
