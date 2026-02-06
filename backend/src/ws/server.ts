import { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { wsArcJet } from '../../arcjet';
import type { Logger } from '../common/types/logger';
import type { Commentary, Match } from '../db/schema';
import { EVENT_TYPES } from './event-types';

const matchSubscribers = new Map<number, Set<WebSocket>>();
const subscriptions = new Map<WebSocket, Set<number>>();

function subscribeToMatch(matchId: number, socket: WebSocket) {
  let subscribers = matchSubscribers.get(matchId);
  if (!subscribers) {
    subscribers = new Set<WebSocket>();
    matchSubscribers.set(matchId, subscribers);
  }
  subscribers.add(socket);
}

function unSubscribeFromMatch(matchId: number, socket: WebSocket) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
    return;
  }
}

function cleanupSubscriptions(socket: WebSocket) {
  const socketSubscriptions = subscriptions.get(socket);
  if (!socketSubscriptions) {
    return;
  }
  for (const matchId of socketSubscriptions) {
    const subscribers = matchSubscribers.get(matchId);
    subscribers?.delete(socket);
  }
}

function broadcastToMatchSubscribers(
  matchId: number,
  payload: Record<string, any>
) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  for (const subscriber of subscribers) {
    sendJson(subscriber, payload);
  }
}

function addMatchIdToSocketSubscription(matchId: number, socket: WebSocket) {
  let subscribedMatches = subscriptions.get(socket);
  if (!subscribedMatches) {
    subscribedMatches = new Set<number>();
    subscriptions.set(socket, subscribedMatches);
  }
  subscribedMatches.add(matchId);
}

function removeMatchIdFromSocketSubscription(
  matchId: number,
  socket: WebSocket
) {
  let subscribedMatches = subscriptions.get(socket);
  if (!subscribedMatches) {
    return;
  }

  subscribedMatches.delete(matchId);

  if (subscribedMatches.size < 1) {
    // remove socket store when not listening to any match
    subscriptions.delete(socket);
    return;
  }
}

function handleMessage(socket: WebSocket, payloadString: string) {
  try {
    const message = JSON.parse(payloadString);
    const matchId = Number(message.matchId);
    const matchIdIsSafeToUse = Number.isSafeInteger(matchId);

    if (message?.type === EVENT_TYPES.SUBSCRIBE && matchIdIsSafeToUse) {
      subscribeToMatch(matchId, socket);
      addMatchIdToSocketSubscription(matchId, socket);
      sendJson(socket, { type: EVENT_TYPES.SUBSCRIBED, matchId });
    } else if (
      message?.type === EVENT_TYPES.UNSUBSCRIBE &&
      matchIdIsSafeToUse
    ) {
      unSubscribeFromMatch(matchId, socket);
      removeMatchIdFromSocketSubscription(matchId, socket);
      sendJson(socket, { type: EVENT_TYPES.UNSUBSCRIBED, matchId });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(socket, { type: 'error', message: 'invalid JSON' });
      return;
    }
    throw error;
  }
}

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

      socket.on('message', (data, isBinary) => {
        let stringifiedData = data.toString();
        handleMessage(socket, stringifiedData);
      });

      socket.on('error', (err) => {
        logger.error(err);
        cleanupSubscriptions(socket);
        socket.terminate();
      });
      socket.on('close', () => {
        cleanupSubscriptions(socket);
      });

      sendJson(socket, { type: EVENT_TYPES.WELCOME });
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
    broadcast(wss, { type: EVENT_TYPES.MATCH_CREATED, data: match });
  }

  function broadcastCommentary(matchId: number, commentary: Commentary) {
    broadcastToMatchSubscribers(matchId, {
      type: EVENT_TYPES.COMMENTARY,
      data: commentary,
    });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}
