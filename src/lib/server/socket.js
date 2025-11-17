// @ts-check
import { Server } from 'socket.io';

// Use globalThis to ensure singleton survives HMR in development
const SOCKET_MANAGER_KEY = Symbol.for('app.socketManager');

// Use a class to prevent tree-shaking
class SocketManager {
	constructor() {
		/** @type {import('socket.io').Server | null} */
		this.io = null;
		/** @type {Map<string, string>} */
		this.onlineUsers = new Map();
	}

	/**
	 * @param {import('http').Server} httpServer
	 * @returns {import('socket.io').Server}
	 */
	initSocketIO(httpServer) {
		if (this.io) {
			console.log('Socket.IO already initialized, returning existing instance');
			return this.io;
		}
		
		console.log('Initializing Socket.IO for the first time');
		this.io = new Server(httpServer, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			}
		});

		this.io.on('connection', (socket) => {
			console.log('Client connected:', socket.id);

			socket.on('user-online', (username) => {
				console.log('User online:', username);
				this.onlineUsers.set(socket.id, username);
				
				const onlineUsersList = Array.from(new Set(this.onlineUsers.values()));
				if (this.io) this.io.emit('online-users', onlineUsersList);
			});

			socket.on('disconnect', () => {
				const username = this.onlineUsers.get(socket.id);
				if (username) {
					console.log('User offline:', username);
					this.onlineUsers.delete(socket.id);
					
					const onlineUsersList = Array.from(new Set(this.onlineUsers.values()));
					if (this.io) this.io.emit('online-users', onlineUsersList);
				}
			});
		});

		return this.io;
	}

	/**
	 * @param {any} message
	 */
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
/**
 * @returns {SocketManager}
 */
export function getSocketManager() {
	// @ts-ignore - Using symbol key on globalThis
	if (!globalThis[SOCKET_MANAGER_KEY]) {
		console.log('Creating new SocketManager instance');
		// @ts-ignore
		globalThis[SOCKET_MANAGER_KEY] = new SocketManager();
	}
	// @ts-ignore
	return globalThis[SOCKET_MANAGER_KEY];
}

// Export functions that always get the current singleton
/**
 * @param {import('http').Server} httpServer
 */
export const initSocketIO = (httpServer) => getSocketManager().initSocketIO(httpServer);
/**
 * @param {any} message
 */
export const broadcastMessage = (message) => getSocketManager().broadcastMessage(message);
