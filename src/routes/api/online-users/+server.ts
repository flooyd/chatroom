import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Consider users online if they've been active in the last 30 seconds
		const thirtySecondsAgo = new Date(Date.now() - 30000);
		
		const onlineUsers = await db
			.select({ 
				username: users.username 
			})
			.from(users)
			.where(sql`${users.lastOnlineTime} > ${thirtySecondsAgo}`);

		return json({ 
			onlineUsers: onlineUsers.map(u => u.username) 
		});
	} catch (error) {
		console.error('Online users error:', error);
		return json({ error: 'Failed to fetch online users' }, { status: 500 });
	}
};
