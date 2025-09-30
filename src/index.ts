import dotenv from "dotenv";
import Prisma from "./db/db.js";
import app from "./app.js";
import { envConfig } from "./config/env.config.js";

dotenv.config({ path: "./.env" });

(async function main() {
  try {
    try {
      console.log("Connecting to database...");
      await Prisma.$connect();
      console.log("Database connected");
    } catch (error) {
      console.error("DB connection error:", error);
    }

    const PORT = envConfig.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`HTTP server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
})();
