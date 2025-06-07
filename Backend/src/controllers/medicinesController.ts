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

// Lấy danh sách medicines (Customer, Doctor, Staff, Manager)
export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const userRole = (req as any).user?.role;

    // Build query - Manager xem tất cả, role khác chỉ xem active
    const query: any = {};
    if (userRole !== 'manager') {
      query.isActive = true; // Chỉ Manager mới xem được thuốc inactive
    }
    if (type) query.type = type;

    // Lấy tất cả thuốc phù hợp, sắp xếp theo tên
    const medicines = await Medicines.find(query)
      .sort({ name: 1 })
      .select('name type description defaultDosage defaultTimingInstructions isActive');

    res.json({
      message: `Lấy danh sách thuốc thành công (${medicines.length} thuốc)`,
      data: medicines
    });
  } catch (error) {
    console.error('Error getting medicines:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách thuốc'
    });
  }
};

// Lấy chi tiết medicine (All roles except guest)
export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'ID thuốc không hợp lệ'
      });
    }

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

// Kích hoạt/vô hiệu hóa medicine (Manager only)
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