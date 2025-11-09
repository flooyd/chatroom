import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, is } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Only load users list if current user is verified
	if (user && user.isVerified) {
		const allUsers = await db
			.select({ username: users.username })
			.from(users)
            .orderBy(users.username);
		
		return { users: allUsers };
	}
	
	return { users: [] };
};

export const actions: Actions = {
	register: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username');
		const email = data.get('email');
		const password = data.get('password');

		// Validate input
		if (!username || typeof username !== 'string' || username.length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters' });
		}

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return fail(400, { error: 'Invalid email address' });
		}

		if (!password || typeof password !== 'string' || password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		try {
			// Check if username already exists
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (existingUser.length > 0) {
				return fail(400, { error: 'Username already taken' });
			}

			// Hash password
			const passwordHash = await bcrypt.hash(password, 10);

			//generate a six digit verification code
			const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

			// Create user
			const [newUser] = await db
				.insert(users)
				.values({
					username: username.toLowerCase(),
					email,
					passwordHash,
					verificationCode: verificationCode,
                    isVerified: false
				})
				.returning();

			// Set session cookie
			cookies.set('session', newUser.id.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 1 week
			});

            // Send verification email
            try {
				const resend = new Resend(RESEND_API_KEY);
				const { data, error } = await resend.emails.send({
					from: 'noreply@thechatroom.chat',
					to: email,
					subject: 'Please verify your email',
					html: `<strong>Welcome to The Chat Room, ${newUser.username}!</strong><br/>Your verification code is: <strong>${verificationCode}</strong><br/>Please verify your email address by entering this code.`
				});

				if (error) {
					console.error('Email send error:', error);
				}
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
				// Don't fail registration if email fails
			}

			return { success: true, username: newUser.username, isVerified: newUser.isVerified };
		} catch (error) {
			console.error('Registration error:', error);
			return fail(500, { error: 'An error occurred during registration' });
		}
	},

	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');

		if (!username || typeof username !== 'string') {
			return fail(400, { error: 'Username is required' });
		}

		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Password is required' });
		}

		try {
			// Find user
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (!user) {
				return fail(400, { error: 'Invalid username or password' });
			}

			// Verify password
			const validPassword = await bcrypt.compare(password, user.passwordHash);

			if (!validPassword) {
				return fail(400, { error: 'Invalid username or password' });
			}

			// Set session cookie
			cookies.set('session', user.id.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 1 week
			});

			return { success: true, username: user.username };
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, { error: 'An error occurred during login' });
		}
	},

	logout: async ({ cookies }) => {
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/');
	}
};
