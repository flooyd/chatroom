import { handler } from './build/handler.js';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Create HTTP server with the SvelteKit handler
const httpServer = createServer(handler);

// Initialize Socket.IO on the same HTTP server
const io = new Server(httpServer, {
	cors: {
		origin: process.env.ORIGIN || '*',
		methods: ['GET', 'POST']
	}
});

// Track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
	console.log('Client connected:', socket.id);

	socket.on('user-online', (username) => {
		console.log('User online:', username);
		onlineUsers.set(socket.id, username);
		
		const onlineUsersList = Array.from(new Set(onlineUsers.values()));
		io.emit('online-users', onlineUsersList);
	});

	socket.on('disconnect', () => {
		const username = onlineUsers.get(socket.id);
		if (username) {
			console.log('User offline:', username);
			onlineUsers.delete(socket.id);
			
			const onlineUsersList = Array.from(new Set(onlineUsers.values()));
			io.emit('online-users', onlineUsersList);
		}
	});
});

// Make io globally available for the API routes
global.io = io;

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

httpServer.listen(port, host, () => {
	console.log(`Server listening on ${host}:${port}`);
	console.log('Socket.IO initialized and ready');
});
