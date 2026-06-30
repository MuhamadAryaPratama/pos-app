import jwt from "jsonwebtoken";
import User from "../models/User.js";
import pool from "../config/database.js";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "8h"; // 8 hours

// Helper function to get client IP
const getClientIP = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  );
};

// Helper function to log logout activity
const logUserLogout = async (userId, userName, clientIP, userAgent) => {
  try {
    console.log(`User logout: ${userName} (${userId}) from IP: ${clientIP}`);
  } catch (error) {
    console.error("Error logging logout activity:", error);
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, name, role = "karyawan" } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({ email, password, name, role });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await User.checkPassword(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token - Hanya satu token dengan expired 8 jam
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last activity
    await User.updateLastActivity(user.id);

    console.log(`Login successful for user: ${email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expiresIn: JWT_EXPIRES_IN,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const clientIP = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "Unknown";
    await logUserLogout(user.id, user.name, clientIP, userAgent);

    await User.updateLastActivity(user.id);

    return res.status(200).json({
      success: true,
      message: "Berhasil logout",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.json({
        success: true,
        message: "Jika email terdaftar, kode reset password akan dikirim",
      });
    }

    const resetToken = await User.createPasswordResetToken(email);
    if (!resetToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to create reset token",
      });
    }

    // Kembalikan token langsung (tanpa email)
    res.json({
      success: true,
      message: "Reset token berhasil dibuat",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const isReset = await User.resetPassword(token, newPassword);
    if (!isReset) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    res.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  let connection;
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!name && !email && !currentPassword && !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (name, email, or password) must be provided",
      });
    }

    // Validasi perubahan password
    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both current password and new password are required for password change",
      });
    }

    const user = await User.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User data for password verification:", {
      userId: user.id,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
    });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update name jika provided
      if (name) {
        await connection.execute(
          "UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?",
          [name, userId]
        );
      }

      // Update email jika provided
      if (email && email !== user.email) {
        // Check if email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        await connection.execute(
          "UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?",
          [email, userId]
        );
      }

      // Update password jika provided
      if (currentPassword && newPassword) {
        console.log("Password change attempt:", {
          userId: user.id,
          hasCurrentPassword: !!currentPassword,
          hasNewPassword: !!newPassword,
          hasStoredPassword: !!user.password,
        });

        // Verify current password
        const isCurrentPasswordValid = await User.checkPassword(
          currentPassword,
          user.password
        );

        if (!isCurrentPasswordValid) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect",
          });
        }

        // Validate new password
        if (newPassword.length < 6) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters",
          });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await connection.execute(
          "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
          [hashedNewPassword, userId]
        );
      }

      await connection.commit();

      // Get updated user data
      const updatedUser = await User.findById(userId);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
