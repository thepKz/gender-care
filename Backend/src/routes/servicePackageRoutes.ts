import express from 'express';
import { 
  getAllServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage 
} from '../controllers/servicePackageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizeManager } from '../middleware/authorizeManager';

const router = express.Router();

// Apply authentication and manager authorization to all routes
router.use(authMiddleware);
router.use(authorizeManager);

// Service package routes
router.get('/', getAllServicePackages);          // GET /service-packages
router.post('/', createServicePackage);          // POST /service-packages
router.put('/:id', updateServicePackage);        // PUT /service-packages/:id
router.delete('/:id', deleteServicePackage);     // DELETE /service-packages/:id

export default router; 