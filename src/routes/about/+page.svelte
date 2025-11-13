<div class="about-container">
	<div class="about-header">
		<h1>About The Chat Room</h1>
		<div class="header-accent"></div>
	</div>

	<div class="content-grid">
		<div class="feature-card">
			<div class="card-icon">💬</div>
			<h2>Real-time Messaging</h2>
			<p>Experience instant communication with Socket.IO.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">👥</div>
			<h2>Live User Status</h2>
			<p>See who's online in real-time with animated status indicators and last seen timestamps for offline users.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🎨</div>
			<h2>Modern Design</h2>
			<p>Built with cutting-edge UI featuring glassmorphism effects, smooth animations, and a sleek dark theme with cyan accents.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">🔐</div>
			<h2>Secure Authentication</h2>
			<p>User accounts with email verification, secure password hashing, and session-based authentication.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">📱</div>
			<h2>Responsive Layout</h2>
			<p>Fully responsive design that works seamlessly across desktop, tablet, and mobile devices.</p>
		</div>

		<div class="feature-card">
			<div class="card-icon">⚡</div>
			<h2>Built with Modern Tech</h2>
			<p>Powered by SvelteKit 5, PostgreSQL with Drizzle ORM, and deployed on Vercel with serverless functions.</p>
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
			<div class="tech-badge">Vercel</div>
		</div>
	</div>
</div>

<style>
	.about-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.about-header {
		text-align: center;
		margin-bottom: 60px;
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
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 24px;
		margin-bottom: 60px;
	}

	.feature-card {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 32px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.6s ease-out backwards;
	}

	.feature-card:nth-child(1) { animation-delay: 0.1s; }
	.feature-card:nth-child(2) { animation-delay: 0.2s; }
	.feature-card:nth-child(3) { animation-delay: 0.3s; }
	.feature-card:nth-child(4) { animation-delay: 0.4s; }
	.feature-card:nth-child(5) { animation-delay: 0.5s; }
	.feature-card:nth-child(6) { animation-delay: 0.6s; }

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
		font-size: 1rem;
	}

	.tech-section {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 40px;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.6s ease-out 0.7s backwards;
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
		padding: 12px 24px;
		font-weight: 600;
		color: #00ffaa;
		transition: all 0.3s;
		font-size: 0.95rem;
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

		.tech-section {
			padding: 28px 20px;
		}

		.tech-section h2 {
			font-size: 1.6rem;
		}
	}
</style>
