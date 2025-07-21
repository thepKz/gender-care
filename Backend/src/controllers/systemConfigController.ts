import { Request, Response } from "express";
import { AuthRequest } from "../types";
import systemConfigService from "../services/systemConfigService";
import systemLogService from "../services/systemLogService";
import { LogAction, LogLevel } from "../models/SystemLogs";

/**
 * GET /api/system-configs
 * Lấy tất cả system configs (Admin only)
 */
export const getAllConfigs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền xem system configs",
      });
    }

    const configs = await systemConfigService.getAllConfigs();

    // Log this access
    await systemLogService.logFromRequest(
      req,
      LogAction.DATA_EXPORT,
      `Admin viewed all system configs (${configs.length} configs)`,
      {
        level: LogLevel.ADMIN,
        targetType: "system_configs",
        metadata: { configCount: configs.length },
      }
    );

    res.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    console.error("Error getting all configs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy system configs",
    });
  }
};

/**
 * GET /api/system-configs/public
 * Lấy các configs công khai (timeout configs cho frontend)
 */
export const getPublicConfigs = async (req: Request, res: Response) => {
  try {
    const publicKeys = [
      "reservation_timeout_minutes",
      "consultation_timeout_minutes",
      "payment_reminder_threshold_minutes",
      "auto_refresh_interval_seconds",
    ];

    const configs = await systemConfigService.getMultipleConfigs(publicKeys);

    res.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    console.error("Error getting public configs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy public configs",
    });
  }
};

/**
 * GET /api/system-configs/:key
 * Lấy config theo key (Admin only)
 */
export const getConfigByKey = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền xem system config",
      });
    }

    const { key } = req.params;
    const value = await systemConfigService.getConfig(key);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy config với key này",
      });
    }

    res.json({
      success: true,
      data: { key, value },
    });
  } catch (error: any) {
    console.error("Error getting config by key:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy config",
    });
  }
};

/**
 * POST /api/system-configs
 * Tạo hoặc cập nhật config (Admin only)
 */
export const setConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền tạo/cập nhật system config",
      });
    }

    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp key và value",
      });
    }

    // Validate timeout configs
    if (key.includes("timeout") && key.includes("minutes")) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Timeout phải là số nguyên dương (phút)",
        });
      }
    }

    const config = await systemConfigService.setConfig(key, value.toString());

    // Log this admin action
    await systemLogService.logFromRequest(
      req,
      LogAction.SYSTEM_CONFIG_CHANGE,
      `Admin set system config: ${key} = ${value}`,
      {
        level: LogLevel.ADMIN,
        targetType: "system_configs",
        targetId: config._id?.toString(),
        metadata: { key, value, action: "set" },
      }
    );

    res.json({
      success: true,
      message: "Cập nhật config thành công",
      data: config,
    });
  } catch (error: any) {
    console.error("Error setting config:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật config",
    });
  }
};

/**
 * DELETE /api/system-configs/:key
 * Xóa config (Admin only)
 */
export const deleteConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền xóa system config",
      });
    }

    const { key } = req.params;

    // Prevent deletion of critical configs
    const protectedKeys = [
      "reservation_timeout_minutes",
      "consultation_timeout_minutes",
    ];
    if (protectedKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa config quan trọng này",
      });
    }

    const deleted = await systemConfigService.deleteConfig(key);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy config để xóa",
      });
    }

    // Log this admin action
    await systemLogService.logFromRequest(
      req,
      LogAction.SYSTEM_CONFIG_CHANGE,
      `Admin deleted system config: ${key}`,
      {
        level: LogLevel.ADMIN,
        targetType: "system_configs",
        metadata: { key, action: "delete" },
      }
    );

    res.json({
      success: true,
      message: "Xóa config thành công",
    });
  } catch (error: any) {
    console.error("Error deleting config:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa config",
    });
  }
};

/**
 * POST /api/system-configs/clear-cache
 * Clear config cache (Admin only)
 */
export const clearConfigCache = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền clear cache",
      });
    }

    systemConfigService.clearCache();

    // Log this admin action
    await systemLogService.logFromRequest(
      req,
      LogAction.SYSTEM_CONFIG_CHANGE,
      "Admin cleared system config cache",
      {
        level: LogLevel.ADMIN,
        targetType: "system_configs",
        metadata: { action: "clear_cache" },
      }
    );

    res.json({
      success: true,
      message: "Cache đã được xóa thành công",
    });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa cache",
    });
  }
};
