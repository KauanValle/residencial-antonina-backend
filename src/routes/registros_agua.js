import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  criar,
  listar,
  deletar,
  updateLeituraNoite
} from '../controllers/registro-agua.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', updateLeituraNoite)
router.delete('/:id', deletar);

export default router;
