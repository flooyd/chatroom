import { Server } from 'socket.io';

// Global Socket.IO instance - use an object to maintain reference
const socketState = {
	io: null,
	onlineUsers: new Map()
};

// Initialize for development (Vite) and production
export function initSocketIO(httpServer) {
	if (socketState.io) return socketState.io;
	
	socketState.io = new Server(httpServer);

	socketState.io.on('connection', (socket) => {
		console.log('Client connected:', socket.id);

		socket.on('user-online', (username) => {
			console.log('User online:', username);
			socketState.onlineUsers.set(socket.id, username);
			
			const onlineUsersList = Array.from(new Set(socketState.onlineUsers.values()));
			socketState.io.emit('online-users', onlineUsersList);
		});

		socket.on('disconnect', () => {
			const username = socketState.onlineUsers.get(socket.id);
			if (username) {
				console.log('User offline:', username);
				socketState.onlineUsers.delete(socket.id);
				
				const onlineUsersList = Array.from(new Set(socketState.onlineUsers.values()));
				socketState.io.emit('online-users', onlineUsersList);
			}
		});
	});

	return socketState.io;
}

// Broadcast message to all clients
export function broadcastMessage(message) {
	console.log('Broadcasting message:', message, 'IO exists:', !!socketState.io);
	if (socketState.io) {
		socketState.io.emit('new-message', message);
		console.log('Message broadcasted successfully');
	} else {
		console.error('Socket.IO not initialized - cannot broadcast message');
	}
}
