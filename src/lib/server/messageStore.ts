// In-memory message store (non-persistent)
interface Message {
	id: string;
	username: string;
	text: string;
	timestamp: number;
}

// Use global to persist across serverless function warm starts
const globalForMessages = global as unknown as {
	messages: Message[] | undefined;
};

if (!globalForMessages.messages) {
	globalForMessages.messages = [];
}

const messages = globalForMessages.messages;
const MAX_MESSAGES = 50; // Keep only last 50 messages

export function addMessage(username: string, text: string): Message {
	const message: Message = {
		id: `${Date.now()}-${Math.random()}`,
		username,
		text,
		timestamp: Date.now()
	};
	
	messages.push(message);
	
	// Keep only the last MAX_MESSAGES
	if (messages.length > MAX_MESSAGES) {
		messages.shift();
	}
	
	return message;
}

export function getMessages(since?: number): Message[] {
	if (since) {
		return messages.filter(m => m.timestamp > since);
	}
	return [...messages];
}

export function getMessageStore() {
	return messages;
}
