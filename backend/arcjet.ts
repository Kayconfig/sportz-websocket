import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';
import type { NextFunction, Request, Response } from 'express';
import { httpStatusCodes } from './src/common/http/status-codes';
import type { Logger } from './src/common/types/logger';

const arcjetKey = process.env.ARCJET_KEY;
const arjetMode = process.env.ARCJET_MODE === 'LIVE' ? 'LIVE' : 'DRY_RUN';

if (!arcjetKey) {
  throw new Error('ARCJET_KEY is missing in env');
}

export const httpArcJet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arjetMode }),
    detectBot({
      mode: arjetMode,
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    slidingWindow({ mode: arjetMode, interval: '10s', max: 50 }),
  ],
});
export const wsArcJet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arjetMode }),
    detectBot({
      mode: arjetMode,
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    slidingWindow({ mode: arjetMode, interval: '2s', max: 5 }),
  ],
});

export function securityMiddleware(logger: Logger) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decision = await httpArcJet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          res
            .status(httpStatusCodes.TOO_MANY_REQUESTS)
            .json({ error: 'too many requests' });
          return;
        }
        res.status(httpStatusCodes.FORBIDDEN).json({ error: 'forbidden' });
      }
    } catch (error) {
      logger.error(error as Error);
      res
        .status(httpStatusCodes.SERVICE_UNAVAILABLE)
        .json({ error: 'service unavailable' });
      return;
    }
    next();
  };
}
