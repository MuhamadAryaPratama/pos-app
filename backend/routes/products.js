import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import {
  authenticateToken,
  requireRole,
  checkRouteAccess,
} from "../middleware/auth.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
} from "../middleware/validation.js";
import { upload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Semua routes membutuhkan authentication
router.use(authenticateToken);

// Hanya pemilik yang bisa membuat, update, delete products
router.post(
  "/",
  requireRole(["pemilik"]),
  upload.single("image"),
  handleUploadError,
  validateCreateProduct,
  createProduct
);

router.put(
  "/:id",
  requireRole(["pemilik"]),
  upload.single("image"),
  handleUploadError,
  validateUpdateProduct,
  updateProduct
);

router.delete("/:id", requireRole(["pemilik"]), deleteProduct);

// Routes yang bisa diakses oleh semua role yang terautentikasi (pemilik dan karyawan)
router.get("/", checkRouteAccess(["pemilik", "karyawan"]), getProducts);
router.get("/:id", checkRouteAccess(["pemilik", "karyawan"]), getProductById);

export default router;
