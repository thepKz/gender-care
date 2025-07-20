import { Request, Response, NextFunction } from 'express';
import PackagePurchases from '../models/PackagePurchases';

// Middleware để tự động cập nhật status của packages
export const updatePackageStatusMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔄 [Middleware] Request path:', req.path);
    
    // Chỉ áp dụng cho các API liên quan đến package purchases
    if (req.path.includes('/package-purchases') || req.path.includes('/user-purchased-packages') || req.path.includes('/user')) {
      console.log('🔄 [Middleware] Checking and updating package status...');
      
      // Tìm tất cả packages có status "active" và cập nhật
      const activePackages = await PackagePurchases.find({ status: 'active' });
      console.log(`📦 [Middleware] Found ${activePackages.length} active packages`);
      
      for (const packagePurchase of activePackages) {
        console.log(`🔍 [Middleware] Checking package ${packagePurchase._id}:`);
        console.log(`  - Current status: ${packagePurchase.status}`);
        console.log(`  - Used services: ${packagePurchase.usedServices?.length || 0}`);
        
        if (packagePurchase.usedServices && packagePurchase.usedServices.length > 0) {
          packagePurchase.usedServices.forEach((service, index) => {
            console.log(`    Service ${index + 1}: ${service.usedQuantity}/${service.maxQuantity}`);
          });
        }
        
        const oldStatus = packagePurchase.status;
        const newStatus = packagePurchase.checkAndUpdateStatus();
        console.log(`  - Old status: ${oldStatus}`);
        console.log(`  - New status: ${newStatus}`);
        console.log(`  - Status changed: ${newStatus !== oldStatus}`);
        
        if (newStatus !== oldStatus) {
          try {
            // Cập nhật status trực tiếp trong database
            const updateResult = await PackagePurchases.findByIdAndUpdate(
              packagePurchase._id,
              { status: newStatus },
              { new: true }
            );
            
            if (updateResult) {
              console.log(`✅ [Middleware] Updated package ${packagePurchase._id}: ${oldStatus} → ${newStatus}`);
              console.log(`✅ [Middleware] Database updated successfully`);
            } else {
              console.log(`❌ [Middleware] Failed to update database for package ${packagePurchase._id}`);
            }
          } catch (saveError) {
            console.error(`❌ [Middleware] Error saving package ${packagePurchase._id}:`, saveError);
          }
        } else {
          console.log(`ℹ️ [Middleware] Package ${packagePurchase._id} status unchanged`);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ [Middleware] Error updating package status:', error);
    next(); // Vẫn tiếp tục request ngay cả khi có lỗi
  }
};

// Middleware để cập nhật status trước khi trả về response
export const updateResponseStatusMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Nếu response có packagePurchases data, cập nhật status
    if (data?.data?.packagePurchases && Array.isArray(data.data.packagePurchases)) {
      data.data.packagePurchases = data.data.packagePurchases.map((purchase: any) => {
        const now = new Date();
        let updatedStatus = purchase.status || 'active';
        
        // Check expiry
        if (purchase.expiryDate && new Date(purchase.expiryDate) < now) {
          updatedStatus = 'expired';
        }
        // Check if all services used up
        else if (purchase.usedServices && purchase.usedServices.length > 0) {
          const allUsedUp = purchase.usedServices.every((service: any) => 
            (service.usedQuantity || 0) >= (service.maxQuantity || 1)
          );
          if (allUsedUp) {
            updatedStatus = 'used_up';
          }
        }
        
        return {
          ...purchase,
          status: updatedStatus,
          isActive: purchase.isActive !== false && updatedStatus === 'active'
        };
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}; 