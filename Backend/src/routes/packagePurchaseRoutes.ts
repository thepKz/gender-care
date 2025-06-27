import { Router } from 'express';
import { 
  purchaseServicePackage,
  getUserPurchasedPackages,
  getPackagePurchaseDetail,
  getPackagePurchasesByProfile,
  getAllPackagesAnalytics,
  getPackageUsageAnalytics,
  handlePayOSWebhook,
  testPayOSWebhook
} from '../controllers/packagePurchaseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route for PayOS webhook
router.post('/webhook/payos', handlePayOSWebhook);

// Test route for simulating PayOS webhook
router.post('/webhook/test', testPayOSWebhook);

// Protected routes
router.use(authMiddleware);
router.post('/', purchaseServicePackage);
router.get('/user', getUserPurchasedPackages);
router.get('/:id', getPackagePurchaseDetail);
router.get('/profile/:profileId', getPackagePurchasesByProfile);
router.get('/analytics', getAllPackagesAnalytics);
router.get('/analytics/:packageId', getPackageUsageAnalytics);

export default router; 