import express from "express";
import multer from 'multer';
import {
    changePassword,
    createUser,
    deleteUser,
    // Admin functions
    getAllUsers,
    getCurrentUserProfile,
    getSystemStatistics,
    getUserById,
    toggleUserStatus,
    updateUserAvatar,
    updateUserProfile,
    updateUserRole,
    uploadAvatarImage
} from "../controllers/userController";
import { verifyToken } from "../middleware/auth";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// User Profile Routes (Authenticated users)
router.get("/profile/me", verifyToken, getCurrentUserProfile);
router.put("/profile/me", verifyToken, updateUserProfile);
router.put("/profile/me/avatar", verifyToken, updateUserAvatar);
router.put("/profile/me/change-password", verifyToken, changePassword);
router.post("/profile/me/avatar/upload", verifyToken, upload.single('avatar'), uploadAvatarImage);

// ===== ADMIN ONLY ROUTES =====
// Quản lý người dùng (Admin only)
router.get("/", verifyToken, roleMiddleware(['admin']), getAllUsers);
router.post("/", verifyToken, roleMiddleware(['admin']), createUser);
router.get("/statistics", verifyToken, roleMiddleware(['admin']), getSystemStatistics);
router.get("/:userId", verifyToken, roleMiddleware(['admin']), getUserById);
router.put("/:userId/role", verifyToken, roleMiddleware(['admin']), updateUserRole);
router.patch("/:userId/toggle-status", verifyToken, roleMiddleware(['admin']), toggleUserStatus);
router.delete("/:userId", verifyToken, roleMiddleware(['admin']), deleteUser);

export default router;
