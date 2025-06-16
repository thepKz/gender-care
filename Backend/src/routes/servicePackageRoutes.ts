import express from 'express';
import { 
  getAllServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage,
  recoverServicePackage,
  searchServicePackages
} from '../controllers/servicePackageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { authorizeManager } from '../middleware/authorizeManager';

const router = express.Router();

// Public route with optional authentication for includeDeleted feature
router.get('/', optionalAuthMiddleware, getAllServicePackages);   // GET /service-packages - Public access with optional auth

// Public search endpoint
router.post('/search', searchServicePackages);                   // POST /service-packages/search - Public search

// Protected routes - cần authentication và manager authorization
router.use(authMiddleware);
router.use(authorizeManager);

// Service package routes
router.post('/', createServicePackage);          // POST /service-packages
router.put('/:id', updateServicePackage);        // PUT /service-packages/:id
router.delete('/:id', deleteServicePackage);     // DELETE /service-packages/:id
router.post('/:id/recover', recoverServicePackage); // POST /service-packages/:id/recover

export default router; 