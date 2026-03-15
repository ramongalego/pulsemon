import { z } from 'zod';

export const feedbackSchema = z.object({
  type: z.enum(['feedback', 'bug', 'support']),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be under 2000 characters')
    .regex(
      /^[\p{L}\p{N}\p{P}\p{Z}\p{S}\n\r]+$/u,
      'Message contains invalid characters',
    ),
});
