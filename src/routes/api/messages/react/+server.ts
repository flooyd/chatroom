import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reactions, messages, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const sessionId = cookies.get('session');
		if (!sessionId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}

		// Get user from database to get username
		const userId = parseInt(sessionId);
		const [user] = await db
			.select({ username: users.username })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		
		if (!user) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		const username = user.username;
		const { messageId, reactionType } = await request.json();

		if (!messageId || !reactionType) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Check if message exists
		const message = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
		if (message.length === 0) {
			return json({ success: false, error: 'Message not found' }, { status: 404 });
		}

		// Check if user already reacted with this type
		const existingReaction = await db
			.select()
			.from(reactions)
			.where(and(eq(reactions.messageId, messageId), eq(reactions.username, username), eq(reactions.type, reactionType)))
			.limit(1);

		if (existingReaction.length > 0) {
			// Remove reaction (toggle off)
			await db
				.delete(reactions)
				.where(and(eq(reactions.messageId, messageId), eq(reactions.username, username), eq(reactions.type, reactionType)));
		} else {
			// Add reaction
			await db.insert(reactions).values({
				messageId,
				username,
				type: reactionType,
			});
		}

		// Get all reactions for this message
		const allReactions = await db
			.select()
			.from(reactions)
			.where(eq(reactions.messageId, messageId));

		// Group reactions by type
		const reactionMap = new Map<string, string[]>();
		allReactions.forEach((r) => {
			if (!reactionMap.has(r.type)) {
				reactionMap.set(r.type, []);
			}
			reactionMap.get(r.type)!.push(r.username);
		});

		const reactionsArray = Array.from(reactionMap.entries()).map(([type, users]) => ({
			type,
			users,
		}));

		// Broadcast reaction update via Socket.IO
		if (global.io) {
			global.io.emit('message-reaction', { messageId, reactions: reactionsArray });
		}

		return json({ success: true, reactions: reactionsArray });
	} catch (error) {
		console.error('React to message error:', error);
		return json({ success: false, error: 'Failed to react to message' }, { status: 500 });
	}
};
