import fs from "fs";

export const validateRegister = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and name are required",
    });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  if (role && !["pemilik", "karyawan"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be either 'pemilik' or 'karyawan'",
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  next();
};

export const validateResetPassword = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  next();
};

export const validateCreateProduct = (req, res, next) => {
  const { name, price, category_id } = req.body;

  if (!name || !price || !category_id) {
    // Hapus file jika upload gagal validasi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: "Name, price, and category_id are required",
    });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum <= 0) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: "Price must be a number greater than 0",
    });
  }

  next();
};

export const validateUpdateProduct = (req, res, next) => {
  const { price } = req.body;

  if (price !== undefined) {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than 0",
      });
    }
  }

  next();
};

export const validateCreateCategory = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori wajib diisi",
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori minimal 2 karakter",
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori maksimal 100 karakter",
    });
  }

  next();
};

export const validateUpdateCategory = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori wajib diisi",
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori minimal 2 karakter",
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori maksimal 100 karakter",
    });
  }

  next();
};

export const validateCreateTransaction = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { payment_method, paid_amount, items } = req.body;

  if (!payment_method) {
    return res.status(400).json({
      success: false,
      message: "Payment method is required",
    });
  }

  if (!["cash", "qris"].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: "Payment method must be either 'cash' or 'qris'",
    });
  }

  if (!paid_amount || paid_amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid paid amount is required",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Items array is required and cannot be empty",
    });
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Each item must have product_id and positive quantity",
      });
    }
  }

  next();
};

export const validateGetTransactions = (req, res, next) => {
  const { page, limit, start_date, end_date, status } = req.query;

  if (page && (isNaN(page) || page < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive number",
    });
  }

  if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 100",
    });
  }

  if (start_date && !isValidDate(start_date)) {
    return res.status(400).json({
      success: false,
      message: "Start date must be in YYYY-MM-DD format",
    });
  }

  if (end_date && !isValidDate(end_date)) {
    return res.status(400).json({
      success: false,
      message: "End date must be in YYYY-MM-DD format",
    });
  }

  if (start_date && end_date && start_date > end_date) {
    return res.status(400).json({
      success: false,
      message: "Start date cannot be after end date",
    });
  }

  if (status && !["pending", "confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be either 'pending', 'confirmed', or 'cancelled'",
    });
  }

  next();
};

// Helper function untuk validasi date
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;

  const date = new Date(dateString);
  const timestamp = date.getTime();

  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return false;
  }

  return date.toISOString().startsWith(dateString);
};

export const validateUpdateProfile = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is required",
    });
  }

  const { name, email, currentPassword, newPassword } = req.body;

  // Validasi name
  if (name && (name.length < 2 || name.length > 100)) {
    return res.status(400).json({
      success: false,
      message: "Name must be between 2 and 100 characters",
    });
  }

  // Validasi email
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Validasi password
  if (newPassword && newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  next();
};
