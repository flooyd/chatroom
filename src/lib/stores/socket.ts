import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';

export const onlineUsers = writable<string[]>([]);

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function initializeSocket(username: string | null, isVerified: boolean = false) {
	if (!browser) return;

	// Disconnect existing socket if any
	if (socket) {
		socket.disconnect();
	}

	// Clear existing intervals
	if (heartbeatInterval) clearInterval(heartbeatInterval);
	if (pollInterval) clearInterval(pollInterval);

	// Only initialize if user is logged in and verified
	if (!username || !isVerified) {
		onlineUsers.set([]);
		return;
	}

	// Immediately add current user to online list for instant UX feedback
	onlineUsers.update(users => {
		if (!users.includes(username)) {
			return [...users, username];
		}
		return users;
	});

	// Try Socket.IO first (for local development)
	socket = io();

	let socketConnected = false;

	socket.on('connect', () => {
		console.log('Connected to Socket.IO server');
		socketConnected = true;
		if (username) {
			socket?.emit('user-online', username);
		}
	});

	socket.on('online-users', (users: string[]) => {
		console.log('Online users (socket):', users);
		onlineUsers.set(users);
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from Socket.IO server');
		socketConnected = false;
	});

	// Fallback to polling for production (Vercel)
	// Wait a bit to see if Socket.IO connects
	setTimeout(() => {
		if (!socketConnected) {
			console.log('Socket.IO not available, using polling fallback');
			
			// Send heartbeat every 15 seconds
			heartbeatInterval = setInterval(async () => {
				try {
					await fetch('/api/heartbeat', { method: 'POST' });
				} catch (error) {
					console.error('Heartbeat failed:', error);
				}
			}, 15000);

			// Poll for online users every 5 seconds
			pollInterval = setInterval(async () => {
				try {
					const response = await fetch('/api/online-users');
					const data = await response.json();
					if (data.onlineUsers) {
						console.log('Online users (polling):', data.onlineUsers);
						onlineUsers.set(data.onlineUsers);
					}
				} catch (error) {
					console.error('Poll failed:', error);
				}
			}, 5000);

			// Send initial heartbeat and fetch immediately
			fetch('/api/heartbeat', { method: 'POST' }).catch(console.error);
			fetch('/api/online-users')
				.then(r => r.json())
				.then(data => {
					if (data.onlineUsers) {
						onlineUsers.set(data.onlineUsers);
					}
				})
				.catch(console.error);
		}
	}, 1000);
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
	
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
	
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = null;
	}
	
	onlineUsers.set([]);
}

