import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
    environment: "node",
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts", "tests/integration/**/*.test.ts"],
    passWithNoTests: false,
    reporters: ["default"],
  },
});
