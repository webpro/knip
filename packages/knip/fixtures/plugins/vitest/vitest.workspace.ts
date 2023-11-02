import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/*",
  "packages/*",
  {
    test: {
      include: ['tests/**/*.{edge}.test.{ts,js}'],
      name: 'edge',
      environment: 'edge-runtime',
    }
  },
]);
