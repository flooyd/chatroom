import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
    const parentLoad = await parent();
    console.log("Parent data in profile page load:", parentLoad);
	const { user } = parentLoad;

	if (!user) {
		throw redirect(303, '/');
	}
	
	return { user };
};

export const actions: Actions = {
	verify: async ({ request, locals, cookies }) => {
		const data = await request.formData();
		const code = data.get('code');

		if (!code || typeof code !== 'string') {
			return fail(400, { error: 'Verification code is required' });
		}

		const sessionId = cookies.get('session');
		if (!sessionId) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const userId = parseInt(sessionId);
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (!user) {
				return fail(404, { error: 'User not found' });
			}

			if (user.isVerified) {
				return fail(400, { error: 'Email already verified' });
			}

			if (user.verificationCode !== code) {
				return fail(400, { error: 'Invalid verification code' });
			}

			// Update user to verified
			await db
				.update(users)
				.set({ 
					isVerified: true,
					verificationCode: null 
				})
				.where(eq(users.id, userId));

			return { success: true, message: 'Email verified successfully!' };
		} catch (error) {
			console.error('Verification error:', error);
			return fail(500, { error: 'An error occurred during verification' });
		}
	}
};
