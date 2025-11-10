import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';

export const onlineUsers = writable<string[]>([]);

let socket: Socket | null = null;

export function initializeSocket(username: string | null) {
	if (!browser) return;

	// Disconnect existing socket if any
	if (socket) {
		socket.disconnect();
	}

	// Only initialize if user is logged in
	if (!username) {
		onlineUsers.set([]);
		return;
	}

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

	socket.on('disconnect', () => {
		console.log('Disconnected from Socket.IO server');
	});
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
		onlineUsers.set([]);
	}
}
