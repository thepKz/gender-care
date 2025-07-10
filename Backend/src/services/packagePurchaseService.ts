import mongoose from 'mongoose';
import PackagePurchases, { PackagePurchaseDocument } from '../models/PackagePurchases';
import Service from '../models/Service';
import ServicePackages, { IServicePackages } from '../models/ServicePackages';
import User from '../models/User'; // Added missing import

// 🔹 Service đơn giản hóa cho Package Purchase
export class PackagePurchaseService {

  /**
   * 🔹 Lấy tất cả packages active
   */
  static async getAllActivePackages(): Promise<IServicePackages[]> {
    return await ServicePackages
      .find({ isActive: true })
      .populate('services.serviceId', 'name price duration')
      .sort({ price: 1 });
  }

  /**
   * 🔹 Lấy package theo ID
   */
  static async getPackageById(packageId: string): Promise<IServicePackages | null> {
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      throw new Error('Invalid package ID format');
    }

    return await ServicePackages
      .findOne({ _id: packageId, isActive: true })
      .populate('services.serviceId', 'name price duration');
  }

  /**
   * 🔹 Tính tổng giá trị services trong package (để validation)
   */
  static async calculatePackageValue(packageId: string): Promise<{
    totalOriginalValue: number;
    packagePrice: number;
    discount: number;
    discountPercentage: number;
  }> {
    const packageDoc = await ServicePackages
      .findById(packageId)
      .populate('services.serviceId', 'price');

    if (!packageDoc) {
      throw new Error('Package not found');
    }

    // Tính tổng giá trị gốc của các services
    let totalOriginalValue = 0;
    for (const service of packageDoc.services) {
      const serviceData = service.serviceId as any;
      totalOriginalValue += (serviceData.price || 0) * service.quantity;
    }

    const discount = totalOriginalValue - packageDoc.price;
    const discountPercentage = totalOriginalValue > 0 
      ? Math.round((discount / totalOriginalValue) * 100) 
      : 0;

    return {
      totalOriginalValue,
      packagePrice: packageDoc.price,
      discount: Math.max(0, discount),
      discountPercentage: Math.max(0, discountPercentage)
    };
  }

  /**
   * 🔹 Test function - Tạo PackagePurchase với dữ liệu tối thiểu
   */
  static async createTestPackagePurchase(
    userId: string, 
    packageId: string
  ): Promise<any> {
    try {
      // Tạo purchase với dữ liệu tối thiểu
      const purchaseData = {
        userId: new mongoose.Types.ObjectId(userId),
        packageId: new mongoose.Types.ObjectId(packageId),
        purchasePrice: 0,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
        status: 'active',
        usedServices: [] // Empty array
      };

      // Thử tạo mới
      let purchase: any;
      try {
        purchase = await PackagePurchases.create(purchaseData);
      } catch (error: any) {
        if (error.code === 11000) {
          const existingPurchase = await PackagePurchases.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            packageId: new mongoose.Types.ObjectId(packageId),
            status: 'active'
          });

          if (existingPurchase) {
            existingPurchase.purchasePrice = 0;
            existingPurchase.purchaseDate = new Date();
            existingPurchase.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            existingPurchase.status = 'active';
            
            purchase = await existingPurchase.save();
          } else {
            throw new Error('Test duplicate purchase detected but existing purchase not found');
          }
        } else {
          throw error;
        }
      }

      return {
        success: true,
        message: 'Test package purchase created successfully',
        data: {
          packagePurchase: purchase
        }
      };

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 🔹 Mua package - tạo PackagePurchase mới (cho phép null values)
   */
  static async purchasePackage(
    userId: string, 
    packageId: string,
    paymentAmount: number = 0,
    paymentTrackingId?: string
  ): Promise<any> {
    try {
      if (!userId) throw new Error('User ID is required');
      if (!packageId) throw new Error('Package ID is required');

      const packageDoc = await ServicePackages.findById(packageId);
      const userDoc = await User.findById(userId);
      if (!userDoc) throw new Error('User not found');

      let usedServices: any[] = [];
      if (packageDoc && Array.isArray(packageDoc.services)) {
        usedServices = packageDoc.services.map((s: any) => ({
          serviceId: s.serviceId,
          usedQuantity: 0,
          maxQuantity: s.quantity || 1
        }));
      }

      const purchaseData: any = {
        userId: new mongoose.Types.ObjectId(userId),
        packageId: new mongoose.Types.ObjectId(packageId),
        purchasePrice: paymentAmount || 0,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        usedServices
      };
      if (paymentTrackingId) {
        purchaseData.paymentTrackingId = new mongoose.Types.ObjectId(paymentTrackingId);
      }

      let purchase: any;
      purchase = await PackagePurchases.create(purchaseData);
      // --- TỰ ĐỘNG TRỪ 1 LƯỢT SAU KHI MUA GÓI MỚI ---
      if (purchase && Array.isArray(purchase.usedServices) && purchase.usedServices.length > 0) {
        if (purchase.usedServices.length === 1) {
          purchase.useService(purchase.usedServices[0].serviceId.toString(), 1);
        } else {
          purchase.usedServices.forEach((s: any) => {
            purchase.useService(s.serviceId.toString(), 1);
          });
        }
        // Cập nhật trạng thái sau khi trừ lượt
        purchase.checkAndUpdateStatus();
        await purchase.save();
      }
      // --- END ---

      return {
        success: true,
        message: 'Package purchase created successfully',
        data: {
          packagePurchase: purchase,
          packageName: packageDoc?.name || 'Unknown Package',
          pricing: {
            originalPrice: packageDoc?.price || 0,
            discountedPrice: paymentAmount || 0
          }
        }
      };
    } catch (error: any) {
      // Chỉ log lỗi nghiêm trọng
      throw error;
    }
  }

  /**
   * 🔹 Lấy packages đã mua của user
   */
  static async getUserPackages(userId: string): Promise<any[]> {
    return await PackagePurchases
      .find({ userId })
      .populate({
        path: 'packageId',
        select: 'name description services durationInDays',
        populate: {
          path: 'services.serviceId',
          select: 'name price'
        }
      })
      .sort({ purchaseDate: -1 });
  }

  /**
   * 🔹 Sử dụng service từ package đã mua
   */
  static async usePackageService(
    userId: string,
    serviceId: string,
    quantity: number = 1
  ): Promise<{
    success: boolean;
    message: string;
    purchaseId?: string;
  }> {
    // Tìm package active có chứa service này
    const activePurchase = await PackagePurchases.findOne({
      userId,
      status: 'active',
      'usedServices.serviceId': serviceId
    }) as PackagePurchaseDocument | null;

    if (!activePurchase) {
      return {
        success: false,
        message: 'No active package found with this service'
      };
    }

    // Check và update status
    activePurchase.checkAndUpdateStatus();
    
    if (activePurchase.status !== 'active') {
      await activePurchase.save();
      return {
        success: false,
        message: `Package is ${activePurchase.status}`
      };
    }

    // Check có thể sử dụng service không
    if (!activePurchase.canUseService(serviceId, quantity)) {
      return {
        success: false,
        message: 'Insufficient service quantity remaining'
      };
    }

    // Sử dụng service
    const used = activePurchase.useService(serviceId, quantity);
    if (!used) {
      return {
        success: false,
        message: 'Failed to use service'
      };
    }

    // Update status sau khi sử dụng
    activePurchase.checkAndUpdateStatus();
    await activePurchase.save();

    return {
      success: true,
      message: 'Service used successfully',
      purchaseId: activePurchase._id.toString()
    };
  }

  /**
   * 🔹 Check user có thể sử dụng service không
   */
  static async canUserUseService(
    userId: string,
    serviceId: string,
    quantity: number = 1
  ): Promise<{
    canUse: boolean;
    remainingQuantity: number;
    packageName?: string;
  }> {
    const activePurchase = await PackagePurchases
      .findOne({
        userId,
        status: 'active',
        'usedServices.serviceId': serviceId
      })
      .populate('packageId', 'name') as PackagePurchaseDocument | null;

    if (!activePurchase) {
      return {
        canUse: false,
        remainingQuantity: 0
      };
    }

    // Update status
    activePurchase.checkAndUpdateStatus();
    
    if (activePurchase.status !== 'active') {
      await activePurchase.save();
      return {
        canUse: false,
        remainingQuantity: 0
      };
    }

    const remainingQuantity = activePurchase.getRemainingQuantity(serviceId);
    const canUse = remainingQuantity >= quantity;

    return {
      canUse,
      remainingQuantity,
      packageName: (activePurchase.packageId as any)?.name
    };
  }

  /**
   * 🔹 Calculate auto price từ services và maxUsages (for backward compatibility)
   */
  static async calculateAutoPrice(
    serviceIds: string[],
    maxUsages: number
  ): Promise<{
    totalServicePrice: number;
    calculatedPrice: number;
  }> {
    // Lấy giá của tất cả services
    const services = await Service.find({ 
      _id: { $in: serviceIds.map(id => new mongoose.Types.ObjectId(id)) } 
    });

    // Tính tổng giá service
    const totalServicePrice = services.reduce((sum, service) => sum + (service.price || 0), 0);
    
    // Tính giá package (giá service * số lần sử dụng, có thể áp dụng discount)
    const basePrice = totalServicePrice * maxUsages;
    
    // Áp dụng discount dựa trên maxUsages (càng nhiều lần sử dụng càng giảm giá)
    let discountPercent = 0;
    if (maxUsages >= 10) {
      discountPercent = 20; // 20% discount cho 10+ lần
    } else if (maxUsages >= 5) {
      discountPercent = 10; // 10% discount cho 5+ lần  
    } else if (maxUsages >= 3) {
      discountPercent = 5;  // 5% discount cho 3+ lần
    }

    const calculatedPrice = Math.round(basePrice * (1 - discountPercent / 100));

    return {
      totalServicePrice,
      calculatedPrice
    };
  }

  /**
   * 🔹 Calculate usage projection để giúp user chọn package phù hợp
   */
  static calculateUsageProjection(
    durationInDays: number,
    totalServicesInPackage: number,
    expectedUsagePerWeek: number
  ): {
    totalWeeks: number;
    estimatedUsage: number;
    usageEfficiency: number;
    recommendation: 'perfect' | 'over' | 'under';
  } {
    const totalWeeks = Math.ceil(durationInDays / 7);
    const estimatedUsage = expectedUsagePerWeek * totalWeeks;
    
    // Tính efficiency (sử dụng bao nhiều % package)
    const usageEfficiency = totalServicesInPackage > 0 
      ? Math.round((estimatedUsage / totalServicesInPackage) * 100)
      : 0;
    
    // Đưa ra recommendation
    let recommendation: 'perfect' | 'over' | 'under';
    if (usageEfficiency >= 80 && usageEfficiency <= 120) {
      recommendation = 'perfect'; // Sử dụng 80-120% là phù hợp
    } else if (usageEfficiency > 120) {
      recommendation = 'under';   // Cần package lớn hơn
    } else {
      recommendation = 'over';    // Package quá lớn
    }

    return {
      totalWeeks,
      estimatedUsage,
      usageEfficiency,
      recommendation
    };
  }
} 