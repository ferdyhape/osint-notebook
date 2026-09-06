import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // Specific aliases first — the general "@/*" one below would otherwise
      // resolve "@/lib/prisma" to the real file before this ever gets a look.
      { find: "@/lib/prisma", replacement: path.resolve(__dirname, "test/mocks/prisma.ts") },
      { find: "server-only", replacement: path.resolve(__dirname, "test/mocks/server-only.ts") },
      { find: "@", replacement: __dirname },
    ],
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
