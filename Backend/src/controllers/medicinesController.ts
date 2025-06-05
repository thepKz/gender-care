import { Request, Response } from 'express';
import Medicines from '../models/Medicines';

// Tạo medicine (Manager only)
export const createMedicine = async (req: Request, res: Response) => {
  try {
    const { name, type, description, defaultDosage, defaultTimingInstructions } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        message: 'Tên thuốc và loại thuốc là bắt buộc'
      });
    }

    // Check if medicine already exists
    const existingMedicine = await Medicines.findOne({ name });
    if (existingMedicine) {
      return res.status(409).json({
        message: 'Thuốc này đã tồn tại trong hệ thống'
      });
    }

    // Create medicine
    const medicine = new Medicines({
      name,
      type,
      description,
      defaultDosage,
      defaultTimingInstructions,
      isActive: true
    });

    await medicine.save();

    res.status(201).json({
      message: 'Tạo thuốc thành công',
      data: medicine
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo thuốc'
    });
  }
};

// Lấy danh sách medicines (Tất cả roles)
export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const { type, isActive, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Medicines.countDocuments(query);

    const medicines = await Medicines.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy danh sách thuốc thành công (${medicines.length}/${total} thuốc)`,
      data: medicines,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting medicines:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách thuốc'
    });
  }
};

// Lấy chi tiết medicine
export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await Medicines.findById(id);
    if (!medicine) {
      return res.status(404).json({
        message: 'Không tìm thấy thuốc'
      });
    }

    res.json({
      message: 'Lấy thông tin thuốc thành công',
      data: medicine
    });
  } catch (error) {
    console.error('Error getting medicine by id:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin thuốc'
    });
  }
};

// Cập nhật medicine (Manager only)
export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, defaultDosage, defaultTimingInstructions, isActive } = req.body;

    const medicine = await Medicines.findById(id);
    if (!medicine) {
      return res.status(404).json({
        message: 'Không tìm thấy thuốc'
      });
    }

    // Check if name exists (if changing name)
    if (name && name !== medicine.name) {
      const existingMedicine = await Medicines.findOne({ name, _id: { $ne: id } });
      if (existingMedicine) {
        return res.status(409).json({
          message: 'Tên thuốc này đã tồn tại'
        });
      }
    }

    // Update medicine
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (defaultDosage !== undefined) updateData.defaultDosage = defaultDosage;
    if (defaultTimingInstructions !== undefined) updateData.defaultTimingInstructions = defaultTimingInstructions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedMedicine = await Medicines.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Cập nhật thuốc thành công',
      data: updatedMedicine
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật thuốc'
    });
  }
};

// Xóa medicine (Manager only) - Soft delete
export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await Medicines.findById(id);
    if (!medicine) {
      return res.status(404).json({
        message: 'Không tìm thấy thuốc'
      });
    }

    // Soft delete - set isActive to false
    await Medicines.findByIdAndUpdate(id, { isActive: false });

    res.json({
      message: 'Xóa thuốc thành công',
      data: { id, name: medicine.name, isActive: false }
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa thuốc'
    });
  }
};

// Kích hoạt/vô hiệu hóa medicine
export const toggleMedicineStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive phải là boolean'
      });
    }

    const medicine = await Medicines.findById(id);
    if (!medicine) {
      return res.status(404).json({
        message: 'Không tìm thấy thuốc'
      });
    }

    const updatedMedicine = await Medicines.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    res.json({
      message: `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} thuốc thành công`,
      data: updatedMedicine
    });
  } catch (error) {
    console.error('Error toggling medicine status:', error);
    res.status(500).json({
      message: 'Lỗi server khi thay đổi trạng thái thuốc'
    });
  }
}; 