import { UserProfile } from '../models/UserProfile';
import { IUserProfile } from '../types';
import mongoose from 'mongoose';

// Interface cho filter parameters
interface ProfileFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: 'all' | 'male' | 'female' | 'other';
  dateFrom?: string;
  dateTo?: string;
}

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
export const getAllUserProfiles = async (filters: ProfileFilterParams = {}) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      gender, 
      dateFrom, 
      dateTo 
    } = filters;

    const skip = (page - 1) * limit;

    // Xây dựng query filter
    const query: any = {};

    // Filter theo giới tính
    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    // Filter theo search (tìm trong fullName và phone)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Filter theo khoảng thời gian tạo
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    const profiles = await UserProfile.find(query)
      .populate('ownerId', 'email fullName avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserProfile.countDocuments(query);

    return {
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        gender,
        dateFrom,
        dateTo
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