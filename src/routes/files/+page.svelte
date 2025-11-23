<script lang="ts">
	import { enhance } from '$app/forms';
	
	const title = "File Manager";
	let { data } = $props();
	
	let uploadError = $state('');
	let uploadSuccess = $state(false);
	let selectedFile = $state<File | null>(null);
	let expandedDocuments = $state<Set<number>>(new Set());
	let editingDocument = $state<number | null>(null);
	let editContent = $state<Record<number, string>>({});
	let ragPrompt = $state('');
	let ragResponse = $state('');
	let isRagLoading = $state(false);
	let ragError = $state('');

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			if (!file.name.endsWith('.txt')) {
				uploadError = 'Only .txt files are allowed';
				selectedFile = null;
				target.value = '';
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				uploadError = 'File size must be less than 10MB';
				selectedFile = null;
				target.value = '';
				return;
			}
			selectedFile = file;
			uploadError = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleString();
	}

	function toggleExpand(id: number) {
		if (expandedDocuments.has(id)) {
			expandedDocuments.delete(id);
		} else {
			expandedDocuments.add(id);
		}
		expandedDocuments = new Set(expandedDocuments);
	}

	function startEdit(doc: any) {
		// Open the document if not already open
		if (!expandedDocuments.has(doc.id)) {
			expandedDocuments.add(doc.id);
			expandedDocuments = new Set(expandedDocuments);
		}
		editingDocument = doc.id;
		editContent[doc.id] = doc.content;
	}

	function cancelEdit() {
		editingDocument = null;
	}

	function downloadDocument(doc: any) {
		const blob = new Blob([doc.content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = doc.filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleRagQuery() {
		if (!ragPrompt.trim() || data.documents.length === 0) return;

		isRagLoading = true;
		ragError = '';
		ragResponse = '';

		try {
			const response = await fetch('/api/rag', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: ragPrompt })
			});

			const result = await response.json();

			if (!response.ok) {
				ragError = result.error || 'Failed to get response';
				return;
			}

			ragResponse = result.response;
		} catch (error) {
			console.error('RAG error:', error);
			ragError = 'An error occurred while processing your request';
		} finally {
			isRagLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{title} - The Chat Room</title>
</svelte:head>

<div class="container">
	<h1>{title}</h1>
	
	{#if data.user}
		<!-- Upload Section -->
		<div class="upload-section">
			<h2>Upload Document</h2>
			<form 
				method="POST" 
				action="?/upload" 
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							uploadSuccess = true;
							uploadError = '';
							selectedFile = null;
							setTimeout(() => { uploadSuccess = false; }, 3000);
						} else if (result.type === 'failure' && result.data) {
							uploadError = (result.data as any).error || 'Upload failed';
							uploadSuccess = false;
						}
						await update();
					};
				}}
			>
				<div class="file-input-wrapper">
					<input 
						type="file" 
						name="file" 
						id="file" 
						accept=".txt"
						onchange={handleFileSelect}
						required
					/>
					<label for="file" class="file-label">
						{#if selectedFile}
							<span class="file-icon">📄</span>
							<div class="file-info">
								<span class="file-name">{selectedFile.name}</span>
								<span class="file-size">{formatFileSize(selectedFile.size)}</span>
							</div>
						{:else}
							<span class="upload-icon">📁</span>
							<span>Choose a .txt file</span>
						{/if}
					</label>
				</div>

				{#if uploadError}
					<p class="error-message">{uploadError}</p>
				{/if}

				{#if uploadSuccess}
					<p class="success-message">✓ File uploaded successfully!</p>
				{/if}

				<button type="submit" class="upload-btn" disabled={!selectedFile}>
					Upload File
				</button>
			</form>
		</div>

		<!-- Documents List -->
		<div class="documents-section">
			<h2>Your Documents ({data.documents.length})</h2>
			
			{#if data.documents.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📂</div>
					<p>No documents yet</p>
					<span>Upload your first .txt file to get started</span>
				</div>
			{:else}
				<div class="documents-list">
					{#each data.documents as doc}
						<div class="document-card">
							<div class="document-header">
								<div class="document-info">
									<span class="doc-icon">📄</span>
									<div class="doc-details">
										<span class="doc-name">{doc.filename}</span>
										<span class="doc-date">{formatDate(doc.uploadedAt)}</span>
									</div>
								</div>
								<div class="document-actions">
									<button 
										class="action-btn download-btn"
										onclick={() => downloadDocument(doc)}
										title="Download"
									>
										💾
									</button>
									{#if editingDocument !== doc.id}
										<button 
											class="action-btn edit-btn"
											onclick={() => startEdit(doc)}
											title="Edit"
										>
											✏️
										</button>
									{/if}
									<button 
										class="action-btn expand-btn"
										onclick={() => toggleExpand(doc.id)}
										title={expandedDocuments.has(doc.id) ? "Collapse" : "Expand"}
									>
										{expandedDocuments.has(doc.id) ? '▲' : '▼'}
									</button>
									<form 
										method="POST" 
										action="?/delete"
										use:enhance
									>
										<input type="hidden" name="documentId" value={doc.id} />
										<button 
											type="submit" 
											class="action-btn delete-btn"
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this document?')) {
													e.preventDefault();
												}
											}}
										>
											🗑️
										</button>
									</form>
								</div>
							</div>
							
							{#if expandedDocuments.has(doc.id)}
								<div class="document-content">
									{#if editingDocument === doc.id}
										<form 
											method="POST" 
											action="?/edit"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														editingDocument = null;
													}
													await update();
												};
											}}
										>
											<input type="hidden" name="documentId" value={doc.id} />
											<textarea 
												name="content"
												bind:value={editContent[doc.id]}
												class="edit-textarea"
											></textarea>
											<div class="edit-actions">
												<button type="submit" class="save-btn">💾 Save Changes</button>
												<button type="button" class="cancel-btn" onclick={cancelEdit}>❌ Cancel</button>
											</div>
										</form>
									{:else}
										<pre>{doc.content}</pre>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- RAG Section -->
		{#if data.documents.length > 0}
			<div class="rag-section">
				<h2>RAG - Ask Questions About Your Documents</h2>
				<p class="rag-description">
					Ask Claude AI questions and it will answer based on all {data.documents.length} of your uploaded documents.
				</p>
				
				<div class="rag-input-wrapper">
					<textarea
						bind:value={ragPrompt}
						placeholder="Ask a question about your documents..."
						class="rag-input"
						rows="3"
						disabled={isRagLoading}
					></textarea>
					<button 
						onclick={handleRagQuery}
						disabled={!ragPrompt.trim() || isRagLoading}
						class="rag-btn"
					>
						{isRagLoading ? '🤔 Thinking...' : '🤖 Ask Claude'}
					</button>
				</div>

				{#if ragError}
					<div class="rag-error">{ragError}</div>
				{/if}

				{#if ragResponse}
					<div class="rag-response">
						<div class="response-header">
							<span class="response-icon">🤖</span>
							<span class="response-label">Claude's Response:</span>
						</div>
						<div class="response-content">
							{ragResponse}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{:else}
		<p class="auth-message">Please log in to manage your files.</p>
	{/if}
</div>

<style>
	.container {
		margin: 0 auto;
		padding: 16px;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ff88);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 24px;
		padding-top: 97px;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 16px;
	}

	.upload-section {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 32px;
		margin-bottom: 40px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.file-input-wrapper {
		margin-bottom: 20px;
	}

	input[type="file"] {
		display: none;
	}

	.file-label {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 24px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(0, 212, 255, 0.3);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.file-label:hover {
		background: rgba(0, 212, 255, 0.1);
		border-color: #00d4ff;
	}

	.upload-icon {
		font-size: 2rem;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.file-name {
		font-size: 01rem;
		font-weight: 600;
		color: white;
	}

	.file-size {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.upload-btn {
		padding: 14px 32px;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		border-radius: 16px;
		color: white;
		font-weight: 600;
		font-size: 01rem;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.upload-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
	}

	.upload-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: rgba(0, 212, 255, 0.3);
		box-shadow: none;
	}

	.error-message {
		color: #ff3e00;
		background: rgba(255, 62, 0, 0.1);
		padding: 12px 16px;
		border-radius: 12px;
		border: 1px solid rgba(255, 62, 0, 0.3);
		margin-bottom: 16px;
	}

	.success-message {
		color: #00ff88;
		background: rgba(0, 255, 136, 0.1);
		padding: 12px 16px;
		border-radius: 12px;
		border: 1px solid rgba(0, 255, 136, 0.3);
		margin-bottom: 16px;
	}

	.documents-section {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 32px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.documents-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.document-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 16px;
		padding: 20px;
		transition: all 0.3s;
	}

	.document-card:hover {
		border-color: rgba(0, 212, 255, 0.4);
		background: rgba(255, 255, 255, 0.08);
	}

	.document-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.document-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.doc-icon {
		font-size: 1.5rem;
	}

	.doc-details {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.doc-name {
		font-size: 01rem;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-date {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.document-actions {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 01rem;
	}

	.download-btn:hover {
		background: rgba(0, 255, 136, 0.2);
		border-color: #00ff88;
	}

	.edit-btn:hover {
		background: rgba(255, 193, 7, 0.2);
		border-color: #ffc107;
	}

	.expand-btn:hover {
		background: rgba(0, 212, 255, 0.2);
		border-color: #00d4ff;
	}

	.delete-btn:hover {
		background: rgba(255, 62, 0, 0.2);
		border-color: #ff3e00;
	}

	.edit-textarea {
		width: 100%;
		min-height: 300px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(255, 193, 7, 0.3);
		border-radius: 12px;
		color: white;
		font-family: 'Courier New', monospace;
		font-size: 01rem;
		resize: vertical;
		margin-bottom: 12px;
	}

	.edit-textarea:focus {
		outline: none;
		border-color: #ffc107;
		box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.1);
	}

	.edit-actions {
		display: flex;
		gap: 12px;
	}

	.save-btn,
	.cancel-btn {
		padding: 10px 20px;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-btn {
		background: linear-gradient(135deg, #00ff88, #00d4ff);
		color: white;
	}

	.save-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
	}

	.cancel-btn {
		background: rgba(255, 62, 0, 0.2);
		color: #ff3e00;
		border: 1px solid rgba(255, 62, 0, 0.3);
	}

	.cancel-btn:hover {
		background: rgba(255, 62, 0, 0.3);
	}

	.document-content {
		margin-top: 16px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.document-content pre {
		color: rgba(255, 255, 255, 0.8);
		font-family: 'Courier New', monospace;
		font-size: 01rem;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		max-height: 400px;
		overflow-y: auto;
	}

	.document-content pre::-webkit-scrollbar {
		width: 8px;
	}

	.document-content pre::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.document-content pre::-webkit-scrollbar-thumb {
		background: rgba(0, 212, 255, 0.3);
		border-radius: 4px;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-state p {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 8px;
		color: rgba(255, 255, 255, 0.7);
	}

	.empty-state span {
		font-size: 01rem;
	}

	.auth-message {
		color: rgba(255, 255, 255, 0.7);
		font-size: 01rem;
		text-align: center;
		padding: 40px;
	}

	.rag-section {
		background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.1));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(168, 85, 247, 0.3);
		border-radius: 20px;
		padding: 32px;
		margin-top: 40px;
		box-shadow: 0 8px 32px rgba(168, 85, 247, 0.2);
	}

	.rag-description {
		color: rgba(255, 255, 255, 0.7);
		font-size: 01rem;
		margin-bottom: 24px;
	}

	.rag-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 24px;
	}

	.rag-input {
		width: 100%;
		padding: 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(168, 85, 247, 0.3);
		border-radius: 16px;
		color: white;
		font-size: 01rem;
		font-family: inherit;
		resize: vertical;
		transition: all 0.3s;
		min-height: 80px;
	}

	.rag-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.rag-input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #a855f7;
		box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
	}

	.rag-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.rag-btn {
		padding: 14px 32px;
		background: linear-gradient(135deg, #a855f7, #8b5cf6);
		border: none;
		border-radius: 16px;
		color: white;
		font-weight: 600;
		font-size: 01rem;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
		align-self: flex-start;
	}

	.rag-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
	}

	.rag-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}

	.rag-error {
		color: #ff3e00;
		background: rgba(255, 62, 0, 0.1);
		padding: 12px 16px;
		border-radius: 12px;
		border: 1px solid rgba(255, 62, 0, 0.3);
	}

	.rag-response {
		background: rgba(168, 85, 247, 0.1);
		border: 1px solid rgba(168, 85, 247, 0.3);
		border-radius: 16px;
		padding: 24px;
		margin-top: 24px;
	}

	.response-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(168, 85, 247, 0.2);
	}

	.response-icon {
		font-size: 1.5rem;
	}

	.response-label {
		font-weight: 600;
		color: #a855f7;
		font-size: 01rem;
	}

	.response-content {
		color: rgba(255, 255, 255, 0.9);
		font-size: 01rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	@media (max-width: 768px) {
		.container {
			padding: 24px 16px;
		}

		h1 {
			font-size: 2rem;
		}

		.upload-section,
		.documents-section {
			padding: 24px 16px;
		}

		.document-header {
			flex-wrap: wrap;
		}

		.doc-name {
			font-size: 01rem;
		}
	}
</style>
