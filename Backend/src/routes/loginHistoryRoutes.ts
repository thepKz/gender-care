import express from "express";
import { createLoginHistory, getAllLoginHistory, getLoginHistoryByUser } from "../controllers/loginHistoryController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = express.Router();

// GET /login-history - Get all login history for management (Admin/Manager only)
router.get("/", authMiddleware, roleMiddleware(['admin', 'manager']), getAllLoginHistory);

router.post("/", createLoginHistory);
router.get("/:userId", getLoginHistoryByUser);

export default router; 