import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { socketManager } from './src/lib/server/socket.js';

const app = express();
const server = createServer(app);

// Initialize Socket.IO
socketManager.initSocketIO(server);

// SvelteKit handler
app.use(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
