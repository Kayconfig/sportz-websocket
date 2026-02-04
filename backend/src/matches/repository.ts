import { desc, sql } from 'drizzle-orm';
import { ErrInternal } from '../common/errors/server-error';
import { withTimeout } from '../common/queries/promises/with-timeout';
import type { Database } from '../db/drizzle';
import { matches, type Match, type NewMatch } from '../db/schema';

export interface MatchesRepository {
  create(newMatch: NewMatch): Promise<Match>;
  find(filter: {
    limit: number;
    offset: number;
  }): Promise<{ count: number; result: Match[] }>;
}

export function createMatchesRespository(db: Database): MatchesRepository {
  const timeout = 3_000;
  return {
    async create(newMatch) {
      const [match] = await withTimeout(
        db.insert(matches).values(newMatch).returning(),
        timeout,
        `MatchesRepository.create query timeout after ${timeout}ms`
      );
      if (!match) {
        throw ErrInternal.create(
          `MatchesRepository.create failed to create match for ${JSON.stringify(
            newMatch
          )}`
        );
      }
      return match;
    },
    async find(filter) {
      const result = await withTimeout(
        db
          .select({
            count: sql<number>`count(matches.id) OVER()`,
            id: matches.id,
            sport: matches.sport,
            homeTeam: matches.homeTeam,
            awayTeam: matches.awayTeam,
            status: matches.status,
            startTime: matches.startTime,
            endTime: matches.endTime,
            homeScore: matches.homeScore,
            awayScore: matches.awayScore,
            createdAt: matches.createdAt,
          })
          .from(matches)
          .limit(filter.limit)
          .offset(filter.offset)
          .orderBy(desc(matches.createdAt)),
        timeout,
        `MatchesRepository.find query timeout after ${timeout}ms`
      );

      const totalItems = result[0]?.count ?? 0;
      const removeCount = (match: Match & { count?: number }) => {
        const { count, ...matchDetails } = match;
        return matchDetails;
      };
      return { count: +totalItems, result: result.map(removeCount) };
    },
  };
}
