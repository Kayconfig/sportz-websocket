import type { PaginationMetadataDto } from '../dtos/pagination-metadata.dto';

function generatePaginationMetadata(
  totalItems: number,
  limit: number,
  page: number
): PaginationMetadataDto {
  if (totalItems < 1) {
    return {
      firstPage: 0,
      lastPage: 0,
      pageSize: 0,
      currentPage: 0,
      totalItems: 0,
    };
  }
  return {
    currentPage: page,
    pageSize: limit,
    firstPage: 1,
    lastPage: Math.ceil((totalItems + limit - 1) / limit),
    totalItems,
  };
}

function calculateOffset(limit: number, page: number): number {
  return (page - 1) * limit;
}
export const paginationUtils = { generatePaginationMetadata, calculateOffset };
