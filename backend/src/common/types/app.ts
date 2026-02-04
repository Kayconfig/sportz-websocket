import type { Express } from 'express';
import type { Database } from '../../db/drizzle';
import type { Logger } from './logger';

export type App = {
  logger: Logger;
  db: Database;
  express: Express;
};
