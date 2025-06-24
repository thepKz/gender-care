import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PackagePurchases from '../models/PackagePurchases';
import ServicePackages from '../models/ServicePackages';
import Bills from '../models/Bills';
import { UserProfile } from '../models/UserProfile';
import { AuthRequest } from '../types/auth';
import { ApiResponse } from '../types';
import { PackagePurchaseService } from '../services/packagePurchaseService';

// POST /package-purchases - DISABLED: Chức năng mua gói đã bị vô hiệu hóa
// Người dùng sẽ đặt lịch trực tiếp thay vì mua gói
export const purchasePackage = async (req: AuthRequest, res: Response) => {
  const response: ApiResponse<any> = {
    success: false,
    message: 'Chức năng mua gói dịch vụ đã được thay thế bằng đặt lịch trực tiếp. Vui lòng sử dụng tính năng đặt lịch.'
  };
  return res.status(410).json(response); // 410 Gone - Feature no longer available
};

/*
// COMMENTED OUT - Original purchase functionality
export const purchasePackageOriginal = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, packageId, promotionId } = req.body;
    const userId = req.user?._id;

    // Validation
    if (!userId) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Unauthorized - User not found'
      };
      return res.status(401).json(response);
    }

    if (!profileId || !packageId) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Profile ID và Package ID là bắt buộc'
      };
      return res.status(400).json(response);
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(profileId) || !mongoose.Types.ObjectId.isValid(packageId)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid profile ID or package ID'
      };
      return res.status(400).json(response);
    }

    // Kiểm tra profile thuộc về user này
    const profile = await UserProfile.findOne({ 
      _id: profileId, 
      ownerId: userId
    });

    if (!profile) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án hoặc bạn không có quyền truy cập'
      };
      return res.status(404).json(response);
    }

    // Kiểm tra package tồn tại và active
    const servicePackage = await ServicePackages.findOne({ 
      _id: packageId, 
      isActive: true 
    });

    if (!servicePackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Gói dịch vụ không tồn tại hoặc đã ngừng hoạt động'
      };
      return res.status(404).json(response);
    }

    // Tạo bill (hóa đơn) - Mock thành công 100%
    const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const billData = {
      userId: userId,
      profileId: profileId,
      billNumber: billNumber,
      packageId: packageId,
      subtotal: servicePackage.price,
      discountAmount: promotionId ? Math.round(servicePackage.price * 0.1) : 0, // Mock 10% discount nếu có promotion
      totalAmount: promotionId ? Math.round(servicePackage.price * 0.9) : servicePackage.price,
      status: 'paid' // Mock thanh toán thành công
    };

    const bill = await Bills.create(billData);

    // Tính ngày hết hạn và số lượt sử dụng
    const activatedAt = new Date();
    const expiredAt = new Date();
    expiredAt.setDate(activatedAt.getDate() + (servicePackage.durationInDays || 30)); // Default 30 ngày

    // Calculate total allowed uses from services
    const totalAllowedUses = servicePackage.services.reduce((sum: number, service: any) => sum + service.quantity, 0) || 1;

    // Tạo package purchase
    const packagePurchaseData = {
      userId: userId,
      profileId: profileId,
      packageId: packageId,
      billId: bill._id,
      activatedAt: activatedAt,
      expiredAt: expiredAt,
      remainingUsages: totalAllowedUses,
      totalAllowedUses: totalAllowedUses,
      isActive: true
    };

    const packagePurchase = await PackagePurchases.create(packagePurchaseData);

    // Populate thông tin để trả về
    const populatedPurchase = await PackagePurchases.findById(packagePurchase._id)
      .populate('packageId', 'name description price serviceIds durationInDays maxUsages')
      .populate('profileId', 'fullName phone year gender')
      .populate('billId', 'subtotal discountAmount totalAmount status');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Mua gói dịch vụ thành công!',
      data: {
        packagePurchase: populatedPurchase,
        bill: bill
      }
    };

    res.status(201).json(response);

  } catch (error: any) {
    console.error('Error purchasing package:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Lỗi hệ thống khi mua gói dịch vụ'
    };
    res.status(500).json(response);
  }
};
*/

// GET /package-purchases/user - Lấy danh sách gói đã mua của user (PRODUCTION VERSION)
export const getUserPurchasedPackages = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [Backend] getUserPurchasedPackages called');
    
    const userId = req.user?._id;
    const { profileId, isActive, page = 1, limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not found'
      });
    }

    console.log('🔍 [Backend] userId:', userId, 'profileId:', profileId);

    // Build query - userId from JWT is already correct type
    const query: any = { userId: userId };
    
    if (profileId && mongoose.Types.ObjectId.isValid(profileId as string)) {
      query.profileId = profileId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    console.log('🔍 [Backend] Final query:', query);

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with proper error handling
    let packagePurchases = [];
    let transformedPurchases: any[] = [];
    let total = 0;
    
    try {
      // Try populate with ServicePackages model (correct model name)
      packagePurchases = await PackagePurchases.find(query)
        .populate({
          path: 'packageId',
          model: 'ServicePackages',
          select: 'name description price services durationInDays maxUsages isActive',
          populate: {
            path: 'services.serviceId',
            model: 'Service',
            select: 'serviceName price description serviceType'
          }
        })
        .populate({
          path: 'profileId',
          model: 'UserProfiles', // Fix model name
          select: 'fullName phone year gender'
        })
        .populate({
          path: 'billId',
          model: 'Bills',
          select: 'subtotal discountAmount totalAmount status createdAt'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Filter out null packageId (deleted packages)
      packagePurchases = packagePurchases.filter(purchase => purchase.packageId);

      // 🔹 Transform data to match frontend expectation
      transformedPurchases = packagePurchases.map((purchase: any) => ({
        ...purchase,
        servicePackage: purchase.packageId, // Map packageId to servicePackage for frontend compatibility
        totalAmount: purchase.purchasePrice || purchase.totalAmount || 0,
        // Ensure required fields are present
        status: purchase.status || 'active',
        isActive: purchase.isActive !== false,
        purchaseDate: purchase.purchaseDate || purchase.createdAt,
        expiryDate: purchase.expiryDate || purchase.expiresAt,
        expiresAt: purchase.expiryDate || purchase.expiresAt,
        remainingUsages: purchase.remainingUsages || 0,
        usedServices: purchase.usedServices || []
      }));

      total = await PackagePurchases.countDocuments(query);
      
      console.log('✅ [Backend] Successfully found purchases:', transformedPurchases.length);
      console.log('✅ [Backend] Sample purchase structure:', transformedPurchases[0] ? Object.keys(transformedPurchases[0]) : 'No purchases');
      
    } catch (populateError) {
      console.error('❌ [Backend] Populate error:', populateError);
      
      // Fallback to basic query without populate
      packagePurchases = await PackagePurchases.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // 🔹 Transform fallback data too
      transformedPurchases = packagePurchases.map((purchase: any) => ({
        ...purchase,
        servicePackage: purchase.packageId,
        totalAmount: purchase.purchasePrice || 0,
        status: purchase.status || 'active',
        isActive: purchase.isActive !== false,
        purchaseDate: purchase.purchaseDate || purchase.createdAt,
        expiryDate: purchase.expiryDate || purchase.expiresAt,
        expiresAt: purchase.expiryDate || purchase.expiresAt,
        remainingUsages: purchase.remainingUsages || 0,
        usedServices: purchase.usedServices || []
      }));
        
      total = await PackagePurchases.countDocuments(query);
      console.log('✅ [Backend] Fallback query successful:', transformedPurchases.length);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packagePurchases: transformedPurchases,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    };

    return res.json(response);

  } catch (error: any) {
    console.error('❌ [Backend] Error in getUserPurchasedPackages:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách gói đã mua',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /package-purchases/test - Test endpoint để kiểm tra data
export const testPackagePurchases = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [Backend] Test endpoint called');
    
    // Đếm tất cả PackagePurchases trong database
    const totalCount = await PackagePurchases.countDocuments({});
    console.log('🔍 [Backend] Total PackagePurchases in DB:', totalCount);
    
    // Lấy 5 records đầu tiên
    const allPurchases = await PackagePurchases.find({}).limit(5);
    console.log('🔍 [Backend] First 5 PackagePurchases:', allPurchases);
    
    // Kiểm tra có user nào đã mua không
    const userIds = await PackagePurchases.distinct('userId');
    console.log('🔍 [Backend] User IDs with purchases:', userIds);
    
    res.json({
      success: true,
      data: {
        totalCount,
        allPurchases,
        userIds,
        currentUserId: req.user?._id
      }
    });
  } catch (error: any) {
    console.error('❌ [Backend] Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /package-purchases/:id - Lấy chi tiết gói đã mua
export const getPackagePurchaseDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Unauthorized - User not found'
      };
      return res.status(401).json(response);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid package purchase ID'
      };
      return res.status(400).json(response);
    }

    const packagePurchase = await PackagePurchases.findOne({ 
      _id: id, 
      userId: userId 
    })
      .populate({
        path: 'packageId',
        select: 'name description price serviceIds durationInDays maxUsages',
        populate: {
          path: 'serviceIds',
          select: 'serviceName price description serviceType availableAt'
        }
      })
      .populate('profileId', 'fullName phone year gender')
      .populate('billId', 'subtotal discountAmount totalAmount status createdAt');

    if (!packagePurchase) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Không tìm thấy gói dịch vụ đã mua hoặc bạn không có quyền truy cập'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packagePurchase: packagePurchase
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('Error getting package purchase detail:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Lỗi hệ thống khi lấy chi tiết gói đã mua'
    };
    res.status(500).json(response);
  }
};

// GET /package-purchases/profile/:profileId - Lấy gói đã mua cho một profile cụ thể
export const getPackagePurchasesByProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const userId = req.user?._id;
    const { isActive = true } = req.query;

    if (!userId) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Unauthorized - User not found'
      };
      return res.status(401).json(response);
    }

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid profile ID'
      };
      return res.status(400).json(response);
    }

    // Kiểm tra profile thuộc về user này
    const profile = await UserProfile.findOne({ 
      _id: profileId, 
      ownerId: userId
    });

    if (!profile) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án hoặc bạn không có quyền truy cập'
      };
      return res.status(404).json(response);
    }

    // Query gói đã mua cho profile này
    const query: any = { 
      userId: userId, 
      profileId: profileId 
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
      
      // Thêm điều kiện kiểm tra hết hạn
      if (isActive === 'true') {
        query.expiredAt = { $gt: new Date() };
        query.remainingUsages = { $gt: 0 };
      }
    }

    const packagePurchases = await PackagePurchases.find(query)
      .populate({
        path: 'packageId',
        select: 'name description price serviceIds durationInDays maxUsages',
        populate: {
          path: 'serviceIds',
          select: 'serviceName price description serviceType availableAt'
        }
      })
      .populate('billId', 'subtotal discountAmount totalAmount status createdAt')
      .sort({ createdAt: -1 });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        profile: profile,
        packagePurchases: packagePurchases
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('Error getting packages by profile:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Lỗi hệ thống khi lấy gói dịch vụ theo hồ sơ'
    };
    res.status(500).json(response);
  }
};

// 🔹 Purchase a service package - updated for new schema
export const purchaseServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId, promotionId } = req.body;
    const userId = req.user?._id;

    // Validation
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID format'
      });
    }

    // 🔹 Find package using new model
    const servicePackage = await ServicePackages.findOne({
      _id: packageId,
      isActive: true
    }).populate('services.serviceId', 'serviceName price');

    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found or inactive'
      });
    }

    // 🔹 Simplified pricing calculation
    const basePrice = servicePackage.price;
    const discountAmount = promotionId ? Math.round(basePrice * 0.1) : 0; // Mock 10% discount
    const finalAmount = basePrice - discountAmount;

    // 🔹 Use PackagePurchaseService to handle purchase
    const purchase = await PackagePurchaseService.purchasePackage(
      userId,
      packageId,
      finalAmount
    );

    // 🔹 Simplified response
    const response = {
      success: true,
      message: 'Package purchased successfully',
      data: {
        purchaseId: purchase._id,
        packageId: servicePackage._id,
        packageName: servicePackage.name,
        pricing: {
          subtotal: basePrice,
          discountAmount,
          totalAmount: finalAmount
        },
        purchaseDate: purchase.purchaseDate,
        expiryDate: purchase.expiryDate,
        durationInDays: servicePackage.durationInDays,
        status: purchase.status
      }
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error purchasing service package:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing service package',
      errors: { general: error.message }
    });
  }
};

// 🔹 Get user's purchased packages - updated for new schema
export const getUserPackagePurchases = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Build filter
    const filter: any = { userId };
    if (status && typeof status === 'string') {
      filter.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [purchases, total] = await Promise.all([
      PackagePurchases.find(filter)
        .populate({
          path: 'packageId',
          select: 'name description services durationInDays price',
          populate: {
            path: 'services.serviceId',
            select: 'serviceName price'
          }
        })
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PackagePurchases.countDocuments(filter)
    ]);

    // 🔹 Enhanced response with usage info
    const purchasesWithUsage = purchases.map(purchase => {
      const totalServices = purchase.usedServices.length;
      const totalUsed = purchase.usedServices.reduce((sum: number, service: any) => sum + service.usedQuantity, 0);
      const totalMax = purchase.usedServices.reduce((sum: number, service: any) => sum + service.maxQuantity, 0);
      
      return {
        ...purchase,
        usageInfo: {
          totalServices,
          totalUsed,
          totalMax,
          usagePercentage: totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0
        }
      };
    });

    const response = {
      success: true,
      data: {
        purchases: purchasesWithUsage,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching user package purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package purchases',
      errors: { general: error.message }
    });
  }
};

// 🔹 Get single package purchase details - updated
export const getPackagePurchaseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase ID format'
      });
    }

    const purchase = await PackagePurchases.findOne({ _id: id, userId })
      .populate({
        path: 'packageId',
        select: 'name description services durationInDays price',
        populate: {
          path: 'services.serviceId',
          select: 'serviceName price description'
        }
      })
      .lean();

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Package purchase not found'
      });
    }

    // 🔹 Add detailed usage information
    const servicesWithUsage = purchase.usedServices.map((usedService: any) => {
      const packageService = (purchase.packageId as any).services.find(
        (ps: any) => ps.serviceId._id.toString() === usedService.serviceId.toString()
      );
      
      return {
        serviceInfo: packageService?.serviceId,
        maxQuantity: usedService.maxQuantity,
        usedQuantity: usedService.usedQuantity,
        remainingQuantity: usedService.maxQuantity - usedService.usedQuantity,
        usagePercentage: Math.round((usedService.usedQuantity / usedService.maxQuantity) * 100)
      };
    });

    const response = {
      success: true,
      data: {
        ...purchase,
        servicesWithUsage,
        summary: {
          totalServices: purchase.usedServices.length,
          totalUsed: purchase.usedServices.reduce((sum: number, s: any) => sum + s.usedQuantity, 0),
          totalMax: purchase.usedServices.reduce((sum: number, s: any) => sum + s.maxQuantity, 0),
          daysRemaining: Math.max(0, Math.ceil((new Date(purchase.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        }
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching package purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package purchase',
      errors: { general: error.message }
    });
  }
};

// 🔹 Use service from purchased package - updated
export const usePackageService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, quantity = 1 } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    // 🔹 Use PackagePurchaseService to handle service usage
    const result = await PackagePurchaseService.usePackageService(userId, serviceId, quantity);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        purchaseId: result.purchaseId,
        serviceId,
        quantityUsed: quantity
      }
    });
  } catch (error: any) {
    console.error('Error using package service:', error);
    res.status(500).json({
      success: false,
      message: 'Error using package service',
      errors: { general: error.message }
    });
  }
};

// 🔹 Check if user can use service - new endpoint
export const checkServiceAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, quantity = 1 } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!serviceId || typeof serviceId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // 🔹 Use PackagePurchaseService to check availability
    const result = await PackagePurchaseService.canUserUseService(
      userId, 
      serviceId, 
      Number(quantity)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error checking service availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking service availability',
      errors: { general: error.message }
    });
  }
};

// 🔹 Get package purchase statistics for user
export const getUserPackageStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const stats = await PackagePurchases.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$purchasePrice' }
        }
      }
    ]);

    const statsMap = {
      active: { count: 0, totalSpent: 0 },
      expired: { count: 0, totalSpent: 0 },
      used_up: { count: 0, totalSpent: 0 }
    };

    stats.forEach(stat => {
      if (statsMap[stat._id as keyof typeof statsMap]) {
        statsMap[stat._id as keyof typeof statsMap] = {
          count: stat.count,
          totalSpent: stat.totalSpent
        };
      }
    });

    const totalPurchases = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalSpent = stats.reduce((sum, stat) => sum + stat.totalSpent, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalPurchases,
          totalSpent
        },
        byStatus: statsMap
      }
    });
  } catch (error: any) {
    console.error('Error fetching user package stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package statistics',
      errors: { general: error.message }
    });
  }
}; 