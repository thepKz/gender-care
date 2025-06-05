import { Request, Response } from 'express';
import ServicePackage from '../models/ServicePackage';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';

// GET /service-packages - Get all service packages (Public access)
export const getAllServicePackages = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as PaginationQuery;
    const { isActive, search } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (isActive !== undefined) {
      filter.isActive = Number(isActive);
    }
    
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [packages, total] = await Promise.all([
      ServicePackage.find(filter)
        .populate('serviceIds', 'serviceName price description serviceType availableAt')
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

    // Check if package with same name already exists
    const existingPackage = await ServicePackage.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package with this name already exists'
      };
      return res.status(409).json(response);
    }

    const newPackage = new ServicePackage({
      name,
      description,
      priceBeforeDiscount: priceBeforeDiscountNum,
      price: priceNum,
      serviceIds
    });

    const savedPackage = await newPackage.save();
    
    // Populate the saved package to return complete data
    const populatedPackage = await ServicePackage.findById(savedPackage._id)
      .populate('serviceIds', 'serviceName price description serviceType availableAt');

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
    const { name, description, priceBeforeDiscount, price, serviceIds, isActive } = req.body;

    // Check if package exists
    const existingPackage = await ServicePackage.findById(id);
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found'
      };
      return res.status(404).json(response);
    }

    // Check if new name conflicts with existing package
    if (name && name !== existingPackage.name) {
      const duplicatePackage = await ServicePackage.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
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
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (priceBeforeDiscount) updateData.priceBeforeDiscount = Number(priceBeforeDiscount);
    if (price) updateData.price = Number(price);
    if (serviceIds) updateData.serviceIds = serviceIds;
    if (isActive !== undefined) updateData.isActive = Number(isActive);

    const updatedPackage = await ServicePackage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('serviceIds', 'serviceName price description serviceType availableAt');

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

// DELETE /service-packages/:id - Delete service package
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if package exists
    const existingPackage = await ServicePackage.findById(id);
    if (!existingPackage) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service package not found'
      };
      return res.status(404).json(response);
    }

    // Delete the package
    await ServicePackage.findByIdAndDelete(id);

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