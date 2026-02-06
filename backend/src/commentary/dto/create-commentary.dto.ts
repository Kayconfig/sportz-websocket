import z from 'zod';

export const createCommentaryDtoSchema = z.object({
  matchId: z.number().int().nonnegative().nonoptional(),
  minute: z.number().int().nonnegative().nonoptional(),
  sequence: z.number().int().nonnegative().nonoptional(),
  period: z.string().nonempty().nonoptional(),
  eventType: z.string().nonempty().nonoptional(),
  actor: z.string().nonempty().nonoptional(),
  team: z.string().nonempty().nonoptional(),
  message: z.string().nonempty().nonoptional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateCommentaryDto = z.infer<typeof createCommentaryDtoSchema>;
