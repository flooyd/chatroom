import { json } from '@sveltejs/kit';
import { deleteMessage } from '$lib/server/messageStore';
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

		// Delete the message from database
		await deleteMessage(messageId);
		
		// Broadcast deletion to all clients via Socket.IO
		if (global.io) {
			global.io.emit('delete-message', messageId);
			console.log('Message deletion broadcasted via global.io');
		} else {
			console.warn('global.io not available, deletion not broadcasted');
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Delete message error:', error);
		return json({ error: 'Failed to delete message' }, { status: 500 });
	}
};
