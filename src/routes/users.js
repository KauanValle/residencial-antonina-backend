import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { listar, criar, atualizar, deletar } from '../controllers/users.controller.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', deletar);

export default router;
