import { z } from 'zod';

export const createStatusPageSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export const updateStatusPageSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(500).nullable().optional(),
    isPublic: z.boolean().optional(),
    showOverallUptime: z.boolean().optional(),
    showIncidentHistory: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateStatusPageMonitorsSchema = z.object({
  monitors: z.array(
    z.object({
      monitorId: z.string().uuid(),
      displayName: z.string().max(100).nullable().optional(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});
