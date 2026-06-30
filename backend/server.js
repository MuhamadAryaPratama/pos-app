import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

// Connect to database
let db;
(async () => {
  try {
    db = await connectDB;
    console.log("✅ Database connected successfully");

    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || "0.0.0.0";

    const server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      console.log("=".repeat(60));
      console.log("🚀 SERVER STARTED SUCCESSFULLY");
      console.log("=".repeat(60));
      console.log(`📍 Local Access: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🕒 Started at: ${new Date().toISOString()}`);
      console.log("=".repeat(60));

      // Test endpoints
      console.log("\n🔗 Test Endpoints:");
      console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📍 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();

export { db };
