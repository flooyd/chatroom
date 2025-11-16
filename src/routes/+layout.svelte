<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { initializeSocket, disconnectSocket } from '$lib/stores/socket';
	import { initializeMessages, disconnectMessages } from '$lib/stores/messages';

	let { children, data } = $props();

	const title = "The Chat Room";
	let loggedIn = $state(!!data.user);
	let username = $state(data.user?.username || "");
	let showLoginModal = $state(false);
	let loginOrRegister = $state("Login");
	let errorMessage = $state("");

	// Sync state with data prop changes (e.g., after logout)
	$effect(() => {
		loggedIn = !!data.user;
		username = data.user?.username || "";
		
		// Initialize or disconnect socket and messages based on login status and verification
		if (loggedIn && username && data.user?.isVerified) {
			initializeSocket(username, data.user.isVerified);
			initializeMessages(username, data.user.isVerified);
		} else {
			disconnectSocket();
			disconnectMessages();
		}

		// Check if URL has #login hash and open modal
		if (typeof window !== 'undefined' && window.location.hash === '#login') {
			showLoginModal = true;
			// Remove the hash from URL
			window.history.replaceState(null, '', window.location.pathname);
		}
	});

	const openLoginModal = () => {
		// Redirect to home page to show login modal
		window.location.href = '/#login';
		showLoginModal = true;
		loginOrRegister = "Login";
		errorMessage = "";
	}

	const handleLoginSubmit = () => {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				loggedIn = true;
				showLoginModal = false;
				errorMessage = "";
				if (result.data?.username) {
					username = result.data.username;
				}
			} else if (result.type === 'failure') {
				errorMessage = result.data?.error || 'An error occurred';
			}
			await update();
		};
	}

</script>

<nav>
	<a class="title" href="/" onclick={() => showLoginModal = false}>
		<img src="/chatroomhouse.png" alt="Chatroom" class="nav-logo" />
		{title}
	</a>
	<div class="section-right">
		<a href="/about" onclick={() => showLoginModal = false}>About</a>
		{#if loggedIn}
			<a href="/profile" onclick={() => showLoginModal = false}>{username}</a>
		{:else}
			<button onclick={openLoginModal}>Login</button>
		{/if}
	</div>
</nav>

{@render children()}

{#if showLoginModal}
	<div class="modal">
		<div class="modal-title">
			{loginOrRegister}
			<button onclick={() => (showLoginModal = false)}>X</button>
		</div>
		<a href="/auth/google" class="google-btn">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
				<path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
				<path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49L4.405 11.9z" fill="#FBBC05"/>
				<path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
			</svg>
			Continue with Google
		</a>

		<div class="divider">
			<span>or</span>
		</div>

		<form method="POST" action="?/{loginOrRegister.toLowerCase()}" use:enhance={handleLoginSubmit}>
			<label for="username">Username:</label>
			<input type="text" id="username" name="username" required />
			{#if loginOrRegister === "Register"}
				<label for="email">Email:</label>
				<input type="email" id="email" name="email" required />
			{/if}
			<label for="password">Password:</label>
			<input type="password" id="password" name="password" required />
			{#if errorMessage}
				<p style="color: red;">{errorMessage}</p>
			{/if}
			<button type="submit">{loginOrRegister}</button>
		</form>
		<div class="modal-footer">
			{#if loginOrRegister === "Login"}
				<p>Don't have an account? <button type="button" onclick={() => { loginOrRegister = "Register"; errorMessage = ""; }}>Register here.</button></p>
			{:else}
				<p>Already have an account? <button type="button" onclick={() => { loginOrRegister = "Login"; errorMessage = ""; }}>Login here.</button></p>
			{/if}
		</div>
	</div>
{/if}

<style>
	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, rgba(10, 10, 15, 0.98), rgba(15, 15, 20, 0.95));
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(0, 212, 255, 0.2);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 40px;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	nav .title {
		font-size: 1.4rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ff88);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.5px;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.nav-logo {
		height: 64px;
		width: auto;
		filter: drop-shadow(0 2px 8px rgba(0, 212, 255, 0.4));
		transition: all 0.3s;
	}

	nav .title:hover {
		transform: scale(1.05);
		filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
	}

	nav .title:hover .nav-logo {
		filter: drop-shadow(0 4px 12px rgba(0, 212, 255, 0.6));
	}

	.section-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.section-right a {
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
		font-size: 0.95rem;
		padding: 8px 16px;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.section-right a:hover {
		color: #00d4ff;
		background: rgba(0, 212, 255, 0.1);
	}

	.section-right button {
		margin-left: 0;
	}

	/* Add padding to body to account for fixed nav */
	:global(body) {
		padding-top: 120px;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 36px;
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.98), rgba(8, 8, 12, 0.96));
		backdrop-filter: blur(30px);
		border: 1px solid rgba(0, 212, 255, 0.4);
		border-radius: 24px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 100px rgba(0, 212, 255, 0.1);
		min-width: 420px;
		animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 2000;
	}

	@keyframes modalIn {
		from {
			opacity: 0;
			transform: translate(-50%, -45%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.modal::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 24px;
		padding: 1px;
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 255, 136, 0.2));
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
		pointer-events: none;
	}

	.modal-title {
		font-size: 1.8rem;
		font-weight: 700;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(0, 212, 255, 0.2);
		margin-bottom: 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: white;
	}

	.modal-title button {
		background: rgba(255, 62, 0, 0.1);
		border: 1px solid rgba(255, 62, 0, 0.3);
		color: #ff3e00;
		padding: 4px 12px;
		font-size: 1.2rem;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.modal-title button:hover {
		background: rgba(255, 62, 0, 0.2);
		border-color: #ff3e00;
		transform: scale(1.1);
	}

	.modal form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal form label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		margin-bottom: -8px;
	}

	.modal form input {
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		color: white;
		font-size: 1rem;
		transition: all 0.3s;
	}

	.modal form input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #00d4ff;
		box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
	}

	.modal form button {
		align-self: flex-end;
		margin-top: 8px;
		padding: 12px 28px;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.modal form button:hover {
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
	}

	.modal-footer {
		margin-top: 20px;
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
	}

	.modal-footer button {
		background: none;
		border: none;
		color: #00d4ff;
		text-decoration: none;
		padding: 0;
		cursor: pointer;
		font-weight: 600;
		box-shadow: none;
	}

	.modal-footer button:hover {
		color: #00ffaa;
		transform: none;
		background: none;
	}

	.google-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		padding: 14px 20px;
		background: white;
		color: #1f1f1f;
		font-weight: 600;
		font-size: 0.95rem;
		border-radius: 12px;
		transition: all 0.3s;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		text-decoration: none;
	}

	.google-btn:hover {
		background: #f8f8f8;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
		transform: translateY(-2px);
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 20px 0;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.9rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
	}

	@media (max-width: 600px) {
		nav {
			padding: 12px 20px;
		}

		nav .title {
			font-size: 1.1rem;
		}

		.nav-logo {
			height: 40px;
		}

		.section-right a {
			font-size: 0.85rem;
			padding: 6px 12px;
		}

		.modal {
			min-width: auto;
			width: calc(100% - 40px);
			max-width: 400px;
			padding: 24px;
			top: auto;
			bottom: auto;
			transform: translate(-50%, 0);
			margin-top: 20px;
			margin-bottom: 20px;
			max-height: calc(100vh - 120px);
			overflow-y: auto;
		}

		@supports (-webkit-touch-callout: none) {
			/* iOS Safari specific */
			.modal {
				margin-top: 20px;
			}
		}
	}
</style>
