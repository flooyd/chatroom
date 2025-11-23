import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'socket.io';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: any) {
		if (!server.httpServer) return;
		
		const io = new Server(server.httpServer, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			}
		});
		
		// Track online users
		const onlineUsers = new Map<string, string>();
		// Track typing users
		const typingUsers = new Map<string, string>();

		io.on('connection', (socket) => {
			console.log('Client connected:', socket.id);

			// Immediately send current online users list to the new connection
			const currentOnlineUsersList = Array.from(new Set(onlineUsers.values()));
			socket.emit('online-users', currentOnlineUsersList);

			socket.on('user-online', (username: string) => {
				console.log('User online:', username);
				onlineUsers.set(socket.id, username);
				
				const onlineUsersList = Array.from(new Set(onlineUsers.values()));
				io.emit('online-users', onlineUsersList);
			});

			socket.on('user-typing', (username: string) => {
				typingUsers.set(socket.id, username);
				const typingUsersList = Array.from(new Set(typingUsers.values()));
				io.emit('typing-users', typingUsersList);
			});

			socket.on('user-stopped-typing', () => {
				typingUsers.delete(socket.id);
				const typingUsersList = Array.from(new Set(typingUsers.values()));
				io.emit('typing-users', typingUsersList);
			});

			socket.on('disconnect', () => {
				const username = onlineUsers.get(socket.id);
				if (username) {
					console.log('User offline:', username);
					onlineUsers.delete(socket.id);
					
					const onlineUsersList = Array.from(new Set(onlineUsers.values()));
					io.emit('online-users', onlineUsersList);
				}
				// Remove from typing users on disconnect
				typingUsers.delete(socket.id);
				const typingUsersList = Array.from(new Set(typingUsers.values()));
				io.emit('typing-users', typingUsersList);
			});
		});
		
		// Make io globally available
		(global as any).io = io;
	}
};

export default defineConfig({
	plugins: [sveltekit(), webSocketServer],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
