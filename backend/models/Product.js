import pool from "../config/database.js";
import fs from "fs";
import path from "path";

class Product {
  // Create new product
  static async create(productData) {
    console.log("=== PRODUCT CREATE DEBUG ===");
    console.log(
      "1. Received productData:",
      JSON.stringify(productData, null, 2)
    );

    const {
      name,
      description,
      price,
      category_id,
      image_url,
      is_available = true,
      created_by,
    } = productData;

    console.log("2. Extracted values:");
    console.log("   - name:", name, typeof name);
    console.log("   - description:", description, typeof description);
    console.log("   - price:", price, typeof price);
    console.log("   - category_id:", category_id, typeof category_id);
    console.log("   - image_url:", image_url, typeof image_url);
    console.log("   - is_available:", is_available, typeof is_available);
    console.log("   - created_by:", created_by, typeof created_by);

    try {
      console.log("3. Attempting database connection...");

      // Test connection
      const [testConn] = await pool.query("SELECT 1 as test");
      console.log("   ✅ Database connection OK:", testConn);

      // Check if category exists
      console.log("4. Checking if category exists...");
      const [categoryCheck] = await pool.execute(
        "SELECT id, name FROM categories WHERE id = ?",
        [category_id]
      );
      console.log("   Category check result:", categoryCheck);

      if (categoryCheck.length === 0) {
        throw new Error(`Category with id ${category_id} does not exist`);
      }

      // Check if user exists
      console.log("5. Checking if user exists...");
      const [userCheck] = await pool.execute(
        "SELECT id, name FROM users WHERE id = ?",
        [created_by]
      );
      console.log("   User check result:", userCheck);

      if (userCheck.length === 0) {
        throw new Error(`User with id ${created_by} does not exist`);
      }

      console.log("6. Executing INSERT query...");
      const insertQuery = `INSERT INTO products 
       (name, description, price, category_id, image_url, is_available, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`;

      // PERBAIKAN: Handle null image_url dengan benar di parameter
      const insertParams = [
        name,
        description,
        price,
        category_id,
        image_url, // Bisa null atau string
        is_available,
        created_by,
      ];

      console.log("   Query:", insertQuery);
      console.log("   Params:", insertParams);

      const [result] = await pool.execute(insertQuery, insertParams);

      console.log("7. INSERT result:", result);
      console.log("   - insertId:", result.insertId);
      console.log("   - affectedRows:", result.affectedRows);

      if (!result.insertId) {
        throw new Error("Insert succeeded but no insertId returned");
      }

      console.log("8. Fetching created product...");
      const createdProduct = await this.findById(result.insertId);
      console.log("   Created product:", createdProduct);

      console.log("=== PRODUCT CREATE SUCCESS ===\n");
      return createdProduct;
    } catch (error) {
      console.error("=== PRODUCT CREATE ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error errno:", error.errno);
      console.error("Error sqlMessage:", error.sqlMessage);
      console.error("Error sql:", error.sql);
      console.error("Full error:", error);
      console.error("Stack trace:", error.stack);
      console.error("=== END ERROR ===\n");

      throw error;
    }
  }

  // Find product by ID
  static async findById(id) {
    console.log(`Finding product by ID: ${id}`);

    try {
      const [products] = await pool.execute(
        `SELECT p.*, u.name as created_by_name, c.name as category_name
         FROM products p 
         LEFT JOIN users u ON p.created_by = u.id 
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [id]
      );

      console.log(`Found ${products.length} product(s)`);

      if (products[0]) {
        // PERBAIKAN: Handle image_url dengan benar - hanya proses jika tidak null
        if (products[0].image_url) {
          products[0].image_url = this.getFullImageUrl(products[0].image_url);
        }
        // Jika image_url null, biarkan tetap null tanpa processing
      }

      return products[0];
    } catch (error) {
      console.error("Error in findById:", error);
      throw error;
    }
  }

  // Get all products with pagination and filters
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      category_id,
      is_available,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = filters;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (category_id) {
      whereClause += " AND p.category_id = ?";
      params.push(category_id);
    }

    if (is_available !== undefined) {
      whereClause += " AND p.is_available = ?";
      params.push(is_available);
    }

    if (search) {
      whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const validSortColumns = ["name", "price", "created_at"];
    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : "created_at";
    const validSortOrders = ["ASC", "DESC"];
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase())
      ? sort_order.toUpperCase()
      : "DESC";

    const [products] = await pool.query(
      `SELECT p.*, u.name as created_by_name, c.name as category_name
       FROM products p 
       LEFT JOIN users u ON p.created_by = u.id 
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause} 
       ORDER BY p.${sortColumn} ${sortOrder} 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // PERBAIKAN: Handle image_url dengan benar untuk semua produk
    const productsWithFullUrls = products.map((product) => {
      // Hanya proses image_url jika tidak null
      if (product.image_url) {
        product.image_url = this.getFullImageUrl(product.image_url);
      }
      // Jika image_url null, biarkan tetap null
      return product;
    });

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM products p 
       ${whereClause}`,
      params
    );

    return {
      products: productsWithFullUrls,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  // Update product
  static async update(id, productData) {
    console.log(`=== UPDATE PRODUCT ${id} ===`);
    console.log("Update data:", productData);

    try {
      const currentProduct = await this.findById(id);

      if (!currentProduct) {
        console.log("Product not found");
        return null;
      }

      // Build SET clause dinamis berdasarkan field yang ada
      const updateFields = [];
      const updateValues = [];

      // List field yang bisa diupdate
      const allowedFields = [
        "name",
        "description",
        "price",
        "category_id",
        "image_url",
        "is_available",
      ];

      allowedFields.forEach((field) => {
        if (productData.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push(productData[field]);
        }
      });

      // Selalu update timestamp
      updateFields.push("updated_at = CURRENT_TIMESTAMP");

      if (updateFields.length === 1) {
        // Hanya ada updated_at, tidak ada yang diupdate
        console.log("No fields to update");
        return currentProduct;
      }

      // Build query
      const query = `UPDATE products SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      updateValues.push(id);

      console.log("Update query:", query);
      console.log("Update values:", updateValues);

      const [result] = await pool.execute(query, updateValues);

      console.log("Update result:", result);

      if (result.affectedRows === 0) {
        return null;
      }

      // Hapus file gambar lama hanya jika ada gambar baru dan berbeda
      if (
        productData.hasOwnProperty("image_url") &&
        currentProduct.image_url &&
        productData.image_url !== currentProduct.image_url
      ) {
        this.deleteImageFile(currentProduct.image_url);
      }

      return this.findById(id);
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }

  // Hard delete product
  static async delete(id) {
    console.log(`=== DELETE PRODUCT ${id} ===`);

    try {
      const product = await this.findById(id);

      const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [
        id,
      ]);

      console.log("Delete result:", result);

      // PERBAIKAN: Hapus file gambar hanya jika product dan image_url ada
      if (result.affectedRows > 0 && product && product.image_url) {
        this.deleteImageFile(product.image_url);
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }

  // Delete image file from filesystem
  static deleteImageFile(imageUrl) {
    try {
      // PERBAIKAN: Hanya hapus jika imageUrl ada dan bukan null/undefined
      if (!imageUrl) {
        console.log("No image URL provided for deletion");
        return;
      }

      let filename;
      if (imageUrl.startsWith("http")) {
        filename = path.basename(imageUrl);
      } else {
        filename = imageUrl;
      }

      const filePath = path.join("uploads/products", filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted image file: ${filePath}`);
      } else {
        console.log(`⚠️ Image file not found: ${filePath}`);
      }
    } catch (error) {
      console.error("❌ Error deleting image file:", error);
    }
  }

  // Get full image URL
  static getFullImageUrl(imagePath) {
    // PERBAIKAN: Return null jika imagePath null/undefined
    if (!imagePath) return null;

    // Jika sudah URL lengkap, return langsung
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // PERBAIKAN: Gunakan localhost:5000 secara eksplisit
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    // Pastikan hanya menggunakan filename, bukan path lengkap
    const filename = path.basename(imagePath);

    return `${baseUrl}/uploads/products/${filename}`;
  }

  // Check if product exists and is available
  static async isAvailable(id) {
    const product = await this.findById(id);
    return product && product.is_available;
  }

  static async getStockReport(filters = {}) {
    const {
      page = 1,
      limit = 10,
      category_id,
      sort_by = "total_sold",
      sort_order = "DESC",
      start_date,
      end_date,
    } = filters;

    // Untuk PDF, batasi lebih ketat
    const effectiveLimit =
      filters.limit === 1000
        ? 80
        : filters.limit === 100
        ? 80
        : filters.limit === 50
        ? 50
        : parseInt(limit);

    const offset = (page - 1) * effectiveLimit;
    let whereClause = "WHERE 1=1";
    const params = [];

    // Filter berdasarkan kategori
    if (category_id) {
      whereClause += " AND p.category_id = ?";
      params.push(category_id);
    }

    // Filter untuk tanggal transaksi (optional)
    let dateFilter = "";
    const dateParams = [];
    if (start_date || end_date) {
      dateFilter = "AND t.created_at IS NOT NULL";
      if (start_date) {
        dateFilter += " AND DATE(t.created_at) >= ?";
        dateParams.push(start_date);
      }
      if (end_date) {
        dateFilter += " AND DATE(t.created_at) <= ?";
        dateParams.push(end_date);
      }
    }

    // Validasi sort column
    const validSortColumns = [
      "total_sold",
      "name",
      "price",
      "revenue",
      "transaction_count",
    ];
    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : "total_sold";
    const validSortOrders = ["ASC", "DESC"];
    const sortDirection = validSortOrders.includes(sort_order.toUpperCase())
      ? sort_order.toUpperCase()
      : "DESC";

    // Query sederhana - hanya data penjualan
    const query = `
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category_id,
    p.image_url,
    p.is_available,
    p.created_by,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    u.name as created_by_name,
    COALESCE(sales.total_sold, 0) as total_sold,
    COALESCE(sales.revenue, 0) as revenue,
    COALESCE(sales.transaction_count, 0) as transaction_count
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN users u ON p.created_by = u.id
  LEFT JOIN (
    SELECT 
      ti.product_id,
      SUM(ti.quantity) as total_sold,
      SUM(ti.subtotal) as revenue,
      COUNT(DISTINCT ti.transaction_id) as transaction_count
    FROM transaction_items ti
    LEFT JOIN transactions t ON ti.transaction_id = t.id
    WHERE 1=1 ${dateFilter}
    GROUP BY ti.product_id
  ) sales ON p.id = sales.product_id
  ${whereClause}
  ORDER BY ${sortColumn} ${sortDirection}
  LIMIT ? OFFSET ?
`;

    console.log("Stock Report Query:", query);
    console.log("Params:", [...params, ...dateParams, effectiveLimit, offset]);

    try {
      const [products] = await pool.query(query, [
        ...params,
        ...dateParams,
        effectiveLimit,
        offset,
      ]);

      // Tambahkan full URL untuk gambar
      const productsWithFullUrls = products.map((product) => {
        // PERBAIKAN: Hanya proses image_url jika tidak null
        if (product.image_url) {
          product.image_url = this.getFullImageUrl(product.image_url);
        }
        // Untuk sistem tanpa stock, kita bisa tentukan status berdasarkan penjualan
        product.stock_status = this.getSalesBasedStatus(product.total_sold);
        return product;
      });

      // Count total products
      const countQuery = `
    SELECT COUNT(*) as total 
    FROM products p 
    ${whereClause}
  `;

      const [countResult] = await pool.execute(countQuery, params);

      return {
        products: productsWithFullUrls,
        total: countResult[0].total,
        page: parseInt(page),
        limit: effectiveLimit,
        totalPages: Math.ceil(countResult[0].total / effectiveLimit),
      };
    } catch (error) {
      console.error("Error in getStockReport:", error);
      return {
        products: [],
        total: 0,
        page: parseInt(page),
        limit: effectiveLimit,
        totalPages: 0,
      };
    }
  }

  // Helper untuk menentukan status berdasarkan penjualan
  static getSalesBasedStatus(totalSold) {
    if (totalSold === 0) return "Belum Terjual";
    if (totalSold <= 10) return "Penjualan Rendah";
    if (totalSold <= 50) return "Penjualan Sedang";
    return "Penjualan Tinggi";
  }

  // Get top selling products
  static async getTopSellingProducts(filters = {}) {
    const { limit = 10, start_date, end_date, category_id } = filters;

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

    if (category_id) {
      whereClause += " AND p.category_id = ?";
      params.push(category_id);
    }

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        c.name as category_name,
        SUM(ti.quantity) as total_sold,
        SUM(ti.subtotal) as revenue,
        COUNT(DISTINCT ti.transaction_id) as transaction_count
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      JOIN products p ON ti.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY p.id, p.name, p.price, p.image_url, c.name
      ORDER BY total_sold DESC
      LIMIT ?`,
      [...params, parseInt(limit)]
    );

    return products.map((product) => ({
      ...product,
      // PERBAIKAN: Hanya proses image_url jika tidak null
      image_url: product.image_url
        ? this.getFullImageUrl(product.image_url)
        : null,
    }));
  }

  // Get sales statistics by product
  static async getSalesStatistics(filters = {}) {
    const { start_date, end_date, category_id } = filters;

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

    if (category_id) {
      whereClause += " AND p.category_id = ?";
      params.push(category_id);
    }

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.id) as total_products_sold,
        SUM(ti.quantity) as total_items_sold,
        SUM(ti.subtotal) as total_revenue,
        AVG(ti.quantity) as avg_quantity_per_transaction,
        MAX(ti.quantity) as max_quantity_sold,
        MIN(ti.quantity) as min_quantity_sold
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      JOIN products p ON ti.product_id = p.id
      ${whereClause}`,
      params
    );

    return {
      total_products_sold: parseInt(stats[0].total_products_sold) || 0,
      total_items_sold: parseInt(stats[0].total_items_sold) || 0,
      total_revenue: parseFloat(stats[0].total_revenue) || 0,
      avg_quantity_per_transaction:
        parseFloat(stats[0].avg_quantity_per_transaction) || 0,
      max_quantity_sold: parseInt(stats[0].max_quantity_sold) || 0,
      min_quantity_sold: parseInt(stats[0].min_quantity_sold) || 0,
    };
  }
}

export default Product;
