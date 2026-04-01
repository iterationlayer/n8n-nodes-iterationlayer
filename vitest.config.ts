import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      "n8n-workflow": "n8n-workflow/dist/index.js",
    },
  },
});
