import { Router } from 'express';
import { ReceivableController } from '../controllers/receivable.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ReceivableController();

// GET /receivables/summary?branch=
// HARUS didaftarkan sebelum /:id
router.get('/summary', authenticate, ctrl.getSummary);

// GET /receivables?branch=
router.get('/', authenticate, ctrl.getReceivables);

// PATCH /receivables/:id  — tandai lunas
router.patch('/:id', authenticate, ctrl.markAsPaid);

export default router;
