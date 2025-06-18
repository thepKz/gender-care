import express from 'express';
import { 
  getAllServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage,
  recoverServicePackage,
  searchServicePackages,
  getPackagePricing,
  getUsageProjection
} from '../controllers/servicePackageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { authorizeManager } from '../middleware/authorizeManager';

const router = express.Router();

// Public route with optional authentication for includeDeleted feature
router.get('/', optionalAuthMiddleware, getAllServicePackages);   // GET /service-packages - Public access with optional auth

// Public search endpoint
router.post('/search', searchServicePackages);                   // POST /service-packages/search - Public search

// Public pricing and usage projection endpoints - không cần authentication vì là thông tin công khai
router.get('/:id/pricing', getPackagePricing);                   // GET /service-packages/:id/pricing - Get pricing info with value metrics
router.post('/:id/usage-projection', getUsageProjection);        // POST /service-packages/:id/usage-projection - Calculate usage projection for planning

// Protected routes - cần authentication và manager authorization
router.use(authMiddleware);
router.use(authorizeManager);

// Service package management routes
router.post('/', createServicePackage);          // POST /service-packages - Create new subscription-based package
router.put('/:id', updateServicePackage);        // PUT /service-packages/:id - Update package with new fields
router.delete('/:id', deleteServicePackage);     // DELETE /service-packages/:id - Soft delete package
router.post('/:id/recover', recoverServicePackage); // POST /service-packages/:id/recover - Recover deleted package

export default router; 