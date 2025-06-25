import { z } from "zod";

export const CartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().positive(),
});

export const BulkCartSchema = z.object({
  userId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
    })
  ),
});

export const CartUpdateSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  quantity: z.number().min(0),
});

export const CartQuerySchema = z.object({});
