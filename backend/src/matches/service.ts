import type { PaginationFilterDto } from '../common/dtos/pagination-filter.dto';
import type { PaginationMetadataDto } from '../common/dtos/pagination-metadata.dto';
import { paginationUtils } from '../common/utils/pagination.utils';
import type { Match, NewMatch } from '../db/schema';
import type { MatchesRepository } from './repository';

export interface MatchesService {
  create(newMatch: NewMatch): Promise<Match>;
  find(filter: PaginationFilterDto): Promise<{
    metadata: PaginationMetadataDto;
    result: Match[];
  }>;
}

export function createMatchesService(
  repository: MatchesRepository
): MatchesService {
  return {
    async create(newMatch) {
      return await repository.create(newMatch);
    },
    async find(filter) {
      const { count, result } = await repository.find({
        limit: filter.limit,
        offset: paginationUtils.calculateOffset(filter.limit, filter.page),
      });
      const metadata: PaginationMetadataDto =
        paginationUtils.generatePaginationMetadata(
          count,
          filter.limit,
          filter.page
        );

      return {
        metadata,
        result,
      };
    },
  };
}
