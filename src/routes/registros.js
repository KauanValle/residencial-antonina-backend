import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listar, buscarPorId, criar, atualizar, registrarSaida, deletar,
} from '../controllers/registros.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.patch('/:id/saida', registrarSaida);
router.delete('/:id', deletar);

export default router;
