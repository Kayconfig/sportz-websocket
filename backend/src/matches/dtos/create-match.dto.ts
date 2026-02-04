import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
} as const;

const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  error: 'Invalid ISO date string',
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(3),
    awayTeam: z.string().min(3),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: z.coerce.number().int().nonnegative().default(0),
    awayScore: z.coerce.number().int().nonnegative().default(0),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end < start) {
      ctx.addIssue({
        code: 'invalid_value',
        message: 'endTime must be chronologically after startTime',
        path: ['endTime'],
        values: [],
      });
    }
  });

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
