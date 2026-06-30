import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

// DEBUG: Lihat konfigurasi yang digunakan
// console.log("🔧 Database Configuration:");
// console.log("- Host:", process.env.DB_HOST);
// console.log("- Port:", process.env.DB_PORT);
// console.log("- User:", process.env.DB_USER);
// console.log(
//   "- Password:",
//   process.env.DB_PASSWORD === "" ? "EMPTY" : "NOT EMPTY"
// );
// console.log("- Database:", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "A@m3_R1c4@N0!G00@d",
  database: process.env.DB_NAME || "pos_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL Database");
    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error(
      "💡 Solution: Check if MySQL is running on port 3306 and root user has no password"
    );
  }
})();

export default pool;
