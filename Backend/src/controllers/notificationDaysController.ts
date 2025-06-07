import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import { NotificationDays, MedicationReminders } from '../models';

// User cập nhật status notification (taken, skipped, snoozed)
export const updateNotificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, takenAt, snoozedUntil } = req.body;
    const currentUserId = req.user?._id;

    // Validate status
    const validStatuses = ['pending', 'sent', 'failed', 'taken', 'skipped', 'snoozed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Status không hợp lệ'
      });
    }

    const notification = await NotificationDays.findById(id).populate({
      path: 'reminderId',
      select: 'createdByUserId'
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check permission - user can only update their own reminders' notifications
    const reminder = notification.reminderId as any;
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể cập nhật thông báo của mình'
      });
    }

    // Update notification
    const updateData: any = { status };
    if (reason) updateData.reason = reason;
    if (status === 'taken' && takenAt) updateData.takenAt = new Date(takenAt);
    if (status === 'snoozed' && snoozedUntil) updateData.snoozedUntil = new Date(snoozedUntil);

    const updatedNotification = await NotificationDays.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Cập nhật trạng thái thông báo thành công',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật trạng thái thông báo'
    });
  }
};

// User xem notifications của reminders thuộc về mình
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { reminderId, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // First get all reminder IDs belonging to user
    const userReminders = await MedicationReminders.find(
      { createdByUserId: currentUserId },
      '_id'
    );
    const reminderIds = userReminders.map(r => r._id);

    if (reminderIds.length === 0) {
      return res.json({
        message: 'Không có thông báo nào',
        data: [],
        pagination: {
          currentPage: Number(page),
          totalPages: 0,
          totalRecords: 0,
          limit: Number(limit)
        }
      });
    }

    // Build query
    const query: any = { reminderId: { $in: reminderIds } };
    if (reminderId) query.reminderId = reminderId;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.notificationTimes = {};
      if (dateFrom) query.notificationTimes.$gte = new Date(dateFrom as string);
      if (dateTo) query.notificationTimes.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await NotificationDays.countDocuments(query);

    const notifications = await NotificationDays.find(query)
      .populate({
        path: 'reminderId',
        select: 'medicines profileId',
        populate: {
          path: 'profileId',
          select: 'fullName'
        }
      })
      .sort({ notificationTimes: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy danh sách thông báo thành công (${notifications.length}/${total} thông báo)`,
      data: notifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting my notifications:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách thông báo'
    });
  }
};

// User xem notifications của một reminder cụ thể
export const getNotificationsByReminderId = async (req: AuthRequest, res: Response) => {
  try {
    const { reminderId } = req.params;
    const currentUserId = req.user?._id;
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // Check if user owns the reminder
    const reminder = await MedicationReminders.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({
        message: 'Không tìm thấy nhắc nhở'
      });
    }

    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể xem thông báo của nhắc nhở thuộc về mình'
      });
    }

    // Build query
    const query: any = { reminderId };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.notificationTimes = {};
      if (dateFrom) query.notificationTimes.$gte = new Date(dateFrom as string);
      if (dateTo) query.notificationTimes.$lte = new Date(dateTo as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await NotificationDays.countDocuments(query);

    const notifications = await NotificationDays.find(query)
      .sort({ notificationTimes: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy thông báo của nhắc nhở thành công (${notifications.length}/${total} thông báo)`,
      data: notifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications by reminder:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông báo của nhắc nhở'
    });
  }
};

// Staff xem tất cả notifications
export const getAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { reminderId, status, userId, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = {};
    if (reminderId) query.reminderId = reminderId;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.notificationTimes = {};
      if (dateFrom) query.notificationTimes.$gte = new Date(dateFrom as string);
      if (dateTo) query.notificationTimes.$lte = new Date(dateTo as string);
    }

    // If filtering by userId, need to get reminder IDs first
    if (userId) {
      const userReminders = await MedicationReminders.find(
        { createdByUserId: userId },
        '_id'
      );
      const reminderIds = userReminders.map(r => r._id);
      query.reminderId = { $in: reminderIds };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await NotificationDays.countDocuments(query);

    const notifications = await NotificationDays.find(query)
      .populate({
        path: 'reminderId',
        select: 'medicines profileId createdByUserId',
        populate: [
          {
            path: 'profileId',
            select: 'fullName'
          },
          {
            path: 'createdByUserId',
            select: 'fullName email'
          }
        ]
      })
      .sort({ notificationTimes: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: `Lấy tất cả thông báo thành công (${notifications.length}/${total} thông báo)`,
      data: notifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all notifications:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy tất cả thông báo'
    });
  }
};

// Lấy thống kê notifications (Staff only)
export const getNotificationStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo, reminderId } = req.query;

    // Build query
    const query: any = {};
    if (reminderId) query.reminderId = reminderId;
    if (dateFrom || dateTo) {
      query.notificationTimes = {};
      if (dateFrom) query.notificationTimes.$gte = new Date(dateFrom as string);
      if (dateTo) query.notificationTimes.$lte = new Date(dateTo as string);
    }

    // Aggregate statistics
    const stats = await NotificationDays.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await NotificationDays.countDocuments(query);

    // Format statistics
    const statistics = {
      total,
      byStatus: stats.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      percentages: stats.reduce((acc: any, item: any) => {
        acc[item._id] = total > 0 ? ((item.count / total) * 100).toFixed(2) : '0.00';
        return acc;
      }, {})
    };

    res.json({
      message: 'Lấy thống kê thông báo thành công',
      data: statistics,
      period: {
        dateFrom,
        dateTo,
        reminderId
      }
    });
  } catch (error) {
    console.error('Error getting notification statistics:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê thông báo'
    });
  }
};

// User đánh dấu đã uống thuốc
export const markAsTaken = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUserId = req.user?._id;

    const notification = await NotificationDays.findById(id).populate({
      path: 'reminderId',
      select: 'createdByUserId'
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check permission
    const reminder = notification.reminderId as any;
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể cập nhật thông báo của mình'
      });
    }

    const updatedNotification = await NotificationDays.findByIdAndUpdate(
      id,
      {
        status: 'taken',
        takenAt: new Date(),
        reason: reason || 'Đã uống thuốc'
      },
      { new: true }
    );

    res.json({
      message: 'Đánh dấu đã uống thuốc thành công',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error marking as taken:', error);
    res.status(500).json({
      message: 'Lỗi server khi đánh dấu đã uống thuốc'
    });
  }
};

// User bỏ qua lần uống
export const markAsSkipped = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUserId = req.user?._id;

    const notification = await NotificationDays.findById(id).populate({
      path: 'reminderId',
      select: 'createdByUserId'
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check permission
    const reminder = notification.reminderId as any;
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể cập nhật thông báo của mình'
      });
    }

    const updatedNotification = await NotificationDays.findByIdAndUpdate(
      id,
      {
        status: 'skipped',
        reason: reason || 'Bỏ qua lần uống'
      },
      { new: true }
    );

    res.json({
      message: 'Đánh dấu bỏ qua thành công',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error marking as skipped:', error);
    res.status(500).json({
      message: 'Lỗi server khi đánh dấu bỏ qua'
    });
  }
};

// User hoãn thông báo
export const snoozeNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { snoozedUntil, reason } = req.body;
    const currentUserId = req.user?._id;

    if (!snoozedUntil) {
      return res.status(400).json({
        message: 'snoozedUntil là bắt buộc'
      });
    }

    const notification = await NotificationDays.findById(id).populate({
      path: 'reminderId',
      select: 'createdByUserId'
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check permission
    const reminder = notification.reminderId as any;
    if (reminder.createdByUserId.toString() !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể cập nhật thông báo của mình'
      });
    }

    const updatedNotification = await NotificationDays.findByIdAndUpdate(
      id,
      {
        status: 'snoozed',
        snoozedUntil: new Date(snoozedUntil),
        reason: reason || 'Hoãn thông báo'
      },
      { new: true }
    );

    res.json({
      message: 'Hoãn thông báo thành công',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error snoozing notification:', error);
    res.status(500).json({
      message: 'Lỗi server khi hoãn thông báo'
    });
  }
}; 