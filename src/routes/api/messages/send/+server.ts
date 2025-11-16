import { json } from '@sveltejs/kit';
import { addMessage } from '$lib/server/messageStore';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

		// Get user's profile picture
		const [user] = await db
			.select({ profilePictureUrl: users.profilePictureUrl })
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		const message = await addMessage(username, text, user?.profilePictureUrl);
		
		// Broadcast to all clients via Socket.IO (global.io is set in server.js for production)
		if (global.io) {
			global.io.emit('new-message', message);
			console.log('Message broadcasted via global.io');
		} else {
			console.warn('global.io not available, message not broadcasted');
		}
		
		return json({ success: true, message });
	} catch (error) {
		console.error('Send message error:', error);
		return json({ error: 'Failed to send message' }, { status: 500 });
	}
};
