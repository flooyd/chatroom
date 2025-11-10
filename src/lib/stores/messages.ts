import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';

export interface Message {
	id: string;
	username: string;
	text: string;
	timestamp: number;
}

export const messages = writable<Message[]>([]);

let socket: Socket | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastMessageTimestamp = 0;
let socketConnected = false;

export function initializeMessages(username: string | null, isVerified: boolean = false) {
	if (!browser) return;

	// Clear existing interval
	if (pollInterval) clearInterval(pollInterval);
	if (socket) socket.disconnect();

	// Only initialize if user is logged in and verified
	if (!username || !isVerified) {
		messages.set([]);
		return;
	}

	// Try Socket.IO first (for local development)
	socket = io();
	socketConnected = false;

	socket.on('connect', () => {
		console.log('Messages Socket.IO connected');
		socketConnected = true;
	});

	socket.on('new-message', (message: Message) => {
		console.log('New message via socket:', message);
		messages.update(currentMessages => [...currentMessages, message]);
		lastMessageTimestamp = message.timestamp;
	});

	socket.on('disconnect', () => {
		console.log('Messages Socket.IO disconnected');
		socketConnected = false;
	});

	// Fetch initial messages immediately
	fetchMessages();

	// Fallback to polling for production (Vercel)
	setTimeout(() => {
		if (!socketConnected) {
			console.log('Socket.IO not available for messages, using polling');
			
			// Poll for new messages every 5 seconds
			pollInterval = setInterval(() => {
				fetchMessages();
			}, 5000);
		}
	}, 1000);
}

async function fetchMessages() {
	try {
		const url = lastMessageTimestamp 
			? `/api/messages?since=${lastMessageTimestamp}`
			: '/api/messages';
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (data.messages) {
			if (data.messages.length > 0) {
				// Update last timestamp
				const timestamps = data.messages.map((m: Message) => m.timestamp);
				lastMessageTimestamp = Math.max(...timestamps);
			}
			
			// Add new messages to the store
			messages.update(currentMessages => {
				// If fetching all messages (no since), replace everything
				if (!url.includes('since')) {
					return data.messages;
				}
				// Otherwise append new messages
				return [...currentMessages, ...data.messages];
			});
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
			// If Socket.IO is connected, emit the message for real-time broadcast
			if (socketConnected && socket) {
				socket.emit('send-message', data.message);
			} else {
				// Otherwise add it locally (polling will sync it for others)
				messages.update(currentMessages => [...currentMessages, data.message]);
			}
			lastMessageTimestamp = data.message.timestamp;
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
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = null;
	}
	messages.set([]);
	lastMessageTimestamp = 0;
	socketConnected = false;
}
