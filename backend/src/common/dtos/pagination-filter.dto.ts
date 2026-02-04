import z from 'zod';

export const paginationFilterSchema = z.object({
  limit: z.coerce.number().nonnegative().min(1).max(100).default(100),
  page: z.coerce.number().nonnegative().default(1),
});

export type PaginationFilterDto = z.infer<typeof paginationFilterSchema>;
