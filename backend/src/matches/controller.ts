import type { NextFunction, Request, Response } from 'express';
import { treeifyError } from 'zod';
import { paginationFilterSchema } from '../common/dtos/pagination-filter.dto';
import { httpStatusCodes } from '../common/http/status-codes';
import { createMatchSchema } from './dtos/create-match.dto';
import type { MatchesService } from './service';
import { getMatchStatus } from './utils/match-status.util';

export interface MatchesController {
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  findAll(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export function createMatchesController(
  service: MatchesService
): MatchesController {
  return {
    async create(req, res, next) {
      const parsed = await createMatchSchema.safeParseAsync(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: 'invalid payload.',
          error: treeifyError(parsed.error).properties,
        });
        return;
      }
      try {
        const { startTime, endTime } = parsed.data;
        const [parsedStartTime, parsedEndTime] = [
          new Date(startTime),
          new Date(endTime),
        ];
        const matchStatus = getMatchStatus(parsedStartTime, parsedEndTime);
        if (matchStatus == null) {
          res.status(httpStatusCodes.BAD_REQUEST).json({
            message:
              'invalid startTime or endTime. ensure startTime & endTime are valid ISO string datetime and startTime is earlier than endTime',
          });
          return;
        }
        const event = await service.create({
          ...parsed.data,
          startTime: parsedStartTime,
          endTime: parsedEndTime,
          status: matchStatus,
        });
        res.status(httpStatusCodes.CREATED).json({
          data: event,
        });
      } catch (error) {
        next(error);
      }
    },
    async findAll(req, res, next) {
      try {
        const parsedFilterResult = await paginationFilterSchema.safeParseAsync(
          req.query
        );
        if (parsedFilterResult.error) {
          res.status(400).json({
            message: 'invalid payload.',
            error: treeifyError(parsedFilterResult.error).properties,
          });
          return;
        }
        const data = await service.find(parsedFilterResult.data);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    },
  };
}
