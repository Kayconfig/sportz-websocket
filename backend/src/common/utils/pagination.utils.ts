import type { PaginationMetadataDto } from '../dtos/pagination-metadata.dto';
import { ErrParseStringNumber } from './error/err-parse-string-number';

/**
 *
 * @param totalItems
 * @param limit
 * @param page
 * @returns PaginationMetadataDto
 *
 * @throws ErrParseStringNumber
 */
function generatePaginationMetadata(
  totalItems: number | string,
  limit: number,
  page: number
): PaginationMetadataDto {
  const parsedTotalItems = Number(totalItems);
  if (isNaN(parsedTotalItems)) {
    throw ErrParseStringNumber.create(`${totalItems} is not a valid number`);
  }
  if (parsedTotalItems < 1) {
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
    lastPage: Math.ceil((parsedTotalItems + limit - 1) / limit),
    totalItems: parsedTotalItems,
  };
}

function calculateOffset(limit: number, page: number): number {
  return (page - 1) * limit;
}
export const paginationUtils = { generatePaginationMetadata, calculateOffset };
