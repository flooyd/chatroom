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
	},

	updateProfilePicture: async ({ request, cookies }) => {
		const data = await request.formData();
		const profilePictureUrl = data.get('profilePictureUrl');

		if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
			return fail(400, { error: 'Profile picture URL is required' });
		}

		// Basic URL validation
		try {
			new URL(profilePictureUrl);
		} catch {
			return fail(400, { error: 'Invalid URL format' });
		}

		const sessionId = cookies.get('session');
		if (!sessionId) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const userId = parseInt(sessionId);
			
			await db
				.update(users)
				.set({ profilePictureUrl })
				.where(eq(users.id, userId));

			return { success: true, message: 'Profile picture updated successfully!' };
		} catch (error) {
			console.error('Profile picture update error:', error);
			return fail(500, { error: 'An error occurred while updating profile picture' });
		}
	}
};
