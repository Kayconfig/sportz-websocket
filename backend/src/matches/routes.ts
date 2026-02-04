import { Router } from 'express';
import type { MatchesController } from './controller';

export function createMatchesRouter(
  matchesController: MatchesController
): Router {
  const matchesRouter = Router();

  matchesRouter.post('/v1/matches', matchesController.create);
  matchesRouter.get('/v1/matches', matchesController.findAll);
  return matchesRouter;
}
