import { Request, Response } from 'express';
import * as staffService from '../services/staffService';

export const getAll = async (req: Request, res: Response) => {
    try {
        const result = await staffService.getAllStaff();
        res.json(result);
    } catch (error) {
        console.error('Error getting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách nhân viên',
        });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const staff = await staffService.getStaffById(req.params.id);
        if (!staff)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên',
            });
        res.json(staff);
    } catch (error: any) {
        if (error.message && error.message.includes('ID nhân viên không hợp lệ')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error('Error getting staff by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin nhân viên',
        });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const staffInfo = req.body;

        if (!staffInfo.fullName) {
            return res.status(400).json({
                success: false,
                message: 'Tên nhân viên là bắt buộc',
                example: {
                    email: 'staff@example.com',
                    fullName: 'Nguyễn Văn A',
                    phone: '0123456789',
                    gender: 'male',
                    address: 'TP.HCM',
                    staffType: 'Normal',
                },
            });
        }

        if (!staffInfo.email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc',
            });
        }

        // Service returns populated staff, tạo credentials riêng
        const populatedStaff = await staffService.createStaff(staffInfo);

        // Generate default password
        const defaultPassword = 'staff123';

        res.status(201).json({
            success: true,
            message: 'Tạo nhân viên thành công',
            data: populatedStaff,
            userCredentials: {
                email: staffInfo.email,
                defaultPassword,
            },
        });
    } catch (error: any) {
        if (error.message.includes('Email') && error.message.includes('đã tồn tại')) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }
        if (error.message.includes('bắt buộc')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo nhân viên',
        });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const staffId = req.params.id;
        const updateData = req.body;

        const updatedStaff = await staffService.updateStaff(staffId, updateData);

        res.json({
            success: true,
            message: 'Cập nhật thông tin nhân viên thành công',
            data: updatedStaff,
        });
    } catch (error: any) {
        if (error.message.includes('Không tìm thấy')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin nhân viên',
        });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const staffId = req.params.id;
        await staffService.deleteStaff(staffId);

        res.json({
            success: true,
            message: 'Xóa nhân viên thành công',
        });
    } catch (error: any) {
        if (error.message.includes('Không tìm thấy')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa nhân viên',
        });
    }
}; 