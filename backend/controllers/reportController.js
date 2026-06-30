import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import pool from "../config/database.js";

// ========================================
// STOCK REPORTS - BERDASARKAN PENJUALAN
// ========================================

export const getStockReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      low_stock_threshold = 10,
      sort_by = "total_sold", // Default sort by penjualan
      sort_order = "DESC",
      start_date,
      end_date,
    } = req.query;

    console.log("=== STOCK REPORT CONTROLLER (SALES-BASED) ===");
    console.log("Query parameters:", req.query);

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      category_id: category_id ? parseInt(category_id) : undefined,
      low_stock_threshold: parseInt(low_stock_threshold),
      sort_by,
      sort_order,
      start_date,
      end_date,
    };

    console.log("Processed filters:", filters);

    const result = await Product.getStockReport(filters);

    // Data untuk visualisasi dengan informasi penjualan
    const visualizationData = await getVisualizationData(filters);
    const salesStats = await Product.getSalesStatistics(filters);
    const topProducts = await Product.getTopSellingProducts({
      limit: 10,
      start_date,
      end_date,
      category_id,
    });

    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        filters: {
          category_id: filters.category_id,
          low_stock_threshold: filters.low_stock_threshold,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
        visualization: visualizationData,
        sales_statistics: salesStats,
        top_products: topProducts,
      },
    });
  } catch (error) {
    console.error("Get stock report error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadStockCSV = async (req, res) => {
  try {
    const {
      category_id,
      low_stock_threshold = 10,
      start_date,
      end_date,
    } = req.query;

    const filters = {
      category_id: category_id ? parseInt(category_id) : undefined,
      low_stock_threshold: parseInt(low_stock_threshold),
      start_date,
      end_date,
      limit: 1000,
    };

    const result = await Product.getStockReport(filters);

    // Format data untuk CSV dengan informasi penjualan
    const csvData = result.products.map((product) => {
      const totalSold = product.total_sold || 0;
      let salesStatus = "";

      if (totalSold === 0) {
        salesStatus = "Belum Terjual";
      } else if (totalSold <= 10) {
        salesStatus = "Penjualan Rendah";
      } else if (totalSold <= 50) {
        salesStatus = "Penjualan Sedang";
      } else {
        salesStatus = "Penjualan Tinggi";
      }

      return {
        ID: product.id,
        Nama_Produk: product.name,
        Kategori: product.category_name,
        Stok_Tersedia: product.stock_quantity,
        Total_Terjual: product.total_sold,
        Jumlah_Transaksi: product.transaction_count,
        Pendapatan: product.revenue,
        Harga_Satuan: product.price,
        Status_Penjualan: salesStatus,
        Status: product.is_available ? "Aktif" : "Nonaktif",
        Dibuat_Oleh: product.created_by_name,
        Tanggal_Dibuat: new Date(product.created_at).toLocaleDateString(
          "id-ID"
        ),
      };
    });

    const fields = [
      "ID",
      "Nama_Produk",
      "Kategori",
      "Stok_Tersedia",
      "Total_Terjual",
      "Jumlah_Transaksi",
      "Pendapatan",
      "Harga_Satuan",
      "Status_Penjualan",
      "Status",
      "Dibuat_Oleh",
      "Tanggal_Dibuat",
    ];

    const parser = new Parser({ fields, delimiter: ";" });
    const csv = parser.parse(csvData);

    const filename = `laporan-stok-penjualan-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Download CSV error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadStockPDF = async (req, res) => {
  try {
    const { category_id, start_date, end_date } = req.query;

    const filters = {
      category_id: category_id ? parseInt(category_id) : undefined,
      start_date,
      end_date,
      limit: 100, // Batasi data untuk menghindari halaman kosong
    };

    console.log("=== DOWNLOAD STOCK PDF (NO FOOTER) ===");

    const result = await Product.getStockReport(filters);
    const visualizationData = await getVisualizationData(filters);
    const salesStats = await Product.getSalesStatistics(filters);

    const doc = new PDFDocument({
      margin: 30, // Margin lebih kecil untuk ruang lebih banyak
      size: "A4",
      layout: "portrait",
    });

    const filename = `laporan-penjualan-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Helper untuk truncate text
    const truncateText = (text, maxLength) => {
      if (!text) return "N/A";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    };

    // Header - lebih compact
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("LAPORAN PENJUALAN PRODUK", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, {
        align: "center",
      });

    if (start_date || end_date) {
      const periodText = `Periode: ${start_date || "Awal"} - ${
        end_date || "Sekarang"
      }`;
      doc.text(periodText, { align: "center" });
    }

    if (category_id) {
      try {
        const category = await Category.findById(category_id);
        doc.text(`Kategori: ${category ? category.name : "Semua"}`, {
          align: "center",
        });
      } catch (error) {
        doc.text("Kategori: Semua", { align: "center" });
      }
    }

    doc.moveDown();

    // Summary Section - lebih compact
    doc.fontSize(11).font("Helvetica-Bold").text("RINGKASAN PENJUALAN");
    doc.fontSize(9).font("Helvetica");

    const summaryData = [
      `• Belum Terjual: ${visualizationData.salesSummary?.notSold || 0}`,
      `• Penjualan Rendah: ${visualizationData.salesSummary?.lowSales || 0}`,
      `• Penjualan Sedang: ${visualizationData.salesSummary?.mediumSales || 0}`,
      `• Penjualan Tinggi: ${visualizationData.salesSummary?.highSales || 0}`,
      `• Total Pendapatan: Rp ${(salesStats?.total_revenue || 0).toLocaleString(
        "id-ID"
      )}`,
    ];

    summaryData.forEach((item) => {
      doc.text(item);
    });

    doc.moveDown();

    // Table Section
    doc.fontSize(11).font("Helvetica-Bold").text("DAFTAR PRODUK:");

    let yPosition = doc.y + 8;

    // Table Header
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("No", 30, yPosition, { width: 15 });
    doc.text("Nama Produk", 50, yPosition, { width: 120 });
    doc.text("Kategori", 175, yPosition, { width: 70 });
    doc.text("Stok", 250, yPosition, { width: 25 });
    doc.text("Terjual", 280, yPosition, { width: 30 });
    doc.text("Pendapatan", 315, yPosition, { width: 70 });

    yPosition += 12;
    doc.moveTo(30, yPosition).lineTo(450, yPosition).stroke();
    yPosition += 8;

    // Table Content
    doc.font("Helvetica").fontSize(8);

    if (result.products && result.products.length > 0) {
      result.products.forEach((product, index) => {
        // Jika data terlalu banyak, stop untuk menghindari halaman kosong
        if (yPosition > 750) {
          return; // Stop menambahkan data jika hampir penuh
        }

        const productName = truncateText(product.name, 25);
        const categoryName = truncateText(product.category_name, 15);
        const totalSold = product.total_sold || 0;
        const revenue = product.revenue || 0;
        const stock = product.stock_quantity || 0;

        doc.text((index + 1).toString(), 30, yPosition, { width: 15 });
        doc.text(productName, 50, yPosition, { width: 120 });
        doc.text(categoryName, 175, yPosition, { width: 70 });
        doc.text(stock.toString(), 250, yPosition, { width: 25 });
        doc.text(totalSold.toString(), 280, yPosition, { width: 30 });
        doc.text(`Rp ${revenue.toLocaleString("id-ID")}`, 315, yPosition, {
          width: 70,
        });

        yPosition += 14; // Jarak lebih rapat
      });
    } else {
      doc.text("Tidak ada data produk", 30, yPosition);
    }

    // TIDAK ADA FOOTER - langsung end
    doc.end();
  } catch (error) {
    console.error("Download PDF error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Gagal membuat laporan PDF",
        error: error.message,
      });
    }
  }
};

// ========================================
// TRANSACTION REPORTS
// ========================================

export const getTransactionReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      payment_method,
      cashier_id,
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date,
      payment_method,
      cashier_id: cashier_id ? parseInt(cashier_id) : undefined,
    };

    const result = await Transaction.findAll(filters);
    const stats = await Transaction.getStatistics(filters);
    const dailyRevenue = await getDailyRevenue(filters);

    res.json({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        statistics: stats,
        dailyRevenue,
        filters,
      },
    });
  } catch (error) {
    console.error("Get transaction report error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadTransactionCSV = async (req, res) => {
  try {
    const { start_date, end_date, payment_method, cashier_id } = req.query;

    console.log("=== DOWNLOAD TRANSACTION CSV ===");
    console.log("Query parameters:", req.query);

    const filters = {
      start_date,
      end_date,
      payment_method,
      cashier_id: cashier_id ? parseInt(cashier_id) : undefined,
      limit: 10000,
    };

    const result = await Transaction.findAll(filters);

    // Format data untuk CSV
    const csvData = result.transactions.map((transaction) => ({
      Invoice: transaction.invoice_number,
      Tanggal: new Date(transaction.created_at).toLocaleDateString("id-ID"),
      Waktu: new Date(transaction.created_at).toLocaleTimeString("id-ID"),
      Kasir: transaction.cashier_name,
      Pelanggan: transaction.customer_name || "Guest",
      Metode_Pembayaran: transaction.payment_method.toUpperCase(),
      Total: transaction.total_amount,
      Dibayar: transaction.paid_amount,
      Kembalian: transaction.change_amount,
      Jumlah_Item: transaction.items.length,
    }));

    const fields = [
      "Invoice",
      "Tanggal",
      "Waktu",
      "Kasir",
      "Pelanggan",
      "Metode_Pembayaran",
      "Total",
      "Dibayar",
      "Kembalian",
      "Jumlah_Item",
    ];

    const parser = new Parser({ fields, delimiter: ";" });
    const csv = parser.parse(csvData);

    const filename = `laporan-transaksi-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Download transaction CSV error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadTransactionPDF = async (req, res) => {
  try {
    const { start_date, end_date, payment_method, cashier_id } = req.query;

    console.log("=== DOWNLOAD TRANSACTION PDF (NO FOOTER) ===");

    const filters = {
      start_date,
      end_date,
      payment_method,
      cashier_id: cashier_id ? parseInt(cashier_id) : undefined,
      limit: 80, // Batasi data
    };

    const result = await Transaction.findAll(filters);
    const stats = await Transaction.getStatistics(filters);

    const doc = new PDFDocument({
      margin: 30, // Margin lebih kecil
      size: "A4",
    });

    const filename = `laporan-transaksi-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header - lebih compact
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("LAPORAN TRANSAKSI", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, {
        align: "center",
      });

    // Filter Information
    doc.moveDown();
    doc.fontSize(9).font("Helvetica");

    if (start_date || end_date) {
      const dateRange = `Periode: ${
        start_date ? new Date(start_date).toLocaleDateString("id-ID") : "Awal"
      } - ${
        end_date ? new Date(end_date).toLocaleDateString("id-ID") : "Sekarang"
      }`;
      doc.text(dateRange);
    }

    if (payment_method) {
      doc.text(`Metode: ${payment_method.toUpperCase()}`);
    }

    // Summary Statistics - lebih compact
    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").text("RINGKASAN");
    doc.fontSize(9).font("Helvetica");
    doc.moveDown(0.3);

    const summaryData = [
      `• Total Transaksi: ${stats.total_transactions || 0}`,
      `• Total Pendapatan: Rp ${(stats.total_revenue || 0).toLocaleString(
        "id-ID"
      )}`,
      `• Rata-rata: Rp ${Math.round(
        stats.average_transaction || 0
      ).toLocaleString("id-ID")}`,
      `• Cash: ${stats.cash_transactions || 0} | QRIS: ${
        stats.qris_transactions || 0
      }`,
    ];

    summaryData.forEach((item) => {
      doc.text(item);
    });

    // Transaction Table
    doc.moveDown();
    doc.fontSize(11).font("Helvetica-Bold").text("DETAIL TRANSAKSI");
    doc.moveDown(0.5);

    // Table Header
    let yPosition = doc.y;
    doc.fontSize(8).font("Helvetica-Bold");

    const columnWidths = {
      no: 15,
      invoice: 80,
      date: 50,
      cashier: 60,
      payment: 35,
      total: 60,
    };

    doc.text("No", 30, yPosition, { width: columnWidths.no });
    doc.text("Invoice", 50, yPosition, { width: columnWidths.invoice });
    doc.text("Tanggal", 135, yPosition, { width: columnWidths.date });
    doc.text("Kasir", 190, yPosition, { width: columnWidths.cashier });
    doc.text("Bayar", 255, yPosition, { width: columnWidths.payment });
    doc.text("Total", 295, yPosition, { width: columnWidths.total });

    // Draw line under header
    yPosition += 10;
    doc.moveTo(30, yPosition).lineTo(400, yPosition).stroke();

    // Table Content
    doc.font("Helvetica").fontSize(7.5);
    yPosition += 6;

    if (result.transactions && result.transactions.length > 0) {
      result.transactions.forEach((transaction, index) => {
        // Stop jika hampir penuh
        if (yPosition > 750) {
          return;
        }

        doc.text((index + 1).toString(), 30, yPosition, {
          width: columnWidths.no,
        });
        doc.text(transaction.invoice_number, 50, yPosition, {
          width: columnWidths.invoice,
        });
        doc.text(
          new Date(transaction.created_at).toLocaleDateString("id-ID"),
          135,
          yPosition,
          { width: columnWidths.date }
        );

        // Truncate cashier name
        const cashierName =
          transaction.cashier_name && transaction.cashier_name.length > 12
            ? transaction.cashier_name.substring(0, 10) + "..."
            : transaction.cashier_name;

        doc.text(cashierName, 190, yPosition, { width: columnWidths.cashier });
        doc.text(
          transaction.payment_method.toUpperCase().substring(0, 4),
          255,
          yPosition,
          { width: columnWidths.payment }
        );
        doc.text(
          `Rp ${transaction.total_amount.toLocaleString("id-ID")}`,
          295,
          yPosition,
          { width: columnWidths.total }
        );

        yPosition += 10; // Jarak sangat rapat
      });
    } else {
      doc.text("Tidak ada data transaksi", 30, yPosition);
    }

    // TIDAK ADA FOOTER - langsung end
    doc.end();
  } catch (error) {
    console.error("Download transaction PDF error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Helper untuk Stock Report
const getVisualizationData = async (filters) => {
  try {
    // Untuk PDF, batasi data yang diambil
    const allProducts = await Product.getStockReport({
      ...filters,
      limit: 50, // Batasi untuk performa PDF
    });

    const salesSummary = {
      notSold: 0,
      lowSales: 0,
      mediumSales: 0,
      highSales: 0,
    };

    const categorySales = {};
    const topSellingProducts = [];

    allProducts.products.forEach((product) => {
      const totalSold = product.total_sold || 0;

      // Sales summary
      if (totalSold === 0) {
        salesSummary.notSold++;
      } else if (totalSold <= 10) {
        salesSummary.lowSales++;
      } else if (totalSold <= 50) {
        salesSummary.mediumSales++;
      } else {
        salesSummary.highSales++;
      }

      // Category aggregation untuk sales
      if (!categorySales[product.category_name]) {
        categorySales[product.category_name] = {
          total_sold: 0,
          revenue: 0,
          product_count: 0,
        };
      }
      categorySales[product.category_name].total_sold += totalSold;
      categorySales[product.category_name].revenue += product.revenue;
      categorySales[product.category_name].product_count++;

      // Top selling products
      if (totalSold > 0) {
        topSellingProducts.push({
          name: product.name,
          total_sold: totalSold,
          revenue: product.revenue,
          category: product.category_name,
        });
      }
    });

    return {
      salesSummary,
      categorySales,
      topSellingProducts: topSellingProducts
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 10),
      totalRevenue: allProducts.products.reduce(
        (sum, product) => sum + product.revenue,
        0
      ),
      totalProductsSold: allProducts.products.filter((p) => p.total_sold > 0)
        .length,
    };
  } catch (error) {
    console.error("Error in getVisualizationData:", error);
    // Return default values jika error
    return {
      salesSummary: { notSold: 0, lowSales: 0, mediumSales: 0, highSales: 0 },
      categorySales: {},
      topSellingProducts: [],
      totalRevenue: 0,
      totalProductsSold: 0,
    };
  }
};

// Helper untuk Transaction Report
const getDailyRevenue = async (filters) => {
  const { start_date, end_date, payment_method, cashier_id } = filters;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (start_date) {
    whereClause += " AND DATE(created_at) >= ?";
    params.push(start_date);
  }

  if (end_date) {
    whereClause += " AND DATE(created_at) <= ?";
    params.push(end_date);
  }

  if (payment_method) {
    whereClause += " AND payment_method = ?";
    params.push(payment_method);
  }

  if (cashier_id) {
    whereClause += " AND cashier_id = ?";
    params.push(cashier_id);
  }

  const [rows] = await pool.execute(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as revenue
     FROM transactions
     ${whereClause}
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 30`,
    params
  );

  return rows;
};

export const downloadTransactionDetailPDF = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== DOWNLOAD TRANSACTION DETAIL PDF ===");
    console.log("Transaction ID:", id);

    // Get transaction details
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
    });

    const filename = `detail-transaksi-${transaction.invoice_number}-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("DETAIL TRANSAKSI", { align: "center" });
    doc.moveDown(0.5);

    // Store initial Y position
    let yPosition = doc.y;

    // Left Column - Transaction Info
    doc.fontSize(10).font("Helvetica");

    // Invoice Number
    doc
      .font("Helvetica-Bold")
      .text("Nomor Invoice:", 50, yPosition)
      .font("Helvetica")
      .text(transaction.invoice_number, 150, yPosition);
    yPosition += 15;

    // Date
    doc
      .font("Helvetica-Bold")
      .text("Tanggal:", 50, yPosition)
      .font("Helvetica")
      .text(
        new Date(transaction.created_at).toLocaleDateString("id-ID"),
        150,
        yPosition
      );
    yPosition += 15;

    // Time
    doc
      .font("Helvetica-Bold")
      .text("Waktu:", 50, yPosition)
      .font("Helvetica")
      .text(
        new Date(transaction.created_at).toLocaleTimeString("id-ID"),
        150,
        yPosition
      );
    yPosition += 15;

    // Cashier
    doc
      .font("Helvetica-Bold")
      .text("Kasir:", 50, yPosition)
      .font("Helvetica")
      .text(transaction.cashier_name, 150, yPosition);
    yPosition += 15;

    // Customer
    doc
      .font("Helvetica-Bold")
      .text("Pelanggan:", 50, yPosition)
      .font("Helvetica")
      .text(transaction.customer_name || "Guest", 150, yPosition);
    yPosition += 15;

    // Payment Method
    doc
      .font("Helvetica-Bold")
      .text("Metode Bayar:", 50, yPosition)
      .font("Helvetica")
      .text(transaction.payment_method.toUpperCase(), 150, yPosition);
    yPosition += 20;

    // Right Column - Payment Summary
    const rightColumnX = 300;

    doc.font("Helvetica-Bold").text("RINGKASAN PEMBAYARAN", rightColumnX, 120);

    doc
      .font("Helvetica")
      .text("Subtotal:", rightColumnX, 140)
      .text(
        `Rp ${transaction.subtotal_amount.toLocaleString("id-ID")}`,
        rightColumnX + 80,
        140
      );

    doc
      .text("PPN (10%):", rightColumnX, 155)
      .text(
        `Rp ${transaction.tax_amount.toLocaleString("id-ID")}`,
        rightColumnX + 80,
        155
      );

    doc
      .font("Helvetica-Bold")
      .text("Total:", rightColumnX, 170)
      .text(
        `Rp ${transaction.total_amount.toLocaleString("id-ID")}`,
        rightColumnX + 80,
        170
      );

    doc
      .text("Dibayar:", rightColumnX, 185)
      .text(
        `Rp ${transaction.paid_amount.toLocaleString("id-ID")}`,
        rightColumnX + 80,
        185
      );

    doc
      .text("Kembali:", rightColumnX, 200)
      .text(
        `Rp ${transaction.change_amount.toLocaleString("id-ID")}`,
        rightColumnX + 80,
        200
      );

    // Draw line separator
    doc.moveTo(50, 220).lineTo(550, 220).stroke();
    doc.moveDown(2);

    // Items Table Header
    yPosition = 240;
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("No", 50, yPosition);
    doc.text("Nama Produk", 80, yPosition, { width: 200 });
    doc.text("Qty", 300, yPosition);
    doc.text("Harga", 340, yPosition);
    doc.text("Subtotal", 420, yPosition);

    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Items Table Content
    doc.font("Helvetica").fontSize(10);

    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;

          // Draw table header again on new page
          doc.font("Helvetica-Bold").fontSize(11);
          doc.text("No", 50, yPosition);
          doc.text("Nama Produk", 80, yPosition, { width: 200 });
          doc.text("Qty", 300, yPosition);
          doc.text("Harga", 340, yPosition);
          doc.text("Subtotal", 420, yPosition);

          yPosition += 15;
          doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
          yPosition += 10;
          doc.font("Helvetica").fontSize(10);
        }

        doc.text((index + 1).toString(), 50, yPosition);

        // Product name dengan truncate untuk menghindari overflow
        const productName = item.product_name || "N/A";
        const truncatedName =
          productName.length > 30
            ? productName.substring(0, 27) + "..."
            : productName;

        doc.text(truncatedName, 80, yPosition, {
          width: 200,
          lineBreak: false, // Hindari line break untuk konsistensi tinggi baris
        });

        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`Rp ${item.price.toLocaleString("id-ID")}`, 340, yPosition);
        doc.text(
          `Rp ${(item.subtotal || item.quantity * item.price).toLocaleString(
            "id-ID"
          )}`,
          420,
          yPosition
        );

        // Move to next position dengan tinggi tetap
        yPosition += 20;
      });
    } else {
      doc.text("Tidak ada item", 80, yPosition);
      yPosition += 20;
    }

    // Final separator
    yPosition += 10;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Footer note
    yPosition += 20;
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text("Terima kasih atas pembeliannya!", 50, yPosition, {
        align: "center",
        width: 500,
      });

    doc.end();
  } catch (error) {
    console.error("Download transaction detail PDF error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};
