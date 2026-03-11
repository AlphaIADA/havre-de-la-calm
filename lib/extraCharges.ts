import { z } from 'zod';

export const extraChargeSchema = z.object({
  label: z.string().min(1).max(100),
  amount: z.number().int().min(0).max(10_000_000),
});

export type ExtraCharge = z.infer<typeof extraChargeSchema>;

export const extraChargesSchema = z.array(extraChargeSchema).max(20);

export function parseExtraCharges(value: unknown): ExtraCharge[] {
  const parsed = extraChargesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

