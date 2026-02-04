import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app';
import { secrets } from './config/env';

secrets.validate();

const app = createApp();
const server = createServer(app.express);
const port = secrets.getOrThrow('PORT');
server.listen(port, () => {
  app.logger.info(`server running on port ${port}`);
});
