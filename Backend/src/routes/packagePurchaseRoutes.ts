import express from 'express';
import { 
  purchasePackage,
  getUserPurchasedPackages,
  getPackagePurchaseDetail,
  getPackagePurchasesByProfile,
  testPackagePurchases
} from '../controllers/packagePurchaseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Tất cả routes cần authentication
router.use(authMiddleware);

// POST /package-purchases - Mua gói dịch vụ
router.post('/', purchasePackage);

// GET /package-purchases/test - Test endpoint để kiểm tra data
router.get('/test', testPackagePurchases);

// GET /package-purchases/user - Lấy danh sách gói đã mua của user
router.get('/user', getUserPurchasedPackages);

// GET /package-purchases/profile/:profileId - Lấy gói đã mua cho một profile cụ thể  
router.get('/profile/:profileId', getPackagePurchasesByProfile);

// GET /package-purchases/:id - Lấy chi tiết gói đã mua
router.get('/:id', getPackagePurchaseDetail);

export default router; 