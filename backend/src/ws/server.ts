import { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
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

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024, // one MB
  });

  wss.on('connection', (socket: WebSocket & { isAlive?: boolean }) => {
    socket.isAlive = true;
    socket.on('pong', function hearbeat() {
      (this as any).alive = true;
    });
    sendJson(socket, { type: PAYLOAD_TYPES.WELCOME });
    socket.on('error', console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws?.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: PAYLOAD_TYPES.MATCH_CREATED, data: match });
  }

  return { broadcastMatchCreated };
}
