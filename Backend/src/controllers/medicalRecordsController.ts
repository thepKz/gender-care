import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import { MedicalRecords, IMedicalRecords } from '../models';
import mongoose from 'mongoose';

// Tạo medical record (Doctor/Staff)
export const createMedicalRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, appointmentId, conclusion, symptoms, treatment, medicines, notes, status } = req.body;
    // Lấy đúng _id của Doctor từ userId
    const Doctor = mongoose.model('Doctor');
    const doctor = await Doctor.findOne({ userId: req.user?._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin bác sĩ' });
    }
    const doctorId = doctor._id;

    // Validate required fields
    if (!profileId || !appointmentId) {
      return res.status(400).json({
        message: 'ProfileId và appointmentId là bắt buộc'
      });
    }

    // Lấy profileId từ appointment
    const Appointment = mongoose.model('Appointments');
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }
    const realProfileId = appointment.profileId;

    // Create medical record
    const medicalRecord = new MedicalRecords({
      doctorId, // Đúng _id Doctor
      profileId: realProfileId, // Lấy từ appointment
      appointmentId,
      conclusion,
      symptoms,
      treatment,
      medicines: medicines || [],
      notes,
      status: status || "draft"
    });

    await medicalRecord.save();
    await medicalRecord.populate([
      { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
    ]);

    res.status(201).json({
      message: 'Tạo hồ sơ khám bệnh thành công',
      data: medicalRecord
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi tạo hồ sơ khám bệnh'
    });
  }
};

// Cập nhật medical record (Doctor/Staff - chỉ sửa, không xóa)
export const updateMedicalRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { conclusion, symptoms, treatment, medicines, notes, status } = req.body;
    const currentUserId = req.user?._id;
    const userRole = req.user?.role;

    // Find medical record
    const medicalRecord = await MedicalRecords.findById(id).populate('doctorId');
    if (!medicalRecord) {
      return res.status(404).json({
        message: 'Không tìm thấy hồ sơ khám bệnh'
      });
    }

    // Check permission: Doctor can only edit own records, Staff can edit all
    if (userRole === 'doctor') {
      const doctorRecord = medicalRecord.doctorId as any;
      if (doctorRecord.userId.toString() !== currentUserId) {
        return res.status(403).json({
          message: 'Bạn chỉ có thể chỉnh sửa hồ sơ do mình tạo'
        });
      }
    }

    // Validate medicines array if provided
    if (medicines && Array.isArray(medicines)) {
      for (const medicine of medicines) {
        // Check required fields for IMedicalRecordMedicines
        if (!medicine.name || !medicine.dosage) {
          return res.status(400).json({
            message: 'Thuốc phải có tên và liều dùng'
          });
        }

        // Set default values for required fields if missing
        if (!medicine.type) medicine.type = 'other';
        if (!medicine.frequency) medicine.frequency = 1;
        if (!medicine.timingInstructions) medicine.timingInstructions = 'Theo chỉ định';
        if (!medicine.instructions) medicine.instructions = medicine.dosage;
      }
    }

    // Update medical record
    const updateData: Partial<IMedicalRecords> = {};
    if (conclusion !== undefined) updateData.conclusion = conclusion;
    if (symptoms !== undefined) updateData.symptoms = symptoms;
    if (treatment !== undefined) updateData.treatment = treatment;
    if (medicines !== undefined) updateData.medicines = medicines;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    let updatedRecord: any;
    try {
      updatedRecord = await MedicalRecords.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate([
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ]);
    } catch (updateError: any) {
      // Thử update không dùng runValidators
      try {
        updatedRecord = await MedicalRecords.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true }
        ).populate([
          { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
          { path: 'profileId', select: 'fullName gender phone' },
          { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
        ]);
      } catch (retryError: any) {
        throw updateError; // Throw original error
      }
    }

    res.json({
      message: 'Cập nhật hồ sơ khám bệnh thành công',
      data: updatedRecord
    });
  } catch (error: any) {
    
    // Check for specific Mongoose validation errors
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Lỗi validation: ' + Object.keys(error?.errors || {}).join(', ')
      });
    }
    
    // Check for cast errors (invalid ObjectId, etc.)
    if (error?.name === 'CastError') {
      return res.status(400).json({
        message: 'Lỗi định dạng dữ liệu: ' + error?.message
      });
    }

    res.status(500).json({
      message: 'Lỗi server khi cập nhật hồ sơ khám bệnh',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

// Lấy chi tiết medical record (Doctor/Staff/User)
export const getMedicalRecordById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;
    const userRole = req.user?.role;

    const medicalRecord = await MedicalRecords.findById(id).populate([
      { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
      { path: 'profileId', select: 'fullName gender phone ownerId' },
      { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
    ]);

    if (!medicalRecord) {
      return res.status(404).json({
        message: 'Không tìm thấy hồ sơ khám bệnh'
      });
    }

    // Check permission
    if (userRole === 'customer') {
      const profileRecord = medicalRecord.profileId as any;
      if (profileRecord.ownerId.toString() !== currentUserId) {
        return res.status(403).json({
          message: 'Bạn chỉ có thể xem hồ sơ của mình'
        });
      }
    } else if (userRole === 'doctor') {
      const doctorRecord = medicalRecord.doctorId as any;
      if (doctorRecord.userId.toString() !== currentUserId) {
        return res.status(403).json({
          message: 'Bạn chỉ có thể xem hồ sơ do mình tạo'
        });
      }
    }

    res.json({
      message: 'Lấy thông tin hồ sơ khám bệnh thành công',
      data: medicalRecord
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy hồ sơ khám bệnh'
    });
  }
};

// Doctor xem medical records do mình tạo
export const getMyMedicalRecords = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { page = 1, limit = 10, profileId, dateFrom, dateTo } = req.query;

    // Find doctor record first
    const Doctor = mongoose.model('Doctor');
    const doctorRecord = await Doctor.findOne({ userId: currentUserId });
    if (!doctorRecord) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    // Build query
    const query: any = { doctorId: doctorRecord._id };
    if (profileId) query.profileId = profileId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicalRecords.countDocuments(query);

    const medicalRecords = await MedicalRecords.find(query)
      .populate([
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy danh sách hồ sơ khám bệnh thành công (${medicalRecords.length}/${total} hồ sơ)`,
      data: medicalRecords,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách hồ sơ khám bệnh'
    });
  }
};

// Staff xem tất cả medical records
export const getAllMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, doctorId, profileId, dateFrom, dateTo } = req.query;

    // Build query
    const query: any = {};
    if (doctorId) query.doctorId = doctorId;
    if (profileId) query.profileId = profileId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicalRecords.countDocuments(query);

    const medicalRecords = await MedicalRecords.find(query)
      .populate([
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy tất cả hồ sơ khám bệnh thành công (${medicalRecords.length}/${total} hồ sơ)`,
      data: medicalRecords,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy tất cả hồ sơ khám bệnh'
    });
  }
};

// User xem medical records của profiles thuộc về mình
export const getMedicalRecordsByProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const currentUserId = req.user?._id;
    const { page = 1, limit = 10, doctorId } = req.query;

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
        message: 'Bạn chỉ có thể xem hồ sơ khám bệnh của mình'
      });
    }

    // Build query
    const query: any = { profileId };
    if (doctorId) query.doctorId = doctorId;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicalRecords.countDocuments(query);

    const medicalRecords = await MedicalRecords.find(query)
      .populate([
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy hồ sơ khám bệnh thành công (${medicalRecords.length}/${total} hồ sơ)`,
      data: medicalRecords,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy hồ sơ khám bệnh'
    });
  }
};

// Doctor tìm kiếm medical records do mình tạo
export const searchMyMedicalRecords = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { conclusion, patientName, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // Find doctor record first
    const Doctor = mongoose.model('Doctor');
    const doctorRecord = await Doctor.findOne({ userId: currentUserId });
    if (!doctorRecord) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    // Build search query
    const query: any = { doctorId: doctorRecord._id };
    
    if (conclusion) {
      query.conclusion = { $regex: conclusion, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    let medicalRecords = await MedicalRecords.find(query)
      .populate([
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter by patient name if provided
    if (patientName) {
      medicalRecords = medicalRecords.filter(record => {
        const profile = record.profileId as any;
        return profile.fullName.toLowerCase().includes((patientName as string).toLowerCase());
      });
    }

    res.json({
      message: `Tìm kiếm hồ sơ khám bệnh thành công (${medicalRecords.length} kết quả)`,
      data: medicalRecords,
      searchCriteria: {
        conclusion,
        patientName,
        dateFrom,
        dateTo
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi tìm kiếm hồ sơ khám bệnh'
    });
  }
};

// Staff tìm kiếm trong tất cả medical records
export const searchAllMedicalRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { conclusion, doctorName, patientName, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // Build search query
    const query: any = {};
    
    if (conclusion) {
      query.conclusion = { $regex: conclusion, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    let medicalRecords = await MedicalRecords.find(query)
      .populate([
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter by doctor name or patient name if provided
    if (doctorName || patientName) {
      medicalRecords = medicalRecords.filter(record => {
        let matchDoctor = true;
        let matchPatient = true;

        if (doctorName) {
          const doctor = (record.doctorId as any).userId;
          matchDoctor = doctor.fullName.toLowerCase().includes((doctorName as string).toLowerCase());
        }

        if (patientName) {
          const profile = record.profileId as any;
          matchPatient = profile.fullName.toLowerCase().includes((patientName as string).toLowerCase());
        }

        return matchDoctor && matchPatient;
      });
    }

    res.json({
      message: `Tìm kiếm tất cả hồ sơ khám bệnh thành công (${medicalRecords.length} kết quả)`,
      data: medicalRecords,
      searchCriteria: {
        conclusion,
        doctorName,
        patientName,
        dateFrom,
        dateTo
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi tìm kiếm hồ sơ khám bệnh'
    });
  }
};

/**
 * Check if appointment already has medical record
 * GET /api/medical-records/check/:appointmentId
 */
export const checkMedicalRecordByAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    // Validate appointmentId
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId is required'
      });
    }

    // Check if medical record exists for this appointment
    const medicalRecord = await MedicalRecords.findOne({ appointmentId });

    return res.status(200).json({
      success: true,
      exists: !!medicalRecord,
      recordId: medicalRecord?._id || null,
      message: medicalRecord ? 'Medical record exists' : 'No medical record found'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getMedicalRecordsByAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId is required' });
    }
    const records = await MedicalRecords.find({ appointmentId }).populate([
      { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
    ]);
    return res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 