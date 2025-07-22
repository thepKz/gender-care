import { Router } from 'express';
import { 
  purchaseServicePackage,
  getUserPurchasedPackages,
  getPackagePurchaseDetail,
  getPackagePurchasesByProfile,
  getAllPackagesAnalytics,
  getPackageUsageAnalytics,
  handlePayOSWebhook,
  testPayOSWebhook,
  testCreatePackagePurchase,
  testUpdatePackageStatus
} from '../controllers/packagePurchaseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { updatePackageStatusMiddleware, updateResponseStatusMiddleware } from '../middleware/packageStatusMiddleware';

const router = Router();

// Public route for PayOS webhook
router.post('/webhook/payos', handlePayOSWebhook);

// Test route for simulating PayOS webhook
router.post('/webhook/test', testPayOSWebhook);

// Protected routes
router.use(authMiddleware);
router.use(updatePackageStatusMiddleware); // 🆕 Auto-update package status
router.use(updateResponseStatusMiddleware); // 🆕 Update status in response

router.post('/', purchaseServicePackage);
router.post('/test-create', testCreatePackagePurchase); // 🧪 Test endpoint
router.get('/test-status', testUpdatePackageStatus); // 🧪 Test status update
router.get('/user', getUserPurchasedPackages);
router.get('/:id', getPackagePurchaseDetail);
router.get('/profile/:profileId', getPackagePurchasesByProfile);
router.get('/analytics', getAllPackagesAnalytics);
router.get('/analytics/:packageId', getPackageUsageAnalytics);

export default router; 