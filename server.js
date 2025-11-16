import { Server } from 'socket.io';

// Import the polka server from adapter-node
const polkaApp = await import('./build/index.js');

// Get the actual HTTP server from the polka instance
const httpServer = polkaApp.server.server;

// Initialize Socket.IO with CORS
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

console.log('Socket.IO initialized and attached to SvelteKit server');
console.log('Server will start on port:', polkaApp.port || process.env.PORT || 3000);
