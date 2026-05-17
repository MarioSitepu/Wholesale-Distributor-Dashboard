import { Router } from 'express';
import { StoreController } from '../controllers/store.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new StoreController();

// GET  /stores?branch=  — semua admin
router.get('/', authenticate, ctrl.getStores);

// POST /stores          — semua admin
router.post('/', authenticate, ctrl.createStore);

// PUT    /stores/:id    — semua admin
router.put('/:id', authenticate, ctrl.updateStore);

// DELETE /stores/:id    — semua admin
router.delete('/:id', authenticate, ctrl.deleteStore);

export default router;
