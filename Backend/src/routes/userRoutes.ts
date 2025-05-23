import express from "express";
import multer from 'multer';
import {
    changePassword,
    getCurrentUserProfile,
    updateUserAvatar,
    updateUserProfile,
    uploadAvatarImage
} from "../controllers/userController";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// User Profile Routes (Authenticated users)
router.get("/profile/me", verifyToken, getCurrentUserProfile);
router.put("/profile/me", verifyToken, updateUserProfile);
router.put("/profile/me/avatar", verifyToken, updateUserAvatar);
router.put("/profile/me/change-password", verifyToken, changePassword);
router.post("/profile/me/avatar/upload", verifyToken, upload.single('avatar'), uploadAvatarImage);

export default router;
