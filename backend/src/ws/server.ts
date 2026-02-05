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
      socket.isAlive = true;
      socket.on('pong', function hearbeat() {
        socket.isAlive = true;
      });
      sendJson(socket, { type: PAYLOAD_TYPES.WELCOME });
      socket.on('error', logger.error);
    }
  );

  server.on('upgrade', async (req, socket, head) => {
    const { pathname } = new URL(req.url!, `http://${req.headers.host}`);
    if (pathname !== '/ws') {
      return;
    }

    try {
      const decision = await wsArcJet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          socket.write('HTTP/1.1 429 Too Many Requests \r\n\r\n');
        } else {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        }
        socket.destroy();
        return;
      }
    } catch (error) {
      logger.error({ msg: 'WS upgrade protection error', err: error });
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
      return;
    }
  });

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
