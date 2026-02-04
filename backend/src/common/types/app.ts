import type { Express } from 'express';
import type { Database } from '../../db/drizzle';
import type { Match } from '../../db/schema';
import type { Logger } from './logger';

export type WebSocketFeatures = {
  broadcastMatchCreated(match: Match): void;
};

export type App = {
  logger: Logger;
  db: Database;
  express: Express;
  ws: WebSocketFeatures;
};
