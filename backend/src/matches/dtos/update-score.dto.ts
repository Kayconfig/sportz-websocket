import { z } from 'zod';

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});

export type UpdateScoreSchemaDto = z.infer<typeof updateScoreSchema>;
