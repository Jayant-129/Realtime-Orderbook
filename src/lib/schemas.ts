import { z } from "zod";

export const OrderFormSchema = z.object({
  type: z.enum(["market", "limit"]),
  side: z.enum(["buy", "sell"]),
  price: z.number().positive().optional(),
  qty: z.number().positive(),
  delayMs: z.number().min(0),
});

export type OrderFormType = z.infer<typeof OrderFormSchema>;
