import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@/noti-service": path.resolve(__dirname),
    },
  },
});
