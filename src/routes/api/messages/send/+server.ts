import { json } from '@sveltejs/kit';
import { addMessage } from '$lib/server/messageStore';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('session');
	
	if (!sessionId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { username, text } = await request.json();
		
		if (!username || !text) {
			return json({ error: 'Username and text are required' }, { status: 400 });
		}

		if (text.trim().length === 0) {
			return json({ error: 'Message cannot be empty' }, { status: 400 });
		}

		if (text.length > 500) {
			return json({ error: 'Message too long (max 500 characters)' }, { status: 400 });
		}

		const message = addMessage(username, text);
		
		return json({ success: true, message });
	} catch (error) {
		console.error('Send message error:', error);
		return json({ error: 'Failed to send message' }, { status: 500 });
	}
};
