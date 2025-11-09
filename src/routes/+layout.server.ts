import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('session');
	
	if (!sessionId) {
		return { user: null };
	}

	try {
		const userId = parseInt(sessionId);
		const [user] = await db
			.select({ 
				id: users.id, 
				username: users.username, 
				email: users.email,
				isVerified: users.isVerified,
				profilePictureUrl: users.profilePictureUrl
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			cookies.delete('session', { path: '/' });
			return { user: null };
		}

		return { user };
	} catch (error) {
		console.error('Error loading user:', error);
		return { user: null };
	}
};
