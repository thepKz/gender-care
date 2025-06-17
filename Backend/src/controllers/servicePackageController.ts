import { Request, Response } from 'express';
import ServicePackage from '../models/ServicePackage';
import ServicePackages from '../models/ServicePackages';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';
import { PackagePricingService } from '../services/packagePricingService';
import mongoose from 'mongoose';

// GET /service-packages - Get all service packages (removed search functionality)
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

    // Search by service - find packages that contain specific service
    if (serviceId && typeof serviceId === 'string') {
      filter.serviceIds = { $in: [serviceId] };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [packages, total] = await Promise.all([
      ServicePackages.find(filter)
        .populate({
          path: 'serviceIds',
          select: 'serviceName price description serviceType availableAt isDeleted',
          match: { isDeleted: 0 } // Only populate active services
        })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServicePackages.countDocuments(filter)
    ]);

    // Add pricing information for each package
    const packagesWithPricing = await Promise.all(
      packages.map(async (pkg) => {
        try {
          // Package đã là plain object từ .lean() nên không cần toObject()
          const pricingResult = await PackagePricingService.calculatePackagePricing(pkg);
          const valueMetrics = PackagePricingService.calculateValueMetrics(
            pricingResult.baseServicePrice,
            pricingResult.discountPrice,
            pricingResult.originalPrice
          );
          return {
            ...pkg,
            pricingInfo: pricingResult,
            valueMetrics
          };
        } catch (error: unknown) {
          console.error(`Error calculating pricing for package ${pkg._id}:`, error);
          return pkg;
        }
      })
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages: packagesWithPricing,
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

// POST /service-packages/search - Search service packages (new endpoint)
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

    // Search by service - find packages that contain specific service
    if (serviceId && typeof serviceId === 'string') {
      filter.serviceIds = { $in: [serviceId] };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [packages, total] = await Promise.all([
      ServicePackages.find(filter)
        .populate({
          path: 'serviceIds',
          select: 'serviceName price description serviceType availableAt isDeleted',
          match: { isDeleted: 0 } // Only populate active services
        })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServicePackages.countDocuments(filter)
    ]);

    // Add pricing information for each package
    const packagesWithPricing = await Promise.all(
      packages.map(async (pkg) => {
        try {
          // Package đã là plain object từ .lean() nên không cần toObject()
          const pricingResult = await PackagePricingService.calculatePackagePricing(pkg);
          const valueMetrics = PackagePricingService.calculateValueMetrics(
            pricingResult.baseServicePrice,
            pricingResult.discountPrice,
            pricingResult.originalPrice
          );
          return {
            ...pkg,
            pricingInfo: pricingResult,
            valueMetrics
          };
        } catch (error: unknown) {
          console.error(`Error calculating pricing for package ${pkg._id}:`, error);
          return pkg;
        }
      })
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages: packagesWithPricing,
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

// POST /service-packages - Create new service package with auto-calculated price
export const createServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, discountPrice, serviceIds, durationInDays, maxUsages, maxProfiles } = req.body;

    // Validation
    if (!name || !description || !discountPrice || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0 || !durationInDays || !maxUsages || !maxProfiles || !Array.isArray(maxProfiles)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'All fields are required',
        errors: {
          name: !name ? 'Package name is required' : '',
          description: !description ? 'Description is required' : '',
          discountPrice: !discountPrice ? 'Discount price is required' : '',
          serviceIds: (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) ? 'At least one service must be selected' : '',
          durationInDays: !durationInDays ? 'Duration in days is required' : '',
          maxUsages: !maxUsages ? 'Max usages is required' : '',
          maxProfiles: (!maxProfiles || !Array.isArray(maxProfiles) || maxProfiles.length === 0) ? 'Profile options are required' : ''
        }
      };
      return res.status(400).json(response);
    }

    // Auto-calculate price from services and maxUsages
    const autoPrice = await PackagePricingService.calculateAutoPrice(serviceIds, maxUsages);

    // Validate package data using pricing service
    try {
      PackagePricingService.validatePackageData({ 
        discountPrice: Number(discountPrice),
        serviceIds, 
        durationInDays: Number(durationInDays), 
        maxUsages: Number(maxUsages),
        maxProfiles
      });
    } catch (error: any) {
      const response: ApiResponse<any> = {
        success: false,
        message: error.message,
        errors: { validation: error.message }
      };
      return res.status(400).json(response);
    }

    // Validate that all serviceIds exist and are not deleted
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      isDeleted: 0 
    });
    
    if (services.length !== serviceIds.length) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'One or more services not found or have been deleted'
      };
      return res.status(400).json(response);
    }

    // Validate discount price not higher than calculated price
    if (Number(discountPrice) > autoPrice.calculatedPrice) {
      const response: ApiResponse<any> = {
        success: false,
        message: `Discount price (${Number(discountPrice).toLocaleString()}đ) cannot be higher than calculated price (${autoPrice.calculatedPrice.toLocaleString()}đ)`
      };
      return res.status(400).json(response);
    }

    // Check if package with same name already exists (including deleted ones)
    const existingPackage = await ServicePackages.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingPackage) {
      if (!existingPackage.isActive) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service package with this name exists but is deleted. Please recover it instead of creating new one.'
        };
        return res.status(409).json(response);
      } else {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service package with this name already exists'
        };
        return res.status(409).json(response);
      }
    }

    const newPackage = new ServicePackages({
      name: name.trim(),
      description: description.trim(),
      price: autoPrice.calculatedPrice,        // Giá gốc được tính tự động
      discountPrice: Number(discountPrice),
      serviceIds,
      durationInDays: Number(durationInDays),
      maxUsages: Number(maxUsages),
      maxProfiles,                             // Multi-profile support
      isActive: true
    });

    const savedPackage = await newPackage.save();
    
    // Populate the saved package to return complete data with pricing
    const populatedPackage = await ServicePackages.findById(savedPackage._id)
      .populate({
        path: 'serviceIds',
        select: 'serviceName price description serviceType availableAt duration',
        match: { isDeleted: 0 }
      });

    // Calculate and add pricing information
    const pricingInfo = await PackagePricingService.calculatePackagePricing(savedPackage);
    
    // Calculate value metrics
    const valueMetrics = PackagePricingService.calculateValueMetrics(
      pricingInfo.baseServicePrice,
      pricingInfo.discountPrice,
      pricingInfo.originalPrice
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        package: populatedPackage,
        pricingInfo,
        valueMetrics,
        autoCalculation: {
          totalServicePrice: autoPrice.totalServicePrice,
          calculatedPrice: autoPrice.calculatedPrice,
          formula: `${autoPrice.totalServicePrice.toLocaleString()}đ × ${maxUsages} lượt = ${autoPrice.calculatedPrice.toLocaleString()}đ`
        }
      },
      message: 'Service package created successfully'
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating service package:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Internal server error'
    };
    res.status(500).json(response);
  }
};

// PUT /service-packages/:id - Update service package with auto-calculated price
export const updateServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, discountPrice, serviceIds, durationInDays, maxUsages, maxProfiles, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid package ID'
      };
      return res.status(400).json(response);
    }

    const existingPackage = await ServicePackages.findById(id);
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found'
      };
      return res.status(404).json(response);
    }

    // Auto-calculate price if services or maxUsages changed
    let autoPrice: any = null;
    let calculatedPrice = existingPackage.price; // Keep existing if not changed
    
    if (serviceIds || maxUsages) {
      const finalServiceIds = serviceIds || existingPackage.serviceIds;
      const finalMaxUsages = maxUsages || existingPackage.maxUsages;
      
      autoPrice = await PackagePricingService.calculateAutoPrice(
        finalServiceIds.map((id: any) => id.toString()), 
        finalMaxUsages
      );
      calculatedPrice = autoPrice.calculatedPrice;
    }

    // Validate pricing if both prices are provided
    if (discountPrice && Number(discountPrice) > calculatedPrice) {
      const response: ApiResponse<any> = {
        success: false,
        message: `Discount price (${Number(discountPrice).toLocaleString()}đ) cannot be higher than calculated price (${calculatedPrice.toLocaleString()}đ)`
      };
      return res.status(400).json(response);
    }

    // Validate subscription fields if provided
    if (durationInDays && (durationInDays < 1 || durationInDays > 365)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Duration must be between 1 and 365 days'
      };
      return res.status(400).json(response);
    }

    if (maxUsages && (maxUsages < 1 || maxUsages > 1000)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Max usages must be between 1 and 1000'
      };
      return res.status(400).json(response);
    }

    // Validate multi-profile fields if provided
    if (maxProfiles) {
      if (!Array.isArray(maxProfiles) || maxProfiles.length === 0) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'maxProfiles must be a non-empty array'
        };
        return res.status(400).json(response);
      }
      
      const validProfileCounts = maxProfiles.every((p: number) => Number.isInteger(p) && p >= 1 && p <= 4);
      if (!validProfileCounts) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'maxProfiles must contain valid profile counts (1-4)'
        };
        return res.status(400).json(response);
      }
    }

    // Update fields
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (discountPrice) updateData.discountPrice = Number(discountPrice);
    if (serviceIds) updateData.serviceIds = serviceIds;
    if (durationInDays) updateData.durationInDays = Number(durationInDays);
    if (maxUsages) updateData.maxUsages = Number(maxUsages);
    if (maxProfiles) updateData.maxProfiles = maxProfiles;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    // Always update calculated price if services or maxUsages changed
    if (autoPrice) {
      updateData.price = calculatedPrice;
    }

    const updatedPackage = await ServicePackages.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'serviceIds',
      select: 'serviceName price description serviceType availableAt duration',
      match: { isDeleted: 0 }
    });

    if (!updatedPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Failed to update service package'
      };
      return res.status(500).json(response);
    }

    // Calculate and add pricing information
    const pricingInfo = await PackagePricingService.calculatePackagePricing(updatedPackage);
    
    // Calculate value metrics
    const valueMetrics = PackagePricingService.calculateValueMetrics(
      pricingInfo.baseServicePrice,
      pricingInfo.discountPrice,
      pricingInfo.originalPrice
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        package: updatedPackage,
        pricingInfo,
        valueMetrics,
        ...(autoPrice && {
          autoCalculation: {
            totalServicePrice: autoPrice.totalServicePrice,
            calculatedPrice: autoPrice.calculatedPrice,
            formula: `${autoPrice.totalServicePrice.toLocaleString()}đ × ${updateData.maxUsages || existingPackage.maxUsages} lượt = ${autoPrice.calculatedPrice.toLocaleString()}đ`
          }
        })
      },
      message: 'Service package updated successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error updating service package:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Internal server error'
    };
    res.status(500).json(response);
  }
};

// DELETE /service-packages/:id - Soft delete service package
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid package ID'
      };
      return res.status(400).json(response);
    }

    // Check if package exists and is not already deleted
    const existingPackage = await ServicePackages.findOne({ _id: id, isActive: true });
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or already deleted'
      };
      return res.status(404).json(response);
    }

    // Soft delete the package
    await ServicePackages.findByIdAndUpdate(id, { 
      isActive: false
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package deleted successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error deleting service package:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error deleting service package'
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/:id/recover - Recover deleted service package
export const recoverServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if package exists and is deleted
    const packageToRecover = await ServicePackages.findOne({ _id: id, isActive: false });
    if (!packageToRecover) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or is not deleted'
      };
      return res.status(404).json(response);
    }

    // Check if there's already an active package with the same name
    const existingActivePackage = await ServicePackages.findOne({
      name: { $regex: new RegExp(`^${packageToRecover.name}$`, 'i') },
      _id: { $ne: id },
      isActive: true
    });

    if (existingActivePackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: `Cannot recover service package. An active package with name "${packageToRecover.name}" already exists.`
      };
      return res.status(409).json(response);
    }

    // Check if all services in the package are still available
    const services = await Service.find({ 
      _id: { $in: packageToRecover.serviceIds },
      isDeleted: 0 
    });

    if (services.length !== packageToRecover.serviceIds.length) {
      const deletedServiceIds = packageToRecover.serviceIds.filter(serviceId => 
        !services.some(service => (service as any)._id.toString() === serviceId.toString())
      );

      const response: ApiResponse<any> = {
        success: false,
        message: `Cannot recover service package. Some services in this package have been deleted. Please update the package services first.`,
        errors: {
          deletedServices: `Deleted service IDs: ${deletedServiceIds.join(', ')}`
        }
      };
      return res.status(400).json(response);
    }

    // Recover the package
    const recoveredPackage = await ServicePackages.findByIdAndUpdate(
      id,
      { 
        isActive: true
      },
      { new: true }
    ).populate({
      path: 'serviceIds',
      select: 'serviceName price description serviceType availableAt duration',
      match: { isDeleted: 0 }
    });

    const response: ApiResponse<any> = {
      success: true,
      data: recoveredPackage,
      message: 'Service package recovered successfully'
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

// GET /service-packages/:id/pricing - Get pricing information for a specific package
export const getPackagePricing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Invalid package ID'
      };
      return res.status(400).json(response);
    }

    // Find the package
    const packageData = await ServicePackages.findOne({ _id: id, isActive: true })
      .populate({
        path: 'serviceIds',
        select: 'serviceName price description serviceType availableAt',
        match: { isDeleted: 0 }
      });

    if (!packageData) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or is not active'
      };
      return res.status(404).json(response);
    }

    // Calculate pricing với as any để tránh lỗi type
    const pricingInfo = await PackagePricingService.calculatePackagePricing(packageData);
    
    // Calculate value metrics
    const valueMetrics = PackagePricingService.calculateValueMetrics(
      pricingInfo.baseServicePrice,
      pricingInfo.discountPrice,
      pricingInfo.originalPrice
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        package: packageData,
        pricingInfo,
        valueMetrics
      },
      message: 'Package pricing calculated successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error calculating package pricing:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error calculating package pricing'
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/calculate-auto-price - Calculate auto price for service packages
export const calculateAutoPrice = async (req: Request, res: Response) => {
  try {
    const { serviceIds, maxUsages } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'serviceIds must be a non-empty array'
      };
      return res.status(400).json(response);
    }

    if (!maxUsages || maxUsages < 1) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'maxUsages must be a positive number'
      };
      return res.status(400).json(response);
    }

    // Validate that all serviceIds exist and are not deleted
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      isDeleted: 0 
    });
    
    if (services.length !== serviceIds.length) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'One or more services not found or have been deleted'
      };
      return res.status(400).json(response);
    }

    // Calculate auto price
    const autoPrice = await PackagePricingService.calculateAutoPrice(serviceIds, maxUsages);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalServicePrice: autoPrice.totalServicePrice,
        calculatedPrice: autoPrice.calculatedPrice,
        maxUsages,
        formula: `${autoPrice.totalServicePrice.toLocaleString()}đ × ${maxUsages} lượt = ${autoPrice.calculatedPrice.toLocaleString()}đ`,
        services: services.map(service => ({
          id: service._id,
          name: service.serviceName,
          price: service.price
        }))
      },
      message: 'Auto price calculated successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error calculating auto price:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error calculating auto price'
    };
    res.status(500).json(response);
  }
};

// POST /service-packages/:id/usage-projection - Calculate usage projection for planning
export const getUsageProjection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expectedUsagePerWeek } = req.body;

    if (!expectedUsagePerWeek || expectedUsagePerWeek < 0) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'expectedUsagePerWeek must be a positive number',
        errors: { expectedUsagePerWeek: 'Invalid expected usage per week' }
      };
      return res.status(400).json(response);
    }

    // Find the package
    const packageData = await ServicePackages.findOne({ _id: id, isActive: true });

    if (!packageData) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or is not active'
      };
      return res.status(404).json(response);
    }

    // Calculate usage projection
    const usageProjection = PackagePricingService.calculateUsageProjection(
      packageData.durationInDays,
      packageData.maxUsages,
      expectedUsagePerWeek
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packageId: packageData._id,
        packageName: packageData.name,
        durationInDays: packageData.durationInDays,
        maxUsages: packageData.maxUsages,
        expectedUsagePerWeek,
        projection: usageProjection,
        recommendation: usageProjection.recommendation === 'perfect' ? 
          'This package is perfect for your usage pattern' :
          usageProjection.recommendation === 'over' ?
          'You might not use all available usages - consider a smaller package' :
          'You might exceed the usage limit - consider a larger package'
      },
      message: 'Usage projection calculated successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error calculating usage projection:', error);
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error calculating usage projection'
    };
    res.status(500).json(response);
  }
}; 