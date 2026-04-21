import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  out: "./migrations",
  schema: "./schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUTH_URL!,
  },
});
