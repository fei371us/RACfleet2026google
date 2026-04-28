import { z } from 'zod';
import { Response } from 'express';

export function validate<T>(schema: z.ZodSchema<T>, body: unknown, res: Response): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
    return null;
  }
  return result.data;
}
