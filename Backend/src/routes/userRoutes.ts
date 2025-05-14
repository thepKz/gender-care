import express from "express";
import {
    changePassword,
    checkEmailWithPhoneNumber,
    checkPhoneNumber,
    forgotPassword,
    getAllUsers,
    getUser,
    resetPassword,
    searchUsers,
    toggleUserStatus,
    updateProfile,
} from "../controllers/userController";
import { authMiddleware } from "../middleware";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.get("/all", authMiddleware, getAllUsers);
router.get("/search", authMiddleware, searchUsers);
router.post("/check-phoneNumber", checkPhoneNumber);
router.post("/check-email-with-phoneNumber", checkEmailWithPhoneNumber)
router.patch("/update-profile", authMiddleware, updateProfile);
router.patch("/toggle-status/:userId", authMiddleware, toggleUserStatus);
router.patch("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
