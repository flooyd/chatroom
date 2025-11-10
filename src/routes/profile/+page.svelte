<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let verificationCode = $state('');
	let profilePictureUrl = $state(data.user?.profilePictureUrl || '');
</script>

<div class="profile-container">
	<h1>Profile</h1>
	
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

		<form method="POST" action="/?/logout" use:enhance>
			<button type="submit" class="logout-btn">Logout</button>
		</form>
	{:else}
		<p>Please log in to view your profile.</p>
	{/if}
</div>

<style>
	.profile-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
        margin-bottom: 20px;
    }

	.profile-header {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	.profile-picture {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #646cff;
	}

	.profile-picture-placeholder {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		background: linear-gradient(135deg, #646cff, #535bf2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		font-weight: bold;
		color: white;
		border: 3px solid #646cff;
	}

	.profile-info {
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid #646cff;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.info-row {
		display: flex;
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: bold;
		min-width: 120px;
		color: #646cff;
	}

	.value {
		flex: 1;
	}

	.logout-btn {
		background-color: #ff3e00;
		border-color: #ff3e00;
	}

	.logout-btn:hover {
		background-color: #cc3200;
		border-color: #cc3200;
	}

	.verified {
		color: #00ff00;
		font-weight: bold;
	}

	.unverified {
		color: #ff9900;
		font-weight: bold;
	}

	.profile-picture-section {
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid #646cff;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.profile-picture-section h2 {
		font-size: 1.5rem;
		margin-bottom: 15px;
	}

	.profile-picture-section form {
		display: flex;
        flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 10px;
	}

	.profile-picture-section input {
		flex: 1;
		padding: 10px;
		border: 2px solid #646cff;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		font-size: 1rem;
	}

	.update-btn {
		background-color: #646cff;
		border-color: #646cff;
		white-space: nowrap;
	}

	.update-btn:hover {
		background-color: #535bf2;
		border-color: #535bf2;
	}

	.verification-section {
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid #ff9900;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.verification-section h2 {
		font-size: 1.5rem;
		margin-bottom: 10px;
	}

	.verification-section p {
		margin-bottom: 15px;
	}

	.verification-section form {
		display: flex;
        flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 10px;
	}

	.verification-section input {
		flex: 1;
		padding: 10px;
		border: 2px solid #646cff;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		font-size: 1rem;
		text-align: center;
		letter-spacing: 0.3em;
	}

	.verify-btn {
		background-color: #646cff;
		border-color: #646cff;
		white-space: nowrap;
	}

	.verify-btn:hover {
		background-color: #535bf2;
		border-color: #535bf2;
	}

	.error {
		color: #ff3e00;
		margin: 10px 0 0 0;
	}

	.success {
		color: #00ff00;
		margin: 10px 0 0 0;
	}
</style>
