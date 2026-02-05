import { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { wsArcJet } from '../../arcjet';
import type { Logger } from '../common/types/logger';
import type { Match } from '../db/schema';
import { PAYLOAD_TYPES } from './payload-types';

function sendJson(socket: WebSocket, payload: Record<string, any>) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: Record<string, any>) {
  for (const client of wss.clients) {
    sendJson(client, payload);
  }
}

export function attachWebSocketServer(server: Server, logger: Logger) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024, // one MB
  });

  wss.on(
    'connection',
    async (socket: WebSocket & { isAlive?: boolean }, req) => {
      let code: number;
      let reason: string;
      try {
        const decision = await wsArcJet.protect(req);
        if (decision.isDenied()) {
          const isRateLimit = decision.reason.isRateLimit();
          code = isRateLimit ? 1013 : 1008;
          reason = isRateLimit ? 'Rate limit exceeded' : 'Access denied';
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        logger.error({ msg: 'WS connection error', err: error });
        socket.close(1011, 'Server security error');
        return;
      }
      socket.isAlive = true;
      socket.on('pong', function hearbeat() {
        socket.isAlive = true;
      });
      sendJson(socket, { type: PAYLOAD_TYPES.WELCOME });
      socket.on('error', logger.error);
    }
  );

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws?.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 1_000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: PAYLOAD_TYPES.MATCH_CREATED, data: match });
  }

  return { broadcastMatchCreated };
}
