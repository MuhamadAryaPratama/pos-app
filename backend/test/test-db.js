import mysql from "mysql2/promise";

async function testConnection() {
  const config = {
    host: "localhost",
    port: 3307,
    user: "root",
    password: "", // COBA KOSONG
    database: "mysql", // Gunakan database default dulu
  };

  console.log("🧪 Testing connection with:", config);

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ CONNECTION SUCCESSFUL!");

    // Test query
    const [rows] = await connection.execute("SELECT 1 + 1 AS result");
    console.log("✅ Query test result:", rows);

    await connection.end();
    return true;
  } catch (error) {
    console.error("❌ CONNECTION FAILED:", error.message);
    console.error("Error code:", error.code);
    return false;
  }
}

testConnection();
