<script lang="ts">
	import { onlineUsers } from '$lib/stores/socket';
	import { messages, sendMessage } from '$lib/stores/messages';

	const title = 'The Chat Room';

	let { data } = $props();
	let messageText = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	let hoveredMessageId = $state<number | null>(null);
	let isAiResponding = $state(false);
	let showReactionPicker = $state<number | null>(null);

	const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

	// Create a map of username to profile picture for quick lookup
	const userProfilePics = $derived(
		data.users?.reduce(
			(acc, user) => {
				acc[user.username] = user.profilePictureUrl;
				return acc;
			},
			{} as Record<string, string | null>
		) || {}
	);

	function isUserOnline(username: string): boolean {
		return $onlineUsers.includes(username);
	}

	function formatLastOnline(lastOnlineTime: Date | null): string {
		if (!lastOnlineTime) return 'Never';

		const now = new Date();
		const last = new Date(lastOnlineTime);
		const diffMs = now.getTime() - last.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

		return last.toLocaleDateString();
	}

	function formatMessageTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	async function handleSendMessage() {
		if (!messageText.trim() || !data.user) return;

		const success = await sendMessage(data.user.username, messageText);
		if (success) {
			messageText = '';
			// Scroll to bottom after sending
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		}
	}

	async function handleAiResponse(messageId: number) {
		if (isAiResponding) return;

		isAiResponding = true;
		hoveredMessageId = null;

		try {
			const response = await fetch('/api/messages/ai-respond', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId })
			});

			const data = await response.json();

			if (!data.success) {
				console.error('AI response failed:', data.error);
			}

			// Scroll to bottom to show AI response
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		} catch (error) {
			console.error('Failed to get AI response:', error);
		} finally {
			isAiResponding = false;
		}
	}

	async function handleDeleteMessage(messageId: number) {
		if (!confirm('Are you sure you want to delete this message?')) return;

		hoveredMessageId = null;

		try {
			const response = await fetch('/api/messages/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId })
			});

			const result = await response.json();

			if (!result.success) {
				console.error('Delete failed:', result.error);
				alert('Failed to delete message');
			}
		} catch (error) {
			console.error('Failed to delete message:', error);
			alert('Failed to delete message');
		}
	}

	async function handleReaction(messageId: number, reactionType: string) {
		try {
			const response = await fetch('/api/messages/react', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId, reactionType })
			});

			const result = await response.json();

			if (!result.success) {
				console.error('Reaction failed:', result.error);
			}

			showReactionPicker = null;
		} catch (error) {
			console.error('Failed to react:', error);
		}
	}

	function toggleReactionPicker(messageId: number) {
		showReactionPicker = showReactionPicker === messageId ? null : messageId;
	}

	function userHasReacted(reaction: any, username: string): boolean {
		return reaction.users.includes(username);
	}

	// Auto-scroll when new messages arrive
	$effect(() => {
		if ($messages.length > 0 && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	function openLoginModal() {
		// Trigger custom event that layout will listen to
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('openLoginModal'));
		}
	}
</script>

{#if !data.user}
	<div class="landing-page">
		<div class="hero-content">
			<div class="hero-left">
				<div class="badge">
					<span class="badge-dot"></span>
					Real-Time • AI-Powered • Secure
				</div>
				<h1 class="hero-title">
					Welcome to<br />
					<span class="gradient-text">The Chat Room</span>
				</h1>
				<p class="hero-description">
					Experience seamless real-time conversations with built-in AI assistance, 
					emoji reactions, and file sharing.
				</p>
				
				<div class="hero-actions">
					<button onclick={openLoginModal} class="primary-btn">
						<span class="btn-text">Start Chatting</span>
						<span class="btn-arrow">→</span>
					</button>
					<a href="/about" class="secondary-btn">
						<span>Learn More</span>
					</a>
				</div>
			</div>

			<div class="hero-right">
				<div class="floating-logo">
					<img src="/chatroomhouse.png" alt="Chat Room" class="main-logo" />
					<div class="glow-effect"></div>
				</div>
				
				<div class="feature-pills">
					<div class="pill pill-1">💬 Real-Time</div>
					<div class="pill pill-2">🤖 AI Assistant</div>
					<div class="pill pill-3">😊 Reactions</div>
					<div class="pill pill-4">📁 File Sharing</div>
				</div>
			</div>
		</div>
	</div>
{:else if data.user && !data.user.isVerified}
	<div class="verification-notice">
		<div class="notice-icon">⚠️</div>
		<div class="notice-content">
			<p>Please verify your email address to access all features.</p>
			<a href="/profile">Verify Now →</a>
		</div>
	</div>
{:else if data.user && data.user.isVerified}
	<main class="chat-main">
		<div class="messages-container" bind:this={messagesContainer}>
					{#if $messages.length === 0}
						<div class="empty-state">
							<div class="empty-icon">💬</div>
							<p>No messages yet</p>
							<span>Start the conversation!</span>
						</div>
					{:else}
					{#each $messages as message (message.id)}
						<div
							class="message-wrapper"
							class:own={message.username === data.user.username}
							role="article"
							data-message-id={message.id}
							onmouseenter={() => (hoveredMessageId = message.id)}
							onmouseleave={() => (hoveredMessageId = null)}
						>
							<div class="message-row">
								<div class="avatar-col">
									{#if userProfilePics[message.username]}
										<img src={userProfilePics[message.username]} alt={message.username} class="msg-avatar" />
									{:else}
										<div class="msg-avatar-placeholder">{message.username.charAt(0).toUpperCase()}</div>
									{/if}
								</div>

								<div class="message-content">
									<div class="message-meta">
										<span class="username" class:claude={message.username === 'claude'}>{message.username}</span>
										<span class="message-id-note">ID - {message.id}</span>
										<span class="meta-spacer"></span>
										<span class="msg-time">{formatMessageTime(message.timestamp)}</span>
									</div>
									<div class="message-text">{message.text}</div>

								{#if message.reactions && message.reactions.length > 0}
									<div class="message-reactions compact">
										{#each message.reactions as reaction}
											<button
												class="reaction-badge"
												class:user-reacted={userHasReacted(reaction, data.user?.username || '')}
												onclick={() => handleReaction(message.id, reaction.type)}
												title={reaction.users.join(', ')}
											>
												<span class="reaction-emoji">{reaction.type}</span>
												<span class="reaction-count">{reaction.users.length}</span>
											</button>
										{/each}
									</div>
								{/if}
								</div>
							</div>

							{#if hoveredMessageId === message.id}
								<div class="message-actions">
									{#if message.username !== 'claude' && message.username === data.user?.username}
										<button
											class="ai-respond-btn"
											onclick={() => handleAiResponse(message.id)}
											disabled={isAiResponding}
											title={isAiResponding ? 'AI is responding...' : 'Ask AI to respond'}
										>
											🤖
										</button>
									{/if}
									{#if data.user?.username === 'admin' || message.username === data.user?.username}
										<button
											class="delete-btn"
											onclick={() => handleDeleteMessage(message.id)}
											title="Delete message"
										>
											🗑️
										</button>
									{/if}
									<button
										class="add-reaction-btn"
										onclick={() => (showReactionPicker = showReactionPicker === message.id ? null : message.id)}
										title="Add reaction"
									>
										➕
									</button>
								</div>
							{/if}

							{#if showReactionPicker === message.id}
								<div class="reaction-picker">
									{#each reactionEmojis as emoji}
										<button
											class="reaction-option"
											onclick={() => handleReaction(message.id, emoji)}
										>
											{emoji}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
					{/if}
		</div>

		<div class="input-area">
				<form
					class="message-input-form"
					onsubmit={(e) => {
						e.preventDefault();
						handleSendMessage();
					}}
				>
					<input
						type="text"
						bind:value={messageText}
						placeholder="Type your message..."
						maxlength="500"
						class="chat-input"
					/>
					<button type="submit" disabled={!messageText.trim()} class="send-btn">
						<span class="btn-icon">→</span>
					</button>
				</form>
		</div>
	</main>
{/if}

<style>
	/* Landing Page */
	.landing-page {
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		animation: fadeIn 0.8s ease-out;
	}

	.hero-content {
		max-width: 1400px;
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 80px;
		align-items: center;
	}

	/* Left Side */
	.hero-left {
		animation: slideInLeft 0.8s ease-out;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(0, 212, 255, 0.1);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 24px;
		animation: pulse 2s ease-in-out infinite;
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		background: #00ff88;
		border-radius: 50%;
		animation: blink 2s ease-in-out infinite;
	}

	.hero-title {
		font-size: 4.5rem;
		font-weight: 900;
		line-height: 1.1;
		color: white;
		margin-bottom: 24px;
	}

	.gradient-text {
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		display: inline-block;
	}

	.hero-description {
		font-size: 1.2rem;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 40px;
		max-width: 540px;
	}

	.hero-actions {
		display: flex;
		gap: 16px;
		margin-bottom: 60px;
	}

	.primary-btn,
	.secondary-btn {
		padding: 16px 32px;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 12px;
		border: none;
	}

	.primary-btn {
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		color: #0a0a0f;
		box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
	}

	.primary-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 48px rgba(0, 212, 255, 0.5);
	}

	.primary-btn:hover .btn-arrow {
		transform: translateX(4px);
	}

	.btn-arrow {
		font-size: 1.5rem;
		transition: transform 0.3s;
	}

	.secondary-btn {
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.secondary-btn:hover {
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.05);
	}

	.stats {
		display: flex;
		gap: 48px;
	}

	.stat {
		text-align: left;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
		margin-bottom: 8px;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	/* Right Side */
	.hero-right {
		position: relative;
		height: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: slideInRight 0.8s ease-out;
	}

	.floating-logo {
		position: relative;
		animation: float 6s ease-in-out infinite;
	}

	.main-logo {
		width: 350px;
		height: 350px;
		position: relative;
		z-index: 2;
		filter: drop-shadow(0 20px 80px rgba(0, 212, 255, 0.6));
	}

	.glow-effect {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
		animation: pulse-glow 3s ease-in-out infinite;
		z-index: 1;
	}

	.feature-pills {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
	}

	.pill {
		position: absolute;
		padding: 12px 24px;
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 170, 0.1));
		backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 24px;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.pill-1 {
		top: 10%;
		left: 5%;
		animation: float-pill 4s ease-in-out infinite;
	}

	.pill-2 {
		top: 25%;
		right: 0;
		animation: float-pill 5s ease-in-out infinite 1s;
	}

	.pill-3 {
		bottom: 30%;
		left: -5%;
		animation: float-pill 4.5s ease-in-out infinite 0.5s;
	}

	.pill-4 {
		bottom: 15%;
		right: 10%;
		animation: float-pill 5.5s ease-in-out infinite 1.5s;
	}

	/* Animations */
	@keyframes float {
		0%, 100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-30px) rotate(5deg);
		}
	}

	@keyframes float-pill {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-15px);
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@keyframes pulse-glow {
		0%, 100% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 0.8;
			transform: translate(-50%, -50%) scale(1.1);
		}
	}

	@keyframes blink {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.hero-content {
			gap: 60px;
		}

		.hero-title {
			font-size: 3.5rem;
		}

		.main-logo {
			width: 280px;
			height: 280px;
		}

		.hero-right {
			height: 500px;
		}
	}

	@media (max-width: 968px) {
		.hero-content {
			grid-template-columns: 1fr;
			gap: 60px;
			text-align: center;
		}

		.hero-left {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.hero-title {
			font-size: 3rem;
		}

		.hero-description {
			margin-left: auto;
			margin-right: auto;
		}

		.hero-actions {
			justify-content: center;
		}

		.stats {
			justify-content: center;
		}

		.hero-right {
			height: 400px;
		}

		.main-logo {
			width: 240px;
			height: 240px;
		}

		.pill {
			font-size: 0.85rem;
			padding: 10px 20px;
		}
	}

	@media (max-width: 600px) {
		.landing-page {
			padding: 40px 16px;
		}

		.hero-title {
			font-size: 2.2rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.hero-actions {
			flex-direction: column;
			width: 100%;
		}

		.primary-btn,
		.secondary-btn {
			width: 100%;
			justify-content: center;
		}

		.stats {
			gap: 32px;
		}

		.stat-value {
			font-size: 2rem;
		}

		.hero-right {
			height: 350px;
		}

		.main-logo {
			width: 200px;
			height: 200px;
		}

		.pill {
			font-size: 0.75rem;
			padding: 8px 16px;
		}
	}

	/* Verification Notice */
	.verification-notice {
		background: linear-gradient(135deg, rgba(255, 153, 0, 0.15), rgba(255, 193, 7, 0.1));
		backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 153, 0, 0.4);
		border-radius: 16px;
		padding: 20px;
		margin: 20px 0;
		display: flex;
		gap: 15px;
		align-items: center;
		box-shadow: 0 8px 32px rgba(255, 153, 0, 0.1);
		animation: slideIn 0.3s ease-out;
	}

	.notice-icon {
		font-size: 2rem;
		filter: drop-shadow(0 2px 4px rgba(255, 153, 0, 0.3));
	}

	.notice-content p {
		margin: 0 0 8px 0;
		color: #ffc107;
		font-weight: 500;
	}

	.notice-content a {
		color: #00d4ff;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
	}

	.notice-content a:hover {
		color: #00ffaa;
		transform: translateX(3px);
		display: inline-block;
	}

	/* Chat Main */
	.chat-main {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 140px);
		background: rgba(12, 12, 18, 0.95);
		border-radius: 8px;
		overflow: hidden;
		animation: fadeIn 0.4s ease-out 0.1s backwards;
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-top: 16px;
		padding-bottom: 20px;
	}

	.messages-container::-webkit-scrollbar {
		width: 8px;
	}

	.messages-container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.03);
	}

	.messages-container::-webkit-scrollbar-thumb {
		background: rgba(0, 212, 255, 0.3);
		border-radius: 12px;
	}

	.messages-container::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 212, 255, 0.5);
	}

	.empty-state {
		margin: auto;
		text-align: center;
		color: rgba(255, 255, 255, 0.3);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 12px;
		opacity: 0.5;
		filter: grayscale(1);
	}

	.empty-state p {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0 0 4px 0;
	}

	.empty-state span {
		font-size: 0.833rem;
	}

	/* Message Styling */
	.message-wrapper {
		width: 100%;
		padding: 4px 0px;
		animation: messageSlide 0.3s ease-out;
		position: relative;
		border-radius: 4px;
		transition: background 0.15s;
	}

	.message-wrapper:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.message-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	@keyframes messageSlide {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.avatar-col {
		flex-shrink: 0;
	}

	.msg-avatar,
	.msg-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.833rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: 1.5px solid rgba(0, 212, 255, 0.3);
		object-fit: cover;
	}

	.message-content {
		flex: 1;
		min-width: 0;
	}

	.message-meta {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 4px;
	}

	.username {
		font-weight: 600;
		font-size: 0.833rem;
		color: #00d4ff;
	}

	.message-wrapper.own .username {
		color: #00ff88;
	}

	.username.claude {
		color: #a855f7;
	}

	.meta-spacer {
		flex: 1;
	}

	.message-id-note {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
		font-weight: 400;
	}

	.msg-time {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.35);
	}

	.message-text {
		font-size: 0.833rem;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.95);
		padding: 0;
	}

	.message-reactions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.message-reactions.compact {
		margin-top: 6px;
		gap: 4px;
	}

	.reaction-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
		animation: fadeIn 0.2s ease-out;
	}

	.reaction-badge:hover {
		background: rgba(0, 0, 0, 0.5);
		border-color: rgba(0, 212, 255, 0.5);
		transform: scale(1.05);
	}

	.reaction-badge.user-reacted {
		background: rgba(0, 212, 255, 0.2);
		border-color: rgba(0, 212, 255, 0.6);
	}

	.reaction-emoji {
		font-size: 0.833rem;
		line-height: 1;
	}

	.reaction-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		min-width: 12px;
		text-align: center;
	}

	.message-actions {
		display: flex;
		gap: 6px;
		align-items: center;
		position: absolute;
		top: 8px;
		right: 8px;
		background: rgba(12, 12, 18, 0.8);
		backdrop-filter: blur(10px);
		border-radius: 8px;
		padding: 4px 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.add-reaction-btn,
	.ai-respond-btn,
	.delete-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid;
		border-radius: 6px;
		color: white;
		font-size: 0.833rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: none;
		animation: fadeInButton 0.2s ease-out;
	}

	.add-reaction-btn {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		border-color: rgba(251, 191, 36, 0.5);
	}

	.add-reaction-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(251, 191, 36, 0.6);
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.add-reaction-btn:active {
		transform: scale(0.95);
	}

	.ai-respond-btn {
		background: linear-gradient(135deg, #8b5cf6, #7c3aed);
		border-color: rgba(139, 92, 246, 0.5);
	}

	.ai-respond-btn:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(139, 92, 246, 0.6);
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
	}

	.ai-respond-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.ai-respond-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		animation: pulse-ai 1.5s infinite;
	}

	.delete-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.delete-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
		background: linear-gradient(135deg, #dc2626, #b91c1c);
	}

	.delete-btn:active {
		transform: scale(0.95);
	}

	@keyframes fadeInButton {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes pulse-ai {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.reaction-picker {
		position: absolute;
		top: 50px;
		right: 8px;
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.95), rgba(8, 8, 12, 0.95));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(251, 191, 36, 0.4);
		border-radius: 12px;
		padding: 8px;
		display: flex;
		gap: 6px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		z-index: 100;
		animation: fadeInButton 0.2s ease-out;
	}

	.reaction-option {
		width: 36px;
		height: 36px;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		font-size: 1.3rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.reaction-option:hover {
		background: rgba(251, 191, 36, 0.2);
		border-color: rgba(251, 191, 36, 0.5);
		transform: scale(1.15);
	}

	.reaction-option:active {
		transform: scale(0.9);
	}

	/* Input Area */
	.input-area {
		padding: 8px;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
		border-top: 1px solid rgba(0, 212, 255, 0.15);
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: black;
	}

	.message-input-form {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-content: space-between;
	}

	.chat-input {
		flex: 1;
		padding: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		color: white;
		font-size: 0.833rem;
		transition: all 0.3s;
		outline: none;
	}

	.chat-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.chat-input:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: #00d4ff;
		box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
	}

	.send-btn {
		padding: 8px;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		border-radius: 12px;
		color: white;
		font-weight: 600;
		font-size: 0.833rem;
		min-width: 48px;
		display: flex;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		gap: 8px;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
		background: linear-gradient(135deg, #00ffaa, #00d4ff);
	}

	.send-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: rgba(0, 212, 255, 0.3);
		box-shadow: none;
	}

	.btn-icon {
		font-size: 1.2rem;
		transition: transform 0.3s;
	}

	.send-btn:hover:not(:disabled) .btn-icon {
		transform: translateX(4px);
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Responsive */
	@media (max-width: 968px) {
		.chat-main {
			height: calc(100vh - 100px);
			height: calc(100dvh - 100px);
		}
	}

	@media (max-width: 600px) {
		.messages-container {
			padding-bottom: 40px;
		}
		.chat-main {
			height: calc(100vh - 80px);
			height: calc(100dvh - 80px);
			border-radius: 6px;
		}

		.message-input-form {
			gap: 8px;
			flex-direction: row;
		}

		.chat-input {
			flex: 1;
			font-size: 16px;
		}

		.send-btn {
			width: 44px;
			height: 44px;
			font-size: 0.833rem;
		}

		.msg-avatar,
		.msg-avatar-placeholder {
			width: 40px;
			height: 40px;
			font-size: 0.833rem;
		}

		.username {
			font-size: 0.85rem;
		}

		.message-id-note,
		.msg-time {
			font-size: 0.65rem;
		}

		.message-text {
			font-size: 0.833rem;
		}
	}
</style>
