import pool from "../config/database.js";
import Product from "./Product.js";

class Category {
  // Create new category
  static async create(categoryData) {
    const { name, description, created_by } = categoryData;

    const [result] = await pool.execute(
      "INSERT INTO categories (name, description, created_by) VALUES (?, ?, ?)",
      [name, description, created_by]
    );

    return this.findById(result.insertId);
  }

  // Find all categories with pagination
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [categories] = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM categories c 
       LEFT JOIN users u ON c.created_by = u.id 
       ORDER BY c.created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM categories"
    );
    const total = countResult[0].total;

    return {
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Find category by ID
  static async findById(id) {
    const [categories] = await pool.execute(
      `SELECT c.*, u.name as created_by_name 
       FROM categories c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = ?`,
      [id]
    );
    return categories[0];
  }

  // Find category by name
  static async findByName(name) {
    const [categories] = await pool.execute(
      "SELECT * FROM categories WHERE name = ?",
      [name]
    );
    return categories[0];
  }

  // Update category
  static async update(id, categoryData) {
    const { name, description } = categoryData;
    const updatedAt = new Date();

    const [result] = await pool.execute(
      "UPDATE categories SET name = ?, description = ?, updated_at = ? WHERE id = ?",
      [name, description, updatedAt, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }

  // Hard delete category (permanently remove from database)
  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }

  // Check if category has products
  static async hasProducts(id) {
    const [products] = await pool.execute(
      "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
      [id]
    );
    return products[0].count > 0;
  }

  // Get products by category with pagination
  static async getProductsByCategory(categoryId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // First, get category info
    const category = await this.findById(categoryId);
    if (!category) {
      return null;
    }

    // Then get products in this category
    const [products] = await pool.query(
      `SELECT p.*, u.name as created_by_name, c.name as category_name
     FROM products p 
     LEFT JOIN users u ON p.created_by = u.id 
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = ? 
     ORDER BY p.created_at DESC 
     LIMIT ? OFFSET ?`,
      [categoryId, parseInt(limit), parseInt(offset)]
    );

    // Get total count of products in this category
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM products WHERE category_id = ?",
      [categoryId]
    );
    const total = countResult[0].total;

    // Add full image URLs
    const productsWithFullUrls = products.map((product) => {
      if (product.image_url) {
        product.image_url = Product.getFullImageUrl(product.image_url);
      }
      return product;
    });

    return {
      category,
      products: productsWithFullUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get category statistics (jumlah produk per kategori)
  static async getCategoryStats() {
    const [stats] = await pool.execute(
      `SELECT 
       c.id,
       c.name,
       c.description,
       COUNT(p.id) as product_count,
       SUM(CASE WHEN p.is_available = 1 THEN 1 ELSE 0 END) as available_products,
       SUM(CASE WHEN p.is_available = 0 THEN 1 ELSE 0 END) as unavailable_products
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id
     GROUP BY c.id, c.name, c.description
     ORDER BY product_count DESC`
    );

    return stats;
  }
}

export default Category;
