import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
  getCategoriesWithStats,
} from "../controllers/categoryController.js";
import {
  authenticateToken,
  requireRole,
  checkRouteAccess,
} from "../middleware/auth.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Only pemilik can access CRUD operations
router.post(
  "/",
  requireRole(["pemilik"]),
  validateCreateCategory,
  createCategory
);

// Routes untuk melihat categories bisa diakses oleh pemilik dan karyawan
router.get("/", checkRouteAccess(["pemilik", "karyawan"]), getAllCategories);
router.get("/:id", checkRouteAccess(["pemilik", "karyawan"]), getCategoryById);
router.get(
  "/:id/products",
  checkRouteAccess(["pemilik", "karyawan"]),
  getCategoryProducts
);

// Hanya pemilik yang bisa akses stats dan operasi modifikasi
router.get("/stats/summary", requireRole(["pemilik"]), getCategoriesWithStats);
router.put(
  "/:id",
  requireRole(["pemilik"]),
  validateUpdateCategory,
  updateCategory
);
router.delete("/:id", requireRole(["pemilik"]), deleteCategory);

export default router;
