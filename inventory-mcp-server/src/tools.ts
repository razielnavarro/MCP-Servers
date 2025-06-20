import { z } from "zod";
import * as entities from "./entities";
import {
  CreateItemSchema,
  UpdateItemSchema,
  StockUpdateSchema,
} from "./schemas/items.schema";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, asc, like } from "drizzle-orm";

interface Env {
  DB: D1Database;
}

function getDb(env: any) {
  return drizzle(env.DB, { schema: entities });
}

// Inventory Management Functions
async function listItems(
  env: any,
  options?: { category?: string; sortBy?: string; limit?: number }
) {
  const db = getDb(env);
  let query = db.select().from(entities.items);

  if (options?.category) {
    query = query.where(like(entities.items.category, `%${options.category}%`));
  }

  if (options?.sortBy === "price") {
    query = query.orderBy(asc(entities.items.price));
  } else if (options?.sortBy === "name") {
    query = query.orderBy(asc(entities.items.name));
  } else {
    query = query.orderBy(desc(entities.items.createdAt));
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return await query.all();
}

async function getItem(env: any, id: string) {
  const db = getDb(env);
  return await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.id, id))
    .get();
}

async function createItem(env: any, input: z.infer<typeof CreateItemSchema>) {
  CreateItemSchema.parse(input);
  const db = getDb(env);

  const existing = await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.id, input.id))
    .get();
  if (existing) {
    throw new Error("Item with this ID already exists");
  }

  await db
    .insert(entities.items)
    .values({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();

  return { success: true, message: "Item created successfully" };
}

async function updateItem(env: any, input: z.infer<typeof UpdateItemSchema>) {
  UpdateItemSchema.parse(input);
  const db = getDb(env);
  const { id, ...updateData } = input;

  const existing = await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.id, id))
    .get();
  if (!existing) {
    throw new Error("Item not found");
  }

  await db
    .update(entities.items)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(entities.items.id, id))
    .run();

  return { success: true, message: "Item updated successfully" };
}

async function deleteItem(env: any, id: string) {
  const db = getDb(env);

  const existing = await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.id, id))
    .get();
  if (!existing) {
    throw new Error("Item not found");
  }

  await db.delete(entities.items).where(eq(entities.items.id, id)).run();

  return { success: true, message: "Item deleted successfully" };
}

async function updateStock(env: any, input: z.infer<typeof StockUpdateSchema>) {
  StockUpdateSchema.parse(input);
  const db = getDb(env);

  const existing = await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.id, input.id))
    .get();
  if (!existing) {
    throw new Error("Item not found");
  }

  if (input.stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  await db
    .update(entities.items)
    .set({
      stock: input.stock,
      updatedAt: new Date(),
    })
    .where(eq(entities.items.id, input.id))
    .run();

  return { success: true, message: "Stock updated successfully" };
}

async function getLowStockItems(env: any, threshold: number = 10) {
  const db = getDb(env);
  return await db
    .select()
    .from(entities.items)
    .where(eq(entities.items.stock, threshold))
    .orderBy(asc(entities.items.stock))
    .all();
}

async function searchItems(env: any, query: string) {
  const db = getDb(env);
  return await db
    .select()
    .from(entities.items)
    .where(like(entities.items.name, `%${query}%`))
    .orderBy(asc(entities.items.name))
    .all();
}

export function registerTools(server: any, env: any) {
  // List all items
  server.tool(
    "listItems",
    {
      schema: z.object({
        category: z.string().optional(),
        sortBy: z.enum(["price", "name", "created"]).optional(),
        limit: z.number().optional(),
      }),
    },
    async (args: {
      schema: { category?: string; sortBy?: string; limit?: number };
    }) => {
      try {
        const items = await listItems(env, args.schema);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Get specific item
  server.tool(
    "getItem",
    { schema: z.object({ id: z.string() }) },
    async (args: { schema: { id: string } }) => {
      try {
        const item = await getItem(env, args.schema.id);
        if (!item) {
          return {
            content: [{ type: "text", text: "Item not found" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Create new item
  server.tool(
    "createItem",
    { schema: CreateItemSchema },
    async (args: { schema: z.infer<typeof CreateItemSchema> }) => {
      try {
        const result = await createItem(env, args.schema);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Update item
  server.tool(
    "updateItem",
    { schema: UpdateItemSchema },
    async (args: { schema: z.infer<typeof UpdateItemSchema> }) => {
      try {
        const result = await updateItem(env, args.schema);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Delete item
  server.tool(
    "deleteItem",
    { schema: z.object({ id: z.string() }) },
    async (args: { schema: { id: string } }) => {
      try {
        const result = await deleteItem(env, args.schema.id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Update stock
  server.tool(
    "updateStock",
    { schema: StockUpdateSchema },
    async (args: { schema: z.infer<typeof StockUpdateSchema> }) => {
      try {
        const result = await updateStock(env, args.schema);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Get low stock items
  server.tool(
    "getLowStockItems",
    { schema: z.object({ threshold: z.number().default(10) }) },
    async (args: { schema: { threshold: number } }) => {
      try {
        const items = await getLowStockItems(env, args.schema.threshold);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Search items
  server.tool(
    "searchItems",
    { schema: z.object({ query: z.string() }) },
    async (args: { schema: { query: string } }) => {
      try {
        const items = await searchItems(env, args.schema.query);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );
}
