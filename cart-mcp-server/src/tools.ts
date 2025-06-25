import { z } from "zod";
import * as entities from "./entities";
import {
  CartItemSchema,
  BulkCartSchema,
  CartUpdateSchema,
  CartQuerySchema,
} from "./schemas/carts.schema";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";

interface Env {
  DB: D1Database;
}

function getDb(env: any) {
  return drizzle(env.DB, { schema: entities });
}

// Cart Management Functions
async function addToCart(
  env: any,
  input: z.infer<typeof CartItemSchema>,
  userId: string
) {
  CartItemSchema.parse(input);
  const db = getDb(env);
  const { itemId, quantity } = input;

  const existing = await db
    .select()
    .from(entities.carts)
    .where(
      and(eq(entities.carts.userId, userId), eq(entities.carts.itemId, itemId))
    )
    .get();

  if (existing) {
    await db
      .update(entities.carts)
      .set({
        quantity: existing.quantity + quantity,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entities.carts.userId, userId),
          eq(entities.carts.itemId, itemId)
        )
      )
      .run();
  } else {
    await db
      .insert(entities.carts)
      .values({
        userId,
        itemId,
        quantity,
        addedAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
  }

  return { success: true, message: "Item added to cart" };
}

async function removeFromCart(
  env: any,
  input: z.infer<typeof CartItemSchema>,
  userId: string
) {
  CartItemSchema.parse(input);
  const db = getDb(env);
  const { itemId, quantity } = input;

  const existing = await db
    .select()
    .from(entities.carts)
    .where(
      and(eq(entities.carts.userId, userId), eq(entities.carts.itemId, itemId))
    )
    .get();

  if (!existing) {
    return { success: false, message: "Item not in cart" };
  }

  const newQty = existing.quantity - quantity;
  if (newQty > 0) {
    await db
      .update(entities.carts)
      .set({
        quantity: newQty,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entities.carts.userId, userId),
          eq(entities.carts.itemId, itemId)
        )
      )
      .run();
  } else {
    await db
      .delete(entities.carts)
      .where(
        and(
          eq(entities.carts.userId, userId),
          eq(entities.carts.itemId, itemId)
        )
      )
      .run();
  }

  return { success: true, message: "Item removed from cart" };
}

async function updateCartItem(
  env: any,
  input: z.infer<typeof CartUpdateSchema>,
  userId: string
) {
  CartUpdateSchema.parse(input);
  const db = getDb(env);
  const { itemId, quantity } = input;

  const existing = await db
    .select()
    .from(entities.carts)
    .where(
      and(eq(entities.carts.userId, userId), eq(entities.carts.itemId, itemId))
    )
    .get();

  if (!existing) {
    return { success: false, message: "Item not in cart" };
  }

  if (quantity === 0) {
    await db
      .delete(entities.carts)
      .where(
        and(
          eq(entities.carts.userId, userId),
          eq(entities.carts.itemId, itemId)
        )
      )
      .run();
    return { success: true, message: "Item removed from cart" };
  }

  await db
    .update(entities.carts)
    .set({
      quantity,
      updatedAt: new Date(),
    })
    .where(
      and(eq(entities.carts.userId, userId), eq(entities.carts.itemId, itemId))
    )
    .run();

  return { success: true, message: "Cart item updated" };
}

async function viewCart(env: any, userId: string) {
  const db = getDb(env);
  return await db
    .select({
      itemId: entities.carts.itemId,
      quantity: entities.carts.quantity,
      addedAt: entities.carts.addedAt,
      updatedAt: entities.carts.updatedAt,
    })
    .from(entities.carts)
    .where(eq(entities.carts.userId, userId))
    .orderBy(desc(entities.carts.updatedAt))
    .all();
}

async function clearCart(env: any, userId: string) {
  const db = getDb(env);
  await db
    .delete(entities.carts)
    .where(eq(entities.carts.userId, userId))
    .run();

  return { success: true, message: "Cart cleared" };
}

async function getCartItemCount(env: any, userId: string) {
  const db = getDb(env);
  const result = await db
    .select({ count: entities.carts.quantity })
    .from(entities.carts)
    .where(eq(entities.carts.userId, userId))
    .all();

  const totalItems = result.reduce((sum, item) => sum + item.count, 0);
  return { totalItems, uniqueItems: result.length };
}

async function addMultipleToCart(
  env: any,
  input: z.infer<typeof BulkCartSchema>,
  userId: string
) {
  BulkCartSchema.parse(input);
  const { items } = input;

  for (const { itemId, quantity } of items) {
    await addToCart(env, { itemId, quantity }, userId);
  }

  return { success: true, message: "Multiple items added to cart" };
}

async function removeMultipleFromCart(
  env: any,
  input: z.infer<typeof BulkCartSchema>,
  userId: string
) {
  BulkCartSchema.parse(input);
  const { items } = input;

  for (const { itemId, quantity } of items) {
    await removeFromCart(env, { itemId, quantity }, userId);
  }

  return { success: true, message: "Multiple items removed from cart" };
}

export function registerTools(server: any, env: any, props: any) {
  // Add item to cart
  server.tool(
    "addToCart",
    { schema: CartItemSchema },
    async (args: { schema: z.infer<typeof CartItemSchema> }) => {
      console.log(
        "🛒 [CART MCP] addToCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await addToCart(env, args.schema, props.userId);
        console.log(
          "🛒 [CART MCP] addToCart result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] addToCart error:", error);
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

  // Remove item from cart
  server.tool(
    "removeFromCart",
    { schema: CartItemSchema },
    async (args: { schema: z.infer<typeof CartItemSchema> }) => {
      console.log(
        "🛒 [CART MCP] removeFromCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await removeFromCart(env, args.schema, props.userId);
        console.log(
          "🛒 [CART MCP] removeFromCart result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] removeFromCart error:", error);
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

  // Update cart item quantity
  server.tool(
    "updateCartItem",
    { schema: CartUpdateSchema },
    async (args: { schema: z.infer<typeof CartUpdateSchema> }) => {
      console.log(
        "🛒 [CART MCP] updateCartItem called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await updateCartItem(env, args.schema, props.userId);
        console.log(
          "🛒 [CART MCP] updateCartItem result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] updateCartItem error:", error);
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

  // View cart contents
  server.tool(
    "viewCart",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      console.log(
        "🛒 [CART MCP] viewCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const cart = await viewCart(env, props.userId);
        console.log(
          "🛒 [CART MCP] viewCart result:",
          JSON.stringify(cart, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(cart, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] viewCart error:", error);
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

  // Clear entire cart
  server.tool(
    "clearCart",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      console.log(
        "🛒 [CART MCP] clearCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await clearCart(env, props.userId);
        console.log(
          "🛒 [CART MCP] clearCart result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] clearCart error:", error);
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

  // Get cart statistics
  server.tool(
    "getCartItemCount",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      console.log(
        "🛒 [CART MCP] getCartItemCount called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const stats = await getCartItemCount(env, props.userId);
        console.log(
          "🛒 [CART MCP] getCartItemCount result:",
          JSON.stringify(stats, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] getCartItemCount error:", error);
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

  // Add multiple items to cart
  server.tool(
    "addMultipleToCart",
    { schema: BulkCartSchema },
    async (args: { schema: z.infer<typeof BulkCartSchema> }) => {
      console.log(
        "🛒 [CART MCP] addMultipleToCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await addMultipleToCart(env, args.schema, props.userId);
        console.log(
          "🛒 [CART MCP] addMultipleToCart result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] addMultipleToCart error:", error);
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

  // Remove multiple items from cart
  server.tool(
    "removeMultipleFromCart",
    { schema: BulkCartSchema },
    async (args: { schema: z.infer<typeof BulkCartSchema> }) => {
      console.log(
        "🛒 [CART MCP] removeMultipleFromCart called with args:",
        JSON.stringify(args, null, 2)
      );
      console.log("🛒 [CART MCP] User ID:", props.userId);
      console.log("🛒 [CART MCP] Timestamp:", new Date().toISOString());

      try {
        const result = await removeMultipleFromCart(
          env,
          args.schema,
          props.userId
        );
        console.log(
          "🛒 [CART MCP] removeMultipleFromCart result:",
          JSON.stringify(result, null, 2)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error("🛒 [CART MCP] removeMultipleFromCart error:", error);
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
