import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  stock: z.number().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const CreateItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  stock: z.number().default(0),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const StockUpdateSchema = z.object({
  id: z.string(),
  stock: z.number(),
});
