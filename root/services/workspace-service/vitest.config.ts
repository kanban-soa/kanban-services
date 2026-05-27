import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.{spec,test}.ts"],
    setupFiles: ["./__tests__/setup.ts"],
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@workspace-service": resolve(__dirname, "."),
    },
  },
});
