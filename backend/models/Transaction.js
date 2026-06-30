import pool from "../config/database.js";
import Product from "./Product.js";

class Transaction {
  // Generate invoice number
  static generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `INV-${year}${month}${day}-${random}`;
  }

  // Create new transaction
  static async create(transactionData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        cashier_id,
        cashier_name,
        customer_name,
        payment_method,
        subtotal_amount,
        tax_amount,
        total_amount,
        paid_amount,
        change_amount,
        items,
      } = transactionData;

      const invoice_number = this.generateInvoiceNumber();

      // Tentukan status berdasarkan payment method
      const status = payment_method === "qris" ? "pending" : "confirmed";

      // Insert transaction
      const [transactionResult] = await connection.execute(
        `INSERT INTO transactions 
       (invoice_number, cashier_id, cashier_name, customer_name, payment_method, 
        subtotal_amount, tax_amount, total_amount, paid_amount, change_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice_number,
          cashier_id,
          cashier_name,
          customer_name || "Guest",
          payment_method,
          subtotal_amount,
          tax_amount,
          total_amount,
          paid_amount,
          change_amount || 0,
          status,
        ]
      );

      const transaction_id = transactionResult.insertId;

      // Insert transaction items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO transaction_items 
         (transaction_id, product_id, product_name, quantity, price, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.price,
            item.subtotal,
          ]
        );
      }

      await connection.commit();

      // Fetch the created transaction with items
      return await this.findById(transaction_id);
    } catch (error) {
      await connection.rollback();
      console.error("Transaction creation error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find transaction by ID
  static async findById(id) {
    const [transactions] = await pool.execute(
      `SELECT t.*, u.name as cashier_name
       FROM transactions t
       LEFT JOIN users u ON t.cashier_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (transactions.length === 0) {
      return null;
    }

    const transaction = transactions[0];

    // Get transaction items
    const [items] = await pool.execute(
      `SELECT ti.*, p.image_url
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = ?`,
      [id]
    );

    transaction.items = items.map((item) => ({
      ...item,
      image_url: item.image_url
        ? Product.getFullImageUrl(item.image_url)
        : null,
    }));

    return transaction;
  }

  // Get all transactions with filters
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      payment_method,
      cashier_id,
    } = filters;

    // Untuk PDF, batasi data
    const effectiveLimit =
      filters.limit === 10000
        ? 80
        : filters.limit === 50
        ? 80
        : parseInt(limit);
    const offset = (page - 1) * effectiveLimit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (start_date) {
      whereClause += " AND DATE(t.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      whereClause += " AND DATE(t.created_at) <= ?";
      params.push(end_date);
    }

    if (payment_method) {
      whereClause += " AND t.payment_method = ?";
      params.push(payment_method);
    }

    if (cashier_id) {
      whereClause += " AND t.cashier_id = ?";
      params.push(cashier_id);
    }

    const [transactions] = await pool.query(
      `SELECT t.*, u.name as cashier_name 
     FROM transactions t 
     LEFT JOIN users u ON t.cashier_id = u.id 
     ${whereClause} 
     ORDER BY t.created_at DESC 
     LIMIT ? OFFSET ?`,
      [...params, effectiveLimit, offset]
    );

    // Get transaction items for each transaction
    for (let transaction of transactions) {
      const [items] = await pool.execute(
        `SELECT ti.*, p.name as product_name, p.price 
       FROM transaction_items ti 
       JOIN products p ON ti.product_id = p.id 
       WHERE ti.transaction_id = ?`,
        [transaction.id]
      );
      transaction.items = items;
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
     FROM transactions t 
     ${whereClause}`,
      params
    );

    return {
      transactions,
      total: countResult[0].total,
      page: parseInt(page),
      limit: effectiveLimit,
      totalPages: Math.ceil(countResult[0].total / effectiveLimit),
    };
  }

  // Delete transaction (only for owner)
  static async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // HAPUS bagian restore stock karena tidak ada kolom stock_quantity
      // const [items] = await connection.execute(
      //   `SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?`,
      //   [id]
      // );

      // for (const item of items) {
      //   await connection.execute(
      //     `UPDATE products
      //      SET stock_quantity = stock_quantity + ?
      //      WHERE id = ?`,
      //     [item.quantity, item.product_id]
      //   );
      // }

      // Delete transaction items
      await connection.execute(
        `DELETE FROM transaction_items WHERE transaction_id = ?`,
        [id]
      );

      // Delete transaction
      const [result] = await connection.execute(
        `DELETE FROM transactions WHERE id = ?`,
        [id]
      );

      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("Transaction deletion error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get transaction statistics
  static async getStatistics(filters = {}) {
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

    const [stats] = await pool.execute(
      `SELECT 
       COUNT(*) as total_transactions,
       COALESCE(SUM(total_amount), 0) as total_revenue,
       COALESCE(SUM(subtotal_amount), 0) as total_subtotal,
       COALESCE(SUM(tax_amount), 0) as total_tax,
       COALESCE(AVG(total_amount), 0) as average_transaction,
       SUM(CASE WHEN payment_method = 'cash' THEN 1 ELSE 0 END) as cash_transactions,
       SUM(CASE WHEN payment_method = 'qris' THEN 1 ELSE 0 END) as qris_transactions,
       COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_total_amount,
       COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) as qris_total_amount
     FROM transactions
     ${whereClause}`,
      params
    );

    return {
      total_transactions: parseInt(stats[0].total_transactions) || 0,
      total_revenue: parseFloat(stats[0].total_revenue) || 0,
      total_subtotal: parseFloat(stats[0].total_subtotal) || 0,
      total_tax: parseFloat(stats[0].total_tax) || 0,
      average_transaction: parseFloat(stats[0].average_transaction) || 0,
      cash_transactions: parseInt(stats[0].cash_transactions) || 0,
      qris_transactions: parseInt(stats[0].qris_transactions) || 0,
      cash_total_amount: parseFloat(stats[0].cash_total_amount) || 0,
      qris_total_amount: parseFloat(stats[0].qris_total_amount) || 0,
    };
  }

  // Update status transaksi
  static async updateStatus(id, status, confirmedBy = null) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let query = `UPDATE transactions SET status = ?`;
      const params = [status];

      if (status === "confirmed" && confirmedBy) {
        query += `, qris_confirmed_at = CURRENT_TIMESTAMP, qris_confirmed_by = ?`;
        params.push(confirmedBy);
      } else if (status === "cancelled") {
        query += `, qris_confirmed_at = NULL, qris_confirmed_by = NULL`;
      }

      query += ` WHERE id = ?`;
      params.push(id);

      const [result] = await connection.execute(query, params);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("Update transaction status error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get pending QRIS transactions
  static async findPendingQRIS() {
    const [transactions] = await pool.execute(
      `SELECT t.*, u.name as cashier_name, 
            uc.name as confirmed_by_name
     FROM transactions t
     LEFT JOIN users u ON t.cashier_id = u.id
     LEFT JOIN users uc ON t.qris_confirmed_by = uc.id
     WHERE t.payment_method = 'qris' AND t.status = 'pending'
     ORDER BY t.created_at DESC`
    );

    // Get items for each transaction
    for (const transaction of transactions) {
      const [items] = await pool.execute(
        `SELECT * FROM transaction_items WHERE transaction_id = ?`,
        [transaction.id]
      );
      transaction.items = items;
    }

    return transactions;
  }
}

export default Transaction;
