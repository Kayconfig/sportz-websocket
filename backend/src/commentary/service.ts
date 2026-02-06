import type { PaginationFilterDto } from '../common/dtos/pagination-filter.dto';
import { paginationUtils } from '../common/utils/pagination.utils';
import type { Commentary, NewCommentary } from '../db/schema';
import type { CommentaryRepository } from './repository';

export interface CommentaryService {
  create(newCommentary: NewCommentary): Promise<Commentary>;
  find(
    matchId: number,
    pagination: PaginationFilterDto
  ): Promise<{ count: number; commentaries: Array<Commentary> }>;
}

export function createCommentaryService(
  repo: CommentaryRepository
): CommentaryService {
  return {
    async create(newCommentary) {
      return await repo.create(newCommentary);
    },

    async find(matchId, pagination) {
      const offset = paginationUtils.calculateOffset(
        pagination.limit,
        pagination.page
      );
      return await repo.find(matchId, {
        limit: pagination.limit,
        offset,
      });
    },
  };
}
