import express from 'express';
import { 
  getAllServices, 
  createService, 
  updateService, 
  deleteService,
  recoverService,
  searchServices
} from '../controllers/serviceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { authorizeManager } from '../middleware/authorizeManager';

const router = express.Router();

// Public route with optional authentication for includeDeleted feature
router.get('/', optionalAuthMiddleware, getAllServices);          // GET /services - Public access with optional auth

// Public search endpoint
router.post('/search', searchServices);                          // POST /services/search - Public search

// Protected routes - cần authentication và manager authorization
router.use(authMiddleware);
router.use(authorizeManager);

// Service routes
router.post('/', createService);          // POST /services
router.put('/:id', updateService);        // PUT /services/:id
router.delete('/:id', deleteService);     // DELETE /services/:id
router.post('/:id/recover', recoverService); // POST /services/:id/recover

export default router; 