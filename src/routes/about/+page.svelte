<div class="about-container">
	<div class="about-header">
		<h1>About The Chat Room</h1>
		<div class="header-accent"></div>
	</div>

	<div class="content-grid">
		<div class="feature-card">
			<div class="card-icon">💬</div>
			<h2>Real-time Messaging</h2>
			<p>Experience instant communication with Socket.IO. Messages include unique IDs and Claude responses reference the message they're answering.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🤖</div>
			<h2>AI-Powered Chat</h2>
			<p>Chat with Claude (Sonnet 4.5) directly in the main room. The AI responds to user questions in real-time.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">👥</div>
			<h2>Live User Status</h2>
			<p>See who's online in real-time with animated status indicators, last seen timestamps, and a dedicated users page with profile cards.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">📄</div>
			<h2>File Manager</h2>
			<p>Upload, edit, download, and delete .txt documents (up to 10MB). Documents are stored securely in PostgreSQL.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🔍</div>
			<h2>RAG System</h2>
			<p>Ask Claude questions about your uploaded documents. The AI analyzes all your files and provides contextual answers.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🎨</div>
			<h2>Modern Design</h2>
			<p>Sleek UI with glassmorphism effects, smooth animations, mobile-optimized layout with hamburger menu, and color-coded usernames.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🔐</div>
			<h2>Secure Authentication</h2>
			<p>User accounts with email verification, Google OAuth, secure password hashing, and session-based authentication.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">📱</div>
			<h2>Responsive Layout</h2>
			<p>Fully responsive design that works seamlessly across desktop, tablet, and mobile devices with optimized touch interfaces.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">⚡</div>
			<h2>Built with Modern Tech</h2>
			<p>Powered by SvelteKit 5, Anthropic Claude API, PostgreSQL with Drizzle ORM, and deployed on Render.</p>
		</div>
	</div>

	<div class="tech-section">
		<h2>Technology Stack</h2>
		<div class="tech-grid">
			<div class="tech-badge">SvelteKit 5</div>
			<div class="tech-badge">Socket.IO</div>
			<div class="tech-badge">PostgreSQL</div>
			<div class="tech-badge">Drizzle ORM</div>
			<div class="tech-badge">TypeScript</div>
			<div class="tech-badge">Render</div>
		</div>
	</div>
</div>

<style>
	.about-container {
		margin-bottom: 24px;
		padding: 32px 20px;
		padding-top: 97px;
	}

	.about-header {
		text-align: center;
		margin-bottom: 24px;
		position: relative;
	}

	.about-header h1 {
		font-size: 3rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 16px;
		animation: fadeIn 0.6s ease-out;
	}

	.header-accent {
		width: 100px;
		height: 4px;
		background: linear-gradient(90deg, #00d4ff, #00ffaa);
		margin: 0 auto;
		border-radius: 2px;
		box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
		animation: slideIn 0.6s ease-out 0.2s backwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			width: 0;
		}
		to {
			opacity: 1;
			width: 100px;
		}
	}

	.content-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
		margin-bottom: 24px;
	}

	.feature-card {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		padding: 16px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.6s ease-out backwards;
		flex: 1 1 calc(33.333% - 16px);
		min-width: 280px;
	}

	.feature-card:nth-child(1) { animation-delay: 0.1s; }
	.feature-card:nth-child(2) { animation-delay: 0.15s; }
	.feature-card:nth-child(3) { animation-delay: 0.2s; }
	.feature-card:nth-child(4) { animation-delay: 0.25s; }
	.feature-card:nth-child(5) { animation-delay: 0.3s; }
	.feature-card:nth-child(6) { animation-delay: 0.35s; }
	.feature-card:nth-child(7) { animation-delay: 0.4s; }
	.feature-card:nth-child(8) { animation-delay: 0.45s; }
	.feature-card:nth-child(9) { animation-delay: 0.5s; }

	.feature-card:hover {
		transform: translateY(-8px);
		border-color: #00d4ff;
		box-shadow: 0 12px 48px rgba(0, 212, 255, 0.2);
	}

	.card-icon {
		font-size: 3rem;
		margin-bottom: 16px;
		filter: drop-shadow(0 4px 8px rgba(0, 212, 255, 0.3));
	}

	.feature-card h2 {
		font-size: 1.4rem;
		font-weight: 700;
		color: #00d4ff;
		margin-bottom: 12px;
	}

	.feature-card p {
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
		font-size: 01rem;
	}

	.tech-section {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		padding: 16px;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.6s ease-out 0.6s backwards;
	}

	.tech-section h2 {
		font-size: 2rem;
		font-weight: 700;
		color: #00d4ff;
		margin-bottom: 28px;
	}

	.tech-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		justify-content: center;
	}

	.tech-badge {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 170, 0.1));
		border: 1px solid rgba(0, 212, 255, 0.4);
		border-radius: 12px;
		padding: 8px;
		font-weight: 600;
		color: #00ffaa;
		transition: all 0.3s;
		font-size: 01rem;
	}

	.tech-badge:hover {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(0, 255, 170, 0.15));
		border-color: #00d4ff;
		transform: scale(1.05);
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	@media (max-width: 768px) {
		.about-header h1 {
			font-size: 2.2rem;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.tech-section h2 {
			font-size: 1.6rem;
		}
	}
</style>
