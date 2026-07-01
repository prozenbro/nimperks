<template>
  <div class="login-page anim-fade-up">
    <!-- Ambient glow blobs -->
    <div aria-hidden="true" class="blob blob-1" />
    <div aria-hidden="true" class="blob blob-2" />

    <!-- Logo mark -->
    <div class="logo-wrap">
      <svg width="64" height="58" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-hex">
        <!-- Nimiq Hexagon base -->
        <path d="M26.6991 10.875L21.0741 1.125C20.6691 0.4275 19.9266 0 19.1241 0H7.87414C7.07164 0 6.32914 0.4275 5.92789 1.125L0.302891 10.875C-0.0983594 11.5725 -0.0983594 12.4275 0.302891 13.125L5.92789 22.875C6.32914 23.5725 7.07164 24 7.87414 24H19.1241C19.9266 24 20.6691 23.5725 21.0704 22.875L26.6954 13.125C27.1004 12.4275 27.1004 11.5725 26.6991 10.875Z"
              fill="url(#loginGrad)" />
        <!-- Ticket / Voucher cutout representing 'Perks' -->
        <path d="M8.5 9C8.22 9 8 9.22 8 9.5v1.25c.69 0 1.25.56 1.25 1.25S8.69 13.25 8 13.25v1.25c0 .28.22.5.5.5h10c.28 0 .5-.22.5-.5v-1.25c-.69 0-1.25-.56-1.25-1.25S18.31 10.75 19 10.75V9.5c0-.28-.22-.5-.5-.5h-10z" fill="#0D0D0F" />
        <!-- Central gold star inside the ticket representing points/stamps -->
        <path d="M13.5 10.5l.4 1.05 1.1.05-.8.75.25 1.1-.95-.6-.95.6.25-1.1-.8-.75 1.1-.05.4-1.05z" fill="#E9B213" />
        <defs>
          <radialGradient id="loginGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 24) rotate(-180) scale(27 24)">
            <stop stop-color="#EC991C"/>
            <stop offset="1" stop-color="#E9B213"/>
          </radialGradient>
        </defs>
      </svg>
    </div>

    <!-- Headline -->
    <h1 class="headline nim-gradient-text">NimPerks</h1>
    <p class="subline">On-chain loyalty, zero friction.</p>

    <!-- Feature pills -->
    <div class="pills">
      <span class="pill">⚡ 60-sec setup</span>
      <span class="pill">🔐 On-chain stamps</span>
      <span class="pill">🪙 Near-zero cost</span>
    </div>

    <!-- Card -->
    <div class="login-card anim-scale-in">
      <p class="card-label">I am a…</p>

      <button
        id="btn-connect-customer"
        class="login-btn login-btn-primary"
        :disabled="loading === 'customer'"
        @click="connect(false)"
      >
        <span v-if="loading === 'customer'" class="spinner" />
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Customer
      </button>

      <button
        id="btn-connect-merchant"
        class="login-btn login-btn-outline"
        :disabled="loading === 'merchant'"
        @click="connect(true)"
      >
        <span v-if="loading === 'merchant'" class="spinner spinner-dark" />
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Merchant / Store Owner
      </button>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <p class="footer-note">
        Connecting uses your Nimiq address as identity.<br />No accounts. No passwords.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { wallet } from '@/protocol/walletAdapter';

const auth = useAuthStore();
const loading = ref(null);   // 'customer' | 'merchant' | null
const errorMsg = ref('');

async function connect(isMerchant) {
  loading.value = isMerchant ? 'merchant' : 'customer';
  errorMsg.value = '';
  try {
    // walletAdapter handles env detection (Hub API vs Mini-App SDK)
    const address = await wallet.getAddress();
    if (address) {
      auth.login(address, isMerchant);
    }
  } catch (e) {
    if (e?.message?.includes('cancelled') || e?.message?.includes('closed')) {
      errorMsg.value = 'Connection cancelled.';
    } else {
      errorMsg.value = 'Could not connect wallet. Please try again.';
    }
    console.error('Login failed', e);
  } finally {
    loading.value = null;
  }
}
</script>

<style scoped>
/* Ambient blobs */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.blob-1 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(233,178,19,0.18) 0%, transparent 70%);
  top: -80px; left: -80px;
}
.blob-2 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(236,153,28,0.12) 0%, transparent 70%);
  bottom: 40px; right: -60px;
}

/* All content sits above blobs */
.login-page > :not(.blob) { position: relative; z-index: 1; }
.login-page {
  gap: 0;
  text-align: center;
}

.logo-wrap {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.logo-hex {
  filter: drop-shadow(0 0 18px rgba(233,178,19,0.5));
  animation: pulseGold 3s ease-in-out infinite;
}

.headline {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 10px;
}
.subline {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 28px;
  letter-spacing: 0.01em;
}

.pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 36px;
}
.pill {
  background: rgba(255,255,255,0.06);
  border: 0.5px solid var(--border-medium);
  border-radius: 100px;
  padding: 5px 12px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-card);
  border: 0.5px solid var(--border-medium);
  border-radius: 22px;
  padding: 28px 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.card-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, opacity 0.15s ease;
  margin-bottom: 12px;
}
.login-btn:last-of-type { margin-bottom: 0; }
.login-btn:active { transform: scale(0.97); }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.login-btn-primary {
  background: linear-gradient(135deg, var(--nim-orange) 0%, var(--nim-gold) 100%);
  color: #000;
  box-shadow: 0 4px 20px rgba(233,178,19,0.35);
}
.login-btn-outline {
  background: rgba(255,255,255,0.06);
  border: 0.5px solid var(--border-medium) !important;
  color: var(--text-primary);
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.spinner-dark {
  border-color: rgba(255,255,255,0.2);
  border-top-color: var(--text-primary);
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-msg {
  font-size: 0.82rem;
  color: var(--danger);
  margin-top: 14px;
  text-align: center;
}

.footer-note {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  line-height: 1.5;
  margin-top: 20px;
}
</style>
