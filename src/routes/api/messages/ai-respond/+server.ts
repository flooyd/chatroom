import { json } from '@sveltejs/kit';
import { addMessage } from '$lib/server/messageStore';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';

// Use dynamic private env for runtime access
const getApiKey = () => env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('session');
	
	if (!sessionId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Check if API key is configured
	const apiKey = getApiKey();
	if (!apiKey) {
		return json({ error: 'AI feature not configured. Please set ANTHROPIC_API_KEY environment variable.' }, { status: 503 });
	}

	const anthropic = new Anthropic({
		apiKey
	});

	try {
		const { messageId } = await request.json();
		
		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		// Fetch the last 50 messages from the database
		const recentMessages = await db
			.select()
			.from(messages)
			.orderBy(desc(messages.timestamp))
			.limit(50);

		// Reverse to get chronological order
		const chronologicalMessages = recentMessages.reverse();

		// Find the specific message that was clicked
		const targetMessage = chronologicalMessages.find(msg => msg.id === messageId);
		
		if (!targetMessage) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		// Format conversation history for Claude
		const conversationHistory = chronologicalMessages
			.map(msg => `${msg.username}: ${msg.text}`)
			.join('\n');

		// Create the prompt for Claude
		const prompt = `You are chatting in a casual chatroom. Below is the recent conversation history:

${conversationHistory}

The user is asking you to respond to this specific message:
"${targetMessage.username}: ${targetMessage.text}"

Please provide a helpful, friendly, and conversational response. Keep it natural, as if you're chatting with friends.`;

		// Call Claude API
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-5',
			max_tokens: 1000,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			]
		});

		// Extract Claude's response text
		const aiResponseText = response.content[0].type === 'text' 
			? response.content[0].text 
			: 'Sorry, I could not generate a response.';

		// Post the AI response as a message from user "claude"
		const aiMessage = await addMessage('claude', aiResponseText, null);
		
		// Broadcast to all clients via Socket.IO
		if (global.io) {
			global.io.emit('new-message', aiMessage);
			console.log('AI message broadcasted via global.io');
		} else {
			console.warn('global.io not available, AI message not broadcasted');
		}
		
		return json({ success: true, message: aiMessage });
	} catch (error) {
		console.error('AI respond error:', error);
		return json({ error: 'Failed to generate AI response' }, { status: 500 });
	}
};
