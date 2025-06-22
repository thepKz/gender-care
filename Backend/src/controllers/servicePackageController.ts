import { Request, Response } from 'express';
import ServicePackages from '../models/ServicePackages';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';
import { PackagePricingService } from '../services/packagePricingService';
import mongoose from 'mongoose';

// GET /service-packages - Get all service packages (updated for new schema)
export const getAllServicePackages = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      includeDeleted = false 
    } = req.query as PaginationQuery & { includeDeleted?: boolean | string };
    
    const { serviceId } = req.query;

    // Build filter object
    const filter: any = {};
    
    // Include deleted packages only if explicitly requested AND user is manager
    const shouldIncludeDeleted = (includeDeleted === true || includeDeleted === 'true');
    
    // Check if user is authenticated and is manager
    const authReq = req as AuthRequest;
    const userRole = authReq.user?.role || null;
    const isManager = userRole === 'manager';
    
    if (shouldIncludeDeleted && isManager) {
      // No filter on isActive - show all packages (including deleted)
      console.log('Manager requested includeDeleted - showing all packages');
    } else {
      filter.isActive = true; // Only active packages
      if (shouldIncludeDeleted && !isManager) {
        console.log('Non-manager user requested includeDeleted - ignored, showing only active packages');
      }
    }

    // 🔹 Updated: Search by service in new schema
    if (serviceId && typeof serviceId === 'string') {
      filter['services.serviceId'] = serviceId;
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [packages, total] = await Promise.all([
      ServicePackages.find(filter)
        .populate({
          path: 'services.serviceId',
          select: 'serviceName price description serviceType availableAt isDeleted',
          match: { isDeleted: 0 } // Only populate active services
        })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServicePackages.countDocuments(filter)
    ]);

    // 🔹 Simplified response - no complex pricing calculations
    const packagesWithInfo = packages.map(pkg => ({
            ...pkg,
      totalServiceQuantity: pkg.services.reduce((sum: number, service: any) => sum + service.quantity, 0),
      serviceCount: pkg.services.length
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages: packagesWithInfo,
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
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error fetching service packages',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/search - Search service packages (updated)
export const searchServicePackages = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query as PaginationQuery;
    
    const { search, serviceId } = req.body;

    // Build filter object
    const filter: any = { isActive: true }; // Only active packages for search
    
    // Enhanced search - case insensitive, partial match for package name and description
    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // 🔹 Updated: Search by service in new schema
    if (serviceId && typeof serviceId === 'string') {
      filter['services.serviceId'] = serviceId;
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [packages, total] = await Promise.all([
      ServicePackages.find(filter)
        .populate({
          path: 'services.serviceId',
          select: 'serviceName price description serviceType availableAt isDeleted',
          match: { isDeleted: 0 } // Only populate active services
        })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServicePackages.countDocuments(filter)
    ]);

    // 🔹 Simplified response
    const packagesWithInfo = packages.map(pkg => ({
            ...pkg,
      totalServiceQuantity: pkg.services.reduce((sum: number, service: any) => sum + service.quantity, 0),
      serviceCount: pkg.services.length
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages: packagesWithInfo,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        },
        searchQuery: search?.trim() || ''
      }
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error searching service packages',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /service-packages - Create new service package (updated)
export const createServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      priceBeforeDiscount,
      price,
      services, // 🔹 Changed from serviceIds to services
      durationInDays = 30
    } = req.body;

    // Validation
    if (!name || !price || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Package name is required' : undefined,
          price: !price ? 'Price is required' : undefined,
          services: (!services || !Array.isArray(services) || services.length === 0) 
            ? 'At least one service is required' : undefined
        }
      });
    }

    // 🔹 Validate services format: [{serviceId, quantity}]
    for (const service of services) {
      if (!service.serviceId || !service.quantity || service.quantity < 1) {
        return res.status(400).json({
        success: false,
          message: 'Invalid service format',
          errors: { services: 'Each service must have serviceId and quantity >= 1' }
        });
      }
    }

    // 🔹 Validate all service IDs exist
    const serviceIds = services.map(s => s.serviceId);
    const existingServices = await Service.find({ 
      _id: { $in: serviceIds },
      isDeleted: 0 
    }).select('_id');
    
    if (existingServices.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some services not found or inactive',
        errors: { services: 'Invalid service IDs provided' }
      });
    }

    // Create package
    const newPackage = new ServicePackages({
      name: name.trim(),
      description: description?.trim(),
      priceBeforeDiscount: priceBeforeDiscount || price,
      price,
      services,
      durationInDays,
      isActive: true
    });

    await newPackage.save();
    
    // Return with populated services
    const savedPackage = await ServicePackages.findById(newPackage._id)
      .populate('services.serviceId', 'serviceName price description');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package created successfully',
      data: savedPackage
    };

    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error creating service package',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// PUT /service-packages/:id - Update service package (updated)
export const updateServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID',
        errors: { id: 'Invalid package ID format' }
      });
    }

    const existingPackage = await ServicePackages.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
        errors: { package: 'Package does not exist' }
      });
    }

    // 🔹 If updating services, validate format
    if (updateData.services) {
      if (!Array.isArray(updateData.services) || updateData.services.length === 0) {
        return res.status(400).json({
        success: false,
          message: 'Services must be a non-empty array',
          errors: { services: 'Invalid services format' }
        });
    }

      // Validate each service
      for (const service of updateData.services) {
        if (!service.serviceId || !service.quantity || service.quantity < 1) {
          return res.status(400).json({
        success: false,
            message: 'Invalid service format',
            errors: { services: 'Each service must have serviceId and quantity >= 1' }
          });
        }
    }

      // Validate service IDs exist
      const serviceIds = updateData.services.map((s: any) => s.serviceId);
      const existingServices = await Service.find({ 
        _id: { $in: serviceIds }, 
        isDeleted: 0 
      }).select('_id');

      if (existingServices.length !== serviceIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some services not found or inactive',
          errors: { services: 'Invalid service IDs provided' }
        });
      }
    }

    // Update package
    const updatedPackage = await ServicePackages.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('services.serviceId', 'serviceName price description');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package updated successfully',
      data: updatedPackage
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error updating service package',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// DELETE /service-packages/:id - Soft delete service package
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID',
        errors: { id: 'Invalid package ID format' }
      });
    }

    const updatedPackage = await ServicePackages.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
        errors: { package: 'Package does not exist' }
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package deleted successfully',
      data: updatedPackage
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error deleting service package',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/:id/recover - Recover deleted service package
export const recoverServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID',
        errors: { id: 'Invalid package ID format' }
      });
    }

    const recoveredPackage = await ServicePackages.findByIdAndUpdate(
      id,
      { isActive: true, updatedAt: new Date() },
      { new: true }
    ).populate('services.serviceId', 'serviceName price description');

    if (!recoveredPackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
        errors: { package: 'Package does not exist' }
    });
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package recovered successfully',
      data: recoveredPackage
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error recovering service package',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// GET /service-packages/:id - Get single service package
export const getServicePackageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID',
        errors: { id: 'Invalid package ID format' }
      });
    }

    const servicePackage = await ServicePackages.findOne({ _id: id, isActive: true })
      .populate('services.serviceId', 'serviceName price description serviceType');

    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
        errors: { package: 'Package does not exist or is inactive' }
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: servicePackage
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error fetching service package',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// GET /service-packages/:id/pricing - Get package pricing info (simplified)
export const getPackagePricing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID',
        errors: { id: 'Invalid package ID format' }
      });
    }

    const pricingInfo = await PackagePricingService.calculatePackageValue(id);

    const response: ApiResponse<any> = {
      success: true,
      data: pricingInfo
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error calculating package pricing',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/calculate-price - Calculate auto price from services and maxUsages
export const calculateAutoPrice = async (req: Request, res: Response) => {
  try {
    const { serviceIds, maxUsages } = req.body;

    // Validation
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service IDs are required'
      };
      return res.status(400).json(response);
    }

    if (!maxUsages || maxUsages < 1) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Max usages must be at least 1'
      };
      return res.status(400).json(response);
    }

    // Auto-calculate price
    const autoPrice = await PackagePricingService.calculateAutoPrice(serviceIds, maxUsages);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalServicePrice: autoPrice.totalServicePrice,
        calculatedPrice: autoPrice.calculatedPrice,
        formula: `${autoPrice.totalServicePrice.toLocaleString()}đ × ${maxUsages} lượt = ${autoPrice.calculatedPrice.toLocaleString()}đ`
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error calculating auto price:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: error.message || 'Internal server error'
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/:id/usage-projection - Calculate usage projection
export const getUsageProjection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expectedUsagePerWeek } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid package ID'
      };
      return res.status(400).json(response);
    }

    if (!expectedUsagePerWeek || expectedUsagePerWeek < 0) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Expected usage per week is required and must be positive'
      };
      return res.status(400).json(response);
    }

    const packageData = await ServicePackages.findById(id);
    if (!packageData) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found'
      };
      return res.status(404).json(response);
    }

    // Calculate usage projection
    // Calculate total services in package
    const totalServicesInPackage = packageData.services?.reduce(
      (sum, service) => sum + service.quantity, 0
    ) || 0;

    const projection = PackagePricingService.calculateUsageProjection(
      packageData.durationInDays,
      totalServicesInPackage, // Use total service quantity instead of maxUsages
      Number(expectedUsagePerWeek)
    );

    // Generate recommendation text
    let recommendation = '';
    if (projection.recommendation === 'perfect') {
      recommendation = 'Gói dịch vụ này phù hợp với nhu cầu sử dụng của bạn.';
    } else if (projection.recommendation === 'over') {
      recommendation = 'Gói dịch vụ này có thể lớn hơn nhu cầu của bạn. Bạn có thể tiết kiệm bằng cách chọn gói nhỏ hơn.';
    } else {
      recommendation = 'Gói dịch vụ này có thể không đủ cho nhu cầu của bạn. Bạn nên xem xét gói lớn hơn.';
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packageId: packageData._id,
        packageName: packageData.name,
        durationInDays: packageData.durationInDays,
        totalServicesInPackage: totalServicesInPackage,
        expectedUsagePerWeek,
        projection,
        recommendation
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error calculating usage projection:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Internal server error'
    };
    res.status(500).json(response);
  }
}; 