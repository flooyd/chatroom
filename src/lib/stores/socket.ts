import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';

export const onlineUsers = writable<string[]>([]);
export const typingUsers = writable<string[]>([]);

let socket: Socket | null = null;

export function getSocket(): Socket | null {
	return socket;
}

export function initializeSocket(username: string | null, isVerified: boolean = false) {
	if (!browser) return;

	// Disconnect existing socket if any
	if (socket) {
		socket.disconnect();
	}

	// Only initialize if user is logged in and verified
	if (!username || !isVerified) {
		onlineUsers.set([]);
		return;
	}

	// Initialize Socket.IO connection
	socket = io();

	socket.on('connect', () => {
		console.log('Connected to Socket.IO server');
		if (username) {
			socket?.emit('user-online', username);
		}
	});

	socket.on('online-users', (users: string[]) => {
		console.log('Online users:', users);
		onlineUsers.set(users);
	});

	socket.on('typing-users', (users: string[]) => {
		typingUsers.set(users);
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from Socket.IO server');
	});
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
	
	onlineUsers.set([]);
	typingUsers.set([]);
}

