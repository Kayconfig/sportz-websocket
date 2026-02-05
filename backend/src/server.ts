import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app';
import { secrets } from './config/env';
import { attachWebSocketServer } from './ws/server';

secrets.validate();
const app = createApp();
const server = createServer(app.express);
const { broadcastMatchCreated } = attachWebSocketServer(server, app.logger);
// add to express global object called locals
app.express.locals.broadcastMatchCreated = broadcastMatchCreated;
const port = secrets.getOrThrow('PORT');
server.listen(port, () => {
  app.logger.info(`server running on port ${port}`);
});
