import { IServicePackages } from '../models/ServicePackages';
import Service from '../models/Service';
import mongoose from 'mongoose';

export interface IPackagePricingResult {
  packageId: string;
  packageName: string;
  baseServicePrice: number;       // Tổng giá của các dịch vụ trong gói
  originalPrice: number;          // Giá gốc được tính tự động
  discountPrice: number;          // Giá đã giảm (nếu có)
  discountPercentage: number;     // % giảm giá
  durationInDays: number;         // Thời hạn sử dụng
  maxUsages: number;             // Số lượt được dùng tối đa
  maxProfiles: number[];         // Tùy chọn số profile
  isMultiProfile: boolean;       // Hỗ trợ nhiều hồ sơ
  pricePerUsage: number;         // Giá mỗi lượt sử dụng
  pricePerDay: number;           // Giá mỗi ngày sử dụng
  pricePerProfile: number;       // Giá trung bình mỗi profile (cho multi-profile)
}

export interface IAutoCalculatedPrice {
  totalServicePrice: number;     // Tổng giá các dịch vụ
  calculatedPrice: number;       // Giá được tính (servicePrice x maxUsages)
}

// Tạo kiểu linh hoạt hơn để chấp nhận cả document và plain object
export type PackageDataInput = any;

/**
 * Service để tính giá gói dịch vụ theo schema mới:
 * - Không còn multi-profile
 * - Focus vào subscription với duration + usage limit
 * - Pricing dựa trên giá gói thay vì tính toán phức tạp
 */
export class PackagePricingService {
  
  /**
   * Tự động tính giá gốc từ services và maxUsages
   */
  static async calculateAutoPrice(serviceIds: string[], maxUsages: number): Promise<IAutoCalculatedPrice> {
    try {
      // Lấy thông tin các dịch vụ
      const services = await Service.find({ 
        _id: { $in: serviceIds }, 
        isDeleted: 0 
      }).select('price');
      
      if (services.length !== serviceIds.length) {
        throw new Error('Some services not found or have been deleted');
      }
      
      // Tính tổng giá các dịch vụ
      const totalServicePrice = services.reduce((sum, service) => sum + service.price, 0);
      
      // Giá gốc = Tổng giá dịch vụ × Số lượt sử dụng
      const calculatedPrice = totalServicePrice * maxUsages;
      
      return {
        totalServicePrice,
        calculatedPrice
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to calculate auto price: ${error.message}`);
      }
      throw new Error('Failed to calculate auto price: Unknown error');
    }
  }

  /**
   * Tính giá cho gói dịch vụ với model hybrid
   */
  static async calculatePackagePricing(packageData: PackageDataInput): Promise<IPackagePricingResult> {
    try {
      // Đảm bảo có id string để tránh lỗi
      const packageId = packageData._id ? 
        (typeof packageData._id.toString === 'function' ? packageData._id.toString() : String(packageData._id))
        : 'unknown';

      // Tính giá gốc tự động
      const autoPrice = await this.calculateAutoPrice(
        packageData.serviceIds.map((id: any) => id.toString ? id.toString() : String(id)), 
        packageData.maxUsages
      );
      
      // Tính discount percentage
      const discountPercentage = packageData.price > 0 
        ? Math.round(((packageData.price - packageData.discountPrice) / packageData.price) * 100)
        : 0;
      
      // Tính các metrics pricing
      const pricePerUsage = packageData.discountPrice / packageData.maxUsages;
      const pricePerDay = packageData.discountPrice / packageData.durationInDays;
      
      // Tính giá trung bình mỗi profile (cho multi-profile packages)
      const avgProfileCount = packageData.maxProfiles.reduce((a: number, b: number) => a + b, 0) / packageData.maxProfiles.length;
      const pricePerProfile = packageData.isMultiProfile ? packageData.discountPrice / avgProfileCount : packageData.discountPrice;
      
      return {
        packageId,
        packageName: packageData.name,
        baseServicePrice: autoPrice.totalServicePrice,
        originalPrice: autoPrice.calculatedPrice,  // Giá được tính tự động
        discountPrice: packageData.discountPrice,
        discountPercentage,
        durationInDays: packageData.durationInDays,
        maxUsages: packageData.maxUsages,
        maxProfiles: packageData.maxProfiles,
        isMultiProfile: packageData.isMultiProfile,
        pricePerUsage: Math.round(pricePerUsage),
        pricePerDay: Math.round(pricePerDay),
        pricePerProfile: Math.round(pricePerProfile)
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to calculate package pricing: ${error.message}`);
      }
      throw new Error('Failed to calculate package pricing: Unknown error');
    }
  }

  /**
   * Validate package data trước khi tính giá
   */
  static validatePackageData(packageData: Partial<IServicePackages>): boolean {
    // Validate required fields
    if (!packageData.durationInDays || packageData.durationInDays < 1) {
      throw new Error('durationInDays must be at least 1 day');
    }

    if (!packageData.maxUsages || packageData.maxUsages < 1) {
      throw new Error('maxUsages must be at least 1');
    }

    if (!packageData.serviceIds || !Array.isArray(packageData.serviceIds) || packageData.serviceIds.length === 0) {
      throw new Error('serviceIds is required and must be a non-empty array');
    }

    if (!packageData.discountPrice || packageData.discountPrice < 0) {
      throw new Error('discountPrice must be a positive number');
    }

    // Validate duration limits
    if (packageData.durationInDays > 365) {
      throw new Error('durationInDays cannot exceed 365 days');
    }

    // Validate usage limits
    if (packageData.maxUsages > 1000) {
      throw new Error('maxUsages cannot exceed 1000');
    }

    // Validate multi-profile settings
    if (!packageData.maxProfiles || !Array.isArray(packageData.maxProfiles) || packageData.maxProfiles.length === 0) {
      throw new Error('maxProfiles is required and must be a non-empty array');
    }

    const validProfileCounts = packageData.maxProfiles.every(p => Number.isInteger(p) && p >= 1 && p <= 4);
    if (!validProfileCounts) {
      throw new Error('maxProfiles must contain valid profile counts (1-4)');
    }

    return true;
  }

  /**
   * Tính value metrics để đánh giá giá trị gói
   */
  static calculateValueMetrics(
    baseServicePrice: number, 
    discountPrice: number, 
    originalPrice: number
  ): {
    savingsAmount: number;
    savingsPercentage: number;
    valueRating: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const savingsAmount = originalPrice - discountPrice;
    const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
    
    let valueRating: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (savingsPercentage >= 30) valueRating = 'excellent';
    else if (savingsPercentage >= 20) valueRating = 'good';
    else if (savingsPercentage >= 10) valueRating = 'fair';

    return {
      savingsAmount,
      savingsPercentage,
      valueRating
    };
  }

  /**
   * Tính toán usage projection cho user planning
   */
  static calculateUsageProjection(
    durationInDays: number, 
    maxUsages: number, 
    expectedUsagePerWeek: number
  ): {
    projectedTotalUsage: number;
    utilizationRate: number;
    recommendation: 'perfect' | 'over' | 'under';
  } {
    const weeks = durationInDays / 7;
    const projectedTotalUsage = Math.ceil(expectedUsagePerWeek * weeks);
    const utilizationRate = Math.min((projectedTotalUsage / maxUsages) * 100, 100);
    
    let recommendation: 'perfect' | 'over' | 'under' = 'perfect';
    if (utilizationRate < 70) recommendation = 'over';
    else if (utilizationRate > 95) recommendation = 'under';

    return {
      projectedTotalUsage,
      utilizationRate,
      recommendation
    };
  }

  /**
   * Tính giá cho từng profile option trong multi-profile package
   */
  static calculateProfilePricing(
    packageData: PackageDataInput, 
    selectedProfileCount: number
  ): {
    profileCount: number;
    totalPrice: number;
    pricePerProfile: number;
    usagePerProfile: number;
    isSupported: boolean;
  } {
    const isSupported = packageData.maxProfiles.includes(selectedProfileCount);
    
    if (!isSupported) {
      return {
        profileCount: selectedProfileCount,
        totalPrice: 0,
        pricePerProfile: 0,
        usagePerProfile: 0,
        isSupported: false
      };
    }

    const pricePerProfile = packageData.discountPrice / selectedProfileCount;
    const usagePerProfile = Math.floor(packageData.maxUsages / selectedProfileCount);

    return {
      profileCount: selectedProfileCount,
      totalPrice: packageData.discountPrice,
      pricePerProfile: Math.round(pricePerProfile),
      usagePerProfile,
      isSupported: true
    };
  }
}