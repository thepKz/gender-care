import express from 'express';
import { 
  getAllServices, 
  getServiceById,
  createService, 
  updateService, 
  deleteService,
  recoverService,
  searchServices,
  toggleServiceStatus
} from '../controllers/serviceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { authorizeManager, authorizeStaffOrDoctorOrManager } from '../middleware/authorizeManager';

const router = express.Router();

// Public route with optional authentication for includeDeleted feature
router.get('/', optionalAuthMiddleware, getAllServices);          // GET /services - Public access with optional auth

// Public search endpoint
router.post('/search', searchServices);                          // POST /services/search - Public search

// Get service by ID - requires authentication, accessible by staff, doctor, manager, admin
router.get('/:id', authMiddleware, authorizeStaffOrDoctorOrManager, getServiceById); // GET /services/:id

// Protected routes - require specific middlewares per route
// Service routes - Order matters: specific routes first, then general routes
router.post('/', authMiddleware, authorizeManager, createService);          // POST /services
router.put('/:id/toggle-status', authMiddleware, authorizeManager, toggleServiceStatus); // PUT /services/:id/toggle-status (specific first)  
router.post('/:id/recover', authMiddleware, authorizeManager, recoverService); // POST /services/:id/recover (specific first)
router.put('/:id', authMiddleware, authorizeManager, updateService);        // PUT /services/:id (general)
router.delete('/:id', authMiddleware, authorizeManager, deleteService);     // DELETE /services/:id (general)

export default router; 