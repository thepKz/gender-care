import express from "express";
import {
  checkEmail,
  login,
  loginAdmin,
  loginWithGoogle,
  register,
  sendNewVerifyEmail,
  verifyEmail
} from "../controllers/authController";

const router = express.Router();
router.post("/register", register);
router.post("/verify-email", verifyEmail); // app password
router.post("/new-verify", sendNewVerifyEmail);
router.post("/login", login);
router.post("/login-google", loginWithGoogle);
router.post("/login-admin", loginAdmin);
router.post("/check-email", checkEmail);

export default router;
