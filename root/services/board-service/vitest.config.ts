import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/board-service", replacement: path.resolve(__dirname, ".") },
      { find: "@", replacement: path.resolve(__dirname, "../..") },
    ],
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__test__/setup.ts"],
    reporters: ['verbose'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
