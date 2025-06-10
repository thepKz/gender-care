import { Request, Response } from 'express';
import ServicePackage from '../models/ServicePackage';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';

// GET /service-packages - Get all service packages with enhanced search and filter options
export const getAllServicePackages = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      includeDeleted = false 
    } = req.query as PaginationQuery & { includeDeleted?: boolean | string };
    
    const { search, serviceId } = req.query;

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
      filter.isActive = 1; // Only active packages
      if (shouldIncludeDeleted && !isManager) {
        console.log('Non-manager user requested includeDeleted - ignored, showing only active packages');
      }
    }
    
    // Enhanced search - case insensitive, partial match for package name and description
    if (search && typeof search === 'string') {
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
      ServicePackage.find(filter)
        .populate({
          path: 'serviceIds',
          select: 'serviceName price description serviceType availableAt isDeleted',
          match: { isDeleted: 0 } // Only populate active services
        })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServicePackage.countDocuments(filter)
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages,
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

// POST /service-packages - Create new service package
export const createServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, priceBeforeDiscount, price, serviceIds } = req.body;

    // Validation
    if (!name || !description || !priceBeforeDiscount || !price || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'All fields are required',
        errors: {
          name: !name ? 'Package name is required' : '',
          description: !description ? 'Description is required' : '',
          priceBeforeDiscount: !priceBeforeDiscount ? 'Original price is required' : '',
          price: !price ? 'Current price is required' : '',
          serviceIds: (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) ? 'At least one service must be selected' : ''
        }
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

    // Validate pricing
    const priceBeforeDiscountNum = Number(priceBeforeDiscount);
    const priceNum = Number(price);
    
    if (priceNum > priceBeforeDiscountNum) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Discounted price cannot be higher than original price'
      };
      return res.status(400).json(response);
    }

    // Check if package with same name already exists (including deleted ones)
    const existingPackage = await ServicePackage.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingPackage) {
      if (existingPackage.isActive === 0) {
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

    const newPackage = new ServicePackage({
      name: name.trim(),
      description: description.trim(),
      priceBeforeDiscount: priceBeforeDiscountNum,
      price: priceNum,
      serviceIds,
      isActive: 1
    });

    const savedPackage = await newPackage.save();
    
    // Populate the saved package to return complete data
    const populatedPackage = await ServicePackage.findById(savedPackage._id)
      .populate({
        path: 'serviceIds',
        select: 'serviceName price description serviceType availableAt',
        match: { isDeleted: 0 }
      });

    const response: ApiResponse<any> = {
      success: true,
      data: populatedPackage,
      message: 'Service package created successfully'
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

// PUT /service-packages/:id - Update service package
export const updateServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, priceBeforeDiscount, price, serviceIds } = req.body;

    // Check if package exists and is not deleted
    const existingPackage = await ServicePackage.findOne({ _id: id, isActive: 1 });
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or has been deleted'
      };
      return res.status(404).json(response);
    }

    // Check if new name conflicts with existing package
    if (name && name.trim() !== existingPackage.name) {
      const duplicatePackage = await ServicePackage.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id },
        isActive: 1
      });
      
      if (duplicatePackage) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service package with this name already exists'
        };
        return res.status(409).json(response);
      }
    }

    // Validate serviceIds if provided
    if (serviceIds && Array.isArray(serviceIds)) {
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
    }

    // Validate pricing if both prices are provided
    if (priceBeforeDiscount && price) {
      const priceBeforeDiscountNum = Number(priceBeforeDiscount);
      const priceNum = Number(price);
      
      if (priceNum > priceBeforeDiscountNum) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Discounted price cannot be higher than original price'
        };
        return res.status(400).json(response);
      }
    }

    // Update fields
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (priceBeforeDiscount) updateData.priceBeforeDiscount = Number(priceBeforeDiscount);
    if (price) updateData.price = Number(price);
    if (serviceIds) updateData.serviceIds = serviceIds;

    const updatedPackage = await ServicePackage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'serviceIds',
      select: 'serviceName price description serviceType availableAt',
      match: { isDeleted: 0 }
    });

    const response: ApiResponse<any> = {
      success: true,
      data: updatedPackage,
      message: 'Service package updated successfully'
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

// DELETE /service-packages/:id - Soft delete service package with delete note
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteNote } = req.body;

    // Validation
    if (!deleteNote || !deleteNote.trim()) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Delete note is required',
        errors: { deleteNote: 'Please provide a reason for deletion' }
      };
      return res.status(400).json(response);
    }

    // Check if package exists and is not already deleted
    const existingPackage = await ServicePackage.findOne({ _id: id, isActive: 1 });
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or already deleted'
      };
      return res.status(404).json(response);
    }

    // Soft delete the package with delete note
    await ServicePackage.findByIdAndUpdate(id, { 
      isActive: 0,
      deleteNote: deleteNote.trim()
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service package deleted successfully'
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

    // Check if package exists and is deleted
    const packageToRecover = await ServicePackage.findOne({ _id: id, isActive: 0 });
    if (!packageToRecover) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found or is not deleted'
      };
      return res.status(404).json(response);
    }

    // Check if there's already an active package with the same name
    const existingActivePackage = await ServicePackage.findOne({
      name: { $regex: new RegExp(`^${packageToRecover.name}$`, 'i') },
      _id: { $ne: id },
      isActive: 1
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
    const recoveredPackage = await ServicePackage.findByIdAndUpdate(
      id,
      { 
        isActive: 1,
        deleteNote: null
      },
      { new: true }
    ).populate({
      path: 'serviceIds',
      select: 'serviceName price description serviceType availableAt',
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