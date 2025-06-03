import { Response } from 'express';
import Service from '../models/Service';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';

// GET /services - Get all services
export const getAllServices = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as PaginationQuery;
    const { serviceType, availableAt, search } = req.query;

    // Build filter object
    const filter: any = { isDeleted: 0 };
    
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    
    if (availableAt) {
      filter.availableAt = { $in: [availableAt] };
    }
    
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Service.countDocuments(filter)
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        services,
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
      message: 'Error fetching services',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /services - Create new service
export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceName, price, description, serviceType, availableAt } = req.body;

    // Validation
    if (!serviceName || !price || !description || !serviceType || !availableAt) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'All fields are required',
        errors: {
          serviceName: !serviceName ? 'Service name is required' : '',
          price: !price ? 'Price is required' : '',
          description: !description ? 'Description is required' : '',
          serviceType: !serviceType ? 'Service type is required' : '',
          availableAt: !availableAt ? 'Available locations are required' : ''
        }
      };
      return res.status(400).json(response);
    }

    // Check if service already exists
    const existingService = await Service.findOne({ 
      serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
      isDeleted: 0 
    });
    
    if (existingService) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service with this name already exists'
      };
      return res.status(409).json(response);
    }

    const newService = new Service({
      serviceName,
      price: Number(price),
      description,
      serviceType,
      availableAt: Array.isArray(availableAt) ? availableAt : [availableAt]
    });

    const savedService = await newService.save();

    const response: ApiResponse<any> = {
      success: true,
      data: savedService,
      message: 'Service created successfully'
    };

    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error creating service',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// PUT /services/:id - Update service
export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { serviceName, price, description, serviceType, availableAt } = req.body;

    // Check if service exists and is not deleted
    const service = await Service.findOne({ _id: id, isDeleted: 0 });
    if (!service) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service not found'
      };
      return res.status(404).json(response);
    }

    // Check if new name conflicts with existing service
    if (serviceName && serviceName !== service.serviceName) {
      const existingService = await Service.findOne({
        serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: 0
      });
      
      if (existingService) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service with this name already exists'
        };
        return res.status(409).json(response);
      }
    }

    // Update fields
    const updateData: any = {};
    if (serviceName) updateData.serviceName = serviceName;
    if (price) updateData.price = Number(price);
    if (description) updateData.description = description;
    if (serviceType) updateData.serviceType = serviceType;
    if (availableAt) updateData.availableAt = Array.isArray(availableAt) ? availableAt : [availableAt];

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    const response: ApiResponse<any> = {
      success: true,
      data: updatedService,
      message: 'Service updated successfully'
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error updating service',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// DELETE /services/:id - Soft delete service
export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists and is not already deleted
    const service = await Service.findOne({ _id: id, isDeleted: 0 });
    if (!service) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service not found'
      };
      return res.status(404).json(response);
    }

    // Soft delete the service
    await Service.findByIdAndUpdate(id, { isDeleted: 1 });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Service deleted successfully'
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error deleting service',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
}; 