import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PaymentTracking, { IPaymentTracking } from '../models/PaymentTracking';
import PackagePurchases from '../models/PackagePurchases';
import ServicePackages from '../models/ServicePackages';
import { LogAction, LogLevel } from '../models/SystemLogs';
import User from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { PackageAnalyticsService } from '../services/packageAnalyticsService';
import { PackagePurchaseService } from '../services/packagePurchaseService';
import systemLogService from '../services/systemLogService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../types/auth';

// POST /package-purchases - Mua gói dịch vụ với PayOS thật
export const purchasePackage = async (req: AuthRequest, res: Response) => {
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

    // Find package
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


    // 🆕 Check if user already has an active package of this type
    const existingPurchase = await PackagePurchases.findOne({
      userId: userId,
      packageId: packageId,
      status: 'active',
      expiryDate: { $gt: new Date() } // Chưa hết hạn
    }).populate('packageId', 'name');

    if (existingPurchase) {
      const packageName = (existingPurchase.packageId as any)?.name || 'Gói dịch vụ';
      return res.status(400).json({
        success: false,
        message: 'Bạn đã sở hữu gói dịch vụ này',
        errors: { 
          general: `Bạn đã sở hữu gói này: "${packageName}" và vẫn còn hiệu lực. Vui lòng sử dụng hết các dịch vụ hoặc chờ gói hết hạn trước khi mua lại.`
        },
        data: {
          existingPackage: existingPurchase,
          expiryDate: existingPurchase.expiryDate,
          status: existingPurchase.status
        }
      });
    }

    // Get user info
    const user = await User.findById(userId).select('fullName email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate pricing
    const basePrice = servicePackage.price;
    const discountAmount = promotionId ? Math.round(basePrice * 0.1) : 0;
    const finalAmount = basePrice - discountAmount;


    // 🆕 Handle free packages differently
    if (finalAmount === 0) {
      // Create package purchase directly for free packages
      const packagePurchaseData = {
        userId: userId,
        packageId: packageId,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + servicePackage.durationInDays * 24 * 60 * 60 * 1000),
        status: 'active',
        pricing: {
          basePrice: basePrice,
          discountAmount: discountAmount,
          finalAmount: finalAmount
        },
        remainingServices: servicePackage.services.map((service: any) => ({
          serviceId: service.serviceId._id,
          serviceName: service.serviceId.serviceName,
          limit: service.quantity,
          used: 0,
          remaining: service.quantity
        }))
      };

      const packagePurchase = await PackagePurchases.create(packagePurchaseData);
      const populatedPurchase = await PackagePurchases.findById(packagePurchase._id)
        .populate('packageId', 'name description price validityPeriod')
        .populate('remainingServices.serviceId', 'serviceName price');

      return res.status(201).json({
        success: true,
        message: 'Gói miễn phí đã được kích hoạt thành công',
        data: {
          packagePurchase: populatedPurchase,
          purchaseId: packagePurchase._id,
          packageId: packageId,
          packageName: servicePackage.name,
          pricing: {
            basePrice,
            discountAmount,
            finalAmount
          },
          purchaseDate: packagePurchase.purchaseDate,
          expiryDate: packagePurchase.expiryDate,
          status: packagePurchase.status,
          bill: null, // No bill needed for free packages
          paymentUrl: null // No payment needed
        }
      });
    }

    // Create bill first
    const billNumber = `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paymentData = {
      userId: userId,
      billNumber: billNumber,
      packageId: packageId,
      totalAmount: finalAmount,
      description: `Thanh toán gói dịch vụ: ${servicePackage.name}`,
      customerName: user.fullName || 'Khách hàng',
      customerEmail: user.email,
      customerPhone: user.phone,
      orderCode: Date.now(),
      paymentGateway: 'payos',
      status: 'pending',
      serviceType: 'package',
      recordId: packageId
    };

    const payment = await PaymentTracking.create(paymentData);
    const paymentDoc = payment.toObject() as IPaymentTracking & { _id: mongoose.Types.ObjectId };

    // Tạo description ngắn gọn cho PayOS (<=25 ký tự)
    const shortPackageName = servicePackage.name.substring(0, 15); // Lấy 15 ký tự đầu
    const payosDescription = `Goi: ${shortPackageName}`.substring(0, 25); // Đảm bảo <= 25 ký tự

    // 🆕 Validate PayOS environment variables
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      console.error('❌ [Backend] Missing PayOS environment variables:', {
        clientId: !!process.env.PAYOS_CLIENT_ID,
        apiKey: !!process.env.PAYOS_API_KEY,
        checksumKey: !!process.env.PAYOS_CHECKSUM_KEY
      });
      
      return res.status(503).json({
        success: false,
        message: 'Payment service is temporarily unavailable',
        errors: { 
          general: 'Hệ thống thanh toán đang được bảo trì. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
          technical: 'PayOS configuration is missing. Please contact administrator.'
        },
        data: {
          isPaymentServiceAvailable: false,
          canPurchaseFreePackages: true
        }
      });
    }

    // Tích hợp PayOS thật
    const PayOS = require('@payos/node');
    const payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );

    const paymentLinkData = {
      orderCode: parseInt(paymentDoc._id.toString().slice(-6), 16),
      amount: finalAmount,
      description: payosDescription,
      buyerName: user.fullName || 'Khach hang',
      buyerEmail: user.email || '',
      buyerPhone: user.phone || '',
      returnUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/success`,
      cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/cancel`,
      items: [{
        name: servicePackage.name,
        quantity: 1,
        price: finalAmount
      }]
    };

    const paymentLinkResponse = await payos.createPaymentLink(paymentLinkData);
    
    // 🆕 Validate PayOS response
    if (!paymentLinkResponse || !paymentLinkResponse.checkoutUrl) {
      console.error('❌ [Backend] PayOS returned empty or invalid response:', paymentLinkResponse);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment link',
        errors: { general: 'Payment service returned invalid response. Please try again.' }
      });
    }

    // Update payment với payment info
    await PaymentTracking.findByIdAndUpdate(paymentDoc._id, {
      paymentUrl: paymentLinkResponse.checkoutUrl,
      paymentData: paymentLinkData
    });

    const response = {
      success: true,
      message: 'Payment link created successfully',
      data: {
        bill: {
          ...paymentDoc,
          paymentUrl: paymentLinkResponse.checkoutUrl
        },
        packagePurchase: null, // Sẽ tạo sau khi thanh toán thành công
        paymentUrl: paymentLinkResponse.checkoutUrl, // For easier frontend access
        paymentTrackingId: paymentDoc._id,
        packageId: packageId,
        packageName: servicePackage.name,
        pricing: {
          basePrice,
          discountAmount,
          finalAmount
        }
      }
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ [Backend] Error in purchasePackage:', error);
    console.error('❌ [Backend] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    
    // Provide more specific error messages
    let errorMessage = 'Error purchasing service package';
    
    if (error.message?.includes('PAYOS')) {
      errorMessage = 'PayOS service error: ' + error.message;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to payment service';
    } else if (error.response?.data?.message) {
      errorMessage = 'PayOS API error: ' + error.response.data.message;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate purchase detected';
    } else {
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    res.status(500).json({
      success: false,
      message: 'Error purchasing service package',
      errors: { general: errorMessage }
    });
  }
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

    // Tạo package purchase
    const packagePurchaseData = {
      userId: userId,
      profileId: profileId,
      packageId: packageId,
      paymentTrackingId: bill._id,
      activatedAt: new Date(),
      expiredAt: new Date(),
      remainingUsages: 1,
      totalAllowedUses: 1,
      isActive: true
    };

    const packagePurchase = await PackagePurchases.create(packagePurchaseData);

    // Populate thông tin để trả về
    const populatedPurchase = await PackagePurchases.findById(packagePurchase._id)
      .populate('packageId', 'name description price serviceIds durationInDays maxUsages')
              .populate('paymentTrackingId', 'totalAmount status billNumber');

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


    // Build query - userId from JWT is already correct type
    const query: any = { userId: userId };
    
    if (profileId && mongoose.Types.ObjectId.isValid(profileId as string)) {
      query.profileId = profileId;
    }
    
    // Map isActive sang status: 'active'
    if (isActive !== undefined) {
      const isActiveStr = String(isActive);
      if (isActiveStr === 'true') query.status = 'active';
      if (isActiveStr === 'false') query.status = { $ne: 'active' };
    }


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
          path: 'paymentTrackingId',
          model: 'PaymentTracking',
          select: 'totalAmount status createdAt billNumber'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();



      // Filter out null packageId (deleted packages)
      packagePurchases = packagePurchases.filter(purchase => purchase.packageId);

      // 🔹 Transform data to match frontend expectation
      transformedPurchases = packagePurchases.map((purchase: any) => {
        
        // 🆕 Check and update status for each purchase
        let updatedStatus = purchase.status || 'active';
        const now = new Date();
        
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
        
        // Fix services mapping based on actual structure
        const services = (purchase.packageId?.services || []).map((service: any) => {

          
          // Handle both populated and non-populated cases
          const serviceData = service.serviceId;
          const serviceId = serviceData?._id || serviceData || service.serviceId;
          const serviceName = serviceData?.serviceName || 'Tên dịch vụ không xác định';
          
          return {
            serviceId: serviceId,
            serviceName: serviceName,
            quantity: service.quantity || 1,
            price: serviceData?.price || 0,
            description: serviceData?.description || '',
            serviceType: serviceData?.serviceType || 'consultation'
          };
        });        
        
        return {
          ...purchase,
          servicePackage: {
            ...purchase.packageId,
            services: services
          },
          totalAmount: purchase.purchasePrice || purchase.totalAmount || 0,
          // Ensure required fields are present with updated status
          status: updatedStatus,
          isActive: purchase.isActive !== false && updatedStatus === 'active',
          purchaseDate: purchase.purchaseDate || purchase.createdAt,
          expiryDate: purchase.expiryDate || purchase.expiresAt,
          expiresAt: purchase.expiryDate || purchase.expiresAt,
          remainingUsages: purchase.remainingUsages || 0,
          // Fix usedServices structure để frontend hiểu đúng
          usedServices: (purchase.usedServices || []).map((used: any) => ({
            serviceId: used.serviceId,
            usedCount: used.usedQuantity || 0, // Map usedQuantity to usedCount cho frontend
            usedQuantity: used.usedQuantity || 0,
            maxQuantity: used.maxQuantity || 1
          }))
        };
      });

      total = await PackagePurchases.countDocuments(query);
      
    } catch (populateError) {
      console.error('❌ [Backend] Populate error:', populateError);
      
      // Fallback to basic query without populate
      packagePurchases = await PackagePurchases.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // 🔹 Transform fallback data too
      transformedPurchases = packagePurchases.map((purchase: any) => {
        // 🆕 Check and update status for each purchase (fallback case)
        let updatedStatus = purchase.status || 'active';
        const now = new Date();
        
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
          servicePackage: {
            ...purchase.packageId,
            // Basic services structure cho fallback case
            services: purchase.packageId?.services?.map((service: any) => ({
              serviceId: service.serviceId,
              serviceName: service.serviceName || 'Tên dịch vụ không xác định',
              quantity: service.quantity || 1,
              price: 0, // Fallback không có populate price
              description: '',
              serviceType: 'consultation'
            })) || []
          },
          totalAmount: purchase.purchasePrice || 0,
          status: updatedStatus,
          isActive: purchase.isActive !== false && updatedStatus === 'active',
          purchaseDate: purchase.purchaseDate || purchase.createdAt,
          expiryDate: purchase.expiryDate || purchase.expiresAt,
          expiresAt: purchase.expiryDate || purchase.expiresAt,
          remainingUsages: purchase.remainingUsages || 0,
          usedServices: (purchase.usedServices || []).map((used: any) => ({
            serviceId: used.serviceId,
            usedCount: used.usedQuantity || 0,
            usedQuantity: used.usedQuantity || 0,
            maxQuantity: used.maxQuantity || 1
          }))
        };
      });
        
      total = await PackagePurchases.countDocuments(query);

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

    
    // Đếm tất cả PackagePurchases trong database
    const totalCount = await PackagePurchases.countDocuments({});

    
    // Lấy 5 records đầu tiên
    const allPurchases = await PackagePurchases.find({}).limit(5);

    
    // Kiểm tra có user nào đã mua không
    const userIds = await PackagePurchases.distinct('userId');

    
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
      .populate('profileId', 'fullName phone year gender', undefined, { strictPopulate: false })
              .populate('paymentTrackingId', 'totalAmount status billNumber createdAt');

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
              .populate('paymentTrackingId', 'totalAmount status billNumber createdAt')
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
    // Nếu là lỗi duplicate gói active, trả về 400 và message rõ ràng
    if (typeof error.message === 'string' && error.message.includes('vui lòng sử dụng hết')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
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
          daysRemaining: purchase.expiryDate ? Math.max(0, Math.ceil((new Date(purchase.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
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

    // Log system activity
    await systemLogService.logFromRequest(req as any, LogAction.PACKAGE_USE, 
      `Package service used: User consumed ${quantity} usage(s) of service ${serviceId}`, {
        level: LogLevel.PUBLIC,
        targetId: result.purchaseId || serviceId,
        targetType: 'package_purchase',
        metadata: {
          serviceId,
          quantityUsed: quantity,
          packagePurchaseId: result.purchaseId,
          action: 'package_service_usage'
        }
      }
    );

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

// 🆕 GET /package-purchases/analytics/:packageId - Lấy usage analytics cho một gói dịch vụ
export const getPackageUsageAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.params;

    if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Package ID không hợp lệ'
      };
      return res.status(400).json(response);
    }



    const analytics = await PackageAnalyticsService.getPackageUsageAnalytics(packageId);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Lấy analytics thành công',
      data: {
        analytics
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error in getPackageUsageAnalytics:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: error.message || 'Lỗi khi lấy analytics gói dịch vụ'
    };
    res.status(500).json(response);
  }
};

// 🆕 GET /package-purchases/analytics - Lấy overview analytics cho tất cả gói dịch vụ  
export const getAllPackagesAnalytics = async (req: AuthRequest, res: Response) => {
  try {


    const analytics = await PackageAnalyticsService.getAllPackagesAnalytics();

    const response: ApiResponse<any> = {
      success: true,
      message: 'Lấy overview analytics thành công',
      data: {
        analytics,
        summary: {
          totalPackages: analytics.length,
          totalRevenue: analytics.reduce((sum, pkg) => sum + pkg.totalRevenue, 0),
          totalPurchases: analytics.reduce((sum, pkg) => sum + pkg.totalPurchases, 0),
          averageUsage: analytics.length > 0 
            ? Math.round(analytics.reduce((sum, pkg) => sum + pkg.averageUsagePercentage, 0) / analytics.length)
            : 0
        }
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error in getAllPackagesAnalytics:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: error.message || 'Lỗi khi lấy overview analytics'
    };
    res.status(500).json(response);
  }
};

// Test endpoint để tạo PackagePurchase đơn giản
export const testCreatePackagePurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.body;
    const userId = req.user?._id;



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

    // Sử dụng hàm test để tạo PackagePurchase
    const purchase = await PackagePurchaseService.createTestPackagePurchase(
      userId.toString(),
      packageId
    );



    res.status(201).json({
      success: true,
      message: 'Test package purchase created successfully',
      data: {
        purchaseId: purchase._id,
        userId: purchase.userId,
        packageId: purchase.packageId,
        status: purchase.status,
        purchaseDate: purchase.purchaseDate,
        expiryDate: purchase.expiryDate
      }
    });

  } catch (error: any) {
    console.error('❌ [Test] Error creating test package purchase:', error);
    
    // Log chi tiết lỗi
    if (error.code === 11000) {
      console.error('❌ [Test] Duplicate key error - unique constraint violation');
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating test package purchase',
      error: error.message,
      code: error.code
    });
  }
};

// Webhook handler cho PayOS payment success
export const handlePayOSWebhook = async (req: Request, res: Response) => {
  try {

    
    const { code, desc, data } = req.body;
    
    // Check if payment is successful
    if (code !== '00' || !data) {
  
      return res.status(200).json({ success: false, message: 'Payment not successful' });
    }
    
    const { orderCode, amount, description, accountNumber, reference, transactionDateTime } = data;

    
    // Find payment by orderCode
    const orderCodeNum = parseInt(orderCode);

    
    const payment = await PaymentTracking.findOne({
      $expr: {
        $eq: [
          { $toInt: { $substr: [{ $toString: "$_id" }, -6, 6] } },
          orderCodeNum
        ]
      },
      status: 'pending'
    });
    
    if (!payment) {
      
      const allPendingPayments = await PaymentTracking.find({ status: 'pending' }).select('_id packageId userId');
      
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    

    
    // Update payment status
    await PaymentTracking.findByIdAndUpdate(payment._id, {
      status: 'paid',
      paidAt: new Date(),
      transactionInfo: {
        reference: reference,
        transactionDateTime: transactionDateTime
      }
    });
    

    
    // Create PackagePurchase
    const servicePackage = await ServicePackages.findById(payment.packageId);
    if (!servicePackage) {

      return res.status(404).json({ success: false, message: 'Service package not found' });
    }
    

    
    // Tính total service quantity từ package
    const totalUsages = servicePackage.services.reduce((total, service) => total + service.quantity, 0);

    
    const packagePurchaseData: any = {
      userId: payment.userId,
      packageId: payment.recordId, // Use recordId since it's the package ID for package payments
      paymentTrackingId: payment._id,
      activatedAt: new Date(),
      expiryDate: new Date(Date.now() + (servicePackage.durationInDays || 365) * 24 * 60 * 60 * 1000),
      remainingUsages: totalUsages,
      totalAllowedUses: totalUsages,
      isActive: true,
      purchasePrice: payment.totalAmount,
      status: 'active'
    };
    

    
    const packagePurchase = await PackagePurchases.create(packagePurchaseData);
    

    
    res.status(200).json({ 
      success: true, 
      message: 'Payment processed successfully',
      data: { packagePurchase, payment }
    });
    
  } catch (error: any) {
    console.error('❌ [Backend] Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
};

// Test endpoint để simulate PayOS webhook success
export const testPayOSWebhook = async (req: Request, res: Response) => {
  try {
    const { orderCode } = req.body;
    
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'orderCode required' });
    }
    

    
    // Simulate PayOS webhook payload
    const mockWebhookPayload = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: orderCode,
        amount: 5000,
        description: 'Test payment',
        accountNumber: '123456789',
        reference: `TEST_${Date.now()}`,
        transactionDateTime: new Date().toISOString()
      }
    };
    
    // Call the actual webhook handler
    const mockReq = { body: mockWebhookPayload } as Request;
    await handlePayOSWebhook(mockReq, res);
    
  } catch (error: any) {
    console.error('❌ [Test] Test webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test webhook failed',
      error: error.message 
    });
  }
}; 

// Test endpoint để kiểm tra và cập nhật package status
export const testUpdatePackageStatus = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🧪 [Test] Testing package status update...');
    
    // Tìm tất cả packages có status "active"
    const activePackages = await PackagePurchases.find({ status: 'active' });
    console.log(`📦 [Test] Found ${activePackages.length} active packages`);
    
    const results = [];
    
    for (const packagePurchase of activePackages) {
      console.log(`🔍 [Test] Checking package ${packagePurchase._id}:`);
      console.log(`  - Current status: ${packagePurchase.status}`);
      console.log(`  - Used services: ${packagePurchase.usedServices?.length || 0}`);
      
      if (packagePurchase.usedServices && packagePurchase.usedServices.length > 0) {
        packagePurchase.usedServices.forEach((service, index) => {
          console.log(`    Service ${index + 1}: ${service.usedQuantity}/${service.maxQuantity}`);
        });
      }
      
      const oldStatus = packagePurchase.status;
      const newStatus = packagePurchase.checkAndUpdateStatus();
      console.log(`  - New status: ${newStatus}`);
      
      if (newStatus !== oldStatus) {
        await packagePurchase.save();
        console.log(`✅ [Test] Updated package ${packagePurchase._id}: ${oldStatus} → ${newStatus}`);
        results.push({
          packageId: packagePurchase._id,
          oldStatus,
          newStatus,
          updated: true
        });
      } else {
        console.log(`ℹ️ [Test] Package ${packagePurchase._id} status unchanged`);
        results.push({
          packageId: packagePurchase._id,
          oldStatus,
          newStatus,
          updated: false
        });
      }
    }
    
    // Hiển thị thống kê
    const stats = await PackagePurchases.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 [Test] Status statistics:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} packages`);
    });
    
    return res.json({
      success: true,
      message: 'Package status update test completed',
      data: {
        totalPackages: activePackages.length,
        updatedPackages: results.filter(r => r.updated).length,
        results,
        statistics: stats
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Test] Error in package status update test:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing package status update',
      error: error.message
    });
  }
}; 