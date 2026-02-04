import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttpLoger from 'pino-http';
import { ErrQueryTimeout } from './common/errors/err-query-timeout';
import { httpStatusCodes } from './common/http/status-codes';
import type { App } from './common/types/app';
import { secrets } from './config/env';
import { connectDB } from './db/drizzle';
import { initializeMatchesModule } from './matches';

function registerMiddlewares(app: App) {
  app.express.use(helmet());
  app.express.use(express.json());
  app.express.use(express.urlencoded({ extended: true }));
  app.express.use(pinoHttpLoger());
}

function registerUtilRoutes(app: App) {
  app.express.get('/health', (req, res) => {
    res.json({
      status: 'Available',
      timestamp: new Date().toISOString(),
    });
  });

  app.express.use('', (req, res) => {
    res
      .status(httpStatusCodes.NOT_FOUND)
      .json({ message: 'request path does not exist' });
  });
}

function registerDefaultErrHandler(app: App) {
  app.express.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      app.logger.error(err);
      if (err instanceof ErrQueryTimeout) {
        res.status(httpStatusCodes.SERVICE_UNAVAILABLE).json({
          msg: 'unable to handle request, due to temporary overload or maintenance',
        });
        return;
      }

      res
        .status(httpStatusCodes.SERVER_ERROR)
        .json({ message: 'unable to process request, please try again later' });
    }
  );
}

export function createApp(): App {
  const expressApp = express();
  const logger = pino();
  const db = connectDB(secrets.getOrThrow('POSTGRES_DATABASE_URL'), logger);
  const app: App = { express: expressApp, logger, db };
  registerMiddlewares(app);

  initializeMatchesModule(app);
  registerUtilRoutes(app);
  registerDefaultErrHandler(app);

  return app;
}
