import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
} from "../middleware/validation.js";
import { authenticateToken, checkActivity } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Protected routes
router.post("/logout", authenticateToken, checkActivity, logout);
router.get("/profile", authenticateToken, checkActivity, getProfile);
router.put(
  "/profile",
  authenticateToken,
  checkActivity,
  validateUpdateProfile,
  updateProfile
);

export default router;
