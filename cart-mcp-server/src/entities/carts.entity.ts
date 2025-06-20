import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const carts = sqliteTable("carts", {
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});
