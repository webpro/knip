import type { Config } from "drizzle-kit";

export default {
  schema: ["./src/schema.ts", "./src/schema/*.ts"],
} satisfies Config;