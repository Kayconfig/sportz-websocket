import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app';
import { secrets } from './config/env';

secrets.validate();
const app = createApp();
const server = createServer(app);
const port = secrets.getOrThrow('PORT');
server.listen(port, () => {
  console.log(`server running on port ${port}`);
});
