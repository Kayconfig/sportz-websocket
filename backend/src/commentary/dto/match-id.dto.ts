import z from 'zod';

export const matchIDParamsDtoSchema = z.object({
  matchId: z.coerce.number().int().nonnegative(),
});
