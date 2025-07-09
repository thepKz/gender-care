import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Service from '../models/Service';
import ServicePackages from '../models/ServicePackages';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';
import systemLogService from '../services/systemLogService';
import { LogAction, LogLevel } from '../models/SystemLogs';

// GET /services - Get all services (removed search functionality)
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      includeDeleted = false 
    } = req.query as PaginationQuery & { includeDeleted?: boolean | string };
    
    const { serviceType, availableAt } = req.query;

    // Build filter object
    const filter: any = {};
    
    // Include deleted services only if explicitly requested AND user is manager
    const shouldIncludeDeleted = (includeDeleted === true || includeDeleted === 'true');
    
    // Check if user is authenticated and is manager
    const authReq = req as AuthRequest;
    const userRole = authReq.user?.role || null;
    const isManager = userRole === 'manager';
    
    if (shouldIncludeDeleted && isManager) {
      // No filter on isDeleted - show all services (including deleted)
      console.log('Manager requested includeDeleted - showing all services');
    } else {
      filter.isDeleted = 0; // Only active services
      if (shouldIncludeDeleted && !isManager) {
        console.log('Non-manager user requested includeDeleted - ignored, showing only active services');
      }
    }
    
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    
    if (availableAt) {
      filter.availableAt = { $in: [availableAt] };
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

// POST /services/search - Search services (new endpoint)
export const searchServices = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query as PaginationQuery;
    
    const { search, serviceType, availableAt } = req.body;

    // Build filter object
    const filter: any = { isDeleted: 0 }; // Only active services for search
    
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    
    if (availableAt) {
      filter.availableAt = { $in: [availableAt] };
    }
    
    // Enhanced search - case insensitive, partial match
    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { serviceName: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
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
        },
        searchQuery: search?.trim() || ''
      }
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error searching services',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// POST /services - Create new service
export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceName, price, description, serviceType, availableAt, status } = req.body;

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

    // Check if service already exists (including deleted ones)
    const existingService = await Service.findOne({ 
      serviceName: { $regex: new RegExp(`^${serviceName.trim()}$`, 'i') }
    });
    
    if (existingService) {
      if (existingService.isDeleted === 1) {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service with this name exists but is deleted. Please recover it instead of creating new one.'
        };
        return res.status(409).json(response);
      } else {
        const response: ApiResponse<any> = {
          success: false,
          message: 'Service with this name already exists'
        };
        return res.status(409).json(response);
      }
    }

    // Map status to isDeleted: 'inactive' -> 1, 'active' -> 0
    const isDeleted = status === 'inactive' ? 1 : 0;

    const newService = new Service({
      serviceName: serviceName.trim(),
      price: Number(price),
      description: description.trim(),
      serviceType,
      availableAt: Array.isArray(availableAt) ? availableAt : [availableAt],
      isDeleted
    });

    const savedService = await newService.save();

    // Log system activity
    await systemLogService.logFromRequest(req as any, LogAction.SERVICE_CREATE, 
      `Service created: ${savedService.serviceName} - ${savedService.serviceType} (${savedService.price.toLocaleString()}đ)`, {
        level: LogLevel.MANAGER,
        targetId: (savedService._id as mongoose.Types.ObjectId).toString(),
        targetType: 'service',
        metadata: {
          serviceName: savedService.serviceName,
          serviceType: savedService.serviceType,
          price: savedService.price,
          availableAt: savedService.availableAt,
          isDeleted: savedService.isDeleted
        }
      }
    );

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
        message: 'Service not found or has been deleted'
      };
      return res.status(404).json(response);
    }

    // Check if new name conflicts with existing service
    if (serviceName && serviceName.trim() !== service.serviceName) {
      const existingService = await Service.findOne({
        serviceName: { $regex: new RegExp(`^${serviceName.trim()}$`, 'i') },
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
    if (serviceName) updateData.serviceName = serviceName.trim();
    if (price) updateData.price = Number(price);
    if (description) updateData.description = description.trim();
    if (serviceType) updateData.serviceType = serviceType;
    if (availableAt) updateData.availableAt = Array.isArray(availableAt) ? availableAt : [availableAt];

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log system activity
    const changedFields = Object.keys(updateData);
    await systemLogService.logFromRequest(req as any, LogAction.SERVICE_UPDATE, 
      `Service updated: ${updatedService?.serviceName} - Fields changed: ${changedFields.join(', ')}`, {
        level: LogLevel.MANAGER,
        targetId: id,
        targetType: 'service',
        metadata: {
          serviceName: updatedService?.serviceName,
          serviceType: updatedService?.serviceType,
          changedFields,
          updateData,
          originalName: service.serviceName
        }
      }
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

// DELETE /services/:id - Soft delete service with protection check
export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists and is not already deleted
    const service = await Service.findOne({ _id: id, isDeleted: 0 });
    if (!service) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service not found or already deleted'
      };
      return res.status(404).json(response);
    }

    // Check if service is being used in any active service packages
    const packagesUsingService = await ServicePackages.findOne({
      serviceIds: { $in: [id] },
      isActive: true
    });

    if (packagesUsingService) {
      const response: ApiResponse<any> = {
        success: false,
        message: `Không thể xóa dịch vụ. Dịch vụ này đang được sử dụng trong gói dịch vụ: "${packagesUsingService.name}". Vui lòng xóa dịch vụ khỏi tất cả gói dịch vụ trước.`
      };
      return res.status(400).json(response);
    }

    // Soft delete the service
    await Service.findByIdAndUpdate(id, { 
      isDeleted: 1
    });

    // Log system activity
    await systemLogService.logFromRequest(req as any, LogAction.SERVICE_DELETE, 
      `Service deleted: ${service.serviceName} - ${service.serviceType} (${service.price.toLocaleString()}đ)`, {
        level: LogLevel.MANAGER,
        targetId: id,
        targetType: 'service',
        metadata: {
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          price: service.price,
          availableAt: service.availableAt,
          deletedAt: new Date()
        }
      }
    );

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

// POST /services/:id/recover - Recover deleted service
export const recoverService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists and is deleted
    const service = await Service.findOne({ _id: id, isDeleted: 1 });
    if (!service) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service not found or is not deleted'
      };
      return res.status(404).json(response);
    }

    // Check if there's already an active service with the same name
    const existingActiveService = await Service.findOne({
      serviceName: { $regex: new RegExp(`^${service.serviceName}$`, 'i') },
      _id: { $ne: id },
      isDeleted: 0
    });

    if (existingActiveService) {
      const response: ApiResponse<any> = {
        success: false,
        message: `Cannot recover service. An active service with name "${service.serviceName}" already exists.`
      };
      return res.status(409).json(response);
    }

    // Recover the service
    const recoveredService = await Service.findByIdAndUpdate(
      id,
      { 
        isDeleted: 0
      },
      { new: true }
    );

    const response: ApiResponse<any> = {
      success: true,
      data: recoveredService,
      message: 'Service recovered successfully'
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error recovering service',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
};

// PUT /services/:id/toggle-status - Toggle service active/inactive status
export const toggleServiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists (both active and deleted services can be toggled)
    const service = await Service.findById(id);
    if (!service) {
      const response: ApiResponse<any> = {
        success: false,
        message: 'Service not found'
      };
      return res.status(404).json(response);
    }

    // Toggle the isDeleted status (0 = active, 1 = inactive)
    const newStatus = service.isDeleted === 0 ? 1 : 0;
    
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { isDeleted: newStatus },
      { new: true, runValidators: true }
    );

    const statusText = newStatus === 0 ? 'activated' : 'deactivated';
    
    const response: ApiResponse<any> = {
      success: true,
      data: updatedService,
      message: `Service ${statusText} successfully`
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<any> = {
      success: false,
      message: 'Error toggling service status',
      errors: { general: error.message }
    };
    res.status(500).json(response);
  }
}; 