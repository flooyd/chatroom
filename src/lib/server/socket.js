import { Server } from 'socket.io';

// Global singleton to ensure same instance across all imports
let globalSocketManager = null;

// Use a class to prevent tree-shaking
class SocketManager {
	constructor() {
		this.io = null;
		this.onlineUsers = new Map();
	}

	initSocketIO(httpServer) {
		if (this.io) {
			console.log('Socket.IO already initialized, returning existing instance');
			return this.io;
		}
		
		console.log('Initializing Socket.IO for the first time');
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

	getIO() {
		return this.io;
	}
}

// Get or create the global singleton
export function getSocketManager() {
	if (!globalSocketManager) {
		globalSocketManager = new SocketManager();
	}
	return globalSocketManager;
}

export const socketManager = getSocketManager();
export const initSocketIO = (httpServer) => getSocketManager().initSocketIO(httpServer);
export const broadcastMessage = (message) => getSocketManager().broadcastMessage(message);
