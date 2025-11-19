<script lang="ts">
	import { enhance } from '$app/forms';
	
	const title = "File Manager";
	let { data } = $props();
	
	let uploadError = $state('');
	let uploadSuccess = $state(false);
	let selectedFile = $state<File | null>(null);
	let expandedDocument = $state<number | null>(null);

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
		expandedDocument = expandedDocument === id ? null : id;
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
										class="expand-btn"
										onclick={() => toggleExpand(doc.id)}
										title={expandedDocument === doc.id ? "Collapse" : "Expand"}
									>
										{expandedDocument === doc.id ? '▲' : '▼'}
									</button>
									<form 
										method="POST" 
										action="?/delete"
										use:enhance
									>
										<input type="hidden" name="documentId" value={doc.id} />
										<button 
											type="submit" 
											class="delete-btn"
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
							
							{#if expandedDocument === doc.id}
								<div class="document-content">
									<pre>{doc.content}</pre>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<p class="auth-message">Please log in to manage your files.</p>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
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
		margin-bottom: 32px;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 20px;
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
		font-size: 1rem;
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
		font-size: 1rem;
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
		font-size: 1rem;
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

	.expand-btn,
	.delete-btn {
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.expand-btn:hover {
		background: rgba(0, 212, 255, 0.2);
		border-color: #00d4ff;
	}

	.delete-btn:hover {
		background: rgba(255, 62, 0, 0.2);
		border-color: #ff3e00;
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
		font-size: 0.9rem;
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
		font-size: 0.95rem;
	}

	.auth-message {
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.1rem;
		text-align: center;
		padding: 40px;
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
			font-size: 0.95rem;
		}
	}
</style>
