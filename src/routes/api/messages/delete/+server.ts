import { json } from '@sveltejs/kit';
import { deleteMessage } from '$lib/server/messageStore';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('session');
	
	if (!sessionId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { messageId } = await request.json();
		
		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		// Find any AI responses linked to this message
		const linkedMessages = await db
			.select()
			.from(messages)
			.where(eq(messages.linkToMessage, messageId));

		// Delete the message from database
		await deleteMessage(messageId);
		
		// Delete any linked AI responses
		const linkedIds = [];
		for (const linkedMsg of linkedMessages) {
			await deleteMessage(linkedMsg.id);
			linkedIds.push(linkedMsg.id);
		}
		
		// Broadcast deletion to all clients via Socket.IO
		if (global.io) {
			global.io.emit('delete-message', messageId);
			console.log('Message deletion broadcasted via global.io');
			
			// Also broadcast deletion of linked messages
			for (const linkedId of linkedIds) {
				global.io.emit('delete-message', linkedId);
				console.log('Linked message deletion broadcasted via global.io:', linkedId);
			}
		} else {
			console.warn('global.io not available, deletion not broadcasted');
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Delete message error:', error);
		return json({ error: 'Failed to delete message' }, { status: 500 });
	}
};
