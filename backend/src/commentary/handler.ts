import type { NextFunction, Request, Response } from 'express';
import { paginationFilterSchema } from '../common/dtos/pagination-filter.dto';
import { httpStatusCodes } from '../common/http/status-codes';
import type { WebSocketFeatures } from '../common/types/app';
import type { Logger } from '../common/types/logger';
import { paginationUtils } from '../common/utils/pagination.utils';
import { createCommentaryDtoSchema } from './dto/create-commentary.dto';
import { matchIDParamsDtoSchema } from './dto/match-id.dto';
import type { CommentaryService } from './service';

export interface CommentaryHandler {
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  find(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createCommentaryHandler(
  service: CommentaryService,
  logger: Logger,
  ws: WebSocketFeatures
): CommentaryHandler {
  return {
    async create(req, res, next) {
      try {
        const matchIdParseResult = matchIDParamsDtoSchema.safeParse(req.params);
        if (matchIdParseResult.error) {
          res.status(httpStatusCodes.BAD_REQUEST).json({
            message: 'invalid matchId',
            error: matchIdParseResult.error.issues,
          });
          return;
        }
        const matchId = matchIdParseResult.data.matchId;
        const parsedResult = await createCommentaryDtoSchema.safeParseAsync({
          ...req.body,
          matchId,
        });
        if (parsedResult.error) {
          res.status(httpStatusCodes.BAD_REQUEST).json({
            message: 'invalid payload',
            error: parsedResult.error.issues,
          });
          return;
        }
        const commentary = await service.create(parsedResult.data);
        ws.broadcastCommentary(matchId, commentary);
        res.status(httpStatusCodes.CREATED).json({
          data: commentary,
        });
      } catch (error) {
        logger.error(error);
        next(error);
      }
    },
    async find(req, res, next) {
      try {
        const matchIdParseResult = matchIDParamsDtoSchema.safeParse(req.params);
        if (matchIdParseResult.error) {
          res.status(httpStatusCodes.BAD_REQUEST).json({
            message: 'invalid matchId',
            error: matchIdParseResult.error.issues,
          });
          return;
        }
        const parsedQueryResult = await paginationFilterSchema.safeParseAsync(
          req.query
        );
        if (parsedQueryResult.error) {
          res.status(httpStatusCodes.BAD_REQUEST).json({
            message: 'invalid query',
            error: parsedQueryResult.error.issues,
          });
          return;
        }
        const matchId = matchIdParseResult.data.matchId;
        const pagination = parsedQueryResult.data;
        const { count, commentaries } = await service.find(matchId, pagination);
        const metadata = paginationUtils.generatePaginationMetadata(
          count,
          pagination.limit,
          pagination.page
        );
        res.json({
          message: 'successful',
          data: { metadata, commentaries },
        });
      } catch (error) {
        logger.error(error);
        next(error);
      }
    },
  };
}
