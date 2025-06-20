import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PackagePurchases from '../models/PackagePurchases';
import ServicePackage from '../models/ServicePackage';
import Bills from '../models/Bills';
import { UserProfile } from '../models/UserProfile';
import { AuthRequest } from '../types/auth';
import { ApiResponse } from '../types';

// POST /package-purchases - Mua gói dịch vụ (mock thành công 100%)
export const purchasePackage = async (req: AuthRequest, res: Response) => {
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
    const servicePackage = await ServicePackage.findOne({ 
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

    const totalAllowedUses = servicePackage.maxUsages || 1;

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
    let total = 0;
    
    try {
      // Try populate with ServicePackage model 
      packagePurchases = await PackagePurchases.find(query)
        .populate({
          path: 'packageId',
          model: 'ServicePackage',
          select: 'name description price serviceIds durationInDays maxUsages isActive'
        })
        .populate({
          path: 'profileId',
          model: 'UserProfile', 
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

      total = await PackagePurchases.countDocuments(query);
      
      console.log('✅ [Backend] Successfully found purchases:', packagePurchases.length);
      
    } catch (populateError) {
      console.error('❌ [Backend] Populate error:', populateError);
      
      // Fallback to basic query without populate
      packagePurchases = await PackagePurchases.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
        
      total = await PackagePurchases.countDocuments(query);
      console.log('✅ [Backend] Fallback query successful:', packagePurchases.length);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packagePurchases: packagePurchases,
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