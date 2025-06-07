import { UserProfile } from '../models/UserProfile';
import { IUserProfile } from '../types';
import mongoose from 'mongoose';

// Tạo profile mới
export const createUserProfile = async (ownerId: string, profileData: Partial<IUserProfile>) => {
  try {
    // Cho phép user tạo nhiều profiles (đã xóa kiểm tra existing profile)

    const profile = await UserProfile.create({
      ownerId,
      ...profileData
    });

    return await UserProfile.findById(profile._id).populate('ownerId', 'email fullName avatar');
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Lấy tất cả profiles (chỉ admin/staff)
export const getAllUserProfiles = async (page: number = 1, limit: number = 10) => {
  try {
    const skip = (page - 1) * limit;

    const profiles = await UserProfile.find()
      .populate('ownerId', 'email fullName avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserProfile.countDocuments();

    return {
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Lấy profile theo ID
export const getUserProfileById = async (profileId: string, requesterId: string, requesterRole: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      throw new Error('ID profile không hợp lệ');
    }

    const profile = await UserProfile.findById(profileId).populate('ownerId', 'email fullName avatar');

    if (!profile) {
      throw new Error('Không tìm thấy profile');
    }

    // Kiểm tra quyền truy cập: chỉ owner hoặc admin/staff
    if (profile.ownerId.toString() !== requesterId && !['admin', 'staff', 'manager'].includes(requesterRole)) {
      throw new Error('Không có quyền truy cập profile này');
    }

    return profile;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Lấy tất cả profiles của user hiện tại
export const getMyUserProfiles = async (ownerId: string) => {
  try {
    const profiles = await UserProfile.find({ ownerId })
      .populate('ownerId', 'email fullName avatar')
      .sort({ createdAt: -1 });

    return profiles;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Cập nhật profile
export const updateUserProfile = async (profileId: string, updateData: Partial<IUserProfile>, requesterId: string, requesterRole: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      throw new Error('ID profile không hợp lệ');
    }

    const profile = await UserProfile.findById(profileId);

    if (!profile) {
      throw new Error('Không tìm thấy profile');
    }

    // Kiểm tra quyền: chỉ owner hoặc admin/staff
    if (profile.ownerId.toString() !== requesterId && !['admin', 'staff', 'manager'].includes(requesterRole)) {
      throw new Error('Không có quyền chỉnh sửa profile này');
    }

    // Loại bỏ ownerId khỏi updateData để đảm bảo không thể thay đổi
    const { ownerId, ...safeUpdateData } = updateData;

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      profileId,
      safeUpdateData,
      { new: true, runValidators: true }
    ).populate('ownerId', 'email fullName avatar');

    return updatedProfile;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Xóa profile
export const deleteUserProfile = async (profileId: string, requesterId: string, requesterRole: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      throw new Error('ID profile không hợp lệ');
    }

    const profile = await UserProfile.findById(profileId);

    if (!profile) {
      throw new Error('Không tìm thấy profile');
    }

    // Kiểm tra quyền: chỉ owner hoặc admin
    if (profile.ownerId.toString() !== requesterId && requesterRole !== 'admin') {
      throw new Error('Không có quyền xóa profile này');
    }

    await UserProfile.findByIdAndDelete(profileId);

    return { message: 'Xóa profile thành công' };
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 