import express from 'express';
import { RefundController } from '../controllers/refundController';
import { verifyToken } from '../middleware/auth';
import { authorizeManagerOrStaff } from '../middleware/authorizeManager';

const router = express.Router();
const refundController = new RefundController();

/**
 * @swagger
 * /api/refunds:
 *   get:
 *     summary: Lấy danh sách tất cả yêu cầu hoàn tiền (Manager/Staff/Admin)
 *     tags: [Refunds Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, rejected]
 *         description: Lọc theo trạng thái xử lý
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu hoàn tiền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     refundRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           appointmentId:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                           customerEmail:
 *                             type: string
 *                           serviceName:
 *                             type: string
 *                           appointmentDate:
 *                             type: string
 *                           appointmentTime:
 *                             type: string
 *                           refundAmount:
 *                             type: number
 *                           accountNumber:
 *                             type: string
 *                           accountHolderName:
 *                             type: string
 *                           bankName:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, processing, completed, rejected]
 *                           requestedAt:
 *                             type: string
 *                             format: date-time
 *                           processedAt:
 *                             type: string
 *                             format: date-time
 *                           processedBy:
 *                             type: string
 *                           notes:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
    '/',
    verifyToken,
    authorizeManagerOrStaff,
    refundController.getAllRefundRequests
);

/**
 * @swagger
 * /api/refunds/{paymentId}:
 *   get:
 *     summary: Lấy chi tiết yêu cầu hoàn tiền (Manager/Staff/Admin)
 *     tags: [Refunds Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của payment record
 *     responses:
 *       200:
 *         description: Chi tiết yêu cầu hoàn tiền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     appointmentId:
 *                       type: string
 *                     customerName:
 *                       type: string
 *                     customerEmail:
 *                       type: string
 *                     customerPhone:
 *                       type: string
 *                     serviceName:
 *                       type: string
 *                     appointmentDate:
 *                       type: string
 *                     appointmentTime:
 *                       type: string
 *                     refundAmount:
 *                       type: number
 *                     accountNumber:
 *                       type: string
 *                     accountHolderName:
 *                       type: string
 *                     bankName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, rejected]
 *                     requestedAt:
 *                       type: string
 *                       format: date-time
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                     processedBy:
 *                       type: string
 *                     notes:
 *                       type: string
 *       404:
 *         description: Không tìm thấy yêu cầu hoàn tiền
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
    '/:paymentId',
    verifyToken,
    authorizeManagerOrStaff,
    refundController.getRefundRequestDetail
);

/**
 * @swagger
 * /api/refunds/{paymentId}/status:
 *   put:
 *     summary: Cập nhật trạng thái xử lý yêu cầu hoàn tiền (Manager/Staff/Admin)
 *     tags: [Refunds Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của payment record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, rejected]
 *                 description: Trạng thái mới cần cập nhật
 *               notes:
 *                 type: string
 *                 description: Ghi chú thêm về quá trình xử lý
 *             example:
 *               status: completed
 *               notes: "Đã chuyển khoản thành công vào ngày 25/01/2025"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     processedBy:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy yêu cầu hoàn tiền
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.put(
    '/:paymentId/status',
    verifyToken,
    authorizeManagerOrStaff,
    refundController.updateRefundStatus
);

export default router; 