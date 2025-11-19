import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('session');
	if (!sessionId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const userId = parseInt(sessionId);

	try {
		const { prompt } = await request.json();

		if (!prompt || typeof prompt !== 'string') {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Fetch all user's documents
		const userDocuments = await db
			.select()
			.from(documents)
			.where(eq(documents.userId, userId));

		if (userDocuments.length === 0) {
			return json({ error: 'No documents found' }, { status: 400 });
		}

		// Combine all document contents with clear separation
		const combinedContext = userDocuments
			.map((doc, index) => `
=== DOCUMENT ${index + 1}: ${doc.filename} ===
${doc.content}
=== END OF DOCUMENT ${index + 1} ===
`)
			.join('\n\n');

		// Create the RAG prompt
		const systemPrompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the following documents. If the answer cannot be found in the documents, say so clearly.

${combinedContext}`;

		const anthropic = new Anthropic({
			apiKey: ANTHROPIC_API_KEY
		});

		const message = await anthropic.messages.create({
			model: 'claude-sonnet-4-5',
			max_tokens: 2000,
			messages: [
				{
					role: 'user',
					content: `${systemPrompt}\n\nUser question: ${prompt}`
				}
			]
		});

		const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

		return json({ response: responseText });
	} catch (error) {
		console.error('RAG error:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};
