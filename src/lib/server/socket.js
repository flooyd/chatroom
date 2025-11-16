import { Server } from 'socket.io';

// Use a class to prevent tree-shaking
class SocketManager {
	constructor() {
		this.io = null;
		this.onlineUsers = new Map();
	}

	initSocketIO(httpServer) {
		if (this.io) return this.io;
		
		this.io = new Server(httpServer);

		this.io.on('connection', (socket) => {
			console.log('Client connected:', socket.id);

			socket.on('user-online', (username) => {
				console.log('User online:', username);
				this.onlineUsers.set(socket.id, username);
				
				const onlineUsersList = Array.from(new Set(this.onlineUsers.values()));
				this.io.emit('online-users', onlineUsersList);
			});

			socket.on('disconnect', () => {
				const username = this.onlineUsers.get(socket.id);
				if (username) {
					console.log('User offline:', username);
					this.onlineUsers.delete(socket.id);
					
					const onlineUsersList = Array.from(new Set(this.onlineUsers.values()));
					this.io.emit('online-users', onlineUsersList);
				}
			});
		});

		return this.io;
	}

	broadcastMessage(message) {
		console.log('Broadcasting message:', message, 'IO exists:', !!this.io);
		if (this.io) {
			this.io.emit('new-message', message);
			console.log('Message broadcasted successfully');
		} else {
			console.error('Socket.IO not initialized - cannot broadcast message');
		}
	}
}

// Export singleton instance
export const socketManager = new SocketManager();
export const initSocketIO = (httpServer) => socketManager.initSocketIO(httpServer);
export const broadcastMessage = (message) => socketManager.broadcastMessage(message);
