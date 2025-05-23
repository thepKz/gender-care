import { Request, Response } from "express";
import LoginHistory from "../models/LoginHistory";

export const createLoginHistory = async (req: Request, res: Response) => {
  try {
    const { userId, ipAddress, userAgent, status, failReason } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ message: "Thiếu userId hoặc status" });
    }
    const history = await LoginHistory.create({
      userId,
      ipAddress,
      userAgent,
      status,
      failReason,
      loginAt: new Date(),
    });
    return res.status(201).json({ data: history });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLoginHistoryByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });
    const history = await LoginHistory.find({ userId }).sort({ loginAt: -1 });
    return res.status(200).json({ data: history });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 