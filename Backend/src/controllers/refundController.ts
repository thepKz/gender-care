import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payments from '../models/Payments';
import Appointments from '../models/Appointments';
import { AuthRequest } from '../types/auth';
import { NotFoundError } from '../errors/notFoundError';
import { ValidationError } from '../errors/validationError';
import { UnauthorizedError } from '../errors/unauthorizedError';

export class RefundController {
    
    /**
     * Lấy danh sách tất cả yêu cầu hoàn tiền cho Manager
     */
    getAllRefundRequests = async (req: AuthRequest, res: Response) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate
            } = req.query;

            const userId = req.user?._id;
            if (!userId) {
                throw new UnauthorizedError('Không tìm thấy thông tin user từ token');
            }

            // Chỉ cho phép Manager, Admin truy cập
            if (!['manager', 'admin', 'staff'].includes(req.user?.role || '')) {
                throw new UnauthorizedError('Chỉ Manager/Admin mới có quyền xem yêu cầu hoàn tiền');
            }

            const matchStage: any = {
                status: 'refunded',
                'refund.refundInfo': { $exists: true, $ne: null }
            };

            // Lọc theo trạng thái refund processing
            if (status && ['pending', 'processing', 'completed', 'rejected'].includes(status as string)) {
                matchStage['refund.processingStatus'] = status;
            }

            // Lọc theo khoảng thời gian
            if (startDate && endDate) {
                matchStage.updatedAt = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            } else if (startDate) {
                matchStage.updatedAt = { $gte: new Date(startDate as string) };
            } else if (endDate) {
                matchStage.updatedAt = { $lte: new Date(endDate as string) };
            }

            // Tính toán skip value cho phân trang
            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);
            const skip = (pageNumber - 1) * limitNumber;

            // Aggregate pipeline để join với Appointments và Users
            const pipeline: any[] = [
                { $match: matchStage },
                
                // Lookup appointment info
                {
                    $lookup: {
                        from: 'appointments',
                        let: { userId: '$userId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$createdByUserId', '$$userId'] },
                                    paymentStatus: 'refunded'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'services',
                                    localField: 'serviceId',
                                    foreignField: '_id',
                                    as: 'service'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'servicepackages',
                                    localField: 'packageId',
                                    foreignField: '_id',
                                    as: 'package'
                                }
                            }
                        ],
                        as: 'appointment'
                    }
                },
                
                // Lookup user info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                        pipeline: [
                            { $project: { fullName: 1, email: 1, phone: 1 } }
                        ]
                    }
                },
                
                { $unwind: { path: '$appointment', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                
                // Project final structure
                {
                    $project: {
                        _id: 1,
                        appointmentId: '$appointment._id',
                        customerName: '$user.fullName',
                        customerEmail: '$user.email',
                        customerPhone: '$user.phone',
                        serviceName: {
                            $ifNull: [
                                { $arrayElemAt: ['$appointment.package.name', 0] },
                                { $arrayElemAt: ['$appointment.service.serviceName', 0] }
                            ]
                        },
                        appointmentDate: '$appointment.appointmentDate',
                        appointmentTime: '$appointment.appointmentTime',
                        refundAmount: '$amount',
                        accountNumber: '$refund.refundInfo.accountNumber',
                        accountHolderName: '$refund.refundInfo.accountHolderName',
                        bankName: '$refund.refundInfo.bankName',
                        phoneNumber: '$refund.refundInfo.phoneNumber',
                        reason: '$refund.refundReason',
                        status: { $ifNull: ['$refund.processingStatus', 'pending'] },
                        requestedAt: '$refund.refundInfo.submittedAt',
                        processedAt: '$refund.processedAt',
                        processedBy: '$refund.processedBy',
                        notes: '$refund.processingNotes'
                    }
                },
                
                { $sort: { requestedAt: -1 } }
            ];

            // Đếm tổng số bản ghi
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await Payments.aggregate(countPipeline);
            const total = countResult.length > 0 ? countResult[0].total : 0;

            // Lấy dữ liệu với phân trang
            const resultPipeline = [
                ...pipeline,
                { $skip: skip },
                { $limit: limitNumber }
            ];

            const refundRequests = await Payments.aggregate(resultPipeline);

            console.log('✅ [RefundController] Retrieved refund requests:', {
                total,
                page: pageNumber,
                limit: limitNumber,
                returned: refundRequests.length
            });

            return res.status(200).json({
                success: true,
                data: {
                    refundRequests,
                    pagination: {
                        total,
                        page: pageNumber,
                        limit: limitNumber,
                        pages: Math.ceil(total / limitNumber)
                    }
                }
            });

        } catch (error: any) {
            console.error('Error in getAllRefundRequests:', error);
            if (error instanceof UnauthorizedError) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu hoàn tiền'
            });
        }
    };

    /**
     * Cập nhật trạng thái xử lý yêu cầu hoàn tiền
     */
    updateRefundStatus = async (req: AuthRequest, res: Response) => {
        try {
            const { paymentId } = req.params;
            const { status, notes } = req.body;

            const userId = req.user?._id;
            if (!userId) {
                throw new UnauthorizedError('Không tìm thấy thông tin user từ token');
            }

            // Chỉ cho phép Manager, Admin cập nhật
            if (!['manager', 'admin', 'staff'].includes(req.user?.role || '')) {
                throw new UnauthorizedError('Chỉ Manager/Admin mới có quyền cập nhật trạng thái hoàn tiền');
            }

            // Kiểm tra paymentId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(paymentId)) {
                throw new ValidationError({ paymentId: 'ID payment không hợp lệ' });
            }

            // Kiểm tra status hợp lệ
            if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
                throw new ValidationError({ status: 'Trạng thái không hợp lệ' });
            }

            // Tìm payment record
            const payment = await Payments.findOne({
                _id: paymentId,
                status: 'refunded',
                'refund.refundInfo': { $exists: true }
            });

            if (!payment) {
                throw new NotFoundError('Không tìm thấy yêu cầu hoàn tiền này');
            }

            // Cập nhật trạng thái
            const updateData: any = {
                'refund.processingStatus': status,
                'refund.processedBy': req.user?.fullName || 'Manager',
                'refund.processedAt': new Date(),
                updatedAt: new Date()
            };

            if (notes) {
                updateData['refund.processingNotes'] = notes;
            }

            const updatedPayment = await Payments.findByIdAndUpdate(
                paymentId,
                { $set: updateData },
                { new: true }
            );

            console.log('✅ [RefundController] Updated refund status:', {
                paymentId,
                newStatus: status,
                processedBy: req.user?.fullName
            });

            return res.status(200).json({
                success: true,
                message: `Cập nhật trạng thái hoàn tiền thành công`,
                data: {
                    paymentId,
                    status,
                    processedBy: req.user?.fullName,
                    processedAt: updateData['refund.processedAt']
                }
            });

        } catch (error: any) {
            console.error('Error in updateRefundStatus:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    errors: error.errors
                });
            }
            if (error instanceof UnauthorizedError) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật trạng thái hoàn tiền'
            });
        }
    };

    /**
     * Lấy chi tiết một yêu cầu hoàn tiền
     */
    getRefundRequestDetail = async (req: AuthRequest, res: Response) => {
        try {
            const { paymentId } = req.params;
            const userId = req.user?._id;

            if (!userId) {
                throw new UnauthorizedError('Không tìm thấy thông tin user từ token');
            }

            // Chỉ cho phép Manager, Admin truy cập
            if (!['manager', 'admin', 'staff'].includes(req.user?.role || '')) {
                throw new UnauthorizedError('Chỉ Manager/Admin mới có quyền xem chi tiết hoàn tiền');
            }

            // Kiểm tra paymentId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(paymentId)) {
                throw new ValidationError({ paymentId: 'ID payment không hợp lệ' });
            }

            const pipeline: any[] = [
                { $match: { 
                    _id: new mongoose.Types.ObjectId(paymentId),
                    status: 'refunded',
                    'refund.refundInfo': { $exists: true, $ne: null }
                }},
                
                // Lookup appointment info
                {
                    $lookup: {
                        from: 'appointments',
                        let: { userId: '$userId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$createdByUserId', '$$userId'] },
                                    paymentStatus: 'refunded'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'services',
                                    localField: 'serviceId',
                                    foreignField: '_id',
                                    as: 'service'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'servicepackages',
                                    localField: 'packageId',
                                    foreignField: '_id',
                                    as: 'package'
                                }
                            }
                        ],
                        as: 'appointment'
                    }
                },
                
                // Lookup user info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                        pipeline: [
                            { $project: { fullName: 1, email: 1, phone: 1 } }
                        ]
                    }
                },
                
                { $unwind: { path: '$appointment', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
            ];

            const result = await Payments.aggregate(pipeline);
            
            if (result.length === 0) {
                throw new NotFoundError('Không tìm thấy yêu cầu hoàn tiền này');
            }

            const refundRequest = result[0];

            return res.status(200).json({
                success: true,
                data: {
                    id: refundRequest._id,
                    appointmentId: refundRequest.appointment?._id,
                    customerName: refundRequest.user?.fullName,
                    customerEmail: refundRequest.user?.email,
                    customerPhone: refundRequest.user?.phone,
                    serviceName: refundRequest.appointment?.package?.[0]?.name || refundRequest.appointment?.service?.[0]?.serviceName,
                    appointmentDate: refundRequest.appointment?.appointmentDate,
                    appointmentTime: refundRequest.appointment?.appointmentTime,
                    refundAmount: refundRequest.amount,
                    accountNumber: refundRequest.refund?.refundInfo?.accountNumber,
                    accountHolderName: refundRequest.refund?.refundInfo?.accountHolderName,
                    bankName: refundRequest.refund?.refundInfo?.bankName,
                    phoneNumber: refundRequest.refund?.refundInfo?.phoneNumber,
                    reason: refundRequest.refund?.refundReason,
                    status: refundRequest.refund?.processingStatus || 'pending',
                    requestedAt: refundRequest.refund?.refundInfo?.submittedAt,
                    processedAt: refundRequest.refund?.processedAt,
                    processedBy: refundRequest.refund?.processedBy,
                    notes: refundRequest.refund?.processingNotes
                }
            });

        } catch (error: any) {
            console.error('Error in getRefundRequestDetail:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    errors: error.errors
                });
            }
            if (error instanceof UnauthorizedError) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy chi tiết yêu cầu hoàn tiền'
            });
        }
    };
} 