import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listar, buscarPorId, criar, registrarRetirada, deletar } from '../controllers/encomendas.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.patch('/:id/retirada', registrarRetirada);
router.delete('/:id', deletar);

export default router;
