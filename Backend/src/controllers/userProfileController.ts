import { Request, Response } from 'express';
import * as userProfileService from '../services/userProfileService';
import { AuthRequest } from '../types';

// Tạo profile mới
export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, gender, phone, year } = req.body;
    const ownerId = req.user!._id;

    // Validation
    if (!fullName || !gender) {
      return res.status(400).json({ 
        message: 'fullName và gender là bắt buộc',
        example: {
          fullName: 'Nguyễn Văn A',
          gender: 'male', // male, female, other
          phone: '0123456789',
          year: '1990-01-01'
        }
      });
    }

    const profile = await userProfileService.createUserProfile(ownerId, {
      fullName,
      gender,
      phone,
      year: year ? new Date(year) : undefined
    });

    res.status(201).json({
      message: 'Tạo profile thành công',
      data: profile
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi tạo profile' });
  }
};

// Lấy tất cả profiles (admin/staff only)
export const getAllProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userProfileService.getAllUserProfiles(page, limit);

    res.json({
      message: 'Lấy danh sách profiles thành công',
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách profiles' });
  }
};

// Lấy profile theo ID
export const getProfileById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user!._id;
    const requesterRole = req.user!.role;

    const profile = await userProfileService.getUserProfileById(id, requesterId, requesterRole);

    res.json({
      message: 'Lấy profile thành công',
      data: profile
    });
  } catch (error: any) {
    if (error.message.includes('không hợp lệ')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Không có quyền')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi lấy profile' });
  }
};

// Lấy tất cả profiles của user hiện tại
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!._id;

    const profiles = await userProfileService.getMyUserProfiles(ownerId);

    res.json({
      message: 'Lấy profiles cá nhân thành công',
      data: profiles,
      count: profiles.length
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server khi lấy profiles cá nhân' });
  }
};

// Cập nhật profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, gender, phone, year } = req.body;
    const requesterId = req.user!._id;
    const requesterRole = req.user!.role;

    // Chuẩn bị data cập nhật
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (year !== undefined) updateData.year = year ? new Date(year) : null;

    const updatedProfile = await userProfileService.updateUserProfile(
      id, 
      updateData, 
      requesterId, 
      requesterRole
    );

    res.json({
      message: 'Cập nhật profile thành công',
      data: updatedProfile
    });
  } catch (error: any) {
    if (error.message.includes('không hợp lệ')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Không có quyền')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật profile' });
  }
};

// Xóa profile
export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user!._id;
    const requesterRole = req.user!.role;

    const result = await userProfileService.deleteUserProfile(id, requesterId, requesterRole);

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('không hợp lệ')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Không có quyền')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server khi xóa profile' });
  }
}; 