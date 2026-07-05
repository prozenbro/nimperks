<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Profile" />

    <div class="content-wrap px-4 pt-6 pb-12 space-y-8">
      <!-- Identity card -->
      <div class="id-card">
        <div class="identicon-wrap">
          <Identicon :address="auth.address" />
        </div>
        <h3 class="id-name">
          {{ currentProfile?.name || (auth.isMerchantMode ? 'Unnamed Merchant' : 'Unnamed Customer') }}
        </h3>
        <div v-if="currentProfile?.signature" class="verified-badge-sub" title="Verified Owner">
          ✓ {{ getShortAddress(auth.address) }}
        </div>
        <p class="id-mode-badge" :class="auth.isMerchantMode ? 'badge-purple' : 'badge-gold'">
          {{ auth.isMerchantMode ? 'Merchant Mode' : 'Customer Mode' }}
        </p>
        <p class="id-address">{{ auth.address }}</p>
      </div>

      <!-- Loyalty target setup (Merchant Mode Only) -->
      <div v-if="auth.isMerchantMode" class="section-card">
        <h4 class="section-title">Default Perk Stamps Target</h4>
        <p class="section-desc">Set the default number of stamps (0 to 10) customers need to collect to unlock rewards at your store.</p>
        <div class="custom-input-group mt-4">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.90rem; font-weight: 700; color: var(--text-primary);">Default Stamp Target</span>
            <span style="font-size: 1.1rem; font-weight: 800; color: var(--nim-gold);">{{ minStamps }} stamps</span>
          </div>
          <input 
            v-model.number="minStamps" 
            type="range" 
            min="0" 
            max="10" 
            step="1"
            style="width: 100%; accent-color: var(--nim-gold); cursor: pointer;"
          />
          <k-button class="nim-btn-primary w-full mt-4 submit-btn" @click="claimUsername" :disabled="claiming">
            <span v-if="claiming" class="mini-spinner-inline" />
            <span v-else>Update Target & Sign · Free</span>
          </k-button>
        </div>
      </div>

      <!-- Claim username (Shown here ONLY if NOT claimed once yet) -->
      <div v-if="!hasClaimedOnce" class="section-card">
        <h4 class="section-title">On-Chain Username</h4>
        <p class="section-desc">Claim a unique identity. Customers & merchants can recognise you instantly.</p>

        <div v-if="loadingProfile" class="py-4 text-center">
          <div class="mini-spinner" />
        </div>

        <!-- Locked -->
        <div v-else-if="currentProfile && !canChange" class="locked-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Username locked until {{ nextChangeDate }}
        </div>

        <!-- Available -->
        <div v-else class="claim-area custom-input-group">
          <label class="custom-label text-left">Desired Username</label>
          <div class="username-input-wrap">
            <input
              v-model="customUsername"
              type="text"
              placeholder="e.g. Satoshi123"
              class="custom-input flex-1"
              style="text-align: center; font-weight: 700; letter-spacing: 0.02em;"
            />
            <button class="suggest-btn" @click="regenerateSuggestion">🎲</button>
          </div>
          <p v-if="claimAttemptsLeft < 6" class="attempts-warn">
            {{ claimAttemptsLeft }} attempts remaining
          </p>
          <div class="claim-section">
            <k-button @click="claimUsername" class="nim-btn-primary w-full submit-btn mt-6" style="padding: 24px; font-size: 1.1rem; letter-spacing: 0.02em;" :disabled="txState.isPending">
              <span v-if="txState.isPending" class="spinner" />
              <span v-else>{{ auth.isMerchantMode ? 'Claim Store Branding · 1 Luna' : 'Claim Username · 1 Luna' }}</span>
            </k-button>
            <p class="cost-note mt-2" style="font-size: 0.75rem; color: var(--text-secondary); text-align: center;">Broadcasts a 1 Luna (~0.00001 NIM) transaction on-chain.</p>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-card">
        <h4 class="section-title">Appearance</h4>
        <div class="theme-row">
          <span class="theme-label">Theme</span>
          <k-segmented strong rounded class="theme-seg">
            <k-segmented-button :active="ui.theme === 'system'" @click="ui.setTheme('system')" small>Auto</k-segmented-button>
            <k-segmented-button :active="ui.theme === 'light'"  @click="ui.setTheme('light')"  small>Light</k-segmented-button>
            <k-segmented-button :active="ui.theme === 'dark'"   @click="ui.setTheme('dark')"   small>Dark</k-segmented-button>
          </k-segmented>
        </div>
      </div>

      <!-- Network -->
      <div class="section-card">
        <h4 class="section-title">Network</h4>
        <div class="net-row">
          <span class="net-label">Status</span>
          <span class="net-status">
            <span class="net-dot" />
            {{ IS_TESTNET ? 'Testnet' : 'Mainnet' }} · Connected
          </span>
        </div>
      </div>

      <!-- Change username (Tucked down here ONLY if claimed once already) -->
      <div v-if="hasClaimedOnce" class="section-card">
        <h4 class="section-title">On-Chain Username</h4>
        <p class="section-desc">Claim a unique identity. Customers & merchants can recognise you instantly.</p>

        <div v-if="loadingProfile" class="py-4 text-center">
          <div class="mini-spinner" />
        </div>

        <!-- Locked -->
        <div v-else-if="currentProfile && !canChange" class="locked-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Username locked until {{ nextChangeDate }}
        </div>

        <!-- Available -->
        <div v-else class="claim-area custom-input-group">
          <label class="custom-label text-left">Desired Username</label>
          <div class="username-input-wrap">
            <input
              v-model="customUsername"
              type="text"
              placeholder="e.g. Satoshi123"
              class="custom-input flex-1"
              style="text-align: center; font-weight: 700; letter-spacing: 0.02em;"
            />
            <button class="suggest-btn" @click="regenerateSuggestion">🎲</button>
          </div>
          <p v-if="claimAttemptsLeft < 6" class="attempts-warn">
            {{ claimAttemptsLeft }} attempts remaining
          </p>
          <k-button class="nim-btn-primary w-full submit-btn" style="margin-top: 20px;" @click="claimUsername" :disabled="claiming">
            <span v-if="claiming" class="mini-spinner-inline" />
            <span v-else>Update Profile Settings · Free</span>
          </k-button>
        </div>
      </div>

      <!-- Logout and Clear Cache section (iOS Native style) -->
      <div style="text-align: center; margin-top: 36px; padding: 0 20px;">
        <k-button @click="clearCacheAndResync" style="max-width: 220px; background: #555555; border: none; border-radius: 12px; color: #FFFFFF; font-size: 0.9rem; font-weight: 700; padding: 14px; cursor: pointer; transition: opacity 0.15s; margin: 0 auto 20px; width: 100%;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Clear Cache & Resync
        </k-button>

        <k-button @click="doLogout" style="max-width: 220px; background: #FF3B30; border: none; border-radius: 12px; color: #FFFFFF; font-size: 0.9rem; font-weight: 700; padding: 14px; cursor: pointer; transition: opacity 0.15s; margin: 0 auto; width: 100%; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Sign Out of Wallet
        </k-button>
      </div>
    </div>
    
    <!-- Transaction Pending Overlay -->
    <Transition name="ftue-fade">
      <div v-if="txState.isPending || txState.error" class="payment-overlay">
        <div class="payment-card card-premium anim-scale-in">
          <div v-if="txState.error">
            <div class="payment-icon" style="font-size: 3rem;">❌</div>
            <h3 class="payment-title" style="color: var(--danger);">Transaction Failed</h3>
            <p class="payment-desc mt-2">{{ txState.error }}</p>
            <k-button class="nim-btn-secondary mt-4 w-full" @click="txState.error = null; txState.isPending = false;">Dismiss</k-button>
          </div>
          <div v-else-if="txState.countdown === 0" class="success-content">
            <!-- Confetti Container -->
            <div class="confetti-container">
              <div v-for="i in 12" :key="i" class="confetti-piece"></div>
            </div>
            
            <div class="payment-icon success-anim">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--nim-gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 class="payment-title" style="color: var(--nim-gold); font-size: 1.5rem; margin-top: 16px;">
              {{ auth.isMerchantMode ? 'Store Updated!' : 'Profile Claimed!' }}
            </h3>
            <p class="payment-desc mt-2" style="font-size: 0.95rem; line-height: 1.4;">
              {{ auth.isMerchantMode ? 'Your branding and default target are now live on the blockchain.' : 'Your unique username is now live on the blockchain.' }}
            </p>
            <k-button class="nim-btn-primary mt-6 w-full" @click="txState.isPending = false" style="background: var(--nim-gold); color: white;">Done</k-button>
          </div>
          <div v-else>
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
              <svg width="44" height="44" viewBox="0 0 24 24" class="nimiq-hex-loader nimiq-hex-loader--spinning" style="color: var(--nim-gold);">
                <path class="loading-big-hex" d="M22 12l-5 8.66H7L2 12l5-8.66h10L22 12z" stroke="currentColor" stroke-width="2" fill="none" />
                <path class="loading-small-hex" d="M17 12l-2.5 4.33h-5L7 12l2.5-4.33h5L17 12z" fill="currentColor" />
              </svg>
            </div>
            <h3 class="payment-title">Pending Network Confirmation</h3>
            <p class="payment-desc mt-2">Waiting for the transaction to be mined.</p>
            <div class="countdown-timer mt-4">
              <span class="countdown-num">{{ txState.countdown }}</span>
              <span class="countdown-unit">seconds remaining</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Navbar as kNavbar,
  Link as kLink,
  Button as kButton,
  Segmented as kSegmented,
  SegmentedButton as kSegmentedButton,
} from 'konsta/vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import Identicon from '@/components/Identicon.vue';
import { db } from '@/db/schema';
import { wallet } from '@/protocol/walletAdapter';
import { indexerService } from '@/indexer/IndexerService';
import { packProfile } from '@/protocol/parser';
import { generateSuggestedUsername } from '@/utils/usernameGenerator';
import { reactive } from 'vue';

const auth = useAuthStore();
const ui = useUIStore();
const IS_TESTNET = import.meta.env.VITE_NIMIQ_NETWORK === 'testnet';

const PROFILE_ADDRESS = import.meta.env.VITE_NIMIQ_PROFILE_ADDRESS || '';

function getShortAddress(address) {
  if (!address) return '';
  const clean = address.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.substring(0, 4)}...${clean.substring(clean.length - 4)}`;
}

const currentProfile = ref(null);
const loadingProfile = ref(true);
const claiming = ref(false);
const seed = ref(Date.now());
const attempts = ref(0);
const claimAttemptsLeft = ref(6);
const customUsername = ref('');
const minStamps = ref(10);

const canChange = computed(() => {
  if (!currentProfile.value?.timestamp) return true;
  return Date.now() - currentProfile.value.timestamp > 30 * 24 * 60 * 60 * 1000;
});
const hasClaimedOnce = computed(() => {
  return !!(currentProfile.value && currentProfile.value.name);
});
const nextChangeDate = computed(() => {
  if (!currentProfile.value?.timestamp) return '';
  return new Date(currentProfile.value.timestamp + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
});

async function loadProfile() {
  if (auth.address) {
    const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
    currentProfile.value = await db.merchants.get(normAddress);
    if (currentProfile.value) {
      minStamps.value = currentProfile.value.minStamps !== undefined ? currentProfile.value.minStamps : 10;
    }
  }
  loadingProfile.value = false;
  if (currentProfile.value && currentProfile.value.name) {
    customUsername.value = currentProfile.value.name;
  } else {
    customUsername.value = generateSuggestedUsername(seed.value, attempts.value);
  }
}

function regenerateSuggestion() {
  attempts.value++;
  customUsername.value = generateSuggestedUsername(seed.value, attempts.value);
}

const txState = reactive({ isPending: false, error: null, countdown: 0, timerInterval: null });

async function claimUsername() {
  const name = customUsername.value.trim();
  if (name.length < 3) return alert('Username must be at least 3 characters.');
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) return alert('Username: letters, numbers, _ . - only.');
  if (claimAttemptsLeft.value <= 0) return alert('No attempts remaining.');

  const owner = await db.merchants.where('name').equals(name).first();
  const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
  if (owner && owner.address !== normAddress) {
    claimAttemptsLeft.value--;
    return alert('Username already taken. Try another.');
  }

  txState.isPending = true;
  txState.error = null;
  txState.countdown = 60;
  
  try {
    const branchName = currentProfile.value ? (currentProfile.value.branch || 'Main') : 'Main';
    const payloadBytes = packProfile(name, branchName, auth.isMerchantMode ? minStamps.value : undefined);
    
    // Broadcast on-chain using 1 Luna
    await wallet.sendTransaction({
      recipient: PROFILE_ADDRESS || auth.address,
      value: 1, // 1 Luna
      extraData: payloadBytes
    });
    
    const timestamp = Date.now();
    
    // Start confirmation countdown
    txState.timerInterval = setInterval(async () => {
      txState.countdown--;
      
      if (txState.countdown % 10 === 0 && txState.countdown > 0) {
        await indexerService.syncAllMerchants();
        const found = await db.merchants.get(auth.address.replace(/\s+/g, '').toUpperCase());
        if (found && found.timestamp >= timestamp - 60000) { // allow a bit of clock skew
          txState.countdown = 0;
        }
      }

      if (txState.countdown <= 0) {
        clearInterval(txState.timerInterval);
        txState.timerInterval = null;
        
        if (txState.countdown === 0) {
          // alert removed, we rely on the beautiful overlay
          await loadProfile();
        } else {
          txState.error = "Confirmation took too long. It may still be processed shortly.";
        }
      }
    }, 1000);

  } catch (e) {
    console.error(e);
    txState.error = e.message || 'Transaction failed.';
    if (txState.timerInterval) clearInterval(txState.timerInterval);
  }
}

async function clearCacheAndResync() {
  if (confirm('This will clear your local app cache and resync data from the blockchain. Continue?')) {
    try {
      await db.sync_state.clear();
      await db.transactions.clear();
      await db.stamps.clear();
      await db.campaigns.clear();
      auth.logout();
      window.location.reload();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }
}

function doLogout() {
  auth.logout();
}

onMounted(loadProfile);
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }
.content-wrap { max-width: 600px; margin: 0 auto; }

/* Identity card */
.id-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 28px 20px 22px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}
.identicon-wrap {
  width: 80px; height: 80px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 0 8px rgba(233, 178, 19, 0.5));
}
.id-name { font-size: 1.15rem; font-weight: 800; margin-bottom: 6px; }
.id-mode-badge {
  display: inline-block;
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; padding: 3px 12px; border-radius: 100px;
  margin-bottom: 12px;
}
.id-address {
  font-size: 0.7rem; font-family: monospace;
  color: var(--text-secondary); word-break: break-all;
  line-height: 1.4;
}

/* Section card */
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}
.section-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; }
.section-desc  { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px; }

/* Locked */
.locked-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,214,10,0.1); border: 0.5px solid rgba(255,214,10,0.25);
  border-radius: 12px; padding: 12px 14px;
  font-size: 0.82rem; font-weight: 500; color: var(--warning);
}

/* Claim area */
.username-input-wrap { display: flex; gap: 8px; align-items: center; }
.suggest-btn {
  width: 52px; height: 52px;
  background: var(--bg-secondary); border: 1px solid var(--border-medium);
  border-radius: 12px; font-size: 1.2rem; cursor: pointer;
  transition: transform 0.15s;
}
.suggest-btn:active { transform: rotate(180deg) scale(0.9); }
.attempts-warn { font-size: 0.75rem; color: var(--danger); margin-top: 8px; text-align: center; }

/* Theme row */
.theme-row  { display: flex; align-items: center; justify-content: space-between; }
.theme-label{ font-size: 0.875rem; color: var(--text-secondary); }
.theme-seg  { width: 160px; }

/* Network row */
.net-row    { display: flex; align-items: center; justify-content: space-between; }
.net-label  { font-size: 0.875rem; color: var(--text-secondary); }
.net-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 600; color: var(--success);
}
.net-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 6px rgba(48,209,88,0.6);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Spinners */
.mini-spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 8px auto;
}
.mini-spinner-inline {
  width: 16px; height: 16px;
  border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Success Animation */
.success-anim svg {
  animation: stroke-draw 0.6s ease-out forwards;
}
@keyframes stroke-draw {
  0% { stroke-dasharray: 0, 100; opacity: 0; transform: scale(0.8); }
  100% { stroke-dasharray: 100, 0; opacity: 1; transform: scale(1); }
}

/* Confetti */
.confetti-container {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
}
.confetti-piece {
  position: absolute;
  width: 8px; height: 16px;
  background: var(--nim-gold);
  top: -20px;
  opacity: 0;
}
.confetti-piece:nth-child(even) { background: #E9B213; border-radius: 50%; width: 12px; height: 12px; }
.confetti-piece:nth-child(3n) { background: #FFFFFF; }

.confetti-piece:nth-child(1) { left: 10%; animation: confetti-fall 2s ease-out forwards 0.1s; }
.confetti-piece:nth-child(2) { left: 20%; animation: confetti-fall 2.2s ease-out forwards 0.3s; }
.confetti-piece:nth-child(3) { left: 30%; animation: confetti-fall 1.8s ease-out forwards 0.2s; }
.confetti-piece:nth-child(4) { left: 40%; animation: confetti-fall 2.4s ease-out forwards 0.4s; }
.confetti-piece:nth-child(5) { left: 50%; animation: confetti-fall 2.1s ease-out forwards 0.1s; }
.confetti-piece:nth-child(6) { left: 60%; animation: confetti-fall 1.9s ease-out forwards 0.5s; }
.confetti-piece:nth-child(7) { left: 70%; animation: confetti-fall 2.3s ease-out forwards 0.2s; }
.confetti-piece:nth-child(8) { left: 80%; animation: confetti-fall 2.0s ease-out forwards 0.6s; }
.confetti-piece:nth-child(9) { left: 90%; animation: confetti-fall 2.5s ease-out forwards 0.3s; }
.confetti-piece:nth-child(10) { left: 15%; animation: confetti-fall 2.1s ease-out forwards 0.4s; }
.confetti-piece:nth-child(11) { left: 55%; animation: confetti-fall 1.8s ease-out forwards 0.1s; }
.confetti-piece:nth-child(12) { left: 85%; animation: confetti-fall 2.2s ease-out forwards 0.5s; }

@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
}

.success-content {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 0 8px;
}
</style>
