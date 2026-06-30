import pool from "../config/database.js";
import fs from "fs";
import path from "path";

beforeAll(async () => {
  // Read schema SQL file
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const connection = await pool.getConnection();
  try {
    // Disable foreign keys to drop and recreate cleanly
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

    // Drop tables if they exist
    await connection.execute("DROP TABLE IF EXISTS transaction_items");
    await connection.execute("DROP TABLE IF EXISTS transactions");
    await connection.execute("DROP TABLE IF EXISTS products");
    await connection.execute("DROP TABLE IF EXISTS categories");
    await connection.execute("DROP TABLE IF EXISTS users");

    // Split queries by semicolon and execute them
    const queries = schemaSql
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    for (const query of queries) {
      try {
        await connection.execute(query);
      } catch (err) {
        if (query.toUpperCase().includes("CREATE INDEX")) {
          console.warn(`⚠️ Setup Warning: Index creation skipped (${err.message}) for query: ${query}`);
        } else {
          throw err;
        }
      }
    }

    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("📂 Database schema initialized successfully for test suite");
  } catch (error) {
    console.error("❌ Failed to initialize database schema in setup:", error.message);
    throw error;
  } finally {
    connection.release();
  }
});

beforeEach(async () => {
  const connection = await pool.getConnection();
  try {
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("TRUNCATE TABLE transaction_items");
    await connection.execute("TRUNCATE TABLE transactions");
    await connection.execute("TRUNCATE TABLE products");
    await connection.execute("TRUNCATE TABLE categories");
    await connection.execute("TRUNCATE TABLE users");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
  } catch (error) {
    console.error("❌ Failed to truncate tables in beforeEach:", error.message);
    throw error;
  } finally {
    connection.release();
  }
});

afterAll(async () => {
  // Close database pool to prevent Jest from hanging
  await pool.end();
  console.log("🔒 Closed test database connection pool");

  // Clean up any uploaded test files in uploads/products directory
  const productsDir = path.join(process.cwd(), "uploads", "products");
  if (fs.existsSync(productsDir)) {
    const files = fs.readdirSync(productsDir);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(productsDir, file));
      } catch (err) {
        // Ignore errors
      }
    }
  }
});
