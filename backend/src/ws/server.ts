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

  wss.on('connection', (socket) => {
    sendJson(socket, { type: PAYLOAD_TYPES.WELCOME });
    socket.on('error', console.error);
  });

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: PAYLOAD_TYPES.MATCH_CREATED, data: match });
  }

  return { broadcastMatchCreated };
}
