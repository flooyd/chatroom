import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('session');
	
	if (!sessionId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// Update user's last online time
		await db
			.update(users)
			.set({ lastOnlineTime: new Date() })
			.where(eq(users.id, parseInt(sessionId)));

		return json({ success: true });
	} catch (error) {
		console.error('Heartbeat error:', error);
		return json({ error: 'Failed to update status' }, { status: 500 });
	}
};
