import express from "express";
import {
  // Stock Reports
  getStockReport,
  downloadStockCSV,
  downloadStockPDF,
  // Transaction Reports
  getTransactionReport,
  downloadTransactionCSV,
  downloadTransactionPDF,
  downloadTransactionDetailPDF,
} from "../controllers/reportController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateGetTransactions } from "../middleware/validation.js";

const router = express.Router();

// ========================================
// Semua routes membutuhkan authentication
// ========================================
router.use(authenticateToken);

// ========================================
// STOCK REPORTS - BERDASARKAN PENJUALAN
// ========================================

// Get stock report dengan pagination dan visualization data
router.get("/stock", getStockReport);

// Download stock report - accessible by all authenticated users
router.get("/stock/download/csv", downloadStockCSV);
router.get("/stock/download/pdf", downloadStockPDF);

// ========================================
// TRANSACTION REPORTS
// ========================================

// Get transaction report dengan pagination dan statistik
router.get("/transactions", validateGetTransactions, getTransactionReport);

// Download transaction report - hanya untuk role pemilik
router.get(
  "/transactions/download/csv",
  requireRole(["pemilik"]),
  validateGetTransactions,
  downloadTransactionCSV
);

router.get(
  "/transactions/download/pdf",
  requireRole(["pemilik"]),
  validateGetTransactions,
  downloadTransactionPDF
);

router.get("/transactions/:id/download/pdf", downloadTransactionDetailPDF);

export default router;
