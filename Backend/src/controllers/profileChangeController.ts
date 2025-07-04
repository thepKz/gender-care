import { Request, Response } from 'express';
const Doctor = require('../models/Doctor');
const ProfileChangeRequest = require('../models/ProfileChangeRequests');

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