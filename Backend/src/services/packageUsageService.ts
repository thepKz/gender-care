import PackagePurchases from '../models/PackagePurchases';
import { IPackagePurchases } from '../models/PackagePurchases';

export class PackageUsageService {
  /**
   * Use a service from a purchased package and decrement quantity
   * @param packagePurchaseId - ID of the package purchase
   * @param serviceId - ID of the service being used
   * @param appointmentId - ID of the appointment for tracking
   * @returns {success: boolean, message: string, data?: any}
   */
  static async useServiceFromPackage(
    packagePurchaseId: string, 
    serviceId: string, 
    appointmentId: string
  ) {
    try {
      console.log('🔄 Using service from package:', { packagePurchaseId, serviceId, appointmentId });

      // Find the package purchase
      const packagePurchase = await PackagePurchases.findById(packagePurchaseId)
        .populate('packageId');

      if (!packagePurchase) {
        return {
          success: false,
          message: 'Package purchase not found'
        };
      }

      // Check if package is active and not expired
      if (packagePurchase.status !== 'active') {
        return {
          success: false,
          message: `Package is ${packagePurchase.status}, cannot use services`
        };
      }

      if (new Date() > packagePurchase.expiryDate) {
        // Auto-expire the package
        packagePurchase.status = 'expired';
        await packagePurchase.save();
        
        return {
          success: false,
          message: 'Package has expired'
        };
      }

      // Find the service in the package's usedServices
      const serviceUsage = packagePurchase.usedServices.find(
        service => service.serviceId.toString() === serviceId
      );

      if (!serviceUsage) {
        return {
          success: false,
          message: 'Service not found in this package'
        };
      }

      // Check if service can still be used
      const canUse = packagePurchase.canUseService(serviceId, 1);
      if (!canUse) {
        const remainingQuantity = packagePurchase.getRemainingQuantity(serviceId);
        return {
          success: false,
          message: `Service usage limit reached. Remaining: ${remainingQuantity}`
        };
      }

      // Use the service (this will increment usedServices)
      const result = packagePurchase.useService(serviceId, 1);
      
      if (!result) {
        return {
          success: false,
          message: 'Failed to use service'
        };
      }

      // Save the updated package
      await packagePurchase.save();

      console.log('✅ Service used successfully:', {
        serviceId,
        appointmentId,
        remainingQuantity: packagePurchase.getRemainingQuantity(serviceId)
      });

      return {
        success: true,
        message: 'Service used successfully',
        data: {
          packagePurchaseId,
          serviceId,
          appointmentId,
          remainingQuantity: packagePurchase.getRemainingQuantity(serviceId),
          totalUsed: serviceUsage.usedQuantity,
          maxQuantity: serviceUsage.maxQuantity
        }
      };

    } catch (error) {
      console.error('❌ Error using service from package:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Get usage summary for a package purchase
   */
  static async getPackageUsageSummary(packagePurchaseId: string) {
    try {
      const packagePurchase = await PackagePurchases.findById(packagePurchaseId)
        .populate('packageId');

      if (!packagePurchase) {
        return {
          success: false,
          message: 'Package purchase not found'
        };
      }

      const summary = {
        packageId: packagePurchase._id,
        packageName: (packagePurchase.packageId as any)?.name || 'Unknown Package',
        status: packagePurchase.status,
        expiresAt: packagePurchase.expiryDate,
        services: packagePurchase.usedServices.map(service => {
          const remainingQuantity = service.maxQuantity - service.usedQuantity;

          return {
            serviceId: service.serviceId,
            maxQuantity: service.maxQuantity,
            usedCount: service.usedQuantity,
            remainingQuantity,
            canUse: remainingQuantity > 0
          };
        })
      };

      return {
        success: true,
        data: summary
      };

    } catch (error) {
      console.error('❌ Error getting package usage summary:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Check if a service can be used from any active package
   */
  static async canUseServiceFromAnyPackage(userId: string, serviceId: string) {
    try {
      const activePackages = await PackagePurchases.find({
        userId,
        status: 'active',
        expiryDate: { $gt: new Date() }
      }).populate('packageId');

      for (const packagePurchase of activePackages) {
        const canUse = packagePurchase.canUseService(serviceId, 1);
        if (canUse) {
          return {
            success: true,
            canUse: true,
            packageId: packagePurchase._id,
            packageName: (packagePurchase.packageId as any)?.name || 'Unknown Package',
            remainingQuantity: packagePurchase.getRemainingQuantity(serviceId)
          };
        }
      }

      return {
        success: true,
        canUse: false,
        message: 'No active packages found with available service usage'
      };

    } catch (error) {
      console.error('❌ Error checking service availability:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }
}

export default PackageUsageService; 