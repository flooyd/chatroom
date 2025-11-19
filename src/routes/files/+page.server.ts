import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	if (!user) {
		throw redirect(303, '/');
	}

	// Load user's documents
	const userDocuments = await db
		.select()
		.from(documents)
		.where(eq(documents.userId, user.id))
		.orderBy(documents.uploadedAt);
	
	return { documents: userDocuments };
};

export const actions: Actions = {
	upload: async ({ request, cookies }) => {
		const sessionId = cookies.get('session');
		if (!sessionId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const userId = parseInt(sessionId);

		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return fail(400, { error: 'No file provided' });
		}

		// Validate file type
		if (!file.name.endsWith('.txt')) {
			return fail(400, { error: 'Only .txt files are allowed' });
		}

		// Validate file size (limit to 10MB)
		if (file.size > 10 * 1024 * 1024) {
			return fail(400, { error: 'File size must be less than 10MB' });
		}

		try {
			// Read file content
			const content = await file.text();

			// Insert into database
			await db.insert(documents).values({
				userId: userId,
				filename: file.name,
				content: content,
			});

			return { success: true };
		} catch (error) {
			console.error('Upload error:', error);
			return fail(500, { error: 'Failed to upload file' });
		}
	},

	delete: async ({ request, cookies }) => {
		const sessionId = cookies.get('session');
		if (!sessionId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const userId = parseInt(sessionId);

		const formData = await request.formData();
		const documentId = Number(formData.get('documentId'));

		if (!documentId) {
			return fail(400, { error: 'No document ID provided' });
		}

		try {
			// Verify the document belongs to the user before deleting
			const [document] = await db
				.select()
				.from(documents)
				.where(eq(documents.id, documentId))
				.limit(1);

			if (!document) {
				return fail(404, { error: 'Document not found' });
			}

			if (document.userId !== userId) {
				return fail(403, { error: 'You can only delete your own documents' });
			}

			// Delete the document
			await db
				.delete(documents)
				.where(eq(documents.id, documentId));

			return { success: true };
		} catch (error) {
			console.error('Delete error:', error);
			return fail(500, { error: 'Failed to delete document' });
		}
	}
};
