import { z } from 'zod';

export const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  expectedInterval: z.number().int().min(10),
  gracePeriod: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateMonitorSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    expectedInterval: z.number().int().min(10).optional(),
    gracePeriod: z.number().int().min(0).optional(),
    isPaused: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
