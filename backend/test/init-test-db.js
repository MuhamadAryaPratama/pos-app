import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

async function initTestDb() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  console.log("🔧 Initializing Test Database...");
  let connection;
  try {
    connection = await mysql.createConnection(config);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`✅ Test Database \`${process.env.DB_NAME}\` is ready!`);
  } catch (error) {
    console.error("❌ Failed to initialize test database:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initTestDb();
