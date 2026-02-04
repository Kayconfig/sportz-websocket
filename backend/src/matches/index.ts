import type { App } from '../common/types/app';
import { createMatchesController } from './controller';
import { createMatchesRespository } from './repository';
import { createMatchesRouter } from './routes';
import { createMatchesService } from './service';

export function initializeMatchesModule(app: App) {
  const repository = createMatchesRespository(app.db);
  const service = createMatchesService(repository);
  const controller = createMatchesController(service);
  const router = createMatchesRouter(controller);

  app.express.use(router);
}
