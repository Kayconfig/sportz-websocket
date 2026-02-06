import { desc, eq, sql } from 'drizzle-orm';
import { ErrInternal } from '../common/errors/server-error';
import type { Database } from '../db/drizzle';
import { commentary, type Commentary, type NewCommentary } from '../db/schema';

export interface CommentaryRepository {
  create(newCommentary: NewCommentary): Promise<Commentary>;
  find(
    matchId: number,
    pagination: {
      limit: number;
      offset: number;
    }
  ): Promise<{ count: number; commentaries: Array<Commentary> }>;
}

export function createCommentaryRepository(db: Database): CommentaryRepository {
  return {
    async create(newCommentary) {
      const [createdCommentary] = await db
        .insert(commentary)
        .values(newCommentary)
        .returning();
      if (!createdCommentary) {
        throw ErrInternal.create(
          `CommentaryRepository.create failed. unable to create ${newCommentary}`
        );
      }
      return createdCommentary;
    },

    async find(matchId, pagination) {
      const commentaries = await db
        .select({
          count: sql<number>`count(*) OVER()`,
          id: commentary.id,
          matchId: commentary.matchId,
          minute: commentary.minute,
          sequence: commentary.sequence,
          period: commentary.period,
          eventType: commentary.eventType,
          actor: commentary.actor,
          team: commentary.team,
          message: commentary.message,
          metadata: commentary.metadata,
          tags: commentary.tags,
          createdAt: commentary.createdAt,
        })
        .from(commentary)
        .where(eq(commentary.matchId, matchId))
        .orderBy(desc(commentary.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      const count = commentaries[0]?.count ?? 0;
      const filterOutCount = (
        commentary: Commentary & { count?: number }
      ): Commentary => {
        const { count, ...commentaryWithoutCount } = commentary;
        return commentaryWithoutCount;
      };
      return {
        count,
        commentaries: commentaries.map(filterOutCount),
      };
    },
  };
}
