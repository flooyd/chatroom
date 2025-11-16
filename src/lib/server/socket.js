import { Server } from 'socket.io';

// Global Socket.IO instance
export let io = null;
const onlineUsers = new Map();

// Initialize for development (Vite)
export function initSocketIO(httpServer) {
	if (io) return io;
	
	io = new Server(httpServer);

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

	return io;
}

// Broadcast message to all clients
export function broadcastMessage(message) {
	if (io) {
		io.emit('new-message', message);
	}
}
