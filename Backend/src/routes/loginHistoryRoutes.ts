import express from "express";
import { createLoginHistory, getLoginHistoryByUser } from "../controllers/loginHistoryController";

const router = express.Router();

router.post("/", createLoginHistory);
router.get("/:userId", getLoginHistoryByUser);

export default router; 