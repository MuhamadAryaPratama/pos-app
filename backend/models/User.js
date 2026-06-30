import pool from "../config/database.js";
import bcrypt from "bcrypt";

class User {
  // Create new user
  static async create(userData) {
    const { email, password, name, role = "karyawan" } = userData;

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      "INSERT INTO users (email, password, name, role, is_verified) VALUES (?, ?, ?, ?, TRUE)",
      [email, hashedPassword, name, role]
    );

    return {
      id: result.insertId,
      email,
      name,
      role,
    };
  }

  // Find user by email
  static async findByEmail(email) {
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return users[0];
  }

  // Find user by ID
  static async findById(id) {
    const [users] = await pool.execute(
      "SELECT id, email, name, role, password, is_verified, created_at FROM users WHERE id = ?",
      [id]
    );
    return users[0];
  }

  // Find user by ID dengan password (khusus untuk update profile)
  static async findByIdWithPassword(id) {
    const [users] = await pool.execute(
      "SELECT id, email, name, role, password, is_verified, created_at FROM users WHERE id = ?",
      [id]
    );
    return users[0];
  }

  // Create password reset token
  static async createPasswordResetToken(email) {
    const resetToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    const [result] = await pool.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?",
      [resetToken, resetTokenExpiry, email]
    );

    if (result.affectedRows > 0) {
      return resetToken;
    }
    return null;
  }

  // Reset password
  static async resetPassword(token, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const [result] = await pool.execute(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [hashedPassword, token]
    );

    return result.affectedRows > 0;
  }

  // Check password
  static async checkPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      console.error("Missing arguments for password comparison:", {
        hasPlainPassword: !!plainPassword,
        hasHashedPassword: !!hashedPassword,
      });
      return false;
    }

    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last activity
  static async updateLastActivity(userId) {
    await pool.execute("UPDATE users SET last_activity = NOW() WHERE id = ?", [
      userId,
    ]);
  }

  // Update user data
  static async updateUser(userId, updateData) {
    const { name, email } = updateData;
    const updates = [];
    const params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }

    if (email) {
      updates.push("email = ?");
      params.push(email);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push("updated_at = NOW()");
    params.push(userId);

    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }
}

export default User;
