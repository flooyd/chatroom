import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
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

// SvelteKit handler
app.use(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
