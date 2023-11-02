import { serial, text, pgTable } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id"),
  name: text("name"),
  email: text("email"),
});