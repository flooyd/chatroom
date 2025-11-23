<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let verificationCode = $state('');
	let profilePictureUrl = $state(data.user?.profilePictureUrl || '');
</script>

<div class="profile-container">
	<div class="profile-header-section">
		<h1>Profile</h1>
		{#if data.user}
			<form method="POST" action="/?/logout" use:enhance>
				<button type="submit" class="logout-btn-header">Logout</button>
			</form>
		{/if}
	</div>
	
	{#if data.user}
		<div class="profile-header">
			{#if data.user.profilePictureUrl}
				<img src={data.user.profilePictureUrl} alt="{data.user.username}'s profile" class="profile-picture" />
			{:else}
				<div class="profile-picture-placeholder">
					{data.user.username.charAt(0).toUpperCase()}
				</div>
			{/if}
		</div>

		<div class="profile-info">
			<div class="info-row">
				<span class="label">Username:</span>
				<span class="value">{data.user.username}</span>
			</div>
			<div class="info-row">
				<span class="label">Email:</span>
				<span class="value">{data.user.email}</span>
			</div>
			<div class="info-row">
				<span class="label">Status:</span>
				<span class="value">
					{#if data.user.isVerified}
						<span class="verified">✓ Verified</span>
					{:else}
						<span class="unverified">✗ Not Verified</span>
					{/if}
				</span>
			</div>
		</div>

		{#if data.user.isVerified}
			<div class="profile-picture-section">
				<h2>Profile Picture</h2>
				<form method="POST" action="?/updateProfilePicture" use:enhance>
					<input 
						type="url" 
						name="profilePictureUrl" 
						bind:value={profilePictureUrl}
						placeholder="Enter image URL (e.g., https://example.com/image.jpg)" 
						required 
					/>
					<button type="submit" class="update-btn">Update Picture</button>
				</form>
				{#if form?.error && form.error !== 'Verification code is required' && form.error !== 'Invalid verification code' && form.error !== 'Email already verified'}
					<p class="error">{form.error}</p>
				{/if}
				{#if form?.success && form.message === 'Profile picture updated successfully!'}
					<p class="success">{form.message}</p>
				{/if}
			</div>
		{/if}

		{#if !data.user.isVerified}
			<div class="verification-section">
				<h2>Verify Your Email</h2>
				<p>Please check your email for the verification code and enter it below.</p>
				
				<form method="POST" action="?/verify" use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							verificationCode = '';
						}
						await update();
					};
				}}>
					<input 
						type="text" 
						name="code" 
						bind:value={verificationCode}
						placeholder="Enter 6-digit code" 
						maxlength="6"
						inputmode="numeric"
						required 
					/>
					<button type="submit" class="verify-btn">Verify Email</button>
				</form>

				{#if form?.error}
					<p class="error">{form.error}</p>
				{/if}
				{#if form?.success}
					<p class="success">{form.message}</p>
				{/if}
			</div>
		{/if}
	{:else}
		<p>Please log in to view your profile.</p>
	{/if}
</div>

<style>
	.profile-container {
		max-width: 700px;
		margin: 0 auto;
		padding: 20px;
	}

	.profile-header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
		gap: 20px;
		padding-top: 97px;
	}

	h1 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.logout-btn-header {
		background: linear-gradient(135deg, rgba(255, 62, 0, 0.8), rgba(200, 40, 0, 0.8));
		border: 2px solid rgba(255, 62, 0, 0.5);
		padding: 8px;
		font-size: 0.833rem;
		box-shadow: 0 4px 16px rgba(255, 62, 0, 0.2);
		white-space: nowrap;
	}

	.logout-btn-header:hover {
		background: linear-gradient(135deg, rgba(255, 62, 0, 1), rgba(200, 40, 0, 1));
		border-color: #ff3e00;
		box-shadow: 0 6px 24px rgba(255, 62, 0, 0.4);
	}

	.profile-header {
		display: flex;
		justify-content: center;
		margin-bottom: 32px;
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.profile-picture {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #00d4ff;
		box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
		transition: all 0.3s;
	}

	.profile-picture:hover {
		transform: scale(1.05);
		box-shadow: 0 12px 48px rgba(0, 212, 255, 0.5);
	}

	.profile-picture-placeholder {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4.5rem;
		font-weight: 700;
		color: white;
		border: 4px solid #00d4ff;
		box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
		transition: all 0.3s;
	}

	.profile-picture-placeholder:hover {
		transform: scale(1.05);
		box-shadow: 0 12px 48px rgba(0, 212, 255, 0.5);
	}

	.profile-info {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 255, 170, 0.05));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 8px;
		margin-bottom: 24px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: fadeIn 0.5s ease-out 0.1s backwards;
	}

	.info-row {
		display: flex;
		padding: 8px 0;
		border-bottom: 1px solid rgba(0, 212, 255, 0.15);
		align-items: center;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 700;
		min-width: 140px;
		color: #00d4ff;
		font-size: 1.05rem;
	}

	.value {
		flex: 1;
		word-break: break-all;
		overflow-wrap: break-word;
		font-size: 1.05rem;
	}

	.verified {
		color: #00ffaa;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.unverified {
		color: #ffc107;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.profile-picture-section {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 255, 170, 0.05));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 8px;
		margin-bottom: 24px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: fadeIn 0.5s ease-out 0.2s backwards;
	}

	.profile-picture-section h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 20px;
		color: #00d4ff;
	}

	.profile-picture-section form {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 10px;
	}

	.profile-picture-section input {
		flex: 1 1 auto;
		min-width: 200px;
		max-width: 100%;
		padding: 8px;
		border: 2px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 0.833rem;
		transition: all 0.3s;
	}

	.profile-picture-section input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #00d4ff;
		box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
	}

	.update-btn {
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		white-space: nowrap;
		padding: 8px;
		font-weight: 700;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.update-btn:hover {
		background: linear-gradient(135deg, #00ffaa, #00d4ff);
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
	}

	.verification-section {
		background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 153, 0, 0.05));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 193, 7, 0.4);
		border-radius: 20px;
		padding: 8px;
		margin-bottom: 24px;
		box-shadow: 0 8px 32px rgba(255, 193, 7, 0.1);
		animation: fadeIn 0.5s ease-out 0.2s backwards;
	}

	.verification-section h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 12px;
		color: #ffc107;
	}

	.verification-section p {
		margin-bottom: 20px;
		color: rgba(255, 255, 255, 0.8);
	}

	.verification-section form {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 10px;
	}

	.verification-section input {
		flex: 1;
		min-width: 200px;
		padding: 8px;
		border: 2px solid rgba(255, 193, 7, 0.4);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 1.2rem;
		text-align: center;
		letter-spacing: 0.5em;
		font-weight: 700;
		transition: all 0.3s;
	}

	.verification-section input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #ffc107;
		box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.1);
	}

	.verify-btn {
		background: linear-gradient(135deg, #ffc107, #ff9900);
		border: none;
		white-space: nowrap;
		padding: 8px;
		font-weight: 700;
		color: #000;
		box-shadow: 0 4px 16px rgba(255, 193, 7, 0.3);
	}

	.verify-btn:hover {
		background: linear-gradient(135deg, #ff9900, #ffc107);
		box-shadow: 0 6px 24px rgba(255, 193, 7, 0.4);
	}

	.error {
		color: #ff3e00;
		margin: 12px 0 0 0;
		font-weight: 600;
		padding: 8px;
		background: rgba(255, 62, 0, 0.1);
		border-radius: 8px;
		border-left: 4px solid #ff3e00;
	}

	.success {
		color: #00ffaa;
		margin: 12px 0 0 0;
		font-weight: 600;
		padding: 8px;
		background: rgba(0, 255, 170, 0.1);
		border-radius: 8px;
		border-left: 4px solid #00ffaa;
	}

	@media (max-width: 600px) {
		h1 {
			font-size: 2rem;
		}

		.logout-btn-header {
			padding: 8px;
			font-size: 0.833rem;
		}

		.profile-picture-section form,
		.verification-section form {
			flex-direction: column;
		}

		.profile-picture-section input,
		.verification-section input {
			max-width: 100%;
		}

		.update-btn,
		.verify-btn {
			width: 100%;
		}
	}
</style>
