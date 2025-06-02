import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';

const router = Router();

router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.post('/', doctorController.create);
router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

export default router;
