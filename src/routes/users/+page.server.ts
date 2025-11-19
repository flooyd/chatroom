import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Only load users list if current user is verified
	if (user && user.isVerified) {
		const allUsers = await db
			.select({ 
				username: users.username,
				profilePictureUrl: users.profilePictureUrl,
				lastOnlineTime: users.lastOnlineTime
			})
			.from(users)
            .orderBy(users.username);
		
		return { users: allUsers };
	}
	
	return { users: [] };
};
