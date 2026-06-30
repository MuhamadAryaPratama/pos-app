import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  deleteTransaction,
  getTodayTransactions,
  confirmQRISPayment,
  cancelQRISPayment,
  getPendingQRISTransactions,
} from "../controllers/transactionController.js";
import {
  authenticateToken,
  requireRole,
  checkRouteAccess,
} from "../middleware/auth.js";
import {
  validateCreateTransaction,
  validateGetTransactions,
} from "../middleware/validation.js";

const router = express.Router();

// Semua routes membutuhkan authentication
router.use(authenticateToken);

// Routes yang bisa diakses oleh pemilik dan karyawan
router.post(
  "/",
  checkRouteAccess(["pemilik", "karyawan"]),
  validateCreateTransaction,
  createTransaction
);
router.get(
  "/",
  checkRouteAccess(["pemilik", "karyawan"]),
  validateGetTransactions,
  getTransactions
);
router.get(
  "/today",
  checkRouteAccess(["pemilik", "karyawan"]),
  getTodayTransactions
);
router.get(
  "/pending-qris",
  checkRouteAccess(["pemilik", "karyawan"]),
  getPendingQRISTransactions
);
router.get(
  "/:id",
  checkRouteAccess(["pemilik", "karyawan"]),
  getTransactionById
);

// Konfirmasi dan cancel QRIS - bisa dilakukan oleh pemilik dan karyawan
router.patch(
  "/:id/confirm-qris",
  checkRouteAccess(["pemilik", "karyawan"]),
  confirmQRISPayment
);
router.patch(
  "/:id/cancel-qris",
  checkRouteAccess(["pemilik", "karyawan"]),
  cancelQRISPayment
);

// Hanya pemilik yang bisa delete transaksi
router.delete("/:id", requireRole(["pemilik"]), deleteTransaction);

export default router;
