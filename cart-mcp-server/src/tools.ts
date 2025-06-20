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
async function addToCart(env: any, input: z.infer<typeof CartItemSchema>) {
  CartItemSchema.parse(input);
  const db = getDb(env);
  const { userId, itemId, quantity } = input;

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

async function removeFromCart(env: any, input: z.infer<typeof CartItemSchema>) {
  CartItemSchema.parse(input);
  const db = getDb(env);
  const { userId, itemId, quantity } = input;

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
  input: z.infer<typeof CartUpdateSchema>
) {
  CartUpdateSchema.parse(input);
  const db = getDb(env);
  const { userId, itemId, quantity } = input;

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
  input: z.infer<typeof BulkCartSchema>
) {
  BulkCartSchema.parse(input);
  const { userId, items } = input;

  for (const { itemId, quantity } of items) {
    await addToCart(env, { userId, itemId, quantity });
  }

  return { success: true, message: "Multiple items added to cart" };
}

async function removeMultipleFromCart(
  env: any,
  input: z.infer<typeof BulkCartSchema>
) {
  BulkCartSchema.parse(input);
  const { userId, items } = input;

  for (const { itemId, quantity } of items) {
    await removeFromCart(env, { userId, itemId, quantity });
  }

  return { success: true, message: "Multiple items removed from cart" };
}

export function registerTools(server: any, env: any) {
  // Add item to cart
  server.tool(
    "addToCart",
    { schema: CartItemSchema },
    async (args: { schema: z.infer<typeof CartItemSchema> }) => {
      try {
        const result = await addToCart(env, args.schema);
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

  // Remove item from cart
  server.tool(
    "removeFromCart",
    { schema: CartItemSchema },
    async (args: { schema: z.infer<typeof CartItemSchema> }) => {
      try {
        const result = await removeFromCart(env, args.schema);
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

  // Update cart item quantity
  server.tool(
    "updateCartItem",
    { schema: CartUpdateSchema },
    async (args: { schema: z.infer<typeof CartUpdateSchema> }) => {
      try {
        const result = await updateCartItem(env, args.schema);
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

  // View cart contents
  server.tool(
    "viewCart",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      try {
        const cart = await viewCart(env, args.schema.userId);
        return {
          content: [{ type: "text", text: JSON.stringify(cart, null, 2) }],
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

  // Clear entire cart
  server.tool(
    "clearCart",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      try {
        const result = await clearCart(env, args.schema.userId);
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

  // Get cart statistics
  server.tool(
    "getCartItemCount",
    { schema: CartQuerySchema },
    async (args: { schema: z.infer<typeof CartQuerySchema> }) => {
      try {
        const stats = await getCartItemCount(env, args.schema.userId);
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
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

  // Add multiple items to cart
  server.tool(
    "addMultipleToCart",
    { schema: BulkCartSchema },
    async (args: { schema: z.infer<typeof BulkCartSchema> }) => {
      try {
        const result = await addMultipleToCart(env, args.schema);
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

  // Remove multiple items from cart
  server.tool(
    "removeMultipleFromCart",
    { schema: BulkCartSchema },
    async (args: { schema: z.infer<typeof BulkCartSchema> }) => {
      try {
        const result = await removeMultipleFromCart(env, args.schema);
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
}
