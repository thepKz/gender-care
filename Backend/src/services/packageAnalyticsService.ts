import mongoose from 'mongoose';
import PackagePurchases from '../models/PackagePurchases';
import ServicePackages from '../models/ServicePackages';

export interface IUserPackageUsage {
  userId: string;
  userInfo: {
    fullName: string;
    email: string;
    phone?: string;
  };
  profileInfo: {
    profileId: string;
    fullName: string;
    phone?: string;
  };
  purchaseId: string;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'used_up';
  purchasePrice: number;
  serviceUsages: {
    serviceId: string;
    serviceName: string;
    usedQuantity: number;
    maxQuantity: number;
    remainingQuantity: number;
    usagePercentage: number;
  }[];
  totalUsagePercentage: number;
  daysRemaining: number;
}

export interface IPackageAnalytics {
  packageId: string;
  packageName: string;
  totalPurchases: number;
  activePurchases: number;
  expiredPurchases: number;
  usedUpPurchases: number;
  totalRevenue: number;
  averageUsagePercentage: number;
  userUsages: IUserPackageUsage[];
}

export class PackageAnalyticsService {
  /**
   * Lấy analytics cho một gói dịch vụ cụ thể
   */
  static async getPackageUsageAnalytics(packageId: string): Promise<IPackageAnalytics> {
    try {
      // Validate packageId
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        throw new Error('Invalid package ID');
      }

      // Lấy thông tin gói dịch vụ
      const servicePackage = await ServicePackages.findById(packageId)
        .populate('services.serviceId', 'serviceName');
      
      if (!servicePackage) {
        throw new Error('Package not found');
      }

      // Lấy tất cả purchases của gói này
      const purchases = await PackagePurchases.find({ packageId })
        .populate([
          {
            path: 'userId',
            select: 'fullName email phone',
            model: 'User'
          },
          {
            path: 'usedServices.serviceId',
            select: 'serviceName',
            model: 'Service'
          }
        ])
        .sort({ purchaseDate: -1 });

      // Tính toán statistics
      const stats = {
        total: purchases.length,
        active: 0,
        expired: 0,
        usedUp: 0,
        totalRevenue: 0
      };

      const userUsages: IUserPackageUsage[] = [];
      let totalUsageSum = 0;

      for (const purchase of purchases) {
        // Update status nếu cần
        const currentStatus = purchase.checkAndUpdateStatus();
        
        // Count by status
        switch (currentStatus) {
          case 'active':
            stats.active++;
            break;
          case 'expired':
            stats.expired++;
            break;
          case 'used_up':
            stats.usedUp++;
            break;
        }

        stats.totalRevenue += purchase.purchasePrice;

        // Tính usage cho từng service
        const serviceUsages = purchase.usedServices.map((usedService: any) => {
          const remainingQuantity = usedService.maxQuantity - usedService.usedQuantity;
          const usagePercentage = usedService.maxQuantity > 0 
            ? Math.round((usedService.usedQuantity / usedService.maxQuantity) * 100)
            : 0;

          return {
            serviceId: usedService.serviceId._id.toString(),
            serviceName: usedService.serviceId.serviceName || 'Unknown Service',
            usedQuantity: usedService.usedQuantity,
            maxQuantity: usedService.maxQuantity,
            remainingQuantity,
            usagePercentage
          };
        });

        // Tính total usage percentage cho user này
        const totalUsagePercentage = serviceUsages.length > 0
          ? Math.round(serviceUsages.reduce((sum, usage) => sum + usage.usagePercentage, 0) / serviceUsages.length)
          : 0;

        totalUsageSum += totalUsagePercentage;

        // Tính số ngày còn lại
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((purchase.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Lấy thông tin user (có thể null nếu user bị xóa)
        const userInfo = purchase.userId ? {
          fullName: (purchase.userId as any).fullName || 'Unknown User',
          email: (purchase.userId as any).email || 'unknown@email.com',
          phone: (purchase.userId as any).phone
        } : {
          fullName: 'Deleted User',
          email: 'deleted@user.com'
        };

        userUsages.push({
          userId: purchase.userId?.toString() || 'unknown',
          userInfo,
          profileInfo: {
            profileId: 'N/A', // Sẽ update sau nếu cần
            fullName: userInfo.fullName,
            phone: userInfo.phone
          },
          purchaseId: purchase._id.toString(),
          purchaseDate: purchase.purchaseDate,
          expiryDate: purchase.expiryDate,
          status: currentStatus as 'active' | 'expired' | 'used_up',
          purchasePrice: purchase.purchasePrice,
          serviceUsages,
          totalUsagePercentage,
          daysRemaining
        });
      }

      const averageUsagePercentage = purchases.length > 0 
        ? Math.round(totalUsageSum / purchases.length)
        : 0;

      return {
        packageId: packageId,
        packageName: servicePackage.name,
        totalPurchases: stats.total,
        activePurchases: stats.active,
        expiredPurchases: stats.expired,
        usedUpPurchases: stats.usedUp,
        totalRevenue: stats.totalRevenue,
        averageUsagePercentage,
        userUsages
      };

    } catch (error: any) {
      console.error('❌ Error in getPackageUsageAnalytics:', error);
      throw new Error(`Failed to get package analytics: ${error.message}`);
    }
  }

  /**
   * Lấy overview analytics cho tất cả gói dịch vụ
   */
  static async getAllPackagesAnalytics(): Promise<IPackageAnalytics[]> {
    try {
      // Lấy tất cả packages
      const packages = await ServicePackages.find({ isActive: true });
      
      const analytics: IPackageAnalytics[] = [];

      for (const pkg of packages) {
        try {
          const packageAnalytics = await this.getPackageUsageAnalytics(pkg._id.toString());
          analytics.push(packageAnalytics);
        } catch (error) {
          console.error(`❌ Error getting analytics for package ${pkg._id}:`, error);
          // Continue với packages khác
        }
      }

      return analytics.sort((a, b) => b.totalPurchases - a.totalPurchases);

    } catch (error: any) {
      console.error('❌ Error in getAllPackagesAnalytics:', error);
      throw new Error(`Failed to get all packages analytics: ${error.message}`);
    }
  }
} 