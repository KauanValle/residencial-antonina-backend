import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  criar,
  listar,
  updateLeituraNoite
} from '../controllers/registro-agua.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', updateLeituraNoite)

export default router;
