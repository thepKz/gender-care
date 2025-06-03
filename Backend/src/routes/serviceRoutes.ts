import express from 'express';
import { 
  getAllServices, 
  createService, 
  updateService, 
  deleteService 
} from '../controllers/serviceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizeManager } from '../middleware/authorizeManager';

const router = express.Router();

// Apply authentication and manager authorization to all routes
router.use(authMiddleware);
router.use(authorizeManager);

// Service routes
router.get('/', getAllServices);          // GET /services
router.post('/', createService);          // POST /services
router.put('/:id', updateService);        // PUT /services/:id
router.delete('/:id', deleteService);     // DELETE /services/:id

export default router; 