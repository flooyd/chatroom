import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Consider users online if they've been active in the last 5 seconds
		const fiveSecondsAgo = new Date(Date.now() - 5000);
		
		const onlineUsers = await db
			.select({ 
				username: users.username 
			})
			.from(users)
			.where(sql`${users.lastOnlineTime} > ${fiveSecondsAgo}`);

		return json({ 
			onlineUsers: onlineUsers.map(u => u.username) 
		});
	} catch (error) {
		console.error('Online users error:', error);
		return json({ error: 'Failed to fetch online users' }, { status: 500 });
	}
};
