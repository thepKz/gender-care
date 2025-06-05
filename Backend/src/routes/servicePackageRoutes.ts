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

// Public route - không cần authentication
router.get('/', getAllServicePackages);   // GET /service-packages - Public access

// Protected routes - cần authentication và manager authorization
router.use(authMiddleware);
router.use(authorizeManager);

// Service package routes
router.post('/', createServicePackage);          // POST /service-packages
router.put('/:id', updateServicePackage);        // PUT /service-packages/:id
router.delete('/:id', deleteServicePackage);     // DELETE /service-packages/:id

export default router; 