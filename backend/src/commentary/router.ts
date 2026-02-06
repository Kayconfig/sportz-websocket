import { Router } from 'express';
import type { CommentaryHandler } from './handler';

export function createCommentaryRouter(handler: CommentaryHandler): Router {
  const router = Router();

  router.post('/v1/matches/:matchId/commentary', handler.create);
  router.get('/v1/matches/:matchId/commentary', handler.find);

  return router;
}
