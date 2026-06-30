import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";

export const createTransaction = async (req, res) => {
  try {
    const { payment_method, paid_amount, items, customer_name } = req.body;

    console.log("=== CREATE TRANSACTION ===");
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    // Validasi field required
    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!paid_amount) {
      return res.status(400).json({
        success: false,
        message: "Paid amount is required",
      });
    }

    // Validasi items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty",
      });
    }

    // Validasi setiap item
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have product_id and quantity",
        });
      }

      const product = await Product.findById(item.product_id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`,
        });
      }

      if (!product.is_available) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`,
        });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`,
        });
      }
    }

    // Hitung total amount dari items (sebelum PPN)
    let subtotal_amount = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      const item_subtotal = product.price * item.quantity;
      subtotal_amount += item_subtotal;

      itemsWithDetails.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: item_subtotal,
      });
    }

    // Hitung PPN 10%
    const tax_amount = subtotal_amount * 0.1;

    // Total amount setelah PPN
    const total_amount = subtotal_amount + tax_amount;

    // Validasi paid_amount
    const paidAmountNum = parseFloat(paid_amount);
    if (isNaN(paidAmountNum) || paidAmountNum < total_amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient payment. Total (including tax): ${total_amount.toFixed(
          2
        )}, Paid: ${paidAmountNum}`,
      });
    }

    const change_amount = paidAmountNum - total_amount;

    // Pastikan user data ada
    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(400).json({
        success: false,
        message: "User information is missing",
      });
    }

    // Buat transaksi dengan data yang sudah divalidasi
    const transactionData = {
      cashier_id: req.user.id,
      cashier_name: req.user.name,
      customer_name: customer_name || "Guest",
      payment_method,
      subtotal_amount, // total sebelum PPN
      tax_amount, // jumlah PPN
      total_amount, // total setelah PPN
      paid_amount: paidAmountNum,
      change_amount,
      items: itemsWithDetails,
    };

    console.log("Final transaction data:", transactionData);

    const transaction = await Transaction.create(transactionData);

    // Response berbeda berdasarkan payment method
    let message = "Transaction created successfully";
    if (payment_method === "qris") {
      message =
        "QRIS transaction created. Please wait for payment confirmation.";
    }

    res.status(201).json({
      success: true,
      message,
      data: {
        transaction,
        requires_confirmation: payment_method === "qris",
      },
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      payment_method,
      cashier_id,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      start_date,
      end_date,
      payment_method,
      cashier_id,
      search,
      sort_by,
      sort_order,
    };

    const result = await Transaction.findAll(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    console.error("Get transaction by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Hanya pemilik yang bisa delete transaksi
    if (req.user.role !== "pemilik") {
      return res.status(403).json({
        success: false,
        message: "Only owner can delete transactions",
      });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const isDeleted = await Transaction.delete(id);

    if (!isDeleted) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
      });
    }

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTodayTransactions = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await Transaction.findAll({
      page: 1,
      limit: 1000,
      start_date: today,
      end_date: today,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get today transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const confirmQRISPayment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== CONFIRM QRIS PAYMENT ===");
    console.log("Transaction ID:", id);
    console.log("User:", req.user);

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.payment_method !== "qris") {
      return res.status(400).json({
        success: false,
        message: "Only QRIS transactions can be confirmed",
      });
    }

    if (transaction.status === "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Transaction already confirmed",
      });
    }

    if (transaction.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot confirm cancelled transaction",
      });
    }

    const isUpdated = await Transaction.updateStatus(
      id,
      "confirmed",
      req.user.id
    );

    if (!isUpdated) {
      return res.status(500).json({
        success: false,
        message: "Failed to confirm transaction",
      });
    }

    // Get updated transaction
    const updatedTransaction = await Transaction.findById(id);

    res.json({
      success: true,
      message: "QRIS payment confirmed successfully",
      data: { transaction: updatedTransaction },
    });
  } catch (error) {
    console.error("Confirm QRIS payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const cancelQRISPayment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== CANCEL QRIS PAYMENT ===");
    console.log("Transaction ID:", id);
    console.log("User:", req.user);

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.payment_method !== "qris") {
      return res.status(400).json({
        success: false,
        message: "Only QRIS transactions can be cancelled",
      });
    }

    if (transaction.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Transaction already cancelled",
      });
    }

    const isUpdated = await Transaction.updateStatus(id, "cancelled");

    if (!isUpdated) {
      return res.status(500).json({
        success: false,
        message: "Failed to cancel transaction",
      });
    }

    // Get updated transaction
    const updatedTransaction = await Transaction.findById(id);

    res.json({
      success: true,
      message: "QRIS payment cancelled successfully",
      data: { transaction: updatedTransaction },
    });
  } catch (error) {
    console.error("Cancel QRIS payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPendingQRISTransactions = async (req, res) => {
  try {
    const pendingTransactions = await Transaction.findPendingQRIS();

    res.json({
      success: true,
      data: { transactions: pendingTransactions },
    });
  } catch (error) {
    console.error("Get pending QRIS transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
