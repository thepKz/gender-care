import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import StaffDetails from '../models/StaffDetails';
import User from '../models/User';
import { sendNewAccountEmail } from './emails';

// Thêm function validation ObjectId
const isValidObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Lấy tất cả staff
export const getAllStaff = () => StaffDetails.find().populate('userId', 'fullName email avatar phone gender address isActive');

// Lấy staff theo ID
export const getStaffById = async (id: string) => {
    try {
        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            throw new Error('ID nhân viên không hợp lệ');
        }

        const staff = await StaffDetails.findById(id).populate('userId', 'fullName email avatar phone gender address isActive');

        if (!staff) {
            return null;
        }

        return staff;
    } catch (error) {
        console.error('Error getting staff by ID:', error);
        throw error;
    }
};

// Tạo staff mới
export const createStaff = async (staffInfo: any) => {
    try {
        // Validate required staff fields
        if (!staffInfo.fullName) {
            throw new Error('Tên nhân viên (fullName) là bắt buộc');
        }

        if (!staffInfo.email) {
            throw new Error('Email là bắt buộc');
        }

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email: staffInfo.email });
        if (existingUser) {
            throw new Error('Email đã tồn tại trong hệ thống');
        }

        // Tạo user account trước
        const defaultPassword = 'staff123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const newUser = new User({
            email: staffInfo.email,
            password: hashedPassword,
            fullName: staffInfo.fullName,
            phone: staffInfo.phone || '',
            gender: staffInfo.gender || 'other',
            address: staffInfo.address || '',
            role: 'staff',
            isActive: true,
            emailVerified: false,
        });

        const savedUser = await newUser.save();

        // Tạo staff details
        const newStaffDetails = new StaffDetails({
            userId: savedUser._id,
            staffType: staffInfo.staffType || 'Normal',
        });

        const savedStaffDetails = await newStaffDetails.save();

        // Populate user info
        const populatedStaff = await StaffDetails.findById(savedStaffDetails._id)
            .populate('userId', 'fullName email avatar phone gender address isActive');

        // Gửi email thông báo tài khoản mới
        try {
            await sendNewAccountEmail(
                staffInfo.email,
                staffInfo.fullName,
                staffInfo.email,
                defaultPassword,
                'staff'
            );
        } catch (emailError) {
            console.error('Failed to send account email:', emailError);
            // Continue without failing the staff creation
        }

        return populatedStaff;
    } catch (error) {
        console.error('Error creating staff:', error);
        throw error;
    }
};

// Cập nhật thông tin staff
export const updateStaff = async (id: string, updateData: any) => {
    try {
        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            throw new Error('ID nhân viên không hợp lệ');
        }

        const staff = await StaffDetails.findById(id);
        if (!staff) {
            throw new Error('Không tìm thấy nhân viên');
        }

        // Cập nhật staff details
        const updatedStaff = await StaffDetails.findByIdAndUpdate(
            id,
            { staffType: updateData.staffType },
            { new: true }
        ).populate('userId', 'fullName email avatar phone gender address isActive');

        // Cập nhật user info nếu có
        if (updateData.fullName || updateData.phone || updateData.gender || updateData.address) {
            const userUpdateData: any = {};
            if (updateData.fullName) userUpdateData.fullName = updateData.fullName;
            if (updateData.phone) userUpdateData.phone = updateData.phone;
            if (updateData.gender) userUpdateData.gender = updateData.gender;
            if (updateData.address) userUpdateData.address = updateData.address;

            await User.findByIdAndUpdate(staff.userId, userUpdateData);
        }

        return updatedStaff;
    } catch (error) {
        console.error('Error updating staff:', error);
        throw error;
    }
};

// Xóa staff
export const deleteStaff = async (id: string) => {
    try {
        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            throw new Error('ID nhân viên không hợp lệ');
        }

        const staff = await StaffDetails.findById(id);
        if (!staff) {
            throw new Error('Không tìm thấy nhân viên');
        }

        // Xóa staff details
        await StaffDetails.findByIdAndDelete(id);

        // Xóa user account
        await User.findByIdAndDelete(staff.userId);

        return { message: 'Xóa nhân viên thành công' };
    } catch (error) {
        console.error('Error deleting staff:', error);
        throw error;
    }
};

// Lấy thống kê staff
export const getStaffStatistics = async () => {
    try {
        const totalStaff = await StaffDetails.countDocuments();

        // Thống kê theo loại staff
        const staffTypeStats = await StaffDetails.aggregate([
            {
                $group: {
                    _id: '$staffType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê theo trạng thái hoạt động
        const activeStats = await StaffDetails.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: '$user.isActive',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalStaff,
            staffTypeStats: staffTypeStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            activeStats: activeStats.reduce((acc, stat) => {
                acc[stat._id ? 'active' : 'inactive'] = stat.count;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('Error getting staff statistics:', error);
        throw error;
    }
}; 