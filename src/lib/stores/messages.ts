import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';

export interface Message {
	id: number;
	username: string;
	text: string;
	timestamp: number;
	profilePictureUrl?: string | null;
	linkToMessage?: number | null;
}

export const messages = writable<Message[]>([]);

let socket: Socket | null = null;
let currentUsername: string | null = null;

export function initializeMessages(username: string | null, isVerified: boolean = false) {
	if (!browser) return;

	// Clear existing socket
	if (socket) socket.disconnect();

	// Only initialize if user is logged in and verified
	if (!username || !isVerified) {
		messages.set([]);
		currentUsername = null;
		return;
	}

	currentUsername = username;

	// Initialize Socket.IO connection
	socket = io();

	socket.on('connect', () => {
		console.log('Messages Socket.IO connected');
	});

	socket.on('new-message', (message: Message) => {
		console.log('New message via socket:', message);
		// Only add if it's not from the current user (to avoid duplicates from optimistic updates)
		if (message.username !== currentUsername) {
			messages.update(currentMessages => [...currentMessages, message]);
		}
	});

	socket.on('delete-message', (messageId: number) => {
		console.log('Delete message via socket:', messageId);
		messages.update(currentMessages => currentMessages.filter(m => m.id !== messageId));
	});

	socket.on('disconnect', () => {
		console.log('Messages Socket.IO disconnected');
	});

	// Fetch initial messages
	fetchMessages();
}

async function fetchMessages() {
	try {
		const response = await fetch('/api/messages');
		const data = await response.json();
		
		if (data.messages) {
			messages.set(data.messages);
		}
	} catch (error) {
		console.error('Failed to fetch messages:', error);
	}
}

export async function sendMessage(username: string, text: string): Promise<boolean> {
	try {
		const response = await fetch('/api/messages/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, text })
		});

		const data = await response.json();
		
		if (data.success && data.message) {
			// Optimistically add message to local UI immediately
			messages.update(currentMessages => [...currentMessages, data.message]);
			return true;
		}
		
		return false;
	} catch (error) {
		console.error('Failed to send message:', error);
		return false;
	}
}

export function disconnectMessages() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
	messages.set([]);
}
