import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import { MedicationReminders, MedicalRecords, NotificationDays } from '../models';
import mongoose from 'mongoose';

// Tạo reminder từ medical record (User only)
export const createMedicationReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { medicalRecordId, profileId, selectedMedicines, startDate, endDate, notes } = req.body;
    const currentUserId = req.user?._id;

    // Validate required fields
    if (!medicalRecordId || !profileId || !selectedMedicines || selectedMedicines.length === 0) {
      return res.status(400).json({
        message: 'MedicalRecordId, profileId và selectedMedicines là bắt buộc'
      });
    }

    // Check if user owns the profile
    const UserProfiles = mongoose.model('UserProfiles');
    const profile = await UserProfiles.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        message: 'Không tìm thấy hồ sơ bệnh nhân'
      });
    }

    const profileData = profile as any;
    if (profileData.ownerId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể tạo nhắc nhở cho hồ sơ của mình'
      });
    }

    // Check if medical record exists and get medicines
    const medicalRecord = await MedicalRecords.findById(medicalRecordId);
    if (!medicalRecord) {
      return res.status(404).json({
        message: 'Không tìm thấy hồ sơ khám bệnh'
      });
    }

    // Validate selected medicines exist in medical record
    const medicalMedicines = medicalRecord.medicines || [];
    const validMedicines = selectedMedicines.map((selected: any) => {
      const medicineIndex = selected.medicineIndex;
      const originalMedicine = medicalMedicines[medicineIndex];
      
      if (!originalMedicine) {
        throw new Error(`Không tìm thấy thuốc tại index ${medicineIndex}`);
      }

      return {
        name: originalMedicine.name,
        dosage: originalMedicine.dosage,
        reminderTimes: selected.reminderTimes || [],
        frequency: selected.frequency || 'daily',
        instructions: selected.customInstructions || originalMedicine.instructions
      };
    });

    // Create medication reminder
    const reminder = new MedicationReminders({
      createdByUserId: currentUserId,
      profileId,
      medicalRecordId,
      medicines: validMedicines,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      notes
    });

    await reminder.save();

    // Create notification schedule
    await createNotificationSchedule(reminder._id, reminder.medicines, reminder.startDate!, reminder.endDate);

    await reminder.populate([
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
    ]);

    res.status(201).json({
      message: 'Tạo nhắc nhở uống thuốc thành công',
      data: reminder
    });
  } catch (error) {
    console.error('Error creating medication reminder:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Lỗi server khi tạo nhắc nhở uống thuốc'
    });
  }
};

// Helper function to create notification schedule
async function createNotificationSchedule(reminderId: any, medicines: any[], startDate: Date, endDate?: Date) {
  const notifications = [];
  const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  let currentDate = new Date(startDate);
  while (currentDate <= end) {
    for (const medicine of medicines) {
      for (const time of medicine.reminderTimes) {
        const [hours, minutes] = time.split(':');
        const notificationTime = new Date(currentDate);
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        notifications.push({
          reminderId,
          notificationTimes: notificationTime,
          status: 'pending'
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (notifications.length > 0) {
    await NotificationDays.insertMany(notifications);
  }
}

// User xem reminders của profiles thuộc về mình
export const getMyMedicationReminders = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { profileId, isActive, page = 1, limit = 10 } = req.query;

    // Build query - chỉ lấy reminders chưa bị xóa
    const query: any = { createdByUserId: currentUserId, isDeleted: false };
    if (profileId) query.profileId = profileId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicationReminders.countDocuments(query);

    const reminders = await MedicationReminders.find(query)
      .populate([
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy danh sách nhắc nhở thành công (${reminders.length}/${total} nhắc nhở)`,
      data: reminders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting my medication reminders:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách nhắc nhở'
    });
  }
};

// User xem chi tiết reminder
export const getMedicationReminderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;
    const userRole = req.user?.role;

    const reminder = await MedicationReminders.findOne({ _id: id, isDeleted: false }).populate([
      { path: 'profileId', select: 'fullName gender phone ownerId' },
      { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
    ]);

    if (!reminder) {
      return res.status(404).json({
        message: 'Không tìm thấy nhắc nhở uống thuốc'
      });
    }

    // Check permission
    if (userRole === 'customer') {
      if (reminder.createdByUserId.toString() !== currentUserId) {
        return res.status(403).json({
          message: 'Bạn chỉ có thể xem nhắc nhở của mình'
        });
      }
    }

    res.json({
      message: 'Lấy thông tin nhắc nhở thành công',
      data: reminder
    });
  } catch (error) {
    console.error('Error getting medication reminder:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin nhắc nhở'
    });
  }
};

// User cập nhật reminder
export const updateMedicationReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { medicines, startDate, endDate, isActive, notes } = req.body;
    const currentUserId = req.user?._id;

    const reminder = await MedicationReminders.findOne({ _id: id, isDeleted: false });
    if (!reminder) {
      return res.status(404).json({
        message: 'Không tìm thấy nhắc nhở uống thuốc'
      });
    }

    // Check permission
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể chỉnh sửa nhắc nhở của mình'
      });
    }

    // Update reminder
    const updateData: any = {};
    if (medicines !== undefined) updateData.medicines = medicines;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    const updatedReminder = await MedicationReminders.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
    ]);

    // If medicines or dates changed, recreate notification schedule
    if (medicines !== undefined || startDate !== undefined || endDate !== undefined) {
      await NotificationDays.deleteMany({ reminderId: id, status: 'pending' });
      await createNotificationSchedule(id, updatedReminder!.medicines, updatedReminder!.startDate!, updatedReminder!.endDate);
    }

    res.json({
      message: 'Cập nhật nhắc nhở thành công',
      data: updatedReminder
    });
  } catch (error) {
    console.error('Error updating medication reminder:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật nhắc nhở'
    });
  }
};

// User tạm dừng/kích hoạt reminder
export const toggleReminderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const currentUserId = req.user?._id;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive phải là boolean'
      });
    }

    const reminder = await MedicationReminders.findOne({ _id: id, isDeleted: false });
    if (!reminder) {
      return res.status(404).json({
        message: 'Không tìm thấy nhắc nhở uống thuốc'
      });
    }

    // Check permission
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể thay đổi trạng thái nhắc nhở của mình'
      });
    }

    const updatedReminder = await MedicationReminders.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).populate([
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
    ]);

    res.json({
      message: `${isActive ? 'Kích hoạt' : 'Tạm dừng'} nhắc nhở thành công`,
      data: updatedReminder
    });
  } catch (error) {
    console.error('Error toggling reminder status:', error);
    res.status(500).json({
      message: 'Lỗi server khi thay đổi trạng thái nhắc nhở'
    });
  }
};

// User xóa reminder (Soft delete)
export const deleteMedicationReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;

    const reminder = await MedicationReminders.findOne({ _id: id, isDeleted: false });
    if (!reminder) {
      return res.status(404).json({
        message: 'Không tìm thấy nhắc nhở uống thuốc'
      });
    }

    // Check permission
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể xóa nhắc nhở của mình'
      });
    }

    // Soft delete - set isDeleted to true
    await MedicationReminders.findByIdAndUpdate(id, { isDeleted: true });

    res.json({
      message: 'Xóa nhắc nhở thành công',
      data: { id, name: reminder.medicines[0]?.name || 'Nhắc nhở thuốc', isDeleted: true }
    });
  } catch (error) {
    console.error('Error deleting medication reminder:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa nhắc nhở'
    });
  }
};

// Staff xem tất cả reminders
export const getAllMedicationReminders = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, userId, isActive, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // Build query - chỉ lấy reminders chưa bị xóa
    const query: any = { isDeleted: false };
    if (profileId) query.profileId = profileId;
    if (userId) query.createdByUserId = userId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicationReminders.countDocuments(query);

    const reminders = await MedicationReminders.find(query)
      .populate([
        { path: 'createdByUserId', select: 'fullName email' },
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'medicalRecordId', select: 'diagnosis treatment createdAt' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy tất cả nhắc nhở thành công (${reminders.length}/${total} nhắc nhở)`,
      data: reminders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all medication reminders:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy tất cả nhắc nhở'
    });
  }
}; 