import type { App } from '../common/types/app';
import { createCommentaryHandler } from './handler';
import { createCommentaryRepository } from './repository';
import { createCommentaryRouter } from './router';
import { createCommentaryService } from './service';

export function initializeCommentaryModule(app: App) {
  const repo = createCommentaryRepository(app.db);
  const service = createCommentaryService(repo);
  const handler = createCommentaryHandler(service, app.logger, app.ws);
  const router = createCommentaryRouter(handler);
  app.express.use(router);
}
