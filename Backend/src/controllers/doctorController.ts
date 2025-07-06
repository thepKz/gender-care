import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';
import { uploadToCloudinary } from '../services/uploadService';
import fs from 'fs';

export const getAll = async (req: Request, res: Response) => {
  try {
    const result = await doctorService.getAllDoctors();
    res.json(result);
  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bác sĩ',
    });
  }
};

// Lấy tất cả doctors kèm feedback + status
export const getAllWithDetails = async (req: Request, res: Response) => {
  try {
    const doctors = await doctorService.getAllDoctorsWithDetails();
    res.json({
      message: 'Lấy danh sách bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctors,
      total: doctors.length,
    });
  } catch (error) {
    console.error('Error in getAllWithDetails:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ chi tiết' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor)
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });
    res.json(doctor);
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error getting doctor by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bác sĩ',
    });
  }
};

// Lấy doctor by ID kèm feedback + status
export const getByIdWithDetails = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const doctor = await doctorService.getDoctorByIdWithDetails(doctorId);

    res.json({
      message: 'Lấy thông tin bác sĩ thành công (bao gồm đánh giá và trạng thái)',
      data: doctor,
    });
  } catch (error: any) {
    console.error('Error in getByIdWithDetails:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin bác sĩ chi tiết' });
  }
};

// PUBLIC: Lấy thông tin cơ bản của bác sĩ (không cần authentication)
export const getPublicById = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorService.getDoctorPublicInfo(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin bác sĩ thành công',
      data: doctor,
    });
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error getting doctor public info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bác sĩ',
    });
  }
};

// Chỉ lấy feedback
export const getDoctorFeedbacks = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const feedbacks = await doctorService.getDoctorFeedbacks(doctorId);

    res.json({
      message: 'Lấy đánh giá bác sĩ thành công',
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error in getDoctorFeedbacks:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá bác sĩ' });
  }
};

// Chỉ lấy trạng thái active
export const getDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const status = await doctorService.getDoctorActiveStatus(doctorId);

    res.json({
      message: 'Lấy trạng thái bác sĩ thành công',
      data: status,
    });
  } catch (error) {
    console.error('Error in getDoctorStatus:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy trạng thái bác sĩ' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const doctorData = req.body;

    // Validate required fields
    if (!doctorData.fullName || !doctorData.email) {
      return res.status(400).json({
        success: false,
        message: 'Tên và email là bắt buộc'
      });
    }

    // Create doctor with structured data
    const doctor = await doctorService.createDoctor(doctorData);

    // Return success response with credentials
    res.status(201).json({
      success: true,
      message: 'Tạo bác sĩ thành công',
      data: doctor,
      userCredentials: {
        email: doctorData.email,
        defaultPassword: 'doctor123' // This should match the password in service
      }
    });
  } catch (error: any) {
    console.error('Error creating doctor:', error);

    // Handle specific error types
    if (error.message.includes('đã tồn tại')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Không thể tạo bác sĩ'
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật không được để trống',
        allowedFields: [
          'fullName',
          'phone',
          'gender',
          'address',
          'bio',
          'experience',
          'rating',
          'specialization',
          'education',
          'certificate',
        ],
      });
    }

    const updated = await doctorService.updateDoctor(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ',
      });

    res.json({
      success: true,
      message: 'Cập nhật thông tin bác sĩ thành công',
      data: updated,
    });
  } catch (error: any) {
    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message &&
      (error.message.includes('kinh nghiệm') ||
        error.message.includes('Rating') ||
        error.message.includes('Giới tính'))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bác sĩ',
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Service hiện tại chỉ support simple delete

    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ',
        received: id,
      });
    }

    const deletedDoctor = await doctorService.deleteDoctor(id);

    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ để xóa',
      });
    }

    res.json({
      success: true,
      message: 'Xóa bác sĩ thành công',
      data: deletedDoctor,
    });
  } catch (error: any) {
    console.error('Delete doctor error:', error);

    if (error.message && error.message.includes('ID bác sĩ không hợp lệ')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message && error.message.includes('Không tìm thấy bác sĩ')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa bác sĩ',
      error: error.message,
    });
  }
};

// MANAGER ONLY
export const updateDoctorStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive phải là boolean (true/false)',
        example: { isActive: true },
      });
    }

    const result = await doctorService.updateDoctorActiveStatus(doctorId, isActive);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in updateDoctorStatus:', error);
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái bác sĩ'
    });
  }
};

/**
 * Upload doctor image lên cloudinary với enhanced validation
 * Enhanced cho medical professional photos
 */
export const uploadDoctorImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    // ✅ Enhanced validation cho medical photos - now includes WebP
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Xóa file tạm không hợp lệ
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WebP'
      });
    }

    // Kiểm tra kích thước file (max 5MB cho medical photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Kích thước file không được vượt quá 5MB'
      });
    }

    // Upload lên cloudinary với folder riêng cho doctors
    const imageUrl = await uploadToCloudinary(req.file.path, 'doctors');

    // Xóa file tạm sau khi upload thành công
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      success: true,
      message: 'Upload ảnh bác sĩ thành công',
      data: {
        imageUrl,
        uploadedAt: new Date()
      }
    });

  } catch (error: any) {
    // Xóa file tạm nếu có lỗi
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    console.error('Doctor image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi upload ảnh bác sĩ',
      error: error.message
    });
  }
};

/**
 * Doctor submit profile changes for approval - Create change requests instead of direct update
 */
export const updateMyProfile = async (req: any, res: Response) => {
  try {
    // Lấy userId từ JWT token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user ID found'
      });
    }

    // Import models
    const Doctor = require('../models/Doctor');
    const ProfileChangeRequest = require('../models/ProfileChangeRequests');

    const doctorRecord = await Doctor.findOne({ userId: userId });

    if (!doctorRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ của bạn'
      });
    }

    const {
      bio,
      experience,
      image,
      specialization,
      education,
      certificate,
    } = req.body;

    // Validation data như function update gốc
    if (experience !== undefined && (experience < 0 || experience > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Kinh nghiệm phải từ 0 đến 50 năm',
      });
    }

    const changeRequests = [];

    // Create change requests for each field that changed
    if (bio !== undefined && bio !== doctorRecord.bio) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'bio',
        currentValue: doctorRecord.bio,
        proposedValue: bio,
        status: 'pending'
      });
    }

    if (specialization !== undefined && specialization !== doctorRecord.specialization) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'specialization',
        currentValue: doctorRecord.specialization,
        proposedValue: specialization,
        status: 'pending'
      });
    }

    if (education !== undefined && education !== doctorRecord.education) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'education',
        currentValue: doctorRecord.education,
        proposedValue: education,
        status: 'pending'
      });
    }

    if (certificate !== undefined && certificate !== doctorRecord.certificate) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'certificate',
        currentValue: doctorRecord.certificate,
        proposedValue: certificate,
        status: 'pending'
      });
    }

    if (image !== undefined && image !== doctorRecord.image) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'image',
        currentValue: doctorRecord.image,
        proposedValue: image,
        status: 'pending'
      });
    }

    if (experience !== undefined && experience !== doctorRecord.experience) {
      changeRequests.push({
        doctorId: doctorRecord._id,
        requestedBy: userId,
        changeType: 'experiences',
        currentValue: doctorRecord.experience,
        proposedValue: experience,
        status: 'pending'
      });
    }

    if (changeRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thay đổi nào để gửi duyệt'
      });
    }

    // Save all change requests
    const createdRequests = await ProfileChangeRequest.insertMany(changeRequests);

    res.json({
      success: true,
      message: `Đã gửi ${changeRequests.length} yêu cầu thay đổi để chờ duyệt`,
      data: {
        requestCount: changeRequests.length,
        requests: createdRequests,
        status: 'pending_approval'
      },
    });
  } catch (error: any) {
    console.error('Error submitting profile changes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi yêu cầu thay đổi',
      error: error.message
    });
  }
};

/**
 * Doctor get own change requests status
 */
export const getMyChangeRequests = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user ID found'
      });
    }

    const Doctor = require('../models/Doctor');
    const ProfileChangeRequest = require('../models/ProfileChangeRequests');

    const doctorRecord = await Doctor.findOne({ userId: userId });

    if (!doctorRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    const changeRequests = await ProfileChangeRequest.find({
      doctorId: doctorRecord._id
    }).sort({ submittedAt: -1 }).populate('reviewedBy', 'fullName email');

    res.json({
      success: true,
      message: 'Lấy danh sách yêu cầu thay đổi thành công',
      data: changeRequests
    });
  } catch (error: any) {
    console.error('Error getting change requests:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy yêu cầu thay đổi',
      error: error.message
    });
  }
};

/**
 * Manager get all pending change requests
 */
export const getAllPendingRequests = async (req: any, res: Response) => {
  try {
    const ProfileChangeRequest = require('../models/ProfileChangeRequests');

    const pendingRequests = await ProfileChangeRequest.find({
      status: 'pending'
    })
      .sort({ submittedAt: -1 })
      .populate('doctorId', 'bio specialization education')
      .populate('requestedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email');

    res.json({
      success: true,
      message: 'Lấy danh sách yêu cầu chờ duyệt thành công',
      data: pendingRequests
    });
  } catch (error: any) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy yêu cầu chờ duyệt',
      error: error.message
    });
  }
};

/**
 * Manager approve change request
 */
export const approveChangeRequest = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { comments } = req.body;
    const managerId = req.user?._id;

    const ProfileChangeRequest = require('../models/ProfileChangeRequests');
    const Doctor = require('../models/Doctor');

    const changeRequest = await ProfileChangeRequest.findById(requestId);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu thay đổi'
      });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý'
      });
    }

    // Update the doctor record with approved changes
    const updateData: any = {};
    updateData[changeRequest.changeType] = changeRequest.proposedValue;

    await Doctor.findByIdAndUpdate(changeRequest.doctorId, updateData);

    // Update change request status
    changeRequest.status = 'approved';
    changeRequest.reviewedBy = managerId;
    changeRequest.reviewedAt = new Date();
    changeRequest.reviewComments = comments;
    await changeRequest.save();

    res.json({
      success: true,
      message: 'Đã duyệt yêu cầu thay đổi thành công',
      data: changeRequest
    });
  } catch (error: any) {
    console.error('Error approving change request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt yêu cầu',
      error: error.message
    });
  }
};

/**
 * Manager reject change request
 */
export const rejectChangeRequest = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const managerId = req.user?._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do từ chối'
      });
    }

    const ProfileChangeRequest = require('../models/ProfileChangeRequests');

    const changeRequest = await ProfileChangeRequest.findById(requestId);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu thay đổi'
      });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý'
      });
    }

    // Update change request status
    changeRequest.status = 'rejected';
    changeRequest.reviewedBy = managerId;
    changeRequest.reviewedAt = new Date();
    changeRequest.reviewComments = reason;
    await changeRequest.save();

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu thay đổi',
      data: changeRequest
    });
  } catch (error: any) {
    console.error('Error rejecting change request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối yêu cầu',
      error: error.message
    });
  }
};
