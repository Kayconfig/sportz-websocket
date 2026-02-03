import express, { type Express } from 'express';

function registerMiddlewares(app: Express) {
  app.use(express.json());
}

export function createApp(): Express {
  const app = express();
  registerMiddlewares(app);

  return app;
}
