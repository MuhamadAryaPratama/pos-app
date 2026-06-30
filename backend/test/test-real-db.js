import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  console.log("🧪 Testing real connection with:", { ...config, password: config.password ? "****" : "" });

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ Main Database CONNECTION SUCCESSFUL!");
    await connection.end();
    return true;
  } catch (error) {
    console.error("❌ Main Database CONNECTION FAILED:", error.message);
    return false;
  }
}

testConnection();
